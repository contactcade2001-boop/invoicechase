import "server-only";

export const JOBBER_AUTH_URL = "https://api.getjobber.com/api/oauth/authorize";
export const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
export const JOBBER_GRAPHQL_URL = "https://api.getjobber.com/api/graphql";

// Pinned GraphQL schema version. Jobber requires this on every request.
// Bump when you intentionally adopt a new schema; otherwise pin it so
// Jobber doesn't unilaterally change response shapes on us.
export const JOBBER_GRAPHQL_VERSION = "2023-11-15";

// Scopes:
//   read_clients   — list customers + their contact info
//   read_invoices  — list invoices and amounts
//   write_payments — record a payment back to Jobber when Stripe collects
export const JOBBER_SCOPES = [
  "read_clients",
  "read_invoices",
  "write_payments",
].join(" ");

export const JOBBER_STATE_COOKIE = "jobber_oauth_state";
