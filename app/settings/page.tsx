"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import OfflineBanner from "@/app/components/OfflineBanner";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isOffline = !useOnlineStatus();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError || !user?.email) {
        throw getUserError ?? new Error("You are not logged in.");
      }

      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (reAuthError) {
        setError("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (submitError) {
      const message =
        submitError instanceof Error && submitError.message.trim()
          ? submitError.message
          : "Unable to update password right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-3 text-base sm:text-lg">Update your account password securely.</p>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-800"
          >
            {successMessage}
          </div>
        ) : null}

        <OfflineBanner show={isOffline} className="mt-6" />

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="currentPassword" className="mb-2 block text-base font-semibold text-[#0f1729]">
              Current Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                placeholder="Enter current password"
              />
              <button
                type="button"
                disabled={isLoading}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showCurrentPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.88 5.09A9.46 9.46 0 0112 4.8c4.37 0 7.96 2.73 9.4 6.6a10.55 10.55 0 01-4.1 5.03M6.61 6.61A10.6 10.6 0 002.6 11.4C4.04 15.27 7.63 18 12 18c1.23 0 2.4-.22 3.48-.62"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.6 12.6a10.08 10.08 0 0118.8 0A10.08 10.08 0 012.6 12.6z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-2 block text-base font-semibold text-[#0f1729]">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                placeholder="Enter new password"
              />
              <button
                type="button"
                disabled={isLoading}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showNewPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.88 5.09A9.46 9.46 0 0112 4.8c4.37 0 7.96 2.73 9.4 6.6a10.55 10.55 0 01-4.1 5.03M6.61 6.61A10.6 10.6 0 002.6 11.4C4.04 15.27 7.63 18 12 18c1.23 0 2.4-.22 3.48-.62"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.6 12.6a10.08 10.08 0 0118.8 0A10.08 10.08 0 012.6 12.6z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="mb-2 block text-base font-semibold text-[#0f1729]">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                disabled={isLoading}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18M10.6 10.6a2 2 0 102.8 2.8M9.88 5.09A9.46 9.46 0 0112 4.8c4.37 0 7.96 2.73 9.4 6.6a10.55 10.55 0 01-4.1 5.03M6.61 6.61A10.6 10.6 0 002.6 11.4C4.04 15.27 7.63 18 12 18c1.23 0 2.4-.22 3.48-.62"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.6 12.6a10.08 10.08 0 0118.8 0A10.08 10.08 0 012.6 12.6z"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isOffline}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#1d3a8a] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin"
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
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
