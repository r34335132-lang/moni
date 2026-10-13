-- Soft-delete friendly RLS for the tables 004 missed (accounts, loans, money_lent, saving_goals).
-- The SELECT policy must not hide own soft-deleted rows: Postgres applies it to the updated row,
-- so `UPDATE ... SET deleted_at = now()` failed with "new row violates row-level security policy".
-- The app already filters deleted_at IS NULL on every read.

-- Accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Loans
DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
CREATE POLICY "Users can view own loans" ON public.loans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
CREATE POLICY "Users can update own loans" ON public.loans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Money lent
DROP POLICY IF EXISTS "Users can view own money lent" ON public.money_lent;
CREATE POLICY "Users can view own money lent" ON public.money_lent
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own money lent" ON public.money_lent;
CREATE POLICY "Users can update own money lent" ON public.money_lent
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saving goals
DROP POLICY IF EXISTS "Users can view own saving goals" ON public.saving_goals;
CREATE POLICY "Users can view own saving goals" ON public.saving_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saving goals" ON public.saving_goals;
CREATE POLICY "Users can update own saving goals" ON public.saving_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
