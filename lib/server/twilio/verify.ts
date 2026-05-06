import "server-only";
import { createHmac } from "node:crypto";
import { getTwilioConfig } from "../env";

// Twilio signs requests by HMAC-SHA1 over the URL + sorted form params.
// Docs: https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function verifyTwilioSignature(input: {
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  if (!input.signature) return false;
  let authToken: string;
  try {
    authToken = getTwilioConfig().authToken;
  } catch {
    return false;
  }
  const sortedKeys = Object.keys(input.params).sort();
  let payload = input.url;
  for (const key of sortedKeys) {
    payload += key + (input.params[key] ?? "");
  }
  const expected = createHmac("sha1", authToken)
    .update(payload, "utf8")
    .digest("base64");
  return expected === input.signature;
}
