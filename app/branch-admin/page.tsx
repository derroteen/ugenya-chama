import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BranchAdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, branch_id")
    .eq("id", user.id)
    .single();

  const branchId = profile?.branch_id;

  const { data: branch } = branchId
    ? await supabase.from("branches").select("name").eq("id", branchId).single()
    : { data: null };

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
          Branch Admin Dashboard
        </h1>
        <p className="mt-4 text-lg">
          Welcome, {profile?.full_name ?? "Branch Admin"}.
        </p>
        <p className="mt-2 text-base sm:text-lg">
          Branch: {branch?.name ?? "Your branch"}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Member management and contribution entry for your branch will appear here.
        </p>
        <Link
          href="/branch-admin/members/new"
          className="mt-8 inline-flex rounded-md bg-[#1d3a8a] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
        >
          Add Member
        </Link>
      </section>
    </main>
  );
}
