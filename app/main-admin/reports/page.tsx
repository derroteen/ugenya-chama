import { createClient } from "@/lib/supabase/server";
import MonthlyReportGenerator from "./MonthlyReportGenerator";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MainAdminReportsPage() {
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

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Monthly Reports</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Combined Branch PDF Reports
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-600">
          Generate a single landscape PDF covering all twelve branches, with full member detail rows, branch totals,
          and association-wide totals for any month.
        </p>

        <MonthlyReportGenerator initialMonth={currentMonth()} />
      </section>
    </main>
  );
}