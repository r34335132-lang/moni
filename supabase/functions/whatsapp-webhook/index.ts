import { createServiceClient, normalizePhone } from '../_shared/supabase.ts';
import { downloadWhatsAppMedia, sendWhatsAppText } from '../_shared/meta.ts';
import {
  readReceipt,
  transcribeAudio,
  uploadInboxMedia,
} from '../_shared/media.ts';
import {
  findAccountInText,
  formatMoney,
  isAffirmative,
  isBareNumber,
  isEdit,
  isNegative,
  isTermsAccept,
  looksLikeSavings,
  parseAccountAndConfirm,
  parseAccountChoice,
  parseBotCommand,
  parseLinkCode,
  parseMovementText,
  parseReceiptOcr,
  parseTypeChoice,
  type ParsedMovement,
  type TxType,
} from '../_shared/parser.ts';
import {
  buildBalanceMessage,
  buildMonthlyReportMessage,
  helpMessage,
} from '../_shared/reports.ts';
import { detectLocale, t, welcomeUnlinked, type BotLocale } from '../_shared/i18n.ts';
import { termsConfig, type TermsConfig } from '../_shared/terms.ts';
import { fallbackCategory, parseCategoryReply, pickCategory } from '../_shared/categoryRules.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

function localeFromText(text?: string | null): BotLocale {
  return detectLocale(text ?? '');
}

function localeFromDraft(draft: { raw_text?: string | null; description?: string | null } | null): BotLocale {
  return localeFromText(draft?.raw_text || draft?.description || '');
}

type WaMessage = {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  image?: { id: string; mime_type?: string; caption?: string };
  audio?: { id: string; mime_type?: string };
  voice?: { id: string; mime_type?: string };
  document?: { id: string; mime_type?: string; caption?: string };
  /** Present when the user swipes-to-reply on a previous message. */
  context?: { id?: string; from?: string };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Meta webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const verify = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '';
    if (mode === 'subscribe' && token === verify && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  // Always 200 quickly so Meta doesn't retry; process inline for MVP
  try {
    await handleWebhook(payload);
  } catch (e) {
    console.error('Webhook handler error', e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function handleWebhook(payload: unknown) {
  const body = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: WaMessage[];
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        };
      }>;
    }>;
  };

  const messages: WaMessage[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        messages.push(msg);
      }
    }
  }
  if (!messages.length) return;

  const supabase = createServiceClient();

  for (const msg of messages) {
    await processMessage(supabase, msg);
  }
}

async function markProcessed(supabase: SupabaseClient, wamid: string, phone: string) {
  const { error } = await supabase.from('whatsapp_processed_messages').insert({
    wamid,
    phone_e164: phone,
  });
  // unique violation → already processed
  if (error && !String(error.message).includes('duplicate') && error.code !== '23505') {
    console.error('idempotency insert', error);
  }
  return !error || error.code === '23505';
}

async function wasProcessed(supabase: SupabaseClient, wamid: string) {
  const { data } = await supabase
    .from('whatsapp_processed_messages')
    .select('wamid')
    .eq('wamid', wamid)
    .maybeSingle();
  return !!data;
}

