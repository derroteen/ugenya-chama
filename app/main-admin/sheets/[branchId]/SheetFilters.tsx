"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type BranchOption = {
  id: string;
  name: string;
};

type SheetFiltersProps = {
  branches: BranchOption[];
  currentBranchId: string;
  month: string;
};

export default function SheetFilters({ branches, currentBranchId, month }: SheetFiltersProps) {
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId);
  const [selectedMonth, setSelectedMonth] = useState(month);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBranchId) return;
    router.push(`/main-admin/sheets/${selectedBranchId}?month=${selectedMonth}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="branchId" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Branch
          </label>
          <select
            id="branchId"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="month" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Month
          </label>
          <input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
          >
            Open Sheet
          </button>
        </div>
      </div>
    </form>
  );
}
