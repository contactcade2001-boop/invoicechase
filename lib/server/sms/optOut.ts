import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { smsOptOuts } from "../db/schema";

function normalizePhone(p: string): string {
  // Keep digits + leading + so we still distinguish E.164 numbers across
  // countries; matches outbound exactly.
  const digits = p.replace(/[^0-9+]/g, "");
  return digits;
}

export function isOptedOut(
  organizationId: number,
  phone: string,
): boolean {
  if (!phone) return false;
  const db = getDb();
  const row = db
    .select()
    .from(smsOptOuts)
    .where(
      and(
        eq(smsOptOuts.organizationId, organizationId),
        eq(smsOptOuts.phone, normalizePhone(phone)),
      ),
    )
    .get();
  return !!row;
}

export function recordOptOut(
  organizationId: number,
  phone: string,
  reason?: string,
): void {
  if (!phone) return;
  const db = getDb();
  const norm = normalizePhone(phone);
  // Upsert by (org, phone).
  db.insert(smsOptOuts)
    .values({
      organizationId,
      phone: norm,
      reason: reason ?? null,
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: [smsOptOuts.organizationId, smsOptOuts.phone],
      set: {
        reason: reason ?? null,
        createdAt: Date.now(),
      },
    })
    .run();
}

export function clearOptOut(organizationId: number, phone: string): void {
  if (!phone) return;
  const db = getDb();
  db.delete(smsOptOuts)
    .where(
      and(
        eq(smsOptOuts.organizationId, organizationId),
        eq(smsOptOuts.phone, normalizePhone(phone)),
      ),
    )
    .run();
}

// CTIA-compliant keyword lists. Match case-insensitively, exact word match.
const STOP_WORDS = new Set([
  "STOP",
  "UNSUBSCRIBE",
  "CANCEL",
  "QUIT",
  "END",
  "STOPALL",
  "REVOKE",
]);
const HELP_WORDS = new Set(["HELP", "INFO"]);
const RESUME_WORDS = new Set(["START", "UNSTOP", "YES"]);

export type KeywordKind = "stop" | "help" | "resume" | null;

export function classifyKeyword(body: string): KeywordKind {
  const trimmed = body.trim().toUpperCase();
  if (STOP_WORDS.has(trimmed)) return "stop";
  if (HELP_WORDS.has(trimmed)) return "help";
  if (RESUME_WORDS.has(trimmed)) return "resume";
  return null;
}
