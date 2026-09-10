import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const transactionSchema = z.object({
  account_id: z.string().uuid('Selecciona una cuenta'),
  category_id: z.string().uuid('Selecciona una categoría').nullable(),
  type: z.enum(['income', 'expense', 'loan_requested', 'loan_payment', 'loan_granted', 'loan_collection', 'transfer']),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  merchant: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  transaction_date: z.string(),
  transfer_to_account_id: z.string().uuid().optional().nullable(),
  beneficiary_id: z.string().uuid().optional().nullable(),
}).required({ tags: true });

export const accountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['cash', 'bank', 'credit', 'savings', 'investment']),
  icon: z.string().default('wallet'),
  color: z.string().default('#22C55E'),
  is_default: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  icon: z.string().default('ellipsis-horizontal'),
  color: z.string().default('#94A3B8'),
  type: z.enum(['income', 'expense', 'both']),
});

export const loanSchema = z.object({
  amount: z.number().positive('Monto requerido'),
  lender: z.string().min(1, 'Prestamista requerido'),
  interest_rate: z.number().min(0).default(0),
  monthly_payment: z.number().positive().optional().nullable(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional(),
  account_id: z.string().uuid().optional().nullable(),
}).required({ interest_rate: true });

export const moneyLentSchema = z.object({
  debtor_name: z.string().min(1, 'Nombre requerido'),
  amount: z.number().positive('Monto requerido'),
  lent_date: z.string(),
  concept: z.string().optional(),
  notes: z.string().optional(),
  account_id: z.string().uuid().optional().nullable(),
});

export const beneficiarySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  relationship: z.string().min(1, 'Relación requerida'),
  notes: z.string().optional(),
});

export const budgetSchema = z.object({
  category_id: z.string().uuid('Selecciona categoría'),
  amount: z.number().positive('Monto requerido'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  alert_threshold: z.number().min(0).max(100).default(80),
}).required({ alert_threshold: true });

export const savingGoalSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  target_amount: z.number().positive('Monto objetivo requerido'),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
}).required({ current_amount: true });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type MoneyLentInput = z.infer<typeof moneyLentSchema>;
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type SavingGoalInput = z.infer<typeof savingGoalSchema>;
