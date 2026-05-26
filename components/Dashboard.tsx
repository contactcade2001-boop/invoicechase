"use client";

import { useMemo, useState } from "react";
import { BulkEmailButton } from "@/components/BulkEmailButton";
import { BulkTextButton } from "@/components/BulkTextButton";
import { CustomerTable } from "@/components/CustomerTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterTabs } from "@/components/FilterTabs";
import { RefreshDashboardButton } from "@/components/RefreshDashboardButton";
import {
  applyFilter,
  computeDSO,
  computeTotalOwed,
} from "@/lib/format";
import type { Customer, FilterKey } from "@/lib/types";
import { ConnectionStatus } from "./ConnectionStatus";

type Props = {
  companyName: string;
  customers: Customer[];
  refreshedAt: number | null;
  stale: boolean;
};

export function Dashboard({
  companyName,
  customers,
  refreshedAt,
  stale,
}: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const totalOwed = useMemo(() => computeTotalOwed(customers), [customers]);
  const dso = useMemo(() => computeDSO(customers), [customers]);

  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      all: applyFilter(customers, "all").length,
      overdue: applyFilter(customers, "overdue").length,
      "high-risk": applyFilter(customers, "high-risk").length,
      "low-risk": applyFilter(customers, "low-risk").length,
    }),
    [customers],
  );

  const visible = useMemo(
    () => applyFilter(customers, filter),
    [customers, filter],
  );

  const overdue = useMemo(
    () => applyFilter(customers, "overdue"),
    [customers],
  );

  return (
    <>
      <DashboardHeader
        businessName={companyName}
        totalOwed={totalOwed}
        dso={dso}
        overdueCount={counts.overdue}
      />

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <RefreshDashboardButton refreshedAt={refreshedAt} stale={stale} />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs active={filter} counts={counts} onChange={setFilter} />
        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <BulkEmailButton overdue={overdue} />
          <BulkTextButton overdue={overdue} />
        </div>
      </div>

      <CustomerTable customers={visible} />

      <ConnectionStatus companyName={companyName} />
    </>
  );
}
