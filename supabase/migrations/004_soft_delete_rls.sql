-- Soft-delete friendly RLS: owners can still UPDATE rows when setting deleted_at.
-- SELECT includes own soft-deleted rows so PostgREST RETURNING / follow-up updates don't fail.

DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (
  (is_system = TRUE AND deleted_at IS NULL)
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE
  USING (auth.uid() = user_id AND is_system = FALSE)
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

DROP POLICY IF EXISTS "Users can view own bank connections" ON public.bank_connections;
CREATE POLICY "Users can view own bank connections" ON public.bank_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bank connections" ON public.bank_connections;
CREATE POLICY "Users can update own bank connections" ON public.bank_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
