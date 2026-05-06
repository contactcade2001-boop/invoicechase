import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
