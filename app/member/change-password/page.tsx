"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearMustChangePassword } from "@/lib/auth/login";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (getUserError || !user) {
        throw getUserError ?? new Error("You are not logged in.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      await clearMustChangePassword(user.id);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update password.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <h1 className="text-2xl font-semibold text-slate-900">Change Password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set a new password to continue to your member dashboard.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter a new password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Re-enter your new password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
