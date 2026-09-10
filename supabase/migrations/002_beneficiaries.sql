-- Beneficiarios y vínculo opcional en transacciones (sin borrar datos existentes)

CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Otro',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON public.beneficiaries(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_beneficiary ON public.transactions(beneficiary_id) WHERE deleted_at IS NULL;

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY beneficiaries_select ON public.beneficiaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY beneficiaries_insert ON public.beneficiaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY beneficiaries_update ON public.beneficiaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY beneficiaries_delete ON public.beneficiaries
  FOR DELETE USING (auth.uid() = user_id);
