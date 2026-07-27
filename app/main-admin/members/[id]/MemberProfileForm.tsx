"use client";

import { useActionState } from "react";
import { updateMemberProfile, type ProfileActionResult } from "./profile-actions";

type MemberProfileFormProps = {
  memberId: string;
  fullName: string;
  phone: string;
  idNumber: string | null;
  status: "active" | "inactive" | "suspended";
  kbgSharesBf: number | string | null;
  sheetOrder: number | null;
};

const initialState: ProfileActionResult = {
  status: "idle",
  message: "",
};

export default function MemberProfileForm({
  memberId,
  fullName,
  phone,
  idNumber,
  status,
  kbgSharesBf,
  sheetOrder,
}: MemberProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    (previousState: ProfileActionResult, formData: FormData) =>
      updateMemberProfile(memberId, previousState, formData),
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
      {state.status !== "idle" ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            defaultValue={fullName}
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={phone}
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="idNumber" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            ID Number
          </label>
          <input
            id="idNumber"
            name="idNumber"
            defaultValue={idNumber ?? ""}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="sheetOrder" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            Sheet Position (Row No.)
          </label>
          <input
            id="sheetOrder"
            name="sheetOrder"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            defaultValue={sheetOrder == null ? "" : String(sheetOrder)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="kbgSharesBf" className="mb-1 block text-sm font-semibold text-[#0f1729]">
            KBG Shares (legacy)
          </label>
          <input
            id="kbgSharesBf"
            name="kbgSharesBf"
            type="number"
            min={0}
            step="0.01"
            defaultValue={kbgSharesBf == null ? "" : String(kbgSharesBf)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
