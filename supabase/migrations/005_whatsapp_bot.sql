-- WhatsApp bot: link phone, sessions, drafts, idempotency, storage

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_e164
  ON public.profiles (phone_e164)
  WHERE phone_e164 IS NOT NULL AND deleted_at IS NULL;

-- One-time link codes generated in the app
CREATE TABLE IF NOT EXISTS public.whatsapp_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_link_codes_code_active
  ON public.whatsapp_link_codes (code)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_link_codes_user
  ON public.whatsapp_link_codes (user_id);

-- Chat session state per WhatsApp phone
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  phone_e164 TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'idle'
    CHECK (state IN ('idle', 'awaiting_confirm', 'awaiting_edit', 'awaiting_type')),
  draft_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending transaction drafts until user confirms
CREATE TABLE IF NOT EXISTS public.whatsapp_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2),
  merchant TEXT,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_name TEXT,
  media_path TEXT,
  media_kind TEXT CHECK (media_kind IS NULL OR media_kind IN ('image', 'audio')),
  raw_text TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_drafts_user
  ON public.whatsapp_drafts (user_id, created_at DESC);

ALTER TABLE public.whatsapp_sessions
  DROP CONSTRAINT IF EXISTS whatsapp_sessions_draft_id_fkey;
ALTER TABLE public.whatsapp_sessions
  ADD CONSTRAINT whatsapp_sessions_draft_id_fkey
  FOREIGN KEY (draft_id) REFERENCES public.whatsapp_drafts(id) ON DELETE SET NULL;

-- Idempotency for Meta message IDs
CREATE TABLE IF NOT EXISTS public.whatsapp_processed_messages (
  wamid TEXT PRIMARY KEY,
  phone_e164 TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_processed_messages ENABLE ROW LEVEL SECURITY;

-- Link codes: users manage their own
CREATE POLICY whatsapp_link_codes_select ON public.whatsapp_link_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY whatsapp_link_codes_insert ON public.whatsapp_link_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY whatsapp_link_codes_update ON public.whatsapp_link_codes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY whatsapp_link_codes_delete ON public.whatsapp_link_codes
  FOR DELETE USING (auth.uid() = user_id);

-- Drafts: users can read their own (webhook uses service role)
CREATE POLICY whatsapp_drafts_select ON public.whatsapp_drafts
  FOR SELECT USING (auth.uid() = user_id);

-- Sessions / processed: service role only (no user policies)

-- Storage for WhatsApp media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-inbox',
  'whatsapp-inbox',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY whatsapp_inbox_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'whatsapp-inbox'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
