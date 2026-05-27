import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InboxThread } from "@/components/InboxThread";
import { getCurrentUser } from "@/lib/server/auth/session";
import { markConversationRead } from "@/lib/server/db/inboxReads";
import {
  findConversationById,
  listAllMessagesForConv,
} from "@/lib/server/db/sms";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function InboxThreadPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isFinite(conversationId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "technician") redirect("/dashboard");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") redirect("/dashboard");
    redirect("/billing");
  }

  const conversation = findConversationById(conversationId, orgId);
  if (!conversation) notFound();
  markConversationRead(user.id, conversation.id);
  const messages = listAllMessagesForConv(conversation.id);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="inbox" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6 sm:py-8">
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Inbox
        </Link>
        <InboxThread conversation={conversation} messages={messages} />
      </main>
    </div>
  );
}
