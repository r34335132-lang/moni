export type TransactionType =
  | 'income'
  | 'expense'
  | 'loan_requested'
  | 'loan_payment'
  | 'loan_granted'
  | 'loan_collection'
  | 'transfer';

export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'investment';

export type CategoryType = 'income' | 'expense' | 'both';

export type LoanStatus = 'pending' | 'paid_off';

export type BankConnectionStatus = 'pending' | 'active' | 'error' | 'disconnected';

export type NotificationType = 'payment_reminder' | 'collection_reminder' | 'budget_alert' | 'goal_reminder' | 'general';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'grace_period';

export type SubscriptionPlatform = 'ios' | 'android';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  currency: string;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  merchant: string | null;
  description: string | null;
  tags: string[];
  transaction_date: string;
  transfer_to_account_id: string | null;
  loan_id: string | null;
  money_lent_id: string | null;
  beneficiary_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  account?: Account;
  category?: Category;
}

export interface TransactionPhoto {
  id: string;
  transaction_id: string;
  user_id: string;
  storage_path: string;
  url: string | null;
  ocr_data: Record<string, unknown> | null;
  created_at: string;
}

export interface TransactionVoice {
  id: string;
  transaction_id: string;
  user_id: string;
  raw_transcript: string;
  parsed_data: Record<string, unknown>;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  amount: number;
  lender: string;
  interest_rate: number;
  monthly_payment: number | null;
  due_date: string | null;
  status: LoanStatus;
  notes: string | null;
  remaining_balance: number;
  account_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  account_id: string | null;
  notes: string | null;
  created_at: string;
  account?: Account | null;
}

export interface MoneyLent {
  id: string;
  user_id: string;
  debtor_name: string;
  amount: number;
  lent_date: string;
  concept: string | null;
  status: LoanStatus;
  remaining_balance: number;
  account_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MoneyLentPayment {
  id: string;
  money_lent_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  account_id: string | null;
  notes: string | null;
  created_at: string;
  account?: Account | null;
}

export interface BankConnection {
  id: string;
  user_id: string;
  institution_name: string;
  institution_id: string | null;
  link_id: string | null;
  status: BankConnectionStatus;
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: Category;
  spent?: number;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  platform: SubscriptionPlatform;
  product_id: string;
  status: SubscriptionStatus;
  purchase_date: string;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  moneyLentOut: number;
  moneyToCollect: number;
  pendingDebts: number;
  nextPayment: { amount: number; date: string; lender: string } | null;
  budgetRemaining: number;
  savingGoalsProgress: number;
}

export interface ParsedVoiceTransaction {
  amount: number | null;
  category: string | null;
  merchant: string | null;
  date: string | null;
  description: string | null;
  type: 'income' | 'expense';
  paymentMethod: 'cash' | 'card' | null;
}

export interface ParsedReceiptData {
  merchant: string | null;
  total: number | null;
  date: string | null;
  currency: string | null;
  items: Array<{ name: string; price: number }>;
  paymentMethod: 'cash' | 'card' | null;
  rawText: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
