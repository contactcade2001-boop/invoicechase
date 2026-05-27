"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AgingBreakdown } from "@/components/AgingBreakdown";
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
  source: "qbo" | "xero" | "jobber" | null;
  /** Server-rendered slots that need to live inside the dashboard layout. */
  pulseSlot?: ReactNode;
  playsSlot?: ReactNode;
  patternsSlot?: ReactNode;
};

export function Dashboard({
  companyName,
  customers,
  refreshedAt,
  stale,
  source,
  pulseSlot,
  playsSlot,
  patternsSlot,
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
        source={source}
      />

      {pulseSlot}

      {playsSlot || patternsSlot ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {playsSlot}
          {patternsSlot}
        </div>
      ) : null}

      <AgingBreakdown customers={customers} />

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
