import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InboxList, type InboxListEntry } from "@/components/InboxList";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getReadsForUser } from "@/lib/server/db/inboxReads";
import {
  countConversationsForOrg,
  listConversationsForOrg,
  recentMessages,
} from "@/lib/server/db/sms";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ page?: string }>;

export default async function InboxPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const page = Math.max(1, Number(sp.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const conversations = listConversationsForOrg(orgId, {
    limit: PAGE_SIZE,
    offset,
  });
  const total = countConversationsForOrg(orgId);
  const reads = getReadsForUser(
    user.id,
    conversations.map((c) => c.id),
  );

  const entries: InboxListEntry[] = conversations.map((c) => {
    const msgs = recentMessages(c.id, 1);
    const lastRead = reads.get(c.id) ?? 0;
    return {
      conversation: c,
      lastMessage: msgs[msgs.length - 1] ?? null,
      unread: c.lastMessageAt > lastRead,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="inbox" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
            <p className="mt-1 text-sm text-slate-600">
              Replies from customers, plus what autopilot sent on your behalf.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {total} conversation{total === 1 ? "" : "s"}
          </span>
        </div>
        <InboxList entries={entries} />
        {(hasPrev || hasNext) && (
          <div className="flex items-center justify-between text-sm">
            {hasPrev ? (
              <Link
                href={`/inbox?page=${page - 1}`}
                className="text-slate-600 hover:text-slate-900"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={`/inbox?page=${page + 1}`}
                className="text-slate-600 hover:text-slate-900"
              >
                Older →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
