"use client";

import { useMemo, useState } from "react";
import { BulkTextButton } from "@/components/BulkTextButton";
import { CustomerTable } from "@/components/CustomerTable";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FilterTabs } from "@/components/FilterTabs";
import {
  applyFilter,
  computeDSO,
  computeTotalOwed,
} from "@/lib/format";
import { mockBusiness, mockCustomers } from "@/lib/mockData";
import type { FilterKey } from "@/lib/types";

export default function DashboardPage() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const totalOwed = useMemo(() => computeTotalOwed(mockCustomers), []);
  const dso = useMemo(() => computeDSO(mockCustomers), []);

  const counts = useMemo<Record<FilterKey, number>>(
    () => ({
      all: applyFilter(mockCustomers, "all").length,
      overdue: applyFilter(mockCustomers, "overdue").length,
      "high-risk": applyFilter(mockCustomers, "high-risk").length,
      "low-risk": applyFilter(mockCustomers, "low-risk").length,
    }),
    [],
  );

  const visible = useMemo(
    () => applyFilter(mockCustomers, filter),
    [filter],
  );

  const overdue = useMemo(
    () => applyFilter(mockCustomers, "overdue"),
    [],
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
      <DashboardHeader
        businessName={mockBusiness.name}
        totalOwed={totalOwed}
        dso={dso}
      />

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs active={filter} counts={counts} onChange={setFilter} />
        <BulkTextButton overdue={overdue} />
      </div>

      <CustomerTable customers={visible} />
    </main>
  );
}
