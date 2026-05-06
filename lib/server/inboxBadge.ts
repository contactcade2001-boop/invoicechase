import "server-only";
import { countUnreadForUser } from "./db/inboxReads";
import type { UserRow } from "./db/schema";

// Owners + managers see the inbox; technicians don't.
export function unreadInboxCountFor(user: UserRow): number {
  if (user.role === "technician") return 0;
  if (!user.organizationId) return 0;
  return countUnreadForUser(user.id, user.organizationId);
}
