import { Building2 } from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";

type Props = {
  businessName: string;
  totalOwed: number;
  dso: number;
};

export function DashboardHeader({ businessName, totalOwed, dso }: Props) {
  return (
    <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Building2 className="h-4 w-4" aria-hidden />
        {businessName}
      </div>
      <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total owed
          </div>
          <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-5xl">
            {formatCurrencyDetailed(totalOwed)}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            DSO
          </div>
          <div className="mt-0.5 text-2xl font-semibold text-slate-900 tabular-nums">
            {dso} <span className="text-base font-normal text-slate-500">days</span>
          </div>
        </div>
      </div>
    </header>
  );
}
