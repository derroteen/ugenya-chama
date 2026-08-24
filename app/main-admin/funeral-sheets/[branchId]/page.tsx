import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadFuneralSheetMembers } from "./actions";
import FuneralSheetForm from "./FuneralSheetForm";

type PageProps = {
  params: Promise<{ branchId: string }> | { branchId: string };
};

export default async function FuneralSheetPage({ params }: PageProps) {
  const { branchId } = await Promise.resolve(params);
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

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name")
    .eq("id", branchId)
    .maybeSingle();

  if (!branch) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-2xl font-semibold text-[#0f1729]">Invalid Branch</h1>
          <p className="mt-3 text-slate-600">The selected branch does not exist.</p>
        </section>
      </main>
    );
  }

  const members = await loadFuneralSheetMembers(branchId);

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
              UAE Funeral / Emergency Collection
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              {branch.name} Funeral Collection Sheet
            </h1>
          </div>

          <Link
            href="/main-admin/funeral-sheets"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            View All Branches
          </Link>
        </div>

        <p className="mt-3 max-w-3xl text-base text-slate-600">
          Record a one-off collection for a specific funeral or emergency event. This is separate from the regular
          monthly emergency fund tracked on the contribution sheet.
        </p>

        <FuneralSheetForm branchId={branch.id} members={members} />
      </section>
    </main>
  );
}
