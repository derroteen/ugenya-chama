"use client";

import { useMemo, useState, useTransition } from "react";
import { saveFuneralCollections, type FuneralCollectionSource, type FuneralSheetMember } from "./actions";

type FuneralSheetFormProps = {
  branchId: string;
  members: FuneralSheetMember[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

export default function FuneralSheetForm({ branchId, members }: FuneralSheetFormProps) {
  const [eventDescription, setEventDescription] = useState("");
  const [collectionDate, setCollectionDate] = useState(todayIso());
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.memberId, ""]))
  );
  const [sources, setSources] = useState<Record<string, FuneralCollectionSource>>(() =>
    Object.fromEntries(members.map((member) => [member.memberId, "cash"]))
  );
  const [isSaving, startSaving] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const total = useMemo(
    () => Object.values(amounts).reduce((sum, value) => sum + toNumber(value), 0),
    [amounts]
  );

  function updateAmount(memberId: string, value: string) {
    setAmounts((current) => ({ ...current, [memberId]: value }));
  }

  function updateSource(memberId: string, value: FuneralCollectionSource) {
    setSources((current) => ({ ...current, [memberId]: value }));
  }

  function handleSaveAll() {
    setErrorMessage("");
    setSuccessMessage("");

    startSaving(async () => {
      const result = await saveFuneralCollections(
        branchId,
        eventDescription,
        collectionDate,
        members.map((member) => ({
          memberId: member.memberId,
          amount: amounts[member.memberId] ?? "",
          source: sources[member.memberId] ?? "cash",
        }))
      );

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
    });
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eventDescription" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Event Description
            </label>
            <input
              id="eventDescription"
              type="text"
              value={eventDescription}
              onChange={(event) => setEventDescription(event.target.value)}
              placeholder="e.g. Death of Jane's father"
              maxLength={200}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>

          <div>
            <label htmlFor="collectionDate" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Collection Date
            </label>
            <input
              id="collectionDate"
              type="date"
              value={collectionDate}
              onChange={(event) => setCollectionDate(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving || members.length === 0}
          className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save All"}
        </button>

        {successMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="rounded px-1 text-emerald-700 transition hover:bg-emerald-100"
              aria-label="Dismiss success message"
            >
              x
            </button>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="rounded px-1 text-rose-700 transition hover:bg-rose-100"
              aria-label="Dismiss error message"
            >
              x
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">No.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Member ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Amount</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active members in this branch.
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr key={member.memberId} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3 text-sm text-slate-700">{member.sheetOrder ?? index + 1}</td>
                    <td className="px-3 py-3 text-sm font-medium text-[#0f1729]">{member.memberName}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{member.memberNo}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amounts[member.memberId] ?? ""}
                        onChange={(event) => updateAmount(member.memberId, event.target.value)}
                        placeholder="0.00"
                        className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-700">
                      <select
                        value={sources[member.memberId] ?? "cash"}
                        onChange={(event) => updateSource(member.memberId, event.target.value as FuneralCollectionSource)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                      >
                        <option value="cash">Cash</option>
                        <option value="emergency_fund">From Emergency Fund</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-[#f8fbff]">
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
