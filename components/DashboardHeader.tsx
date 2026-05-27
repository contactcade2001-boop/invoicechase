import { Building2 } from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";
import { JobberLogo, QuickBooksLogo, XeroLogo } from "./BrandLogos";

type Props = {
  businessName: string;
  totalOwed: number;
  dso: number;
  overdueCount: number;
  source?: "qbo" | "xero" | "jobber" | null;
};

function SourceBadge({ source }: { source: Props["source"] }) {
  if (!source) return null;
  if (source === "qbo")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
        <QuickBooksLogo size={12} /> Synced with QuickBooks
      </span>
    );
  if (source === "xero")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-200">
        <XeroLogo size={12} /> Synced with Xero
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
      <JobberLogo size={12} /> Synced with Jobber
    </span>
  );
}

export function DashboardHeader({
  businessName,
  totalOwed,
  dso,
  overdueCount,
  source = null,
}: Props) {
  const stats = [
    {
      label: "Total outstanding",
      value: formatCurrencyDetailed(totalOwed),
      sub: null as string | null,
    },
    {
      label: "Overdue customers",
      value: overdueCount.toString(),
      sub: overdueCount === 0 ? "All current" : null,
    },
    {
      label: "Avg days late",
      value: dso.toString(),
      sub: dso > 0 ? "days" : "—",
    },
  ];

  return (
    <header className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          <Building2 className="h-3.5 w-3.5" aria-hidden />
          {businessName}
        </div>
        <SourceBadge source={source} />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-stone-800">
        {stats.map((s, i) => (
          <div key={s.label} className={i > 0 ? "sm:pl-6" : ""}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {s.label}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-stone-100 tabular-nums">
              {s.value}
              {s.sub ? (
                <span className="ml-1.5 text-base font-normal text-stone-500">
                  {s.sub}
                </span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </header>
  );
}
