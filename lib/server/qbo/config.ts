import "server-only";

export const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
export const QBO_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
export const QBO_REVOKE_URL =
  "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

const QBO_API_BASE_SANDBOX = "https://sandbox-quickbooks.api.intuit.com";
const QBO_API_BASE_PRODUCTION = "https://quickbooks.api.intuit.com";

export function getQboApiBase(): string {
  return process.env.QBO_ENVIRONMENT === "production"
    ? QBO_API_BASE_PRODUCTION
    : QBO_API_BASE_SANDBOX;
}

export const QBO_SCOPE = "com.intuit.quickbooks.accounting";
export const QBO_MINOR_VERSION = "75";
export const QBO_PAGE_SIZE = 1000;

export const STATE_COOKIE = "qbo_oauth_state";
