import "server-only";
import { generateToken } from "../auth/tokens";
import {
  findActivePayLink,
  insertPayLink,
} from "../db/payLinks";
import { getAppBaseUrl } from "../env";

const PAY_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type PayLinkResult = { token: string; url: string };

export function getOrCreatePayLink(
  userId: number,
  customerId: string,
): PayLinkResult {
  const existing = findActivePayLink(userId, customerId);
  if (existing) {
    return {
      token: existing.token,
      url: `${getAppBaseUrl()}/pay/${existing.token}`,
    };
  }
  const token = generateToken();
  const expiresAt = Date.now() + PAY_LINK_TTL_MS;
  insertPayLink({ token, userId, customerId, expiresAt });
  return { token, url: `${getAppBaseUrl()}/pay/${token}` };
}
