import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InboxList, type InboxListEntry } from "@/components/InboxList";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listConversationsForOrg,
  recentMessages,
} from "@/lib/server/db/sms";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const conversations = listConversationsForOrg(orgId);
  const entries: InboxListEntry[] = conversations.map((c) => {
    const msgs = recentMessages(c.id, 1);
    return { conversation: c, lastMessage: msgs[msgs.length - 1] ?? null };
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader user={user} current="inbox" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-slate-600">
            Replies from customers, plus what autopilot sent on your behalf.
          </p>
        </div>
        <InboxList entries={entries} />
      </main>
    </div>
  );
}
