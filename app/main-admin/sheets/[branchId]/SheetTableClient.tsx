"use client";

import { useMemo, useState, useTransition } from "react";
import {
  type SheetRow,
  updateAllEntries,
  updateMonthlyEntry,
} from "../actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type SheetTableClientProps = {
  rows: SheetRow[];
};

type RowDraft = SheetRow & {
  kbgSharesBfInput: string;
  oldSavingsBfInput: string;
  previousBalanceBfInput: string;
  subsInput: string;
  previousEmergBfInput: string;
  emergSubsInput: string;
  withdrawalInput: string;
};

type EditableField =
  | "kbgSharesBfInput"
  | "oldSavingsBfInput"
  | "previousBalanceBfInput"
  | "subsInput"
  | "previousEmergBfInput"
  | "emergSubsInput"
  | "withdrawalInput";

function toNumber(value: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateCumulativeSaving(row: Pick<RowDraft, "kbgSharesBfInput" | "oldSavingsBfInput" | "previousBalanceBfInput" | "subsInput">) {
  return (
    toNumber(row.kbgSharesBfInput) +
    toNumber(row.oldSavingsBfInput) +
    toNumber(row.previousBalanceBfInput) +
    toNumber(row.subsInput)
  );
}

function calculateCumulativeEmergFund(row: Pick<RowDraft, "previousEmergBfInput" | "emergSubsInput">) {
  return toNumber(row.previousEmergBfInput) + toNumber(row.emergSubsInput);
}

function calculateEmergencyBalance(
  row: Pick<RowDraft, "previousEmergBfInput" | "emergSubsInput" | "withdrawalInput">
) {
  return calculateCumulativeEmergFund(row) - toNumber(row.withdrawalInput);
}

function syncComputedValues(row: RowDraft): RowDraft {
  const kbgSharesBf = toNumber(row.kbgSharesBfInput);
  const oldSavingsBf = toNumber(row.oldSavingsBfInput);
  const previousBalanceBf = toNumber(row.previousBalanceBfInput);
  const subs = toNumber(row.subsInput);
  const previousEmergBf = toNumber(row.previousEmergBfInput);
  const emergSubs = toNumber(row.emergSubsInput);
  const withdrawal = toNumber(row.withdrawalInput);
  const cumulativeSaving = calculateCumulativeSaving(row);
  const cumulativeEmergFund = calculateCumulativeEmergFund(row);
  const emergencyBalance = calculateEmergencyBalance(row);

  return {
    ...row,
    kbgSharesBf,
    oldSavingsBf,
    previousBalanceBf,
    subs,
    cumulativeSaving,
    previousEmergBf,
    emergSubs,
    cumulativeEmergFund,
    withdrawal,
    emergencyBalance,
  };
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function toSuccessMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "Rows saved successfully.";
  return trimmed.endsWith(".")
    ? `${trimmed.slice(0, -1)} successfully.`
    : `${trimmed} successfully.`;
}

export default function SheetTableClient({ rows }: SheetTableClientProps) {
  const [isSavingAll, startSaveAll] = useTransition();
  const [isSavingRow, startSaveRow] = useTransition();
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isOffline = !useOnlineStatus();
  const [draftRows, setDraftRows] = useState<RowDraft[]>(() =>
    rows.map((row) => ({
      ...row,
      kbgSharesBfInput: String(row.kbgSharesBf),
      oldSavingsBfInput: String(row.oldSavingsBf),
      previousBalanceBfInput: String(row.previousBalanceBf),
      subsInput: String(row.subs),
      previousEmergBfInput: String(row.previousEmergBf),
      emergSubsInput: String(row.emergSubs),
      withdrawalInput: String(row.withdrawal),
    }))
  );

  const totals = useMemo(
    () =>
      draftRows.reduce(
        (acc, row) => {
          acc.subs += toNumber(row.subsInput);
          acc.cumulativeSaving += calculateCumulativeSaving(row);
          acc.emergSubs += toNumber(row.emergSubsInput);
          acc.withdrawal += toNumber(row.withdrawalInput);
          acc.emergencyBalance += calculateEmergencyBalance(row);
          return acc;
        },
        {
          subs: 0,
          cumulativeSaving: 0,
          emergSubs: 0,
          withdrawal: 0,
          emergencyBalance: 0,
        }
      ),
    [draftRows]
  );

  const updateDraftField = (
    rowIndex: number,
    field: EditableField,
    value: string
  ) => {
    setDraftRows((current) => {
      const next = [...current];
      next[rowIndex] = {
        ...next[rowIndex],
        [field]: value,
      };
      return next;
    });
  };

  const syncRowAfterSave = (rowIndex: number) => {
    setDraftRows((current) => {
      const next = [...current];
      next[rowIndex] = syncComputedValues(next[rowIndex]);
      return next;
    });
  };

  const handleSaveRow = (rowIndex: number) => {
    const row = draftRows[rowIndex];

    setErrorMessage("");
    setSuccessMessage("");
    setSavingRowId(row.monthlySavingsId);

    startSaveRow(async () => {
      const result = await updateMonthlyEntry(
        row.monthlySavingsId,
        row.emergencyContributionId,
        row.kbgSharesBfInput,
        row.oldSavingsBfInput,
        row.previousBalanceBfInput,
        row.subsInput,
        row.previousEmergBfInput,
        row.emergSubsInput,
        row.withdrawalInput
      );

      setSavingRowId(null);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      syncRowAfterSave(rowIndex);
      setSuccessMessage(toSuccessMessage(result.message));
    });
  };

  const handleSaveAll = () => {
    setErrorMessage("");
    setSuccessMessage("");

    startSaveAll(async () => {
      const result = await updateAllEntries(
        draftRows.map((row) => ({
          monthlySavingsId: row.monthlySavingsId,
          emergencyContributionId: row.emergencyContributionId,
          kbgSharesBf: row.kbgSharesBfInput,
          oldSavingsBf: row.oldSavingsBfInput,
          previousBalanceBf: row.previousBalanceBfInput,
          subs: row.subsInput,
          previousEmergBf: row.previousEmergBfInput,
          emergSubs: row.emergSubsInput,
          withdrawal: row.withdrawalInput,
        }))
      );

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setDraftRows((current) => current.map(syncComputedValues));
      setSuccessMessage(toSuccessMessage(result.message));
    });
  };

  return (
    <>
      <OfflineBanner show={isOffline} className="mt-6" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSavingAll || isSavingRow || draftRows.length === 0 || isOffline}
          className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSavingAll ? "Saving..." : "Save All"}
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
        <div
          className="w-full overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
        >
          <table className="min-w-[1500px] divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">No.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">KBG Shares B/F</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Old Savings B/F</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Balance B/F</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Subs</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cumulative Saving</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Previous Emerg B/F</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Emerg Subs</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Cumulative Emerg Fund</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Withdrawal</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Emergency Balance</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {draftRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active members in this branch.
                  </td>
                </tr>
              ) : (
                draftRows.map((row, index) => {
                  const cumulativeSaving = calculateCumulativeSaving(row);
                  const cumulativeEmergFund = calculateCumulativeEmergFund(row);
                  const emergencyBalance = calculateEmergencyBalance(row);
                  const rowIsSaving = isSavingRow && savingRowId === row.monthlySavingsId;
                  return (
                    <tr key={row.monthlySavingsId} className="hover:bg-slate-50/70 align-top">
                      <td className="px-3 py-3 text-sm text-slate-700">{row.sheetOrder ?? "-"}</td>
                      <td className="px-3 py-3 text-sm font-medium text-[#0f1729]">
                        <div>{row.memberName}</div>
                        <div className="text-xs text-slate-500">{row.memberNo}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="kbgSharesBf"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.kbgSharesBfInput}
                          onChange={(event) => updateDraftField(index, "kbgSharesBfInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="oldSavingsBf"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.oldSavingsBfInput}
                          onChange={(event) => updateDraftField(index, "oldSavingsBfInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="previousBalanceBf"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.previousBalanceBfInput}
                          onChange={(event) => updateDraftField(index, "previousBalanceBfInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>

                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="subs"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.subsInput}
                          onChange={(event) => updateDraftField(index, "subsInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(cumulativeSaving)}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="previousEmergBf"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.previousEmergBfInput}
                          onChange={(event) => updateDraftField(index, "previousEmergBfInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="emergSubs"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.emergSubsInput}
                          onChange={(event) => updateDraftField(index, "emergSubsInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(cumulativeEmergFund)}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <input
                          name="withdrawal"
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.withdrawalInput}
                          onChange={(event) => updateDraftField(index, "withdrawalInput", event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(emergencyBalance)}</td>
                      <td className="px-3 py-3 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(index)}
                          disabled={isSavingAll || isSavingRow || isOffline}
                          className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {rowIsSaving ? "Saving..." : "Save Row"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-[#f8fbff]">
              <tr>
                <td colSpan={5} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Totals
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.subs)}</td>
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.cumulativeSaving)}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.emergSubs)}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.withdrawal)}</td>
                <td className="px-3 py-3 text-sm font-semibold text-[#0f1729]">{formatKsh(totals.emergencyBalance)}</td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
