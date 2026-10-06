const GRAPH = 'https://graph.facebook.com/v21.0';

function token() {
  const t = Deno.env.get('WHATSAPP_TOKEN');
  if (!t) throw new Error('Missing WHATSAPP_TOKEN');
  return t;
}

function phoneNumberId() {
  const id = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!id) throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID');
  return id;
}

/** Returns the sent message id (wamid) so replies that quote it can be matched later. */
export async function sendWhatsAppText(to: string, body: string): Promise<string | null> {
  const res = await fetch(`${GRAPH}/${phoneNumberId()}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { preview_url: false, body },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('WhatsApp send failed', res.status, err);
    throw new Error(`WhatsApp send failed: ${res.status}`);
  }
  const json = (await res.json().catch(() => null)) as { messages?: Array<{ id?: string }> } | null;
  return json?.messages?.[0]?.id ?? null;
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const metaRes = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!metaRes.ok) throw new Error(`Media meta failed: ${metaRes.status}`);
  const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!meta.url) throw new Error('Media URL missing');

  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!fileRes.ok) throw new Error(`Media download failed: ${fileRes.status}`);
  const buf = new Uint8Array(await fileRes.arrayBuffer());
  return { bytes: buf, mimeType: meta.mime_type ?? 'application/octet-stream' };
}
