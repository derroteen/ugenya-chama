"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBranch } from "./actions";

export default function CreateBranchForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSaving, startSaving] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function resetAndClose() {
    setName("");
    setCode("");
    setErrorMessage("");
    setIsOpen(false);
  }

  function handleSubmit() {
    setErrorMessage("");
    setSuccessMessage("");

    startSaving(async () => {
      const result = await createBranch(name, code);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(result.message);
      setName("");
      setCode("");
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
        >
          + Add Branch
        </button>

        {successMessage ? (
          <span className="text-sm font-medium text-emerald-700">{successMessage}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#0f1729]">Add New Branch</h2>
        <p className="text-xs text-slate-500">New branches are rare — double-check details before saving.</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="branchName" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Branch Name
          </label>
          <input
            id="branchName"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Kiplombe"
            maxLength={100}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <div>
          <label htmlFor="branchCode" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Branch Code
          </label>
          <input
            id="branchCode"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="e.g. KPL"
            maxLength={10}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base uppercase text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
          <p className="mt-1 text-xs text-slate-500">A short unique code, 2-10 letters or numbers.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || !name.trim() || !code.trim()}
          className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Creating..." : "Create Branch"}
        </button>

        <button
          type="button"
          onClick={resetAndClose}
          disabled={isSaving}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>

        {errorMessage ? (
          <span className="text-sm font-medium text-rose-700">{errorMessage}</span>
        ) : null}
      </div>
    </div>
  );
}
