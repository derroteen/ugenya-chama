"use client";

import { useMemo, useState, useTransition } from "react";
import { pdf } from "@react-pdf/renderer";
import { getMemberPassbookData, type PassbookData } from "./actions";
import PassbookDocument from "./PassbookDocument";

type PassbookClientProps = {
  initialData: PassbookData;
};

function formatMonthLabel(month: string) {
  if (!month) return "All months";
  const date = new Date(`${month}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return month;

  return new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PassbookClient({ initialData }: PassbookClientProps) {
  const [range, setRange] = useState({ fromMonth: initialData.fromMonth, toMonth: initialData.toMonth });
  const [data, setData] = useState(initialData);
  const [isLoading, startLoading] = useTransition();
  const [isGeneratingPdf, startPdfGeneration] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  const rangeLabel = useMemo(() => {
    const from = range.fromMonth ? formatMonthLabel(range.fromMonth) : "All months";
    const to = range.toMonth ? formatMonthLabel(range.toMonth) : "All months";
    return `${from} - ${to}`;
  }, [range.fromMonth, range.toMonth]);

  async function refreshPassbook() {
    setErrorMessage("");
    startLoading(async () => {
      try {
        const nextData = await getMemberPassbookData(range.fromMonth, range.toMonth);
        setData(nextData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load your passbook.");
      }
    });
  }

  async function handleDownloadPdf() {
    setErrorMessage("");
    startPdfGeneration(async () => {
      try {
        const passbook = await getMemberPassbookData(range.fromMonth, range.toMonth);
        const blob = await pdf(<PassbookDocument passbook={passbook} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `UAE-${passbook.memberId}-Passbook-${passbook.fromMonth || "all"}-${passbook.toMonth || "all"}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to generate the PDF.");
      }
    });
  }

  return (
    <>
      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              From Month
              <input
                type="month"
                value={range.fromMonth}
                onChange={(event) => setRange((current) => ({ ...current, fromMonth: event.target.value }))}
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#1d3a8a]/10"
              />
            </label>

            <label className="flex flex-col text-sm font-medium text-slate-700">
              To Month
              <input
                type="month"
                value={range.toMonth}
                onChange={(event) => setRange((current) => ({ ...current, toMonth: event.target.value }))}
                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#1d3a8a]/10"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void refreshPassbook()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg bg-[#0f1729] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Loading..." : "Apply Filter"}
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGeneratingPdf ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Date range:</span>
          <span>{rangeLabel}</span>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Savings Passbook</h2>
          {data.savingsRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-slate-600">
              No savings records found for the selected range.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                <table className="min-w-[640px] divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Month</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Old Savings B/F</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Balance B/F</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Subs</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Cumulative Saving</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.savingsRows.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-700">{formatMonthLabel(row.month)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.oldSavingsBf)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.previousBalanceBf)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.subs)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1d3a8a]">{formatAmount(row.cumulativeSaving)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Emergency Fund Passbook</h2>
          {data.emergencyRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-slate-600">
              No emergency fund records found for the selected range.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}>
                <table className="min-w-[640px] divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Month</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Emerg B/F</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Emerg Subs</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Withdrawal</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Emergency Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.emergencyRows.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-700">{formatMonthLabel(row.month)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.previousEmergBf)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.emergSubs)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(row.withdrawal)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1d3a8a]">{formatAmount(row.emergencyBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