async function processMessage(supabase: SupabaseClient, msg: WaMessage) {
  const phone = normalizePhone(msg.from);
  if (await wasProcessed(supabase, msg.id)) return;
  await markProcessed(supabase, msg.id, phone);

  const terms = termsConfig();

  // Link command works even before profile link (uses code)
  if (msg.type === 'text' && msg.text?.body) {
    const code = parseLinkCode(msg.text.body);
    if (code) {
      await handleLink(supabase, phone, code, localeFromText(msg.text.body), terms);
      return;
    }
    if (terms.enabled && await handlePendingTerms(supabase, phone, msg.text.body, terms)) {
      return;
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(terms.enabled ? 'id, currency, full_name, whatsapp_terms_version' : 'id, currency, full_name')
    .eq('phone_e164', phone)
    .is('deleted_at', null)
    .maybeSingle<{ id: string; currency: string; full_name: string | null; whatsapp_terms_version?: string | null }>();

  if (!profile) {
    await sendWhatsAppText(phone, welcomeUnlinked());
    return;
  }

  // Already linked but never accepted (or terms changed): ask before doing anything else.
  if (terms.enabled && profile.whatsapp_terms_version !== terms.version) {
    await setTermsSession(supabase, phone, profile.id, null);
    await sendWhatsAppText(phone, termsPrompt(localeFromText(msg.text?.body), terms));
    return;
  }

  let session = await getSession(supabase, phone, profile.id);

  // Reply quoting an older confirmation: act on that draft, not the latest one.
  if (msg.context?.id && msg.type === 'text') {
    const quoted = await findDraftByPrompt(supabase, profile.id, msg.context.id);
    if (quoted) {
      const locale = localeFromDraft(quoted);
      if (quoted.confirmed_at) {
        await sendWhatsAppText(phone, t(locale, 'draftAlreadySaved'));
        return;
      }
      if (quoted.discarded_at) {
        await sendWhatsAppText(phone, t(locale, 'draftAlreadyCancelled'));
        return;
      }
      if (session.draft_id !== quoted.id || session.state !== 'awaiting_confirm') {
        await setSession(supabase, phone, profile.id, 'awaiting_confirm', quoted.id);
        session = { ...session, state: 'awaiting_confirm', draft_id: quoted.id };
      }
    }
  }

  // Consultas: saldo / reporte / ayuda
  if (msg.type === 'text' && msg.text?.body) {
    const text = msg.text.body.trim();
    const locale = localeFromText(text);
    const cmd = parseBotCommand(text);
    if (cmd === 'help') {
      await sendWhatsAppText(phone, helpMessage(locale));
      return;
    }
    if (cmd === 'balance') {
      const body = await buildBalanceMessage(supabase, profile.id, profile.currency, locale);
      await sendWhatsAppText(phone, body);
      return;
    }
    if (cmd === 'report') {
      const body = await buildMonthlyReportMessage(supabase, profile.id, profile.currency, locale);
      await sendWhatsAppText(phone, body);
      return;
    }
  }

  // Handle confirm / cancel / edit / type choice based on state
  if (msg.type === 'text' && msg.text?.body) {
    const text = msg.text.body.trim();
    const locale = localeFromText(text);

    if (looksLikeSavings(text) && session.state === 'idle') {
      await sendWhatsAppText(phone, t(locale, 'savings'));
      return;
    }

    if (session.state === 'awaiting_type' && session.draft_id) {
      const choice = parseTypeChoice(text);
      if (!choice && isNegative(text)) {
        await discardDraft(supabase, phone, profile.id, session.draft_id, locale);
        return;
      }
      if (!choice && isBareNumber(text)) {
        await sendWhatsAppText(phone, t(locale, 'typePrompt'));
        return;
      }
      if (!choice) {
        // Anything else is a new entry; drop the unanswered draft instead of trapping the user.
        await supabase
          .from('whatsapp_drafts')
          .update({ discarded_at: new Date().toISOString() })
          .eq('id', session.draft_id);
        await setSession(supabase, phone, profile.id, 'idle', null);
        await proposeFromText(supabase, phone, profile.id, text, profile.currency);
        return;
      }
      const draft = await setDraftType(supabase, profile.id, session.draft_id, choice);
      await setSession(supabase, phone, profile.id, 'awaiting_confirm', session.draft_id);
      if (draft) {
        await sendConfirmPrompt(supabase, phone, profile.id, draft, profile.currency, localeFromDraft(draft));
      }
      return;
    }

    if (session.state === 'awaiting_confirm' && session.draft_id) {
      const draft = await loadDraft(supabase, session.draft_id);
      const draftLocale = localeFromDraft(draft) || locale;
      if (isAffirmative(text)) {
        await confirmDraft(supabase, phone, profile.id, session.draft_id, profile.currency, draftLocale);
        return;
      }
      if (isNegative(text)) {
        await discardDraft(supabase, phone, profile.id, session.draft_id, draftLocale);
        return;
      }
      if (isEdit(text)) {
        await setSession(supabase, phone, profile.id, 'awaiting_edit', session.draft_id);
        await sendWhatsAppText(phone, t(draftLocale, 'editPrompt'));
        return;
      }
      if (draft) {
        const accounts = await loadAccounts(supabase, profile.id);

        const pickedAndConfirm = parseAccountAndConfirm(text, accounts);
        if (pickedAndConfirm) {
          await supabase.from('whatsapp_drafts').update({ account_id: pickedAndConfirm.id }).eq('id', session.draft_id);
          await confirmDraft(supabase, phone, profile.id, session.draft_id, profile.currency, draftLocale);
          return;
        }

        const picked = parseAccountChoice(text, accounts);
        if (picked) {
          await supabase.from('whatsapp_drafts').update({ account_id: picked.id }).eq('id', session.draft_id);
          await sendConfirmPrompt(
            supabase,
            phone,
            profile.id,
            { ...draft, account_id: picked.id },
            profile.currency,
            draftLocale,
            accounts,
          );
          return;
        }

        const pickedCategory = parseCategoryReply(
          text,
          await loadCategories(supabase, profile.id),
          draft.type === 'income' ? 'income' : 'expense',
        );
        if (pickedCategory) {
          const change = { category_id: pickedCategory.id, category_name: pickedCategory.name };
          await supabase.from('whatsapp_drafts').update(change).eq('id', session.draft_id);
          await sendConfirmPrompt(
            supabase,
            phone,
            profile.id,
            { ...draft, ...change },
            profile.currency,
            draftLocale,
            accounts,
          );
          return;
        }

        const typeChoice = parseTypeChoice(text);
        if (typeChoice) {
          const retyped = await setDraftType(supabase, profile.id, session.draft_id, typeChoice);
          await sendConfirmPrompt(
            supabase,
            phone,
            profile.id,
            retyped ?? { ...draft, type: typeChoice },
            profile.currency,
            draftLocale,
            accounts,
          );
          return;
        }

        // A lone number here is an account pick, never a new $N movement.
        if (isBareNumber(text)) {
          await sendWhatsAppText(phone, t(draftLocale, 'accountInvalid', { n: text.replace(/\D/g, '') }));
          await sendConfirmPrompt(supabase, phone, profile.id, draft, profile.currency, draftLocale, accounts);
          return;
        }
      }
    }

    if (session.state === 'awaiting_edit' && session.draft_id) {
      const typeOnly = parseTypeChoice(text);
      if (typeOnly) {
        const draft = await setDraftType(supabase, profile.id, session.draft_id, typeOnly);
        await setSession(supabase, phone, profile.id, 'awaiting_confirm', session.draft_id);
        if (draft) {
          await sendConfirmPrompt(supabase, phone, profile.id, draft, profile.currency, localeFromDraft(draft));
        }
        return;
      }
      await proposeFromText(supabase, phone, profile.id, text, profile.currency, session.draft_id);
      return;
    }
  }

  // New capture
  if (msg.type === 'text' && msg.text?.body) {
    await proposeFromText(supabase, phone, profile.id, msg.text.body, profile.currency);
    return;
  }

  if (msg.type === 'audio' || msg.type === 'voice') {
    const media = msg.audio ?? msg.voice;
    const locale: BotLocale = 'es';
    if (!media?.id) {
      await sendWhatsAppText(phone, t(locale, 'audioFail'));
      return;
    }
    await sendWhatsAppText(phone, t(locale, 'listening'));
    try {
      const { bytes, mimeType } = await downloadWhatsAppMedia(media.id);
      const path = await uploadInboxMedia(supabase, profile.id, bytes, mimeType, 'audio');
      const transcript = await transcribeAudio(bytes, mimeType);
      if (!transcript) {
        await sendWhatsAppText(phone, t(locale, 'transcribeFail'));
        return;
      }
      await proposeFromText(supabase, phone, profile.id, transcript, profile.currency, undefined, path, 'audio');
    } catch (e) {
      console.error(e);
      await sendWhatsAppText(phone, t(locale, 'audioError'));
    }
    return;
  }

  if (msg.type === 'image' || (msg.type === 'document' && msg.document?.mime_type?.startsWith('image/'))) {
    const media = msg.image ?? msg.document;
    const caption = msg.image?.caption ?? msg.document?.caption ?? '';
    const locale = localeFromText(caption);
    if (!media?.id) {
      await sendWhatsAppText(phone, t(locale, 'imageFail'));
      return;
    }
    await sendWhatsAppText(phone, t(locale, 'readingReceipt'));
    try {
      const { bytes, mimeType } = await downloadWhatsAppMedia(media.id);
      const path = await uploadInboxMedia(supabase, profile.id, bytes, mimeType, 'image');
      const receipt = await readReceipt(bytes, mimeType);
      const parsed = receipt.text ? parseReceiptOcr(receipt.text) : parseMovementText(caption || 'ticket');
      if (receipt.total) parsed.amount = receipt.total;
      if (receipt.merchant) {
        parsed.merchant = receipt.merchant;
        parsed.description = `Ticket ${receipt.merchant}`;
      }
      parsed.type = 'expense';
      parsed.ambiguousType = false;
      if (caption) {
        const fromCaption = parseMovementText(caption);
        if (fromCaption.amount) parsed.amount = fromCaption.amount;
        // A receipt is an expense unless the caption says otherwise ("cobré…").
        if (!fromCaption.ambiguousType) parsed.type = fromCaption.type;
        // Keeps "con Banorte" in the text used to pick the account.
        parsed.description = `${parsed.description} · ${caption.trim()}`;
      }
      await proposeParsed(supabase, phone, profile.id, parsed, profile.currency, path, 'image', undefined, locale);
    } catch (e) {
      console.error(e);
      await sendWhatsAppText(phone, t(locale, 'receiptError'));
    }
    return;
  }

  await sendWhatsAppText(phone, t('es', 'fallbackHelp'));
}

type LinkCodeRow = { id: string; user_id: string; expires_at: string; used_at: string | null };

async function validateLinkCode(
  supabase: SupabaseClient,
  phone: string,
  locale: BotLocale,
  filter: { code: string } | { id: string },
): Promise<LinkCodeRow | null> {
  const query = supabase.from('whatsapp_link_codes').select('id, user_id, expires_at, used_at');
  const { data: row } = await ('code' in filter ? query.eq('code', filter.code) : query.eq('id', filter.id))
    .maybeSingle<LinkCodeRow>();

  if (!row || row.used_at) {
    await sendWhatsAppText(phone, t(locale, 'linkInvalid'));
    return null;
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await sendWhatsAppText(phone, t(locale, 'linkExpired'));
    return null;
  }
  return row;
}

function termsPrompt(locale: BotLocale, terms: TermsConfig): string {
  const docs = terms.privacyUrl && terms.privacyUrl !== terms.termsUrl
    ? t(locale, 'termsDocs', { terms: terms.termsUrl, privacy: terms.privacyUrl })
    : t(locale, 'termsDocsSingle', { terms: terms.termsUrl });
  return t(locale, 'termsPrompt', { docs });
}

async function setTermsSession(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  pendingCodeId: string | null,
) {
  await supabase.from('whatsapp_sessions').upsert({
    phone_e164: phone,
    user_id: userId,
    state: 'awaiting_terms',
    draft_id: null,
    pending_link_code_id: pendingCodeId,
    updated_at: new Date().toISOString(),
  });
}

async function clearTermsSession(supabase: SupabaseClient, phone: string, userId: string | null) {
  await supabase.from('whatsapp_sessions').upsert({
    phone_e164: phone,
    user_id: userId,
    state: 'idle',
    draft_id: null,
    pending_link_code_id: null,
    updated_at: new Date().toISOString(),
  });
}

/** Returns true when the message was consumed by the terms step. */
async function handlePendingTerms(
  supabase: SupabaseClient,
  phone: string,
  text: string,
  terms: TermsConfig,
): Promise<boolean> {
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('user_id, state, pending_link_code_id')
    .eq('phone_e164', phone)
    .maybeSingle<{ user_id: string | null; state: string; pending_link_code_id: string | null }>();

  if (session?.state !== 'awaiting_terms') return false;
  const locale = localeFromText(text);

  if (isTermsAccept(text)) {
    await clearTermsSession(supabase, phone, session.user_id);
    if (session.pending_link_code_id) {
      const row = await validateLinkCode(supabase, phone, locale, { id: session.pending_link_code_id });
      if (row) await completeLink(supabase, phone, row, locale, terms.version);
      return true;
    }
    if (session.user_id) {
      await supabase
        .from('profiles')
        .update({ whatsapp_terms_accepted_at: new Date().toISOString(), whatsapp_terms_version: terms.version })
        .eq('id', session.user_id);
    }
    await sendWhatsAppText(phone, t(locale, 'termsAccepted'));
    return true;
  }

  if (isNegative(text)) {
    await clearTermsSession(supabase, phone, session.user_id);
    await sendWhatsAppText(phone, t(locale, session.pending_link_code_id ? 'termsDeclined' : 'termsRequired'));
    return true;
  }

  await sendWhatsAppText(phone, termsPrompt(locale, terms));
  return true;
}

async function handleLink(
  supabase: SupabaseClient,
  phone: string,
  code: string,
  locale: BotLocale,
  terms: TermsConfig,
) {
  const row = await validateLinkCode(supabase, phone, locale, { code });
  if (!row) return;

  if (terms.enabled) {
    await setTermsSession(supabase, phone, row.user_id, row.id);
    await sendWhatsAppText(phone, termsPrompt(locale, terms));
    return;
  }
  await completeLink(supabase, phone, row, locale, null);
}

async function completeLink(
  supabase: SupabaseClient,
  phone: string,
  row: LinkCodeRow,
  locale: BotLocale,
  termsVersion: string | null,
) {
  await supabase
    .from('profiles')
    .update({ phone_e164: null, whatsapp_linked_at: null })
    .eq('phone_e164', phone)
    .neq('id', row.user_id);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({
      phone_e164: phone,
      whatsapp_linked_at: now,
      ...(termsVersion ? { whatsapp_terms_accepted_at: now, whatsapp_terms_version: termsVersion } : {}),
    })
    .eq('id', row.user_id);

  if (error) {
    console.error(error);
    await sendWhatsAppText(phone, t(locale, 'linkFail'));
    return;
  }

  await supabase
    .from('whatsapp_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id);

  await setSession(supabase, phone, row.user_id, 'idle', null);
  await sendWhatsAppText(phone, t(locale, 'linkOk'));
}

async function getSession(supabase: SupabaseClient, phone: string, userId: string) {
  const { data } = await supabase
    .from('whatsapp_sessions')
    .select('phone_e164, user_id, state, draft_id')
    .eq('phone_e164', phone)
    .maybeSingle();

  if (data) return data;
  await supabase.from('whatsapp_sessions').upsert({
    phone_e164: phone,
    user_id: userId,
    state: 'idle',
    draft_id: null,
    updated_at: new Date().toISOString(),
  });
  return { phone_e164: phone, user_id: userId, state: 'idle' as const, draft_id: null as string | null };
}

async function setSession(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  state: string,
  draftId: string | null,
) {
  await supabase.from('whatsapp_sessions').upsert({
    phone_e164: phone,
    user_id: userId,
    state,
    draft_id: draftId,
    updated_at: new Date().toISOString(),
  });
}

async function loadDraft(supabase: SupabaseClient, draftId: string) {
  const { data } = await supabase.from('whatsapp_drafts').select('*').eq('id', draftId).maybeSingle();
  return data;
}

/** Switching expense ↔ income also needs a category of the new kind. */
async function setDraftType(supabase: SupabaseClient, userId: string, draftId: string, type: TxType) {
  const draft = await loadDraft(supabase, draftId);
  if (!draft) return null;
  const categories = await loadCategories(supabase, userId);
  const text = [draft.description, draft.merchant].filter(Boolean).join(' ');
  const category = pickCategory(text, categories, type) ?? fallbackCategory(categories, type);
  const change = { type, category_id: category?.id ?? null, category_name: category?.name ?? null };
  await supabase.from('whatsapp_drafts').update(change).eq('id', draftId);
  return { ...draft, ...change };
}

async function findDraftByPrompt(supabase: SupabaseClient, userId: string, wamid: string) {
  const { data, error } = await supabase
    .from('whatsapp_drafts')
    .select('*')
    .eq('user_id', userId)
    .contains('prompt_wamids', [wamid])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error('findDraftByPrompt', error);
  return data;
}

async function rememberPrompt(supabase: SupabaseClient, draftId: string, wamid: string | null) {
  if (!wamid) return;
  const { data, error } = await supabase
    .from('whatsapp_drafts')
    .select('prompt_wamids')
    .eq('id', draftId)
    .maybeSingle<{ prompt_wamids: string[] | null }>();
  if (error || !data) return;
  await supabase
    .from('whatsapp_drafts')
    .update({ prompt_wamids: [...(data.prompt_wamids ?? []), wamid].slice(-10) })
    .eq('id', draftId);
}

type AccountRow = { id: string; name: string; balance: number; is_default: boolean };

/** Stable order: numbers in the WhatsApp picker must map to the same accounts on reply. */
async function loadAccounts(supabase: SupabaseClient, userId: string): Promise<AccountRow[]> {
  const { data } = await supabase
    .from('accounts')
    .select('id, name, balance, is_default')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  return (data ?? []) as AccountRow[];
}

async function resolveCategoryAndAccount(
  supabase: SupabaseClient,
  userId: string,
  type: TxType,
  categoryName: string | null,
  text: string,
) {
  const accounts = await loadAccounts(supabase, userId);
  const accountId = findAccountInText(text, accounts)?.id
    ?? accounts.find((a) => a.is_default)?.id
    ?? accounts[0]?.id
    ?? null;

  const categories = await loadCategories(supabase, userId);
  // Receipts carry a hint from the full OCR text (items), which isn't in the short description.
  const category = pickCategory(text, categories, type)
    ?? (categoryName ? pickCategory(categoryName, categories, type) : null)
    ?? fallbackCategory(categories, type);

  return { accountId, categoryId: category?.id ?? null, categoryName: category?.name ?? null };
}

type CategoryRow = { id: string; name: string; type: string; user_id: string | null };

async function loadCategories(supabase: SupabaseClient, userId: string): Promise<CategoryRow[]> {
  const { data } = await supabase
    .from('categories')
    .select('id, name, type, user_id')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .is('deleted_at', null);
  return (data ?? []) as CategoryRow[];
}

async function proposeFromText(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  text: string,
  currency: string,
  replaceDraftId?: string,
  mediaPath?: string | null,
  mediaKind?: 'image' | 'audio' | null,
) {
  const locale = localeFromText(text);
  if (looksLikeSavings(text)) {
    await sendWhatsAppText(phone, t(locale, 'savings'));
    return;
  }
  const parsed = parseMovementText(text);
  await proposeParsed(supabase, phone, userId, parsed, currency, mediaPath, mediaKind, replaceDraftId);
}

async function proposeParsed(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  parsed: ParsedMovement,
  currency: string,
  mediaPath?: string | null,
  mediaKind?: 'image' | 'audio' | null,
  replaceDraftId?: string,
  localeOverride?: BotLocale,
) {
  const locale = localeOverride ?? localeFromText(parsed.description);
  if (!parsed.amount) {
    await sendWhatsAppText(phone, t(locale, 'noAmount'));
    return;
  }

  const { accountId, categoryId, categoryName } = await resolveCategoryAndAccount(
    supabase,
    userId,
    parsed.type,
    parsed.categoryName,
    parsed.description,
  );

  if (!accountId) {
    await sendWhatsAppText(phone, t(locale, 'noAccount'));
    return;
  }

  const draftPayload = {
    user_id: userId,
    phone_e164: phone,
    type: parsed.type,
    amount: parsed.amount,
    merchant: parsed.merchant,
    description: parsed.description,
    category_id: categoryId,
    account_id: accountId,
    category_name: categoryName,
    media_path: mediaPath ?? null,
    media_kind: mediaKind ?? null,
    raw_text: parsed.description,
    transaction_date: new Date().toISOString(),
    confirmed_at: null,
    discarded_at: null,
  };

  let draftId = replaceDraftId;
  if (replaceDraftId) {
    await supabase.from('whatsapp_drafts').update(draftPayload).eq('id', replaceDraftId);
  } else {
    const { data, error } = await supabase.from('whatsapp_drafts').insert(draftPayload).select('id').single();
    if (error || !data) {
      console.error(error);
      await sendWhatsAppText(phone, t(locale, 'draftFail'));
      return;
    }
    draftId = data.id;
  }

  if (parsed.ambiguousType) {
    await setSession(supabase, phone, userId, 'awaiting_type', draftId!);
    const wamid = await sendWhatsAppText(
      phone,
      t(locale, 'ambiguous', {
        amount: formatMoney(parsed.amount, currency, locale),
        merchant: parsed.merchant ? ` · ${parsed.merchant}` : '',
      }),
    );
    await rememberPrompt(supabase, draftId!, wamid);
    return;
  }

  await setSession(supabase, phone, userId, 'awaiting_confirm', draftId!);
  await sendConfirmPrompt(supabase, phone, userId, { ...draftPayload, id: draftId }, currency, locale);
}

async function sendConfirmPrompt(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  draft: {
    id?: string;
    type: string;
    amount: number | null;
    merchant?: string | null;
    category_name?: string | null;
    account_id?: string | null;
  },
  currency: string,
  locale: BotLocale = 'es',
  preloadedAccounts?: AccountRow[],
) {
  const accounts = preloadedAccounts ?? await loadAccounts(supabase, userId);
  const selected = accounts.find((a) => a.id === draft.account_id);
  const kind = draft.type === 'income' ? t(locale, 'kindIncome') : t(locale, 'kindExpense');
  const parts = [
    formatMoney(draft.amount, currency, locale),
    draft.merchant,
    draft.category_name,
  ].filter(Boolean);

  const picker = accounts.length > 1
    ? t(locale, 'accountPicker', {
      list: accounts
        .map((a, i) => {
          const mark = a.id === draft.account_id ? ' ✓' : '';
          return `*${i + 1}.* ${a.name} (${formatMoney(Number(a.balance), currency, locale)})${mark}`;
        })
        .join('\n'),
    })
    : '';

  const wamid = await sendWhatsAppText(
    phone,
    t(locale, 'confirm', {
      kind,
      parts: parts.join(' · '),
      account: selected?.name ?? '—',
      picker,
    }),
  );
  if (draft.id) await rememberPrompt(supabase, draft.id, wamid);
}

async function confirmDraft(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  draftId: string,
  currency: string,
  locale: BotLocale = 'es',
) {
  const draft = await loadDraft(supabase, draftId);
  if (!draft || draft.discarded_at || draft.confirmed_at) {
    await sendWhatsAppText(phone, t(locale, 'nothingPending'));
    await setSession(supabase, phone, userId, 'idle', null);
    return;
  }
  if (!draft.amount || !draft.account_id) {
    await sendWhatsAppText(phone, t(locale, 'draftIncomplete'));
    await setSession(supabase, phone, userId, 'idle', null);
    return;
  }

  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      account_id: draft.account_id,
      category_id: draft.category_id,
      type: draft.type,
      amount: draft.amount,
      merchant: draft.merchant,
      description: draft.description,
      tags: ['source:whatsapp'],
      transaction_date: draft.transaction_date ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !tx) {
    console.error(error);
    await sendWhatsAppText(phone, t(locale, 'saveFail'));
    return;
  }

  if (draft.media_path && draft.media_kind === 'image') {
    const { error: photoErr } = await supabase.from('transaction_photos').insert({
      transaction_id: tx.id,
      user_id: userId,
      storage_path: draft.media_path,
    });
    if (photoErr) console.error('photo link', photoErr);
  }

  await supabase
    .from('whatsapp_drafts')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', draftId);
  await setSession(supabase, phone, userId, 'idle', null);

  const { data: account } = await supabase
    .from('accounts')
    .select('name')
    .eq('id', draft.account_id)
    .maybeSingle();

  const kind = draft.type === 'income' ? t(locale, 'kindIncomeCap') : t(locale, 'kindExpenseCap');
  await sendWhatsAppText(
    phone,
    t(locale, 'saved', {
      kind,
      amount: formatMoney(Number(draft.amount), currency, locale),
      account: account?.name ?? '—',
    }),
  );
}

async function discardDraft(
  supabase: SupabaseClient,
  phone: string,
  userId: string,
  draftId: string,
  locale: BotLocale = 'es',
) {
  await supabase
    .from('whatsapp_drafts')
    .update({ discarded_at: new Date().toISOString() })
    .eq('id', draftId);
  await setSession(supabase, phone, userId, 'idle', null);
  await sendWhatsAppText(phone, t(locale, 'cancelled'));
}
