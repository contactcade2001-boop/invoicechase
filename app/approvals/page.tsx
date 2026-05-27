import { redirect } from "next/navigation";
import { Inbox, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ApprovalQueueClient } from "@/components/ApprovalQueueClient";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listPending } from "@/lib/server/db/approvalQueue";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const items = listPending(user.organizationId!);
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <AppHeader user={user} current="inbox" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            Owner approvals
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Review AI-drafted messages.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            When &ldquo;Owner approval required&rdquo; is on, Claude drafts the
            message here instead of sending. Approve to send, decline to skip.
          </p>
        </header>
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-stone-200">
            <Sparkles className="mx-auto h-8 w-8 text-orange-500" aria-hidden />
            <h3 className="font-display mt-3 text-base font-semibold text-stone-900">
              Inbox zero
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              No drafts waiting. Either everything&apos;s auto-sending or
              nothing&apos;s queued.
            </p>
          </div>
        ) : (
          <ApprovalQueueClient items={items} />
        )}
        <p className="mt-8 text-center text-[11px] text-stone-500">
          <Inbox className="mr-1 inline-block h-3 w-3 align-middle" /> Toggle
          this feature in /settings.
        </p>
      </main>
    </div>
  );
}
