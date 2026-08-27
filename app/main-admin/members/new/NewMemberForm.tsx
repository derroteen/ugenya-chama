"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addMemberAction } from "./actions";
import { type NewMemberFormState } from "./form-state";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

interface BranchOption {
  id: string;
  name: string;
}

interface NewMemberFormProps {
  canChooseBranch: boolean;
  defaultBranchId: string | null;
  ownBranchName: string | null;
  branchOptions: BranchOption[];
  initialState: NewMemberFormState;
}

export default function NewMemberForm({
  canChooseBranch,
  defaultBranchId,
  ownBranchName,
  branchOptions,
  initialState,
}: NewMemberFormProps) {
  const [state, formAction, isPending] = useActionState(addMemberAction, initialState);
  const isOffline = !useOnlineStatus();
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);

  useEffect(() => {
    if (state.status === "success") {
      setShowSuccess(true);
      setCopied(false);
    }
  }, [state.status]);

  const selectedBranchName = useMemo(() => {
    if (!canChooseBranch) {
      return ownBranchName ?? "Your Branch";
    }

    const selectedId =
      state.defaults?.selectedBranchId || defaultBranchId || branchOptions[0]?.id;

    const found = branchOptions.find((branch) => branch.id === selectedId);
    return found?.name ?? ownBranchName ?? "Selected Branch";
  }, [branchOptions, canChooseBranch, defaultBranchId, ownBranchName, state.defaults?.selectedBranchId]);

  async function handleCopyMemberId(memberId: string) {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (state.status === "success" && showSuccess) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-emerald-900 [font-family:var(--font-uae-display)]">
          Member Created Successfully
        </h2>
        <p className="mt-3 text-base text-emerald-800 sm:text-lg">
          Member has been added to: <span className="font-semibold">{state.successBranchName ?? selectedBranchName}</span>
        </p>

        <div className="mt-6">
          <p className="mb-2 text-base font-semibold text-[#0f1729]">Member ID</p>
          <div className="flex flex-col gap-3 rounded-xl border border-[#1d3a8a]/20 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <code className="block break-all rounded-md bg-slate-100 px-3 py-2 text-2xl font-bold tracking-wide text-[#1d3a8a]">
              {state.memberId}
            </code>
            <button
              type="button"
              onClick={() => state.memberId && handleCopyMemberId(state.memberId)}
              className="inline-flex items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-base text-[#0f1729] sm:text-lg">
          Initial password (phone number): <span className="font-semibold">{state.initialPassword ?? state.successPhone}</span>
        </p>

        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:text-base">
          Give this Member ID and their phone number to the new member - they&apos;ll be asked to set a new password on first login.
        </p>

        <button
          type="button"
          onClick={() => {
            setShowSuccess(false);
            setResetVersion((value) => value + 1);
          }}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#1d3a8a] bg-white px-5 py-2.5 text-sm font-semibold text-[#1d3a8a] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
        >
          Add another member
        </button>
      </section>
    );
  }

  const branchSelectDefault =
    state.defaults?.selectedBranchId || defaultBranchId || branchOptions[0]?.id || "";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <OfflineBanner show={isOffline} className="mb-6" />

      {state.status === "error" ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700"
        >
          {state.errorMessage ?? "Unable to create member right now."}
        </div>
      ) : null}

      <form key={resetVersion} action={formAction} className="space-y-5">
        {canChooseBranch ? (
          <div>
            <label htmlFor="branchId" className="mb-2 block text-base font-semibold text-[#0f1729]">
              Branch
            </label>
            <select
              id="branchId"
              name="branchId"
              required
              defaultValue={branchSelectDefault}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            >
              <option value="" disabled>
                Select branch
              </option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="branchId" value={defaultBranchId ?? ""} />
        )}

        <div>
          <label htmlFor="fullName" className="mb-2 block text-base font-semibold text-[#0f1729]">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={state.defaults?.fullName ?? ""}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-base font-semibold text-[#0f1729]">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={state.defaults?.phone ?? ""}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            placeholder="07XXXXXXXX"
          />
          <p className="mt-2 text-sm text-slate-500">Use Kenyan format, for example: 07XXXXXXXX.</p>
        </div>

        <div>
          <label htmlFor="idNumber" className="mb-2 block text-base font-semibold text-[#0f1729]">
            ID Number (Optional)
          </label>
          <input
            id="idNumber"
            name="idNumber"
            type="text"
            defaultValue={state.defaults?.idNumber ?? ""}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            placeholder="Enter national ID number"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isOffline}
          className="inline-flex items-center justify-center rounded-xl bg-[#1d3a8a] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  className="opacity-30"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  d="M21 12a9 9 0 00-9-9"
                  className="opacity-100"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Creating member...
            </>
          ) : (
            "Create member"
          )}
        </button>
      </form>
    </section>
  );
}
