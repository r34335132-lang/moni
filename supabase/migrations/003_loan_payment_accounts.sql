ALTER TABLE public.loan_payments
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.money_lent_payments
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loan_payments_account_id
  ON public.loan_payments(account_id);

CREATE INDEX IF NOT EXISTS idx_money_lent_payments_account_id
  ON public.money_lent_payments(account_id);
