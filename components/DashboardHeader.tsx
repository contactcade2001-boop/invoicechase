import { Building2 } from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";

type Props = {
  businessName: string;
  totalOwed: number;
  dso: number;
  overdueCount: number;
};

export function DashboardHeader({
  businessName,
  totalOwed,
  dso,
  overdueCount,
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
    <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Building2 className="h-3.5 w-3.5" aria-hidden />
        {businessName}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
        {stats.map((s, i) => (
          <div key={s.label} className={i > 0 ? "sm:pl-6" : ""}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
              {s.value}
              {s.sub ? (
                <span className="ml-1.5 text-base font-normal text-slate-500">
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
