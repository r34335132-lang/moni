import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { parseMoney } from './parser.ts';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type SttProvider = { name: string; url: string; apiKey: string; model: string };

/** Groq (free tier) first, OpenAI as paid fallback. Both expose the same Whisper API. */
function sttProviders(): SttProvider[] {
  const providers: SttProvider[] = [];
  const groq = Deno.env.get('GROQ_API_KEY');
  if (groq) {
    providers.push({
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/audio/transcriptions',
      apiKey: groq,
      model: 'whisper-large-v3-turbo',
    });
  }
  const openai = Deno.env.get('OPENAI_API_KEY');
  if (openai) {
    providers.push({
      name: 'openai',
      url: 'https://api.openai.com/v1/audio/transcriptions',
      apiKey: openai,
      model: 'whisper-1',
    });
  }
  return providers;
}

export async function transcribeAudio(
  bytes: Uint8Array,
  mimeType: string,
): Promise<string | null> {
  const providers = sttProviders();
  if (!providers.length) {
    console.warn('GROQ_API_KEY / OPENAI_API_KEY missing; cannot transcribe audio');
    return null;
  }

  const ext = mimeType.includes('mpeg') || mimeType.includes('mp3')
    ? 'mp3'
    : mimeType.includes('mp4') || mimeType.includes('m4a')
      ? 'm4a'
      : 'ogg';
  const blob = new Blob(
    [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
    { type: mimeType },
  );

  for (const provider of providers) {
    const form = new FormData();
    form.append('file', blob, `audio.${ext}`);
    form.append('model', provider.model);
    // No language param: auto-detects ES/EN. The prompt nudges amounts and bank names into the right spelling.
    form.append('prompt', 'Gasté 150 pesos en Uber con BBVA. Cobré 5000 de sueldo en Nu.');

    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provider.apiKey}` },
        body: form,
      });
      if (!res.ok) {
        console.error(`STT ${provider.name} failed`, res.status, await res.text());
        continue;
      }
      const json = (await res.json()) as { text?: string };
      const text = json.text?.trim();
      if (text) return text;
    } catch (e) {
      console.error(`STT ${provider.name} error`, e);
    }
  }
  return null;
}

export interface ReceiptRead {
  /** Text for category hints and the fallback parser. */
  text: string | null;
  merchant: string | null;
  /** Set only when a vision model read the TOTAL line itself. */
  total: number | null;
}

const RECEIPT_PROMPT = `Lee este ticket de compra y responde SOLO con JSON:
{"merchant": string|null, "total": number|null, "items": string[]}
- merchant: nombre comercial de la tienda (ej. "Walmart", "OXXO"), no la razón social.
- total: el importe final pagado, del renglón TOTAL / TOTAL A PAGAR / IMPORTE TOTAL. NO uses SUBTOTAL, IVA, descuentos, ahorro, EFECTIVO, CAMBIO, puntos ni precios de productos. Número sin separador de miles y con punto decimal, ej. 1400.50. Si no se ve, null.
- items: hasta 15 nombres cortos de productos.`;

/** Groq vision (free tier, same key as audio): reads the TOTAL line directly instead of guessing among numbers. */
async function receiptWithGroq(bytes: Uint8Array, mimeType: string): Promise<ReceiptRead | null> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  // Groq caps base64 image requests at ~4 MB.
  if (!apiKey || bytes.length > 3_000_000) return null;

  const body: Record<string, unknown> = {
    model: Deno.env.get('GROQ_VISION_MODEL') ?? 'qwen/qwen3.8-27b',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: RECEIPT_PROMPT },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${bytesToBase64(bytes)}` } },
      ],
    }],
    temperature: 0,
    max_completion_tokens: 800,
    response_format: { type: 'json_object' },
    reasoning_effort: 'none',
  };

  try {
    let res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 400) {
      // Some models reject reasoning_effort; retry without it.
      console.warn('Groq vision 400, retrying without reasoning_effort', await res.text());
      delete body.reasoning_effort;
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      console.error('Groq vision failed', res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = (json.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '');
    const raw = content.match(/\{[\s\S]*\}/)?.[0];
    if (!raw) return null;
    const data = JSON.parse(raw) as { merchant?: unknown; total?: unknown; items?: unknown };
    const merchant = typeof data.merchant === 'string' && data.merchant.trim() ? data.merchant.trim() : null;
    const items = Array.isArray(data.items) ? data.items.filter((x): x is string => typeof x === 'string') : [];
    const total = parseMoney(typeof data.total === 'number' || typeof data.total === 'string' ? data.total : null);
    return { text: [merchant, ...items].filter(Boolean).join('\n') || null, merchant, total };
  } catch (e) {
    console.error('Groq vision error', e);
    return null;
  }
}

export async function readReceipt(bytes: Uint8Array, mimeType: string): Promise<ReceiptRead> {
  const vision = await receiptWithGroq(bytes, mimeType);
  if (vision?.total) return vision;
  const text = await ocrImageWithOpenAI(bytes, mimeType);
  return { text: text ?? vision?.text ?? null, merchant: vision?.merchant ?? null, total: null };
}

export async function ocrImageWithOpenAI(bytes: Uint8Array, mimeType: string): Promise<string | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.warn('OPENAI_API_KEY missing; falling back to OCR.space');
    return ocrWithOcrSpace(bytes);
  }

  const b64 = bytesToBase64(bytes);
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe el ticket completo en texto plano, un renglón por línea, con cada etiqueta y su importe en el mismo renglón (ej. "TOTAL 1,400.00"). No omitas la parte final (SUBTOTAL, IVA, TOTAL).',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });
  if (!res.ok) {
    console.error('Vision OCR failed', res.status, await res.text());
    return ocrWithOcrSpace(bytes);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function ocrWithOcrSpace(bytes: Uint8Array): Promise<string | null> {
  const apiKey = Deno.env.get('OCR_SPACE_KEY') ?? 'helloworld';
  const b64 = bytesToBase64(bytes);
  const body = new FormData();
  body.append('apikey', apiKey);
  body.append('language', 'spa');
  body.append('isOverlayRequired', 'false');
  body.append('OCREngine', '2');
  // Line-by-line output keeps "TOTAL" and its amount on the same row on long receipts.
  body.append('isTable', 'true');
  body.append('scale', 'true');
  body.append('detectOrientation', 'true');
  body.append('base64Image', `data:image/jpeg;base64,${b64}`);

  const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
    IsErroredOnProcessing?: boolean;
  };
  if (json.IsErroredOnProcessing) return null;
  return json.ParsedResults?.[0]?.ParsedText?.trim() || null;
}

export async function uploadInboxMedia(
  supabase: SupabaseClient,
  userId: string,
  bytes: Uint8Array,
  mimeType: string,
  kind: 'image' | 'audio',
): Promise<string | null> {
  const ext = kind === 'audio' ? 'ogg' : mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('whatsapp-inbox').upload(path, bytes, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) {
    console.error('Storage upload failed', error);
    return null;
  }
  return path;
}
