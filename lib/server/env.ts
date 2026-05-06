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

export function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === "1";
}
