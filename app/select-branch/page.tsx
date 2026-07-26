import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface BranchRecord {
  id: string;
  name: string;
  code: string;
}

export default async function SelectBranchPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("branches")
    .select("id, name, code")
    .order("name", { ascending: true });

  const branches = ((data ?? []) as Array<BranchRecord>).filter(
    (branch) => Boolean(branch.code)
  );

  return (
    <main className="min-h-screen bg-[#eef2ff] px-4 py-12 text-[#475569] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.2em] text-[#1d3a8a] underline-offset-2 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
        >
          UAE Home
        </Link>
        <h1 className="text-3xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Select Your Branch
        </h1>
        <p className="mt-3 text-base sm:text-lg">
          Choose your branch to continue with member login.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700"
          >
            Unable to load branches right now. Please refresh and try again.
          </div>
        ) : null}

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <li key={branch.id}>
              <Link
                href={`/login?branch=${encodeURIComponent(branch.code)}`}
                className="group block rounded-xl border border-slate-200/90 bg-white/90 px-5 py-4 text-[#0f1729] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
              >
                <span className="mb-2 block h-1 w-7 rounded-full bg-[#c9a227]" aria-hidden="true" />
                <p className="text-base font-semibold">{branch.name}</p>
                <p className="mt-1 text-sm text-slate-500">Code: {branch.code}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href="/login"
            className="text-sm text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
          >
            Admin? Login here
          </Link>
        </div>
      </section>
    </main>
  );
}
