"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTransaction, type BusinessTransaction } from "./actions";
import { TRANSACTION_TYPES, type TransactionType } from "./transaction-types";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type TransactionLogProps = {
  ventureId: string;
  month: string;
  transactions: BusinessTransaction[];
};

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Income",
  fuel: "Fuel",
  driver_payment: "Driver Payment",
  maintenance: "Maintenance",
  other_expense: "Other Expense",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatKsh(value: number) {
  return `KSH ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function TransactionLog({ ventureId, month, transactions }: TransactionLogProps) {
  const router = useRouter();
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [transactionType, setTransactionType] = useState<TransactionType>("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isOffline = !useOnlineStatus();

  const groups = useMemo(() => {
    const map = new Map<TransactionType, BusinessTransaction[]>();
    for (const type of TRANSACTION_TYPES) {
      map.set(type, []);
    }
    for (const transaction of transactions) {
      map.get(transaction.transactionType)?.push(transaction);
    }
    return map;
  }, [transactions]);

  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const transaction of transactions) {
      if (transaction.transactionType === "income") {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
      }
    }
    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    };
  }, [transactions]);

  function handleAddTransaction() {
    setErrorMessage("");
    setSuccessMessage("");

    startSaving(async () => {
      const result = await addTransaction(ventureId, transactionDate, transactionType, description, amount);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
      setDescription("");
      setAmount("");

      const transactionMonth = transactionDate.slice(0, 7);
      if (transactionMonth !== month) {
        router.push(`/main-admin/business/${ventureId}?month=${transactionMonth}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[#0f1729]">Add Transaction</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="transactionDate" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Date
            </label>
            <input
              id="transactionDate"
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>

          <div>
            <label htmlFor="transactionType" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Type
            </label>
            <select
              id="transactionType"
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value as TransactionType)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            >
              {TRANSACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              maxLength={500}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>

          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-semibold text-[#0f1729]">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            />
          </div>
        </div>

        <OfflineBanner show={isOffline} className="mt-4" />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAddTransaction}
            disabled={isSaving || isOffline}
            className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Adding..." : "Add Transaction"}
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
      </div>

      <div className="mt-8 space-y-6">
        {TRANSACTION_TYPES.map((type) => {
          const rows = groups.get(type) ?? [];
          const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);

          return (
            <div key={type}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[#0f1729]">{TYPE_LABELS[type]}</h3>
                <span className="text-sm font-semibold text-slate-600">{formatKsh(subtotal)}</span>
              </div>

              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No {TYPE_LABELS[type].toLowerCase()} entries this month.
                </p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <div
                    className="w-full overflow-x-auto"
                    style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
                  >
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Description
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-2 text-sm text-slate-700">{formatDate(row.transactionDate)}</td>
                            <td className="px-4 py-2 text-sm text-slate-700">{row.description || "-"}</td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-[#0f1729]">
                              {formatKsh(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-[#f8fbff] p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#0f1729]">Monthly Summary</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-600">Total Income</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{formatKsh(totals.totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Total Expenses</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{formatKsh(totals.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Net Profit / Loss</p>
            <p
              className={`mt-1 text-2xl font-bold ${totals.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}
            >
              {formatKsh(totals.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
