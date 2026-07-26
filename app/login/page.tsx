"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth/login";
import { createClient } from "@/lib/supabase/client";

type BranchStatus = "idle" | "loading" | "valid" | "invalid";

interface SelectedBranch {
  status: BranchStatus;
  id: string | null;
  name: string | null;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#eef2ff] text-[#475569] [font-family:var(--font-uae-sans)]" />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelectBranchLink, setShowSelectBranchLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranch>({
    status: "idle",
    id: null,
    name: null,
  });

  const branchCode = searchParams.get("branch")?.trim().toUpperCase() ?? "";

  useEffect(() => {
    let isActive = true;

    async function loadBranch() {
      if (!branchCode) {
        if (isActive) {
          setSelectedBranch({ status: "idle", id: null, name: null });
        }
        return;
      }

      setSelectedBranch({ status: "loading", id: null, name: null });

      const { data, error: branchError } = await supabase
        .from("branches")
        .select("id, name")
        .eq("code", branchCode)
        .maybeSingle();

      if (!isActive) return;

      if (branchError || !data) {
        setSelectedBranch({ status: "invalid", id: null, name: null });
        return;
      }

      setSelectedBranch({ status: "valid", id: data.id, name: data.name });
    }

    void loadBranch();

    return () => {
      isActive = false;
    };
  }, [branchCode, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShowSelectBranchLink(false);

    if (branchCode && selectedBranch.status === "invalid") {
      setError("Branch not recognized - please go back and select your branch");
      return;
    }

    setIsLoading(true);

    try {
      const { profile } = await login(identifier, password);

      if (!branchCode && profile?.role === "member") {
        await supabase.auth.signOut();
        setError(
          "This login is for administrators. Members should log in via the branch selection page."
        );
        setShowSelectBranchLink(true);
        return;
      }

      if (branchCode && profile?.role !== "member") {
        await supabase.auth.signOut();
        setError(
          "This login is for members. Administrators should use the direct admin login link."
        );
        return;
      }

      if (
        branchCode &&
        profile?.role === "member" &&
        selectedBranch.id &&
        profile.branch_id !== selectedBranch.id
      ) {
        await supabase.auth.signOut();
        setError(
          "This Member ID belongs to a different branch. Please go back and select your correct branch."
        );
        return;
      }

      router.refresh();
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const branchNotRecognized = branchCode && selectedBranch.status === "invalid";
  const branchResolving = branchCode && selectedBranch.status === "loading";
  const branchMismatchBlocked = branchCode && selectedBranch.status !== "valid";

  return (
    <main className="min-h-screen bg-[#eef2ff] text-[#475569] [font-family:var(--font-uae-sans)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-2">
        <section className="flex items-center bg-[#0f1729] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div className="max-w-xl">
            <Link
              href="/"
              className="inline-block text-6xl font-bold tracking-wide text-white [font-family:var(--font-uae-display)] transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] sm:text-7xl"
            >
              UAE
            </Link>
            <div className="mt-3 h-0.5 w-24 bg-[#c9a227]" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold text-[#e2e8f0]">Ugenya Association Eldoret</p>
            <p className="mt-2 text-lg italic text-[#c9a227]">Riwruok Eteko</p>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Welcome. Please sign in to access your member services, branch records, and welfare information.
            </p>
          </div>
        </section>

        <section className="flex items-center bg-white px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full rounded-2xl bg-white p-6 shadow-[0_18px_44px_-20px_rgba(15,23,41,0.35)] ring-1 ring-slate-200 sm:p-8 lg:p-10">
            <h1 className="text-4xl font-semibold text-[#0f1729] [font-family:var(--font-uae-display)]">Member Login</h1>
            <p className="mt-2 text-lg text-[#475569]">
              Sign in with your Member ID or email and password.
            </p>

            {branchCode && selectedBranch.status === "valid" ? (
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-base text-blue-800">
                Logging in to: <span className="font-semibold">{selectedBranch.name}</span>
              </div>
            ) : null}

            {branchCode && selectedBranch.status === "loading" ? (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
                Checking selected branch...
              </div>
            ) : null}

            {branchNotRecognized ? (
              <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-900">
                Branch not recognized - please go back and select your branch
              </div>
            ) : null}

            {error ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700"
              >
                <p>{error}</p>
                {showSelectBranchLink ? (
                  <Link
                    href="/select-branch"
                    className="mt-3 inline-flex text-sm font-semibold text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    Go to branch selection
                  </Link>
                ) : null}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-base font-semibold text-[#0f1729]"
                >
                  Member ID or Email
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                  placeholder="UGY-ABC-0001 or name@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-base font-semibold text-[#0f1729]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
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
                disabled={isLoading || Boolean(branchMismatchBlocked)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1d3a8a] px-5 py-3.5 text-lg font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {branchCode ? (
                <>
                  <Link
                    href="/select-branch"
                    className="block text-sm font-medium text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    Wrong branch? Select a different one
                  </Link>
                  <Link
                    href="/login"
                    className="block text-sm font-medium text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    Admin? Login here
                  </Link>
                </>
              ) : (
                <Link
                  href="/select-branch"
                  className="block text-sm font-medium text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  Are you a member? Select your branch to log in
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}