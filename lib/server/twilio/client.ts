import "server-only";
import twilio, { type Twilio } from "twilio";
import { getTwilioConfig } from "../env";

let _client: Twilio | null = null;

export function getTwilio(): Twilio {
  if (_client) return _client;
  const { accountSid, authToken } = getTwilioConfig();
  _client = twilio(accountSid, authToken);
  return _client;
}
