-- MONI Finance App - Initial Schema Migration
-- Run in Supabase SQL Editor or via CLI: supabase db push

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_not_deleted(deleted_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  avatar_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ACCOUNTS
-- ============================================================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash' CHECK (type IN ('cash', 'bank', 'credit', 'savings', 'investment')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#22C55E',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_user_active ON public.accounts(user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'ellipsis-horizontal',
  color TEXT NOT NULL DEFAULT '#94A3B8',
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'both')),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type) WHERE deleted_at IS NULL;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- LOANS (Pedí un préstamo / Estoy pagando)
-- ============================================================

CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  lender TEXT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(15, 2),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_off')),
  notes TEXT,
  remaining_balance DECIMAL(15, 2) NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(user_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- LOAN PAYMENTS
-- ============================================================

CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX idx_loan_payments_user_id ON public.loan_payments(user_id);

-- ============================================================
-- MONEY LENT (Me deben dinero)
-- ============================================================

CREATE TABLE public.money_lent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  debtor_name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  lent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  concept TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_off')),
  remaining_balance DECIMAL(15, 2) NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_money_lent_user_id ON public.money_lent(user_id);
CREATE INDEX idx_money_lent_status ON public.money_lent(user_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER money_lent_updated_at
  BEFORE UPDATE ON public.money_lent
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- MONEY LENT PAYMENTS
-- ============================================================

CREATE TABLE public.money_lent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  money_lent_id UUID NOT NULL REFERENCES public.money_lent(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_money_lent_payments_money_lent_id ON public.money_lent_payments(money_lent_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'income', 'expense', 'loan_requested', 'loan_payment',
    'loan_granted', 'loan_collection', 'transfer'
  )),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  merchant TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transfer_to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES public.loans(id) ON DELETE SET NULL,
  money_lent_id UUID REFERENCES public.money_lent(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(user_id, transaction_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_type ON public.transactions(user_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON public.transactions(category_id) WHERE deleted_at IS NULL;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update account balance on transaction insert/update/delete
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  delta DECIMAL(15, 2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
    IF NEW.type IN ('income', 'loan_requested', 'loan_collection') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('expense', 'loan_payment', 'loan_granted') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction if it was active
    IF OLD.deleted_at IS NULL THEN
      IF OLD.type IN ('income', 'loan_requested', 'loan_collection') THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type IN ('expense', 'loan_payment', 'loan_granted') THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
      END IF;
    END IF;
    -- Apply new transaction if active
    IF NEW.deleted_at IS NULL THEN
      IF NEW.type IN ('income', 'loan_requested', 'loan_collection') THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type IN ('expense', 'loan_payment', 'loan_granted') THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      ELSIF NEW.type = 'transfer' AND NEW.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_account_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.deleted_at IS NULL THEN
      IF OLD.type IN ('income', 'loan_requested', 'loan_collection') THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type IN ('expense', 'loan_payment', 'loan_granted') THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      ELSIF OLD.type = 'transfer' AND OLD.transfer_to_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER transactions_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- ============================================================
-- TRANSACTION PHOTOS
-- ============================================================

CREATE TABLE public.transaction_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT,
  ocr_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_photos_transaction_id ON public.transaction_photos(transaction_id);

-- ============================================================
-- TRANSACTION VOICE
-- ============================================================

CREATE TABLE public.transaction_voice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_transcript TEXT NOT NULL,
  parsed_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_voice_transaction_id ON public.transaction_voice(transaction_id);

-- ============================================================
-- BANK CONNECTIONS (Belvo - architecture only)
-- ============================================================

CREATE TABLE public.bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  institution_id TEXT,
  link_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disconnected')),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bank_connections_user_id ON public.bank_connections(user_id);

CREATE TRIGGER bank_connections_updated_at
  BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  alert_threshold DECIMAL(5, 2) NOT NULL DEFAULT 80 CHECK (alert_threshold BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, category_id, month, year)
);

CREATE INDEX idx_budgets_user_period ON public.budgets(user_id, year, month) WHERE deleted_at IS NULL;

CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SAVING GOALS
-- ============================================================

CREATE TABLE public.saving_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_saving_goals_user_id ON public.saving_goals(user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER saving_goals_updated_at
  BEFORE UPDATE ON public.saving_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'collection_reminder', 'budget_alert', 'goal_reminder', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- ============================================================
-- SUBSCRIPTIONS (RevenueCat)
-- ============================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
  purchase_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, status) WHERE status = 'active';

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SEED DEFAULT CATEGORIES (system-wide)
-- ============================================================

INSERT INTO public.categories (id, user_id, name, icon, color, type, is_system) VALUES
  (gen_random_uuid(), NULL, 'Comida', 'restaurant', '#F97316', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Gasolina', 'car', '#3B82F6', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Supermercado', 'cart', '#8B5CF6', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Transporte', 'bus', '#0EA5E9', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Servicios', 'flash', '#EAB308', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Educación', 'school', '#F59E0B', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Salud', 'medical', '#EF4444', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Entretenimiento', 'game-controller', '#A855F7', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Hogar', 'home', '#6366F1', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Mascotas', 'paw', '#78716C', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Viajes', 'airplane', '#14B8A6', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Compras', 'bag', '#EC4899', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Suscripciones', 'repeat', '#6B7280', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Préstamos', 'cash', '#DC2626', 'expense', TRUE),
  (gen_random_uuid(), NULL, 'Otros', 'ellipsis-horizontal', '#94A3B8', 'both', TRUE),
  (gen_random_uuid(), NULL, 'Salario', 'briefcase', '#22C55E', 'income', TRUE),
  (gen_random_uuid(), NULL, 'Freelance', 'laptop', '#3B82F6', 'income', TRUE),
  (gen_random_uuid(), NULL, 'Inversiones', 'trending-up', '#16A34A', 'income', TRUE),
  (gen_random_uuid(), NULL, 'Regalo', 'gift', '#EC4899', 'income', TRUE);

-- ============================================================
-- DEFAULT ACCOUNTS ON PROFILE CREATE
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_default_accounts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, type, icon, color, is_default) VALUES
    (NEW.id, 'Efectivo', 'cash', 'cash', '#22C55E', TRUE),
    (NEW.id, 'BBVA', 'bank', 'business', '#072146', FALSE),
    (NEW.id, 'Banorte', 'bank', 'business', '#E4002B', FALSE),
    (NEW.id, 'Nu', 'bank', 'card', '#820AD1', FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_accounts
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_accounts();

-- ============================================================
-- DELETE ACCOUNT (CASCADE ALL USER DATA)
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;

  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.subscriptions WHERE user_id = target_user_id;
  DELETE FROM public.transaction_voice WHERE user_id = target_user_id;
  DELETE FROM public.transaction_photos WHERE user_id = target_user_id;
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  DELETE FROM public.loan_payments WHERE user_id = target_user_id;
  DELETE FROM public.loans WHERE user_id = target_user_id;
  DELETE FROM public.money_lent_payments WHERE user_id = target_user_id;
  DELETE FROM public.money_lent WHERE user_id = target_user_id;
  DELETE FROM public.bank_connections WHERE user_id = target_user_id;
  DELETE FROM public.budgets WHERE user_id = target_user_id;
  DELETE FROM public.saving_goals WHERE user_id = target_user_id;
  DELETE FROM public.categories WHERE user_id = target_user_id;
  DELETE FROM public.accounts WHERE user_id = target_user_id;
  UPDATE public.profiles SET deleted_at = NOW() WHERE id = target_user_id;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_voice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_lent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_lent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id AND deleted_at IS NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- Categories (system + own)
CREATE POLICY "Users can view categories" ON public.categories FOR SELECT USING (
  (is_system = TRUE AND deleted_at IS NULL) OR (auth.uid() = user_id AND deleted_at IS NULL)
);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Transaction photos
CREATE POLICY "Users can view own transaction photos" ON public.transaction_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transaction photos" ON public.transaction_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own transaction photos" ON public.transaction_photos FOR DELETE USING (auth.uid() = user_id);

-- Transaction voice
CREATE POLICY "Users can view own transaction voice" ON public.transaction_voice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transaction voice" ON public.transaction_voice FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loans
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own loans" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own loans" ON public.loans FOR DELETE USING (auth.uid() = user_id);

-- Loan payments
CREATE POLICY "Users can view own loan payments" ON public.loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loan payments" ON public.loan_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own loan payments" ON public.loan_payments FOR DELETE USING (auth.uid() = user_id);

-- Money lent
CREATE POLICY "Users can view own money lent" ON public.money_lent FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own money lent" ON public.money_lent FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own money lent" ON public.money_lent FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own money lent" ON public.money_lent FOR DELETE USING (auth.uid() = user_id);

-- Money lent payments
CREATE POLICY "Users can view own money lent payments" ON public.money_lent_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own money lent payments" ON public.money_lent_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own money lent payments" ON public.money_lent_payments FOR DELETE USING (auth.uid() = user_id);

-- Bank connections
CREATE POLICY "Users can view own bank connections" ON public.bank_connections FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own bank connections" ON public.bank_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank connections" ON public.bank_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank connections" ON public.bank_connections FOR DELETE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Saving goals
CREATE POLICY "Users can view own saving goals" ON public.saving_goals FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can insert own saving goals" ON public.saving_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saving goals" ON public.saving_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saving goals" ON public.saving_goals FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket for transaction photos
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-photos', 'transaction-photos', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'transaction-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'transaction-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'transaction-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
