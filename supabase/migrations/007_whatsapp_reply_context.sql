-- Bot prompt message ids per draft, so a WhatsApp reply quoting an older prompt resumes that draft

ALTER TABLE public.whatsapp_drafts
  ADD COLUMN IF NOT EXISTS prompt_wamids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_whatsapp_drafts_prompt_wamids
  ON public.whatsapp_drafts USING GIN (prompt_wamids);
