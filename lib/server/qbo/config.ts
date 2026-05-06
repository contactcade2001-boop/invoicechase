import "server-only";

export const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
export const QBO_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
export const QBO_REVOKE_URL =
  "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

// Sandbox base URL — production would be https://quickbooks.api.intuit.com
export const QBO_API_BASE = "https://sandbox-quickbooks.api.intuit.com";

export const QBO_SCOPE = "com.intuit.quickbooks.accounting";
export const QBO_MINOR_VERSION = "75";

export const STATE_COOKIE = "qbo_oauth_state";
