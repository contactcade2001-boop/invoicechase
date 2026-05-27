import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Gavel,
  HandCoins,
  Scale,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DemandLetterForm } from "@/components/DemandLetterForm";
import { SettlementOfferForm } from "@/components/SettlementOfferForm";
import { getCurrentUser } from "@/lib/server/auth/session";
import { listOpenOffers } from "@/lib/server/db/settlements";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");
  const offers = listOpenOffers(user.organizationId!);
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="reports" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            Last-resort recovery
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Recovery toolkit.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            For balances that AI reminders + payment plans couldn&apos;t move.
            Escalation in graduated steps — settle, demand, lien, or sue.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Tile
            icon={HandCoins}
            color="emerald"
            title="Settlement offer"
            body="Offer N% off if paid within 48 hours. Recover most of a balance you'd otherwise write off."
          />
          <Tile
            icon={FileText}
            color="amber"
            title="Demand letter"
            body="Formal certified-mail-ready letter giving 10 days to pay before escalation."
          />
          <Tile
            icon={Scale}
            color="orange"
            title="Mechanics lien tracker"
            body="Per-state deadline math. Most owners miss the window — we surface it."
            href="/liens"
          />
          <Tile
            icon={Gavel}
            color="stone"
            title="Small claims packet"
            body="Auto-generated complaint draft + evidence packet ready for the courthouse."
          />
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            <Sparkles className="h-3 w-3 text-orange-600" /> Settlement offer
          </p>
          <h2 className="font-display mt-1 text-xl font-bold text-stone-900">
            Make an offer
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            We send the customer an SMS like &ldquo;Pay $X in 48h, we&apos;ll
            waive $Y.&rdquo; Tracks acceptance + payment automatically.
          </p>
          <div className="mt-5">
            <SettlementOfferForm
              openOffers={offers.map((o) => ({
                id: o.id,
                customerName: o.customerName,
                originalBalanceCents: o.originalBalanceCents,
                offerBalanceCents: o.offerBalanceCents,
                status: o.status,
                expiresAt: o.expiresAt,
              }))}
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            <FileText className="h-3 w-3 text-orange-600" /> Demand letter
          </p>
          <h2 className="font-display mt-1 text-xl font-bold text-stone-900">
            Generate a formal demand letter
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Downloads as a plain-text file ready to print, mail certified, or
            paste into your letterhead.
          </p>
          <div className="mt-5">
            <DemandLetterForm />
          </div>
        </section>

        <p className="mt-8 text-center text-[11px] text-stone-500">
          Recovery toolkit is general guidance, not legal advice. Consult a
          licensed attorney for significant balances.
        </p>
      </main>
    </div>
  );
}

function Tile({
  icon: Icon,
  color,
  title,
  body,
  href,
}: {
  icon: typeof FileText;
  color: "emerald" | "amber" | "orange" | "stone";
  title: string;
  body: string;
  href?: string;
}) {
  const bg = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    stone: "bg-stone-100 text-stone-700 ring-stone-200",
  }[color];
  const content = (
    <div className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:shadow-md hover:ring-stone-300">
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset transition group-hover:scale-110 ${bg}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-display mt-3 text-base font-semibold text-stone-900">
        {title}
      </p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
