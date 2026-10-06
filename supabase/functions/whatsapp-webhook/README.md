# WhatsApp bot (Meta Cloud API)

## 1. Apply DB migration

Run `supabase/migrations/005_whatsapp_bot.sql` on your Supabase project (SQL editor or CLI).

## 2. Deploy Edge Function

```bash
supabase functions deploy whatsapp-webhook
```

Set secrets:

```bash
supabase secrets set \
  WHATSAPP_TOKEN="EAAB..." \
  WHATSAPP_VERIFY_TOKEN="moni-verify-change-me" \
  WHATSAPP_PHONE_NUMBER_ID="123456789" \
  OPENAI_API_KEY="sk-..." \
  OCR_SPACE_KEY="optional"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically on hosted Supabase.

## 3. Meta Developer Console

1. Create a Meta app → add **WhatsApp** product.
2. Webhook URL: `https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`
3. Verify token: same as `WHATSAPP_VERIFY_TOKEN`.
4. Subscribe to `messages`.
5. Add a test number, then move to a production Business number.

## 4. App env

```
EXPO_PUBLIC_WHATSAPP_BUSINESS_NUMBER=+52155XXXXXXXX
```

## 5. User flow

1. App → Profile → WhatsApp → Generate code  
2. User sends `VINCULAR 123456` to the Business number  
3. Register: text / voice / receipt → confirm Sí/No/Editar → `transactions`  
4. Query: `SALDO`, `RESUMEN` / `REPORTE`, `AYUDA`  
