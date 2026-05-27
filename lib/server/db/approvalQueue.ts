import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "./client";
import { approvalQueue } from "./schema";

export type ApprovalItem = {
  id: number;
  organizationId: number;
  customerId: string;
  customerName: string | null;
  channel: string;
  draftBody: string;
  reason: string | null;
  status: string;
  approvedAt: number | null;
  approvedByUserId: number | null;
  declinedAt: number | null;
  sentAt: number | null;
  createdAt: number;
};

export function listPending(orgId: number): ApprovalItem[] {
  const db = getDb();
  return db
    .select()
    .from(approvalQueue)
    .where(
      and(
        eq(approvalQueue.organizationId, orgId),
        eq(approvalQueue.status, "pending"),
      ),
    )
    .all() as unknown as ApprovalItem[];
}

export function enqueueDraft(input: {
  organizationId: number;
  customerId: string;
  customerName?: string | null;
  channel: "sms" | "email";
  draftBody: string;
  reason?: string;
}): ApprovalItem {
  const db = getDb();
  const row = db
    .insert(approvalQueue)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName ?? null,
      channel: input.channel,
      draftBody: input.draftBody,
      reason: input.reason ?? null,
      createdAt: Date.now(),
    })
    .returning()
    .get();
  return row as unknown as ApprovalItem;
}

export function approve(orgId: number, id: number, userId: number): void {
  const db = getDb();
  db.update(approvalQueue)
    .set({
      status: "approved",
      approvedAt: Date.now(),
      approvedByUserId: userId,
    })
    .where(
      and(eq(approvalQueue.organizationId, orgId), eq(approvalQueue.id, id)),
    )
    .run();
}

export function decline(orgId: number, id: number): void {
  const db = getDb();
  db.update(approvalQueue)
    .set({ status: "declined", declinedAt: Date.now() })
    .where(
      and(eq(approvalQueue.organizationId, orgId), eq(approvalQueue.id, id)),
    )
    .run();
}

export function markSent(orgId: number, id: number): void {
  const db = getDb();
  db.update(approvalQueue)
    .set({ status: "sent", sentAt: Date.now() })
    .where(
      and(eq(approvalQueue.organizationId, orgId), eq(approvalQueue.id, id)),
    )
    .run();
}
