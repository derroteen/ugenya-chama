"use client";

import { FormEvent, useState } from "react";
import { login } from "@/lib/auth/login";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(identifier, password);
      // No redirect here: middleware handles logged-in routing.
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
        <h1 className="text-2xl font-semibold text-slate-900">Member Login</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in with your Member ID or email and password.
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
              htmlFor="identifier"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Member ID or Email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="UGY-ABC-0001 or name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}