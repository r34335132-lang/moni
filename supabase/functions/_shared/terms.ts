export interface TermsConfig {
  /** Gate is off until MONI_TERMS_URL is set, so the bot keeps working before the docs are published. */
  enabled: boolean;
  termsUrl: string;
  privacyUrl: string;
  /** Bump MONI_TERMS_VERSION when the documents change to ask everyone again. */
  version: string;
}

export function termsConfig(): TermsConfig {
  const termsUrl = Deno.env.get('MONI_TERMS_URL') ?? '';
  const privacyUrl = Deno.env.get('MONI_PRIVACY_URL') || termsUrl;
  const version = Deno.env.get('MONI_TERMS_VERSION') || '2026-09';
  return { enabled: !!termsUrl, termsUrl, privacyUrl, version };
}
