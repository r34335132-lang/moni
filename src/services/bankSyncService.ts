import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { accountRepository } from '@/src/data/repositories/accountRepository';
import { categoryRepository } from '@/src/data/repositories/categoryRepository';
import { transactionService } from '@/src/services/transactionService';
import { fallbackCategoryId, matchCategoryId, suggestAccountId } from '@/src/services/smartFillService';
import {
  bankAlertFingerprint,
  bankAlertTags,
  parseBankAlert,
  type ParsedBankAlert,
} from '@/src/services/bankAlertParser';
import type { BankConnection, Transaction } from '@/src/core/types/entities';

export type BankSyncMode = 'wallet_alerts' | 'belvo';

/** Conexión bancaria + sync de avisos (Belvo cuando esté disponible). */
export const bankSyncService = {
  async connect(userId: string, institutionName: string): Promise<BankConnection> {
    const { data, error } = await supabase
      .from('bank_connections')
      .insert({
        user_id: userId,
        institution_name: institutionName,
        status: 'active',
        last_sync_at: new Date().toISOString(),
        metadata: {
          sync_mode: 'wallet_alerts' satisfies BankSyncMode,
        },
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async disconnect(id: string): Promise<void> {
    const soft = await supabase
      .from('bank_connections')
      .update({ status: 'disconnected', deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    if (!soft.error) return;

    const hard = await supabase.from('bank_connections').delete().eq('id', id);
    if (hard.error) handleSupabaseError(soft.error);
  },

  async touchSync(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_connections')
      .update({ last_sync_at: new Date().toISOString(), status: 'active' })
      .eq('id', connectionId);
    if (error) handleSupabaseError(error);
  },

  async importFromAlertText(
    userId: string,
    text: string,
    connectionId?: string | null,
  ): Promise<{ transaction: Transaction; parsed: ParsedBankAlert; duplicate: boolean }> {
    const parsed = parseBankAlert(text);
    if (!parsed) {
      return handleSupabaseError({
        message: 'No pude leer el aviso. Pega el SMS o notificación del banco (monto y comercio).',
      });
    }

    const fingerprint = bankAlertFingerprint(parsed);
    const accounts = await accountRepository.getAll(userId);
    const categories = await categoryRepository.getByType(userId, 'expense');
    const accountId =
      suggestAccountId(accounts, parsed.isWallet ? 'wallet' : 'card', text) ?? accounts[0]?.id;
    if (!accountId) {
      return handleSupabaseError({ message: 'Crea una cuenta de banco o tarjeta antes de sincronizar.' });
    }

    const categoryId = matchCategoryId(parsed.suggestedCategory, categories, 'expense')
      ?? fallbackCategoryId(categories, 'expense');

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data: existing, error: existingError } = await supabase
      .from('transactions')
      .select(
        'id, tags, amount, merchant, description, type, account_id, category_id, transaction_date, user_id, created_at, updated_at, deleted_at, transfer_to_account_id, loan_id, money_lent_id, beneficiary_id',
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('transaction_date', start.toISOString())
      .contains('tags', [`fp:${fingerprint}`])
      .limit(1);

    if (existingError) handleSupabaseError(existingError);
    if (existing?.length) {
      if (connectionId) await this.touchSync(connectionId);
      return { transaction: existing[0] as Transaction, parsed, duplicate: true };
    }

    const description = [
      parsed.isWallet ? 'Pago con billetera' : 'Cargo bancario',
      parsed.merchant ? `· ${parsed.merchant}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const transaction = await transactionService.create(userId, {
      type: 'expense',
      amount: parsed.amount,
      account_id: accountId,
      category_id: categoryId,
      merchant: parsed.merchant ?? undefined,
      description,
      tags: [...bankAlertTags(parsed), `fp:${fingerprint}`],
      transaction_date: new Date().toISOString(),
    });

    if (connectionId) await this.touchSync(connectionId);

    return { transaction, parsed, duplicate: false };
  },
};
