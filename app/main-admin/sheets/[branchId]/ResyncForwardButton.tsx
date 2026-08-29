"use client";

import { type FormEvent, useState, useTransition } from "react";
import { resyncMonthlySavingsForward } from "../actions";

type ResyncForwardButtonProps = {
  branchId: string;
};

function isValidMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

export default function ResyncForwardButton({ branchId }: ResyncForwardButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fromMonth, setFromMonth] = useState("");
  const [isResyncing, startResync] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidMonth(fromMonth)) {
      setSuccessMessage("");
      setErrorMessage("Pick a month.");
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

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="text-xs font-medium text-slate-500 underline decoration-dotted underline-offset-2 transition hover:text-slate-700"
      >
        Numbers look wrong somewhere? Reset a branch forward from a month...
      </button>
    );
  }

  return (
    <div className="inline-flex max-w-md flex-col items-start gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">
        Only use this if something looks wrong - sheets already heal themselves
        automatically on every view. This recomputes every month after the one you pick,
        for every member with a row there, and clears any manual brought-forward
        corrections in that range. The month you pick itself is never changed.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="resyncFromMonth" className="mb-1 block text-xs font-semibold text-slate-600">
            Reset forward from
          </label>
          <input
            id="resyncFromMonth"
            type="month"
            value={fromMonth}
            onChange={(event) => setFromMonth(event.target.value)}
            className="block rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <button
          type="submit"
          disabled={isResyncing || !fromMonth}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isResyncing ? "Resetting..." : "Reset Forward"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setFromMonth("");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          className="text-xs font-medium text-slate-500 underline transition hover:text-slate-700"
        >
          Cancel
        </button>
      </form>

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
