-- Terms & privacy acceptance: app signup + WhatsApp bot consent

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_terms_version TEXT;

-- Copy acceptance sent as signup metadata (works even when email confirmation leaves no session)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, terms_accepted_at, terms_version)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'terms_accepted_at', '')::timestamptz,
    NULLIF(NEW.raw_user_meta_data->>'terms_version', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bot waits for "ACEPTO" before linking / continuing
ALTER TABLE public.whatsapp_sessions
  ADD COLUMN IF NOT EXISTS pending_link_code_id UUID
    REFERENCES public.whatsapp_link_codes(id) ON DELETE SET NULL;

ALTER TABLE public.whatsapp_sessions
  DROP CONSTRAINT IF EXISTS whatsapp_sessions_state_check;
ALTER TABLE public.whatsapp_sessions
  ADD CONSTRAINT whatsapp_sessions_state_check
  CHECK (state IN ('idle', 'awaiting_confirm', 'awaiting_edit', 'awaiting_type', 'awaiting_terms'));
