import "server-only";

export const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
export const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
export const XERO_REVOKE_URL = "https://identity.xero.com/connect/revocation";
export const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
export const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

// Scopes covering: read contacts/invoices/payments + write payments/credit notes,
// plus a refresh token so we can stay connected past the access token expiry.
export const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.contacts.read",
  "accounting.transactions",
  "accounting.transactions.read",
  "accounting.settings.read",
].join(" ");

export const XERO_STATE_COOKIE = "xero_oauth_state";
