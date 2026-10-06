import { supabase } from '@/src/data/supabase/client';
import { handleSupabaseError } from '@/src/core/utils/errors';
import { env } from '@/src/core/config/env';

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const whatsappService = {
  businessNumber(): string {
    return env.whatsappBusinessNumber;
  },

  /** wa.me deep link that opens the bot chat with `text` prefilled (user still taps Send). */
  chatUrl(text?: string): string | null {
    const digits = env.whatsappBusinessNumber.replace(/\D/g, '');
    if (!digits) return null;
    return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
  },

  async getLinkStatus(userId: string): Promise<{
    phone_e164: string | null;
    whatsapp_linked_at: string | null;
  }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('phone_e164, whatsapp_linked_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) handleSupabaseError(error);
    return {
      phone_e164: data?.phone_e164 ?? null,
      whatsapp_linked_at: data?.whatsapp_linked_at ?? null,
    };
  },

  async createLinkCode(userId: string): Promise<{ code: string; expiresAt: string }> {
    // Invalidate previous unused codes
    await supabase
      .from('whatsapp_link_codes')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null);

    const code = randomCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase.from('whatsapp_link_codes').insert({
      user_id: userId,
      code,
      expires_at: expiresAt,
    });
    if (error) handleSupabaseError(error);
    return { code, expiresAt };
  },

  async unlink(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ phone_e164: null, whatsapp_linked_at: null })
      .eq('id', userId);
    if (error) handleSupabaseError(error);
  },
};
