-- Admin dashboard (web panel in /admin): read-only metrics for allow-listed admins.
-- After running, add yourself:
--   INSERT INTO public.admin_users (user_id) SELECT id FROM auth.users WHERE email = 'tu@correo.com';

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No policies on purpose: only the SECURITY DEFINER functions below can read it.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.admin_has_active_sub(p_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p_user
      AND s.status IN ('active', 'grace_period')
      AND (s.expiration_date IS NULL OR s.expiration_date > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard(
  p_days INT DEFAULT 30,
  p_tz TEXT DEFAULT 'America/Mexico_City'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INT := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
  v_today DATE := (NOW() AT TIME ZONE p_tz)::date;
  v_from DATE := v_today - (v_days - 1);
  v_prev_from DATE := v_from - v_days;
  v_from_ts TIMESTAMPTZ := v_from::timestamp AT TIME ZONE p_tz;
  v_scan_ts TIMESTAMPTZ := LEAST(v_prev_from, v_today - 29)::timestamp AT TIME ZONE p_tz;
  v_users JSONB;
  v_activity JSONB;
  v_subs JSONB;
  v_series JSONB;
  v_whatsapp JSONB;
  v_categories JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total', COUNT(*) FILTER (WHERE p.deleted_at IS NULL),
    'deleted', COUNT(*) FILTER (WHERE p.deleted_at IS NOT NULL),
    'new_today', COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND (p.created_at AT TIME ZONE p_tz)::date = v_today),
    'new_period', COUNT(*) FILTER (WHERE (p.created_at AT TIME ZONE p_tz)::date >= v_from),
    'new_prev_period', COUNT(*) FILTER (
      WHERE (p.created_at AT TIME ZONE p_tz)::date >= v_prev_from
        AND (p.created_at AT TIME ZONE p_tz)::date < v_from
    ),
    'premium', COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND (p.is_premium OR public.admin_has_active_sub(p.id))),
    'whatsapp_linked', COUNT(*) FILTER (WHERE p.deleted_at IS NULL AND p.whatsapp_linked_at IS NOT NULL)
  )
  INTO v_users
  FROM public.profiles p;

  SELECT jsonb_build_object(
    'dau', COUNT(DISTINCT t.user_id) FILTER (WHERE t.d = v_today),
    'wau', COUNT(DISTINCT t.user_id) FILTER (WHERE t.d > v_today - 7),
    'mau', COUNT(DISTINCT t.user_id) FILTER (WHERE t.d > v_today - 30),
    'active_period', COUNT(DISTINCT t.user_id) FILTER (WHERE t.d >= v_from),
    'tx_period', COUNT(*) FILTER (WHERE t.d >= v_from),
    'tx_prev_period', COUNT(*) FILTER (WHERE t.d >= v_prev_from AND t.d < v_from),
    'tx_total', (SELECT COUNT(*) FROM public.transactions WHERE deleted_at IS NULL)
  )
  INTO v_activity
  FROM (
    SELECT user_id, (created_at AT TIME ZONE p_tz)::date AS d
    FROM public.transactions
    WHERE deleted_at IS NULL AND created_at >= v_scan_ts
  ) t;

  SELECT jsonb_build_object(
    'active', COUNT(*) FILTER (WHERE s.status = 'active' AND (s.expiration_date IS NULL OR s.expiration_date > NOW())),
    'grace', COUNT(*) FILTER (WHERE s.status = 'grace_period'),
    'cancelled', COUNT(*) FILTER (WHERE s.status = 'cancelled'),
    'expired', COUNT(*) FILTER (WHERE s.status = 'expired' OR (s.status = 'active' AND s.expiration_date <= NOW())),
    'new_period', COUNT(*) FILTER (WHERE (s.purchase_date AT TIME ZONE p_tz)::date >= v_from),
    'churned_period', COUNT(*) FILTER (
      WHERE s.status IN ('cancelled', 'expired') AND (s.updated_at AT TIME ZONE p_tz)::date >= v_from
    ),
    'by_platform', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('key', x.platform, 'count', x.n) ORDER BY x.n DESC), '[]'::jsonb)
      FROM (
        SELECT platform, COUNT(*) AS n FROM public.subscriptions
        WHERE status IN ('active', 'grace_period') GROUP BY platform
      ) x
    ),
    'by_product', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('key', x.product_id, 'count', x.n) ORDER BY x.n DESC), '[]'::jsonb)
      FROM (
        SELECT product_id, COUNT(*) AS n FROM public.subscriptions
        WHERE status IN ('active', 'grace_period') GROUP BY product_id
      ) x
    )
  )
  INTO v_subs
  FROM public.subscriptions s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day', g.d::date,
    'signups', COALESCE(su.n, 0),
    'premium', COALESCE(ps.n, 0),
    'transactions', COALESCE(tx.n, 0),
    'active_users', COALESCE(tx.u, 0)
  ) ORDER BY g.d), '[]'::jsonb)
  INTO v_series
  FROM generate_series(v_from, v_today, INTERVAL '1 day') AS g(d)
  LEFT JOIN (
    SELECT (created_at AT TIME ZONE p_tz)::date AS day, COUNT(*) AS n
    FROM public.profiles WHERE created_at >= v_from_ts GROUP BY 1
  ) su ON su.day = g.d::date
  LEFT JOIN (
    SELECT (purchase_date AT TIME ZONE p_tz)::date AS day, COUNT(*) AS n
    FROM public.subscriptions WHERE purchase_date >= v_from_ts GROUP BY 1
  ) ps ON ps.day = g.d::date
  LEFT JOIN (
    SELECT (created_at AT TIME ZONE p_tz)::date AS day, COUNT(*) AS n, COUNT(DISTINCT user_id) AS u
    FROM public.transactions WHERE deleted_at IS NULL AND created_at >= v_from_ts GROUP BY 1
  ) tx ON tx.day = g.d::date;

  SELECT jsonb_build_object(
    'linked', (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND whatsapp_linked_at IS NOT NULL),
    'linked_period', (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL AND whatsapp_linked_at >= v_from_ts),
    'saved_period', COUNT(*) FILTER (WHERE d.confirmed_at IS NOT NULL),
    'discarded_period', COUNT(*) FILTER (WHERE d.discarded_at IS NOT NULL),
    'text', COUNT(*) FILTER (WHERE d.confirmed_at IS NOT NULL AND d.media_kind IS NULL),
    'audio', COUNT(*) FILTER (WHERE d.confirmed_at IS NOT NULL AND d.media_kind = 'audio'),
    'image', COUNT(*) FILTER (WHERE d.confirmed_at IS NOT NULL AND d.media_kind = 'image'),
    'active_users_period', COUNT(DISTINCT d.user_id)
  )
  INTO v_whatsapp
  FROM public.whatsapp_drafts d
  WHERE d.created_at >= v_from_ts;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', x.name, 'count', x.n) ORDER BY x.n DESC), '[]'::jsonb)
  INTO v_categories
  FROM (
    SELECT COALESCE(c.name, 'Sin categoría') AS name, COUNT(*) AS n
    FROM public.transactions t
    LEFT JOIN public.categories c ON c.id = t.category_id
    WHERE t.deleted_at IS NULL AND t.type = 'expense' AND t.created_at >= v_from_ts
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 6
  ) x;

  RETURN jsonb_build_object(
    'days', v_days,
    'from', v_from,
    'to', v_today,
    'generated_at', NOW(),
    'users', v_users,
    'activity', v_activity,
    'subscriptions', v_subs,
    'series', v_series,
    'whatsapp', v_whatsapp,
    'top_categories', v_categories
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL,
  p_filter TEXT DEFAULT 'all',
  p_limit INT DEFAULT 25,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q TEXT := NULLIF(btrim(COALESCE(p_search, '')), '');
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 200);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
  v_total BIGINT;
  v_rows JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.created_at,
      p.whatsapp_linked_at,
      (p.is_premium OR s.status IS NOT NULL) AS premium,
      s.product_id,
      s.platform,
      s.expiration_date,
      a.last_tx_at,
      COALESCE(a.tx_count, 0) AS tx_count
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT status, product_id, platform, expiration_date
      FROM public.subscriptions
      WHERE user_id = p.id
        AND status IN ('active', 'grace_period')
        AND (expiration_date IS NULL OR expiration_date > NOW())
      ORDER BY purchase_date DESC
      LIMIT 1
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT MAX(created_at) AS last_tx_at, COUNT(*) AS tx_count
      FROM public.transactions
      WHERE user_id = p.id AND deleted_at IS NULL
    ) a ON TRUE
    WHERE p.deleted_at IS NULL
      AND (v_q IS NULL OR p.full_name ILIKE '%' || v_q || '%' OR p.email ILIKE '%' || v_q || '%')
  ),
  filtered AS (
    SELECT * FROM base
    WHERE CASE COALESCE(p_filter, 'all')
      WHEN 'premium' THEN premium
      WHEN 'free' THEN NOT premium
      WHEN 'whatsapp' THEN whatsapp_linked_at IS NOT NULL
      WHEN 'inactive' THEN last_tx_at IS NULL OR last_tx_at < NOW() - INTERVAL '30 days'
      ELSE TRUE
    END
  )
  SELECT
    (SELECT COUNT(*) FROM filtered),
    COALESCE((
      SELECT jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC)
      FROM (SELECT * FROM filtered ORDER BY created_at DESC LIMIT v_limit OFFSET v_offset) f
    ), '[]'::jsonb)
  INTO v_total, v_rows;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_subscriptions(
  p_status TEXT DEFAULT 'all',
  p_limit INT DEFAULT 25,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 200);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
  v_total BIGINT;
  v_rows JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH filtered AS (
    SELECT
      s.id,
      s.user_id,
      p.full_name,
      p.email,
      s.platform,
      s.product_id,
      CASE
        WHEN s.status = 'active' AND s.expiration_date IS NOT NULL AND s.expiration_date <= NOW() THEN 'expired'
        ELSE s.status
      END AS status,
      s.purchase_date,
      s.expiration_date,
      s.updated_at
    FROM public.subscriptions s
    JOIN public.profiles p ON p.id = s.user_id
  )
  SELECT
    (SELECT COUNT(*) FROM filtered WHERE COALESCE(p_status, 'all') = 'all' OR status = p_status),
    COALESCE((
      SELECT jsonb_agg(to_jsonb(f) ORDER BY f.purchase_date DESC)
      FROM (
        SELECT * FROM filtered
        WHERE COALESCE(p_status, 'all') = 'all' OR status = p_status
        ORDER BY purchase_date DESC
        LIMIT v_limit OFFSET v_offset
      ) f
    ), '[]'::jsonb)
  INTO v_total, v_rows;

  RETURN jsonb_build_object('total', v_total, 'rows', v_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_has_active_sub(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_dashboard(INT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, INT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_subscriptions(TEXT, INT, INT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard(INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions(TEXT, INT, INT) TO authenticated;
