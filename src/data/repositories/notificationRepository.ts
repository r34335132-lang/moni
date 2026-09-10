import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import type { Notification, Subscription } from '@/src/core/types/entities';

export const notificationRepository = {
  async getAll(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, data, is_read, scheduled_at, sent_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) handleSupabaseError(error);
    return data ?? [];
  },
};

export const subscriptionRepository = {
  async getActive(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, platform, product_id, status, purchase_date, expiration_date, created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data;
  },
};
