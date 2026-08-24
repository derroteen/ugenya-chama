import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MembersFilters from "./MembersFilters";

type AdminRole = "main_admin" | "superadmin";

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

interface MemberRow {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  branch_id: string;
  branches: { name: string; code: string } | Array<{ name: string; code: string }> | null;
}

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getJoinedBranchName(
  branchRelation:
    | { name: string; code: string }
    | Array<{ name: string; code: string }>
    | null
    | undefined
) {
  if (!branchRelation) return null;
  if (Array.isArray(branchRelation)) {
    return branchRelation[0]?.name ?? null;
  }
  return branchRelation.name ?? null;
}

function statusBadgeClasses(status: string) {
  if (status === "active") {
    return "border border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  return "border border-slate-300 bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Inactive";
}

function escapeIlike(value: string) {
  return value.replace(/[,%_]/g, " ").trim();
}

export default async function MainAdminMembersPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const resolvedParams = await Promise.resolve(searchParams ?? {});
  const branchParam = getParamValue(resolvedParams.branch).trim().toUpperCase();
  const q = getParamValue(resolvedParams.q).trim();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as AdminRole | undefined) ?? null;

  if (role !== "main_admin" && role !== "superadmin") {
    return null;
  }

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, code")
    .order("name", { ascending: true });

  const branchOptions = (branches ?? []) as BranchOption[];
  const selectedBranch = branchOptions.find((branch) => branch.code.toUpperCase() === branchParam);

  let membersQuery = supabase
    .from("members")
    .select("id, member_id, full_name, phone, status, branch_id, branches(name, code)")
    .order("full_name", { ascending: true });

  if (selectedBranch) {
    membersQuery = membersQuery.eq("branch_id", selectedBranch.id);
  }

  const searchValue = escapeIlike(q);
  if (searchValue) {
    membersQuery = membersQuery.or(`full_name.ilike.%${searchValue}%,member_id.ilike.%${searchValue}%`);
  }

  const { data: members } = await membersQuery;
  const rows = (members ?? []) as MemberRow[];

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Membership</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              Members
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/main-admin/members/import"
              className="inline-flex items-center rounded-lg border border-[#1d3a8a]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f1729] transition hover:border-[#1d3a8a]/35 hover:bg-slate-50"
            >
              Import Members
            </Link>
            <Link
              href="/main-admin/members/new"
              className="inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
            >
              Add Member
            </Link>
          </div>
        </div>

        <MembersFilters branches={branchOptions} branch={selectedBranch?.code ?? ""} q={q} />

        {rows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-lg font-semibold text-[#0f1729]">No members found</p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Try adjusting your branch filter or search term, or add a new member.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Member ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Full Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-sm font-semibold text-[#1d3a8a] sm:px-6">{member.member_id}</td>
                      <td className="px-4 py-4 text-sm font-medium text-[#0f1729] sm:px-6">{member.full_name}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">{member.phone}</td>
                      <td className="px-4 py-4 text-sm text-slate-700 sm:px-6">{getJoinedBranchName(member.branches) ?? "-"}</td>
                      <td className="px-4 py-4 text-sm sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(
                            member.status
                          )}`}
                        >
                          {statusLabel(member.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm sm:px-6">
                        <Link
                          href={`/main-admin/members/${member.id}`}
                          className="font-semibold text-[#1d3a8a] underline-offset-2 transition hover:text-[#16306f] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
