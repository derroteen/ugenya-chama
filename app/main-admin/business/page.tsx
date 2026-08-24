import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BusinessVenturesPage() {
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

  const { data: ventures } = await supabase
    .from("business_ventures")
    .select("id, name, description, active")
    .order("created_at", { ascending: true });

  const ventureList = ventures ?? [];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Business Activities</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Business Ventures
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-600">
          Track income and expenses for association-run business activities, starting with the van hire business.
        </p>

        {ventureList.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-lg font-semibold text-[#0f1729]">No business ventures yet</p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Add a row to business_ventures in Supabase to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {ventureList.map((venture) => (
              <Link
                key={venture.id}
                href={`/main-admin/business/${venture.id}`}
                className="rounded-2xl border border-[#1d3a8a]/15 bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1d3a8a]/30 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#c9a227]/30 bg-[#fff9e6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a5c00]">
                    Venture
                  </span>
                  {!venture.active ? (
                    <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Inactive
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-2xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)]">
                  {venture.name}
                </h2>

                {venture.description ? <p className="mt-3 text-sm text-slate-600">{venture.description}</p> : null}

                <p className="mt-6 text-sm font-semibold text-[#1d3a8a]">View Transaction Log &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
