import Link from "next/link";
import { redirect } from "next/navigation";
import { TechFastPay } from "@/components/TechFastPay";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  getSubscriptionByOrgId,
  isActive,
} from "@/lib/server/db/subscriptions";
import { getDashboardData } from "@/lib/server/qbo/sync";

export const dynamic = "force-dynamic";

export default async function FastPayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.organizationId!;
  if (!isActive(getSubscriptionByOrgId(orgId))) {
    if (user.role !== "owner") {
      // Tech / manager can't activate; show a stub and let them sign out.
      return (
        <BlockedShell email={user.email}>
          <h1 className="text-2xl font-bold">Waiting on the owner</h1>
          <p className="mt-2 text-sm text-stone-400">
            Your team&apos;s Invoice Chase subscription isn&apos;t active yet.
            Ask the account owner to set up billing.
          </p>
        </BlockedShell>
      );
    }
    redirect("/billing");
  }
  const data = await getDashboardData(orgId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-800 bg-stone-900/70">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-stone-100"
            >
              Invoice Chase
            </Link>
            <span className="ml-2 text-xs uppercase tracking-wide text-stone-500">
              Fast-pay
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="hidden sm:inline">{user.email}</span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-stone-500 underline-offset-2 hover:text-stone-100 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {data.connected ? (
          <TechFastPay customers={data.customers} />
        ) : (
          <div className="rounded-2xl bg-stone-900/70 p-8 text-center shadow-sm ring-1 ring-stone-800">
            <h1 className="text-xl font-bold">QuickBooks not connected</h1>
            <p className="mt-2 text-sm text-stone-400">
              Ask the owner to connect QuickBooks before you can send Fast-Pay
              texts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function BlockedShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-stone-900/70 p-8 text-center shadow-sm ring-1 ring-stone-800">
        {children}
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className="text-stone-500">{email}</span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-stone-500 underline-offset-2 hover:text-stone-100 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
