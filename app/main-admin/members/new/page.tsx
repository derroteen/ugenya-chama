import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NewMemberForm from "./NewMemberForm";
import { initialNewMemberFormState } from "./form-state";

type AdminRole = "main_admin" | "superadmin" | "member";

function getJoinedBranchName(
  branchRelation: { name: string } | Array<{ name: string }> | null | undefined
) {
  if (!branchRelation) return null;
  if (Array.isArray(branchRelation)) {
    return branchRelation[0]?.name ?? null;
  }
  return branchRelation.name ?? null;
}

export default async function NewMainAdminMemberPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id, full_name, branches(name)")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as AdminRole | undefined) ?? null;
  const ownBranchId = (profile?.branch_id as string | null | undefined) ?? null;
  const ownBranchName = getJoinedBranchName(
    profile?.branches as { name: string } | Array<{ name: string }> | null
  );

  if (role !== "main_admin" && role !== "superadmin") {
    return null;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .order("name", { ascending: true });

  const displayBranchName = ownBranchName ?? "No branch assigned";

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Membership</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Add New Member
            </h1>
          </div>
          <Link
            href="/main-admin/members"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            Back to Members
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-[#1d3a8a]/20 bg-[#f8fbff] px-4 py-3 text-base text-[#0f1729] sm:text-lg">
          <span className="font-semibold">Adding member to:</span> {displayBranchName}
        </div>

        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          As {role === "superadmin" ? "Superadmin" : "Main Admin"}, you can choose any branch for this member.
        </p>

        <NewMemberForm
          canChooseBranch
          defaultBranchId={ownBranchId}
          ownBranchName={ownBranchName}
          branchOptions={branches ?? []}
          initialState={initialNewMemberFormState}
        />
      </section>
    </main>
  );
}
