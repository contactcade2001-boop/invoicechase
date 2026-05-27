import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required env var: ${name}. See .env.local.example.`,
    );
  }
  return value;
}

export function getEncryptionKey(): Buffer {
  const key = Buffer.from(required("APP_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) {
    throw new Error(
      "APP_ENCRYPTION_KEY must decode to 32 bytes. Generate one with: openssl rand -base64 32",
    );
  }
  return key;
}

export function getQboConfig() {
  return {
    clientId: required("QBO_CLIENT_ID"),
    clientSecret: required("QBO_CLIENT_SECRET"),
    redirectUri: required("QBO_REDIRECT_URI"),
  };
}

export function getXeroConfig() {
  return {
    clientId: required("XERO_CLIENT_ID"),
    clientSecret: required("XERO_CLIENT_SECRET"),
    redirectUri: required("XERO_REDIRECT_URI"),
  };
}

export function isXeroConfigured(): boolean {
  return !!(
    process.env.XERO_CLIENT_ID &&
    process.env.XERO_CLIENT_SECRET &&
    process.env.XERO_REDIRECT_URI
  );
}

export function getJobberConfig() {
  return {
    clientId: required("JOBBER_CLIENT_ID"),
    clientSecret: required("JOBBER_CLIENT_SECRET"),
    redirectUri: required("JOBBER_REDIRECT_URI"),
  };
}

export function isJobberConfigured(): boolean {
  return !!(
    process.env.JOBBER_CLIENT_ID &&
    process.env.JOBBER_CLIENT_SECRET &&
    process.env.JOBBER_REDIRECT_URI
  );
}

export function getHousecallProConfig() {
  return {
    clientId: required("HOUSECALLPRO_CLIENT_ID"),
    clientSecret: required("HOUSECALLPRO_CLIENT_SECRET"),
    redirectUri: required("HOUSECALLPRO_REDIRECT_URI"),
  };
}

export function isHousecallProConfigured(): boolean {
  return !!(
    process.env.HOUSECALLPRO_CLIENT_ID &&
    process.env.HOUSECALLPRO_CLIENT_SECRET &&
    process.env.HOUSECALLPRO_REDIRECT_URI
  );
}

export function getServiceTitanConfig() {
  return {
    clientId: required("SERVICETITAN_CLIENT_ID"),
    clientSecret: required("SERVICETITAN_CLIENT_SECRET"),
    redirectUri: required("SERVICETITAN_REDIRECT_URI"),
    appKey: process.env.SERVICETITAN_APP_KEY ?? "",
  };
}

export function isServiceTitanConfigured(): boolean {
  return !!(
    process.env.SERVICETITAN_CLIENT_ID &&
    process.env.SERVICETITAN_CLIENT_SECRET &&
    process.env.SERVICETITAN_REDIRECT_URI
  );
}

// FieldPulse + Workiz use API-key auth (no env-level OAuth secrets),
// so they're always available — the per-org credential is what gates use.
export function isFieldPulseAvailable(): boolean {
  return true;
}

export function isWorkizAvailable(): boolean {
  return true;
}

export function getStripeConfig() {
  return {
    secretKey: required("STRIPE_SECRET_KEY"),
    priceId: required("STRIPE_PRICE_ID"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  };
}

export function getAppBaseUrl(): string {
  return required("APP_BASE_URL").replace(/\/$/, "");
}

export function getTwilioConfig() {
  return {
    accountSid: required("TWILIO_ACCOUNT_SID"),
    authToken: required("TWILIO_AUTH_TOKEN"),
    fromNumber: required("TWILIO_FROM_NUMBER"),
  };
}

export function getAnthropicApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getCronSecret(): string | null {
  const s = process.env.CRON_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}

export function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === "1";
}

export function useMockSms(): boolean {
  return process.env.USE_MOCK_SMS === "1";
}
