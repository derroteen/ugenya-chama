"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createAdminAccountAction } from "./actions";
import type { NewAdminFormState, NewAdminRole } from "./form-state";

interface BranchOption {
  id: string;
  name: string;
}

interface NewAdminFormProps {
  branchOptions: BranchOption[];
  initialState: NewAdminFormState;
}

export default function NewAdminForm({ branchOptions, initialState }: NewAdminFormProps) {
  const [state, formAction, isPending] = useActionState(createAdminAccountAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const [resetVersion, setResetVersion] = useState(0);
  const formDefaultRole: NewAdminRole = state.defaults?.role ?? "main_admin";
  const [selectedRole, setSelectedRole] = useState<NewAdminRole>(formDefaultRole);

  useEffect(() => {
    if (state.status === "success") {
      setShowSuccess(true);
      setCopiedField(null);
    }
  }, [state.status]);

  useEffect(() => {
    setSelectedRole(formDefaultRole);
  }, [formDefaultRole]);

  const showBranchField = selectedRole === "branch_admin";

  const selectedBranchName = useMemo(() => {
    if (!showBranchField) return "-";
    const selectedBranchId = state.defaults?.branchId;
    if (!selectedBranchId) return "Selected branch";

    const found = branchOptions.find((branch) => branch.id === selectedBranchId);
    return found?.name ?? "Selected branch";
  }, [branchOptions, showBranchField, state.defaults?.branchId]);

  async function handleCopy(value: string, field: "email" | "password") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      setCopiedField(null);
    }
  }

  if (state.status === "success" && showSuccess) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-emerald-900 [font-family:var(--font-uae-display)]">
          Admin Account Created
        </h2>
        <p className="mt-3 text-base text-emerald-800 sm:text-lg">
          Role assigned: <span className="font-semibold">{state.role === "branch_admin" ? "Branch Admin" : "Main Admin"}</span>
        </p>
        <p className="mt-1 text-base text-emerald-800 sm:text-lg">
          Branch: <span className="font-semibold">{state.branchName ?? selectedBranchName}</span>
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1d3a8a]/20 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-[#0f1729]">Email</p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2">
              <code className="break-all text-sm font-semibold text-[#1d3a8a]">{state.email}</code>
              <button
                type="button"
                onClick={() => state.email && handleCopy(state.email, "email")}
                className="inline-flex shrink-0 items-center rounded-md bg-[#1d3a8a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#16306f]"
              >
                {copiedField === "email" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#1d3a8a]/20 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-[#0f1729]">Generated Password</p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-2">
              <code className="break-all text-sm font-semibold text-[#1d3a8a]">{state.generatedPassword}</code>
              <button
                type="button"
                onClick={() => state.generatedPassword && handleCopy(state.generatedPassword, "password")}
                className="inline-flex shrink-0 items-center rounded-md bg-[#1d3a8a] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#16306f]"
              >
                {copiedField === "password" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:text-base">
          Share these credentials securely with the new admin. They should change this password after their first login.
        </p>

        <button
          type="button"
          onClick={() => {
            setShowSuccess(false);
            setResetVersion((value) => value + 1);
          }}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#1d3a8a] bg-white px-5 py-2.5 text-sm font-semibold text-[#1d3a8a] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
        >
          Add another admin
        </button>
      </section>
    );
  }

  const branchSelectDefault = state.defaults?.branchId || branchOptions[0]?.id || "";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {state.status === "error" ? (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700"
        >
          {state.errorMessage ?? "Unable to create admin account right now."}
        </div>
      ) : null}

      <form key={resetVersion} action={formAction} className="space-y-5">
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
          <label htmlFor="email" className="mb-2 block text-base font-semibold text-[#0f1729]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={state.defaults?.email ?? ""}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-2 block text-base font-semibold text-[#0f1729]">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={formDefaultRole}
            onChange={(event) => setSelectedRole(event.target.value as NewAdminRole)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          >
            <option value="main_admin">Main Admin</option>
            <option value="branch_admin">Branch Admin</option>
          </select>
        </div>

        {showBranchField ? (
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
          <input type="hidden" name="branchId" value="" />
        )}

        <button
          type="submit"
          disabled={isPending}
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
              Creating admin account...
            </>
          ) : (
            "Create admin account"
          )}
        </button>
      </form>
    </section>
  );
}
