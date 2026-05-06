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
  organizationId: number,
  customerId: string,
): PayLinkResult {
  const existing = findActivePayLink(organizationId, customerId);
  if (existing) {
    return {
      token: existing.token,
      url: `${getAppBaseUrl()}/pay/${existing.token}`,
    };
  }
  const token = generateToken();
  const expiresAt = Date.now() + PAY_LINK_TTL_MS;
  insertPayLink({ token, organizationId, customerId, expiresAt });
  return { token, url: `${getAppBaseUrl()}/pay/${token}` };
}

export function createDepositPayLink(
  organizationId: number,
  customerId: string,
  amountCents: number,
): PayLinkResult {
  // Always a fresh token — we don't reuse deposit links because the amount is
  // tied to a specific invoice and reusing would re-charge.
  const token = generateToken();
  const expiresAt = Date.now() + PAY_LINK_TTL_MS;
  insertPayLink({
    token,
    organizationId,
    customerId,
    expiresAt,
    amountCentsOverride: amountCents,
  });
  return { token, url: `${getAppBaseUrl()}/pay/${token}` };
}
