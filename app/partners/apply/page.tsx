import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/server/auth/session";
import { findPartnerByUserId } from "@/lib/server/db/partners";
import { PartnerApplyForm } from "@/components/PartnerApplyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply — Invoice Chase Partner Program",
};

export default async function PartnerApplyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/partners/apply");
  }
  const existing = findPartnerByUserId(user.id);
  if (existing) {
    redirect("/partner");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <Link
            href="/partners"
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            ← Partner program
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Become a partner
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Earn 20% recurring on every Invoice Chase subscription you refer. Tell
          us where to send your monthly payout statements.
        </p>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <PartnerApplyForm defaultEmail={user.email} />
        </div>
      </main>
    </div>
  );
}
