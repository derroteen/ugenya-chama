import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadVentureTransactions } from "./actions";
import BusinessMonthFilter from "./BusinessMonthFilter";
import TransactionLog from "./TransactionLog";

type PageProps = {
  params: Promise<{ ventureId: string }> | { ventureId: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function BusinessVenturePage({ params, searchParams }: PageProps) {
  const { ventureId } = await Promise.resolve(params);
  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const month = getParamValue(resolvedParams.month).trim() || currentMonth();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    return null;
  }

  const { data: venture } = await supabase
    .from("business_ventures")
    .select("id, name, description")
    .eq("id", ventureId)
    .maybeSingle();

  if (!venture) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-2xl font-semibold text-[#0f1729]">Venture Not Found</h1>
          <p className="mt-3 text-slate-600">The selected business venture does not exist.</p>
        </section>
      </main>
    );
  }

  const transactions = await loadVentureTransactions(ventureId, month);

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
              UAE Business Activities
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              {venture.name}
            </h1>
            {venture.description ? <p className="mt-2 text-base text-slate-600">{venture.description}</p> : null}
          </div>

          <Link
            href="/main-admin/business"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            ← All Ventures
          </Link>
        </div>

        <BusinessMonthFilter ventureId={venture.id} month={month} />

        <TransactionLog ventureId={venture.id} month={month} transactions={transactions} />
      </section>
    </main>
  );
}
