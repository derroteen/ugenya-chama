"use client";

import { FormEvent, useState, useTransition } from "react";
import { pdf } from "@react-pdf/renderer";
import FinancialReportDocument from "./FinancialReportDocument";
import AnnualReportDocument from "./AnnualReportDocument";
import { generateAnnualReport, generateFinancialReport } from "./actions";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentYear() {
  return String(new Date().getFullYear());
}

export default function FinancialReportGenerator() {
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear());
  const [isGenerating, startGenerating] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    startGenerating(() => {
      void (async () => {
        try {
          if (viewMode === "monthly") {
            setStatusMessage("Fetching financial data...");
            const report = await generateFinancialReport(selectedMonth);

            setStatusMessage("Generating PDF...");
            const blob = await pdf(<FinancialReportDocument report={report} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `UAE-Financial-Report-${report.month}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setStatusMessage(`PDF ready for ${report.monthLabel}.`);
            return;
          }

          setStatusMessage("Fetching annual financial data...");
          const report = await generateAnnualReport(Number(selectedYear));

          setStatusMessage("Generating annual PDF...");
          const blob = await pdf(<AnnualReportDocument report={report} />).toBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");

          link.href = url;
          link.download = `UAE-Annual-Report-${report.year}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);

          setStatusMessage(`Annual PDF ready for ${report.year}.`);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to generate the financial report.");
          setStatusMessage("");
        }
      })();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "monthly"
                ? "bg-[#1d3a8a] text-white shadow-sm"
                : "border border-slate-300 bg-white text-[#0f1729] hover:bg-slate-50"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setViewMode("annual")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "annual"
                ? "bg-[#1d3a8a] text-white shadow-sm"
                : "border border-slate-300 bg-white text-[#0f1729] hover:bg-slate-50"
            }`}
          >
            Annual
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {viewMode === "monthly" ? (
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
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="year" className="mb-2 block text-sm font-semibold text-[#0f1729]">
                Year
              </label>
              <input
                id="year"
                type="number"
                min={2020}
                step={1}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                required
              />
            </div>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isGenerating || (viewMode === "monthly" ? !selectedMonth : !selectedYear)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isGenerating
                ? "Generating..."
                : viewMode === "monthly"
                  ? "Generate PDF"
                  : "Generate Annual PDF"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600">
          {viewMode === "monthly"
            ? "Download a combined monthly report covering savings, emergency fund movements, and business activity."
            : "Download a combined annual report covering all 12 months of savings, emergency fund movements, and business activity."}
        </p>
      </form>

      {statusMessage ? (
        <div className="mt-4 rounded-lg border border-[#1d3a8a]/20 bg-[#f8fbff] px-4 py-3 text-sm font-medium text-[#1d3a8a]">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {errorMessage}
        </div>
      ) : null}
    </>
  );
}
