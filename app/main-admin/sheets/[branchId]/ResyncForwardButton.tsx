"use client";

import { useState, useTransition } from "react";
import { resyncMonthlySavingsForward } from "../actions";

type ResyncForwardButtonProps = {
  branchId: string;
};

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export default function ResyncForwardButton({ branchId }: ResyncForwardButtonProps) {
  const [isResyncing, startResync] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleClick() {
    const input = window.prompt(
      "Resync this branch forward from which month? (YYYY-MM)\n\nThis recalculates every later month's carry-forward values for every member with a row in that month. The month you enter is never changed - only the months after it."
    );

    if (input === null) return;

    const fromMonth = input.trim();
    if (!isValidMonth(fromMonth)) {
      setSuccessMessage("");
      setErrorMessage("Enter a month in YYYY-MM format, e.g. 2026-07.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    startResync(async () => {
      const result = await resyncMonthlySavingsForward(branchId, fromMonth);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isResyncing}
        className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isResyncing ? "Resyncing..." : "Resync This Branch Forward"}
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
  );
}
