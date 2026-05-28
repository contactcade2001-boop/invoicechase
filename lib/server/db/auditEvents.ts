import "server-only";
import { and, desc, eq, gte, like, lt } from "drizzle-orm";
import { getDb } from "./client";
import { auditEvents, type AuditEventRow } from "./schema";

export type AuditKind =
  | "team.invite_sent"
  | "team.invite_revoked"
  | "team.invite_accepted"
  | "team.role_changed"
  | "team.member_removed"
  | "settings.template_saved"
  | "settings.autopilot_toggled"
  | "settings.deposit_toggled"
  | "settings.deposit_config_saved"
  | "settings.digest_phone_saved"
  | "settings.twilio_phone_saved"
  | "settings.twilio_provisioned"
  | "settings.custom_receipts_toggled"
  | "settings.reminder_sequences_toggled"
  | "settings.cashflow_saved"
  | "settings.qbo_refund_accounts_saved"
  | "qbo.connected"
  | "qbo.disconnected"
  | "qbo.payment_retry_synced"
  | "xero.connected"
  | "xero.disconnected"
  | "xero.payment_synced"
  | "jobber.connected"
  | "jobber.disconnected"
  | "jobber.payment_synced"
  | "fsm.connected"
  | "fsm.disconnected"
  | "stripe.connect_started"
  | "sms.text_sent"
  | "sms.bulk_text_sent"
  | "sms.manual_reply_sent"
  | "sms.autopilot_paused"
  | "sms.autopilot_resumed"
  | "email.reminder_sent"
  | "email.bulk_reminder_sent"
  | "partner.applied"
  | "partner.commission_paid"
  | "partner.connect_started"
  | "partner.payout_transferred"
  | "org_referral.attributed"
  | "org_referral.credited"
  | "payment_plan.created"
  | "payment_plan.installment_paid"
  | "pay.link_generated"
  | "report.weekly_sent";

export type LogAuditEventInput = {
  organizationId: number;
  userId?: number | null;
  actorEmail?: string | null;
  kind: AuditKind;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export function logAuditEvent(input: LogAuditEventInput): AuditEventRow {
  const db = getDb();
  return db
    .insert(auditEvents)
    .values({
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      actorEmail: input.actorEmail ?? null,
      kind: input.kind,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: Date.now(),
    })
    .returning()
    .get();
}

export type AuditEventFilters = {
  kind?: string;
  sinceMs?: number;
};

export function pruneAuditEventsOlderThan(cutoffMs: number): number {
  const db = getDb();
  const result = db
    .delete(auditEvents)
    .where(lt(auditEvents.createdAt, cutoffMs))
    .run();
  return Number(result.changes ?? 0);
}

export function listAuditEventsForOrg(
  organizationId: number,
  options: { limit?: number; offset?: number } & AuditEventFilters = {},
): AuditEventRow[] {
  const db = getDb();
  const limit = options.limit ?? 200;
  const offset = options.offset ?? 0;
  const filters = [eq(auditEvents.organizationId, organizationId)];
  if (options.kind && options.kind.trim()) {
    filters.push(like(auditEvents.kind, `%${options.kind.trim()}%`));
  }
  if (options.sinceMs && options.sinceMs > 0) {
    filters.push(gte(auditEvents.createdAt, options.sinceMs));
  }
  return db
    .select()
    .from(auditEvents)
    .where(and(...filters))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}
