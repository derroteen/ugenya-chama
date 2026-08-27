"use client";

import { useMemo, useRef, useState } from "react";
import { bulkImportMembers, type BulkImportMember } from "./actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type BranchOption = {
  id: string;
  name: string;
};

type PreviewRow = {
  rowNumber: number;
  full_name: string;
  phone: string;
  status: string;
  error?: string;
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  return rows.map((row) => row.map((cell) => cell.replace(/^\uFEFF/, "").trim()));
}

function isHeaderRow(row: string[]) {
  if (row.length !== 2) return false;
  return row[0].toLowerCase() === "full_name" && row[1].toLowerCase() === "phone";
}

async function readCsvFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("Only CSV files are supported.");
  }

  const text = await file.text();
  const rows = parseCsvText(text);

  if (!rows.length) {
    throw new Error("The CSV file is empty.");
  }

  if (!isHeaderRow(rows[0])) {
    throw new Error("CSV must have exactly two columns named full_name and phone.");
  }

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));

  if (!dataRows.length) {
    throw new Error("No member rows were found in the CSV file.");
  }

  const invalidRowCount = dataRows.filter((row) => row.length !== 2).length;
  if (invalidRowCount > 0) {
    throw new Error("Every row must contain exactly two columns: full_name and phone.");
  }

  const parsedPreview: PreviewRow[] = dataRows.map((row, index) => {
    const fullName = (row[0] ?? "").trim();
    const phone = (row[1] ?? "").trim();

    return {
      rowNumber: index + 2,
      full_name: fullName,
      phone,
      status: "",
    };
  });

  const invalidRows = parsedPreview.filter((row) => !row.full_name || !row.phone);
  if (invalidRows.length > 0) {
    throw new Error("Some rows are missing a full_name or phone value. Please fix the file and try again.");
  }

  return parsedPreview;
}

export default function ImportMembersClient({ branchOptions }: { branchOptions: BranchOption[] }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{ created: number; failed: number; failures: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const isOffline = !useOnlineStatus();

  const canPreview = selectedBranchId.trim().length > 0;
  const canConfirm = previewRows.length > 0 && !importing && !isOffline;

  const previewSummary = useMemo(() => {
    if (!previewRows.length) return "No preview available yet.";
    return `${previewRows.length} rows ready to import`;
  }, [previewRows.length]);

  async function handleFileRead(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewRows([]);
      setFileName("");
      return;
    }

    setErrorMessage("");
    setSummary(null);
    setFileName(file.name);

    try {
      const parsedPreview = await readCsvFile(file);
      setPreviewRows(parsedPreview);
    } catch (error) {
      setPreviewRows([]);
      setErrorMessage(error instanceof Error ? error.message : "Unable to read the CSV file.");
    }
  }

  async function handleUploadPreview() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMessage("Please choose a CSV file to upload.");
      setPreviewRows([]);
      return;
    }

    setErrorMessage("");
    setSummary(null);
    setFileName(file.name);

    try {
      const parsedPreview = await readCsvFile(file);
      setPreviewRows(parsedPreview);
    } catch (error) {
      setPreviewRows([]);
      setErrorMessage(error instanceof Error ? error.message : "Unable to read the CSV file.");
    }
  }

  async function handleConfirmImport() {
    if (!selectedBranchId || previewRows.length === 0) {
      setErrorMessage("Please select a branch and upload a valid CSV file.");
      return;
    }

    const payload: BulkImportMember[] = previewRows.map((row) => ({
      full_name: row.full_name.trim(),
      phone: row.phone.trim(),
    }));

    const invalid = payload.some((row) => !row.full_name || !row.phone);
    if (invalid) {
      setErrorMessage("Preview contains incomplete rows. Please remove or fix them before importing.");
      return;
    }

    setImporting(true);
    setErrorMessage("");
    setSummary(null);

    try {
      const results = await bulkImportMembers(payload, selectedBranchId);
      const created = results.filter((result) => result.success).length;
      const failed = results.filter((result) => !result.success).length;

      setPreviewRows((currentRows) =>
        currentRows.map((row, index) => {
          const result = results[index];
          if (!result) return row;

          return {
            ...row,
            status: result.success ? "Created" : "Failed",
            error: result.error,
          };
        })
      );

      const failures = results
        .filter((result) => !result.success)
        .map((result) => `${result.full_name}: ${result.error ?? "Unknown error"}`);

      setSummary({ created, failed, failures });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Membership</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Import Members
            </h1>
          </div>

          <a
            href="/main-admin/members"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            ← Back to Members
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="branchId" className="mb-2 block text-sm font-semibold text-[#0f1729]">
                Branch
              </label>
              <select
                id="branchId"
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
              >
                <option value="">Select a branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="csvFile" className="mb-2 block text-sm font-semibold text-[#0f1729]">
                CSV File
              </label>
              <input
                id="csvFile"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileRead}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#1d3a8a] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
            >
              Choose CSV
            </button>

            <button
              type="button"
              disabled={!canPreview || !selectedBranchId}
              onClick={handleUploadPreview}
              className="inline-flex items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Upload & Preview
            </button>
          </div>

          {fileName ? (
            <p className="mt-4 text-sm text-slate-600">
              Loaded file: <span className="font-semibold text-[#0f1729]">{fileName}</span>
            </p>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        {previewRows.length > 0 ? (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Preview</h2>
              <span className="rounded-full border border-[#1d3a8a]/20 bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#1d3a8a]">
                {previewSummary}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div
                className="w-full overflow-x-auto"
                style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
              >
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Row</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">full_name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewRows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.full_name}`} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{row.rowNumber}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0f1729] sm:px-6">{row.full_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 sm:px-6">{row.phone}</td>
                        <td className="px-4 py-3 text-sm sm:px-6">
                          {row.status ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                row.status === "Created"
                                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                                  : row.status === "Failed"
                                    ? "border border-red-300 bg-red-50 text-red-700"
                                    : "border border-slate-300 bg-slate-100 text-slate-700"
                              }`}
                            >
                              {row.status}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <OfflineBanner show={isOffline} className="mt-6" />

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirmImport}
                className="inline-flex items-center justify-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {importing ? "Importing..." : "Confirm Import"}
              </button>

              {importing ? (
                <div className="w-full max-w-xs">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full animate-pulse rounded-full bg-[#c9a227]" />
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Processing members
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {summary ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-lg font-semibold text-[#0f1729]">
              {summary.created} members created successfully, {summary.failed} failed
            </p>

            {summary.failures.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-700">
                {summary.failures.map((failure) => (
                  <li key={failure}>{failure}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
