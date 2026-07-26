import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberDetailsTabs from "./MemberDetailsTabs";

type AdminRole = "branch_admin" | "main_admin" | "superadmin";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

interface MemberRecord {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  branch_id: string;
  created_at: string;
  branches: { name: string } | Array<{ name: string }> | null;
}

interface FamilyDetails {
  marital_status: "single" | "married" | "widowed" | null;
  employment_status: "employed" | "self_employed" | "unemployed" | null;
  occupation: string | null;
  residential_location: string | null;
  home_district: string | null;
  home_location: string | null;
  home_village: string | null;
  spouse_name: string | null;
  spouse_district: string | null;
  spouse_location: string | null;
  spouse_sub_location: string | null;
  spouse_village: string | null;
  spouse_id_number: string | null;
}

interface ChildRow {
  id: string;
  full_name: string;
  age: number | null;
}

interface BeneficiaryDeclaration {
  father_name: string | null;
  father_date_of_birth: string | null;
  father_id_number: string | null;
  father_status: "alive" | "deceased" | null;
  mother_name: string | null;
  mother_date_of_birth: string | null;
  mother_id_number: string | null;
  mother_status: "alive" | "deceased" | null;
  guardian_name: string | null;
  guardian_date_of_birth: string | null;
  guardian_id_number: string | null;
  beneficiary_full_name: string | null;
  beneficiary_date_of_birth: string | null;
  beneficiary_mobile: string | null;
  beneficiary_relationship: string | null;
}

function getJoinedBranchName(branchRelation: { name: string } | Array<{ name: string }> | null | undefined) {
  if (!branchRelation) return null;
  if (Array.isArray(branchRelation)) {
    return branchRelation[0]?.name ?? null;
  }
  return branchRelation.name ?? null;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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

export default async function BranchMemberDetailsPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as AdminRole | undefined) ?? null;
  const ownBranchId = (profile?.branch_id as string | null | undefined) ?? null;

  if (role !== "branch_admin" && role !== "main_admin" && role !== "superadmin") {
    return null;
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, member_id, full_name, phone, status, branch_id, created_at, branches(name)")
    .eq("id", id)
    .maybeSingle();

  const memberRecord = (member ?? null) as MemberRecord | null;

  if (!memberRecord) {
    if (role === "branch_admin") {
      redirect("/branch-admin/members?error=member_not_found_or_forbidden");
    }

    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)]">
            Member Record Not Found
          </h1>
          <p className="mt-4 text-base sm:text-lg">
            The selected member could not be found, or you do not have permission to view this record.
          </p>
          <Link
            href="/branch-admin/members"
            className="mt-6 inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
          >
            Back to Members
          </Link>
        </section>
      </main>
    );
  }

  if (role === "branch_admin" && ownBranchId !== memberRecord.branch_id) {
    redirect("/branch-admin/members?error=member_not_found_or_forbidden");
  }

  const [{ data: familyDetails }, { data: children }, { data: beneficiaryDeclaration }] =
    await Promise.all([
      supabase
        .from("member_family_details")
        .select(
          "marital_status, employment_status, occupation, residential_location, home_district, home_location, home_village, spouse_name, spouse_district, spouse_location, spouse_sub_location, spouse_village, spouse_id_number"
        )
        .eq("member_id", id)
        .maybeSingle(),
      supabase
        .from("member_children")
        .select("id, full_name, age")
        .eq("member_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("member_beneficiary_declarations")
        .select(
          "father_name, father_date_of_birth, father_id_number, father_status, mother_name, mother_date_of_birth, mother_id_number, mother_status, guardian_name, guardian_date_of_birth, guardian_id_number, beneficiary_full_name, beneficiary_date_of_birth, beneficiary_mobile, beneficiary_relationship"
        )
        .eq("member_id", id)
        .maybeSingle(),
    ]);

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Member Record</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              {memberRecord.full_name}
            </h1>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">Member ID: {memberRecord.member_id}</p>
          </div>
          <Link
            href="/branch-admin/members"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            Back to Members
          </Link>
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-[#0f1729]">{memberRecord.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</p>
            <p className="mt-1 text-sm font-medium text-[#0f1729]">{getJoinedBranchName(memberRecord.branches) ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(
                memberRecord.status
              )}`}
            >
              {statusLabel(memberRecord.status)}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member Since</p>
            <p className="mt-1 text-sm font-medium text-[#0f1729]">{formatDate(memberRecord.created_at)}</p>
          </div>
        </div>

        <MemberDetailsTabs
          memberId={memberRecord.id}
          familyDetails={(familyDetails ?? null) as FamilyDetails | null}
          children={(children ?? []) as ChildRow[]}
          beneficiaryDeclaration={(beneficiaryDeclaration ?? null) as BeneficiaryDeclaration | null}
        />
      </section>
    </main>
  );
}
