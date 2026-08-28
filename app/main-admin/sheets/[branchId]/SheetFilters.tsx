"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BranchOption = {
  id: string;
  name: string;
};

type SheetFiltersProps = {
  branches: BranchOption[];
  currentBranchId: string;
  month: string;
  isSheetOpen: boolean;
};

export default function SheetFilters({ branches, currentBranchId, month, isSheetOpen }: SheetFiltersProps) {
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranchId);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [sheetOpen, setSheetOpen] = useState(isSheetOpen);
  const [isOpening, setIsOpening] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState("");

  function monthLabel(value: string) {
    return new Intl.DateTimeFormat("en-KE", { month: "long", year: "numeric" }).format(
      new Date(`${value}-01T00:00:00`)
    );
  }

  function showSelectionNotice(branchId: string, value: string) {
    const branch = branches.find((option) => option.id === branchId);
    const notice = `Now viewing: ${branch?.name ?? "Selected branch"} - ${monthLabel(value)}`;
    sessionStorage.setItem("sheet-selection-notice", notice);
    setSelectionNotice(notice);
  }

  useEffect(() => {
    setSelectedBranchId(currentBranchId);
    setSelectedMonth(month);
    setSheetOpen(isSheetOpen);
    setIsOpening(false);
    const notice = sessionStorage.getItem("sheet-selection-notice");
    if (notice) {
      sessionStorage.removeItem("sheet-selection-notice");
      setSelectionNotice(notice);
      const timeout = window.setTimeout(() => setSelectionNotice(""), 4000);
      return () => window.clearTimeout(timeout);
    }
  }, [currentBranchId, month, isSheetOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBranchId || !selectedMonth || sheetOpen || isOpening) return;
    setIsOpening(true);
    router.push(`/main-admin/sheets/${selectedBranchId}?month=${selectedMonth}&open=1`);
  }

  function handleBranchChange(value: string) {
    setSelectedBranchId(value);
    setSheetOpen(false);
    setIsOpening(false);
    if (!value) return;
    router.push(`/main-admin/sheets/${value}?month=${selectedMonth}`);
  }

  function handleMonthChange(value: string) {
    setSelectedMonth(value);
    setSheetOpen(false);
    setIsOpening(false);
    if (!selectedBranchId || !value) return;
    showSelectionNotice(selectedBranchId, value);
    router.push(`/main-admin/sheets/${selectedBranchId}?month=${value}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      {selectionNotice ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900" role="status">
          {selectionNotice}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="branchId" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Branch
          </label>
          <select
            id="branchId"
            value={selectedBranchId}
            onChange={(event) => handleBranchChange(event.target.value)}
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
            onChange={(event) => handleMonthChange(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={sheetOpen || isOpening}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
              sheetOpen
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                : "bg-[#1d3a8a] text-white hover:bg-[#16306f]"
            }`}
          >
            {isOpening ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                Opening Sheet...
              </>
            ) : sheetOpen ? (
              "Sheet Opened"
            ) : (
              "Open Sheet"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
