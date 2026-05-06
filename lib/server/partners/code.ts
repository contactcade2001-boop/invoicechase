import "server-only";
import { randomBytes } from "node:crypto";
import { findPartnerByCode } from "../db/partners";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 8;

function randomCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateUniqueReferralCode(): string {
  for (let i = 0; i < 10; i++) {
    const candidate = randomCode();
    if (!findPartnerByCode(candidate)) return candidate;
  }
  // Astronomically unlikely; fall through with a longer code.
  return randomCode() + randomCode();
}

export function generateUniqueOrgReferralCode(
  isTaken: (code: string) => boolean,
): string {
  for (let i = 0; i < 10; i++) {
    const candidate = randomCode();
    if (!isTaken(candidate)) return candidate;
  }
  return randomCode() + randomCode();
}

export function isValidCodeShape(code: string): boolean {
  if (code.length < 4 || code.length > 24) return false;
  return /^[a-z0-9]+$/.test(code);
}
