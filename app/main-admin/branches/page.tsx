import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CreateBranchForm from "./CreateBranchForm";

export default async function MainAdminBranchesPage() {
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

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  const branchList = branches ?? [];

  const branchesWithCounts = await Promise.all(
    branchList.map(async (branch) => {
      const { count } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", branch.id)
        .eq("status", "active");

      return {
        ...branch,
        activeMemberCount: count ?? 0,
      };
    })
  );

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Network</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Branches
        </h1>

        <CreateBranchForm />

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {branchesWithCounts.map((branch) => (
            <article
              key={branch.id}
              className="rounded-2xl border border-[#1d3a8a]/15 bg-gradient-to-br from-[#f8fbff] to-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1d3a8a]/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-[#c9a227]/30 bg-[#fff9e6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a5c00]">
                  Branch
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-[#0f1729] [font-family:var(--font-uae-display)]">
                {branch.name}
              </h2>

              <p className="mt-3 text-base font-medium text-slate-700">
                {branch.activeMemberCount} Member{branch.activeMemberCount === 1 ? "" : "s"}
              </p>

              <div className="mt-6">
                <Link
                  href={`/main-admin/branches/${branch.id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[#1d3a8a]/20 bg-white px-3 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
                >
                  View Members
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
