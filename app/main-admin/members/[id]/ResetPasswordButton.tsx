"use client";

import { useState } from "react";
import { resetMemberPassword } from "./actions";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

type ResetPasswordButtonProps = {
  memberId: string;
  memberName: string;
  memberNumber: string;
};

type ResetMode = "phone" | "custom";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordButton({ memberId, memberName, memberNumber }: ResetPasswordButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ResetMode>("phone");
  const [customPassword, setCustomPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isOffline = !useOnlineStatus();

  function closeDialog() {
    setIsOpen(false);
    setMode("phone");
    setCustomPassword("");
    setErrorMessage("");
  }

  async function handleReset() {
    setErrorMessage("");
    setSuccessMessage("");

    if (mode === "custom" && customPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsResetting(true);

    try {
      const usedCustom = mode === "custom";
      const passwordToSet = customPassword;
      const result = await resetMemberPassword(memberId, usedCustom ? passwordToSet : undefined);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(usedCustom ? `${result.message} New password: ${passwordToSet}` : result.message);
      closeDialog();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reset the password right now.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={() => {
            setSuccessMessage("");
            setIsOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-lg border border-[#1d3a8a]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#1d3a8a] transition hover:bg-[#f8fbff]"
        >
          Reset Password
        </button>

        {successMessage ? (
          <div
            role="status"
            className="flex max-w-md items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span className="break-all">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="rounded px-1 text-emerald-700 transition hover:bg-emerald-100"
              aria-label="Dismiss password reset message"
            >
              x
            </button>
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Member Login</p>
                <h2 className="mt-2 text-2xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)]">
                  Reset Password
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close reset password dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg font-semibold text-[#0f1729]">{memberName}</p>
              <p className="mt-1 text-sm font-medium text-[#1d3a8a]">{memberNumber}</p>
            </div>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resetMode"
                  checked={mode === "phone"}
                  onChange={() => setMode("phone")}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold text-[#0f1729]">Reset to phone number</span>
                  <span className="block text-slate-600">
                    Sets the password back to the phone number stored on this member&apos;s profile.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name="resetMode"
                  checked={mode === "custom"}
                  onChange={() => setMode("custom")}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="font-semibold text-[#0f1729]">Set a custom password</span>
                  <span className="block text-slate-600">Type the new password to give to the member.</span>
                </span>
              </label>

              {mode === "custom" ? (
                <div>
                  <label htmlFor="customPassword" className="mb-1 block text-sm font-semibold text-[#0f1729]">
                    New password
                  </label>
                  <input
                    id="customPassword"
                    type="text"
                    value={customPassword}
                    onChange={(event) => setCustomPassword(event.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    maxLength={72}
                    autoComplete="off"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  />
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <OfflineBanner show={isOffline} className="mt-4" />

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isResetting || isOffline}
                onClick={handleReset}
                className="inline-flex items-center justify-center rounded-lg bg-[#1d3a8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
