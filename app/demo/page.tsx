import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoDashboard } from "@/components/DemoDashboard";
import { mockBusiness } from "@/lib/mockData";

export const metadata = {
  title: "Live demo — Invoice Chase",
  description:
    "Click around the Invoice Chase dashboard with sample data — buttons work, payments preview, filters live.",
};

export default function DemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky demo banner */}
      <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm">
        <span className="font-semibold text-amber-900">Live demo</span>
        <span className="text-amber-800">
          {" "}
          — fully interactive with sample data. Nothing here actually sends.
        </span>
        <Link
          href="/login"
          className="ml-2 inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
        >
          Try it with your customers
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {/* Faux app header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Invoice Chase
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-stone-900">Dashboard</span>
            <span className="hidden text-stone-500 sm:inline">Customers</span>
            <span className="hidden text-stone-500 sm:inline">Inbox</span>
            <span className="hidden text-stone-500 sm:inline">Forecast</span>
            <Link
              href="/login"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        <DemoDashboard businessName={mockBusiness.name} />
      </main>
    </div>
  );
}
