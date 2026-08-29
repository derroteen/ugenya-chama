import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getNextSheetOrder } from "@/lib/members/nextSheetOrder";
import DeleteMemberButton from "./DeleteMemberButton";
import MemberDetailsTabs from "./MemberDetailsTabs";
import MemberProfileForm from "./MemberProfileForm";

type AdminRole = "main_admin" | "superadmin";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

interface MemberRecord {
  id: string;
  member_id: string;
  full_name: string;
  phone: string;
  id_number: string | null;
  status: "active" | "inactive" | "suspended";
  branch_id: string;
  kbg_shares_bf: number | string | null;
  sheet_order: number | null;
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

export default async function MainAdminMemberDetailsPage({ params }: PageProps) {
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
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as AdminRole | undefined) ?? null;

  if (role !== "main_admin" && role !== "superadmin") {
    return null;
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, member_id, full_name, phone, id_number, status, branch_id, kbg_shares_bf, sheet_order, created_at, branches(name)")
    .eq("id", id)
    .maybeSingle();

  const memberRecord = (member ?? null) as MemberRecord | null;

  if (!memberRecord) {
    return (
      <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)]">
            Member Record Not Found
          </h1>
          <p className="mt-4 text-base sm:text-lg">
            The selected member could not be found.
          </p>
          <Link
            href="/main-admin/members"
            className="mt-6 inline-flex items-center rounded-lg bg-[#1d3a8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16306f]"
          >
            Back to Members
          </Link>
        </section>
      </main>
    );
  }

  const [
    { data: familyDetails },
    { data: children },
    { data: beneficiaryDeclaration },
  ] = await Promise.all([
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

  const branchName = getJoinedBranchName(memberRecord.branches);

  const suggestedSheetOrder =
    memberRecord.sheet_order == null
      ? await getNextSheetOrder(supabase, memberRecord.branch_id).catch(() => null)
      : null;

  return (
    <main className="bg-[#eef2ff] px-4 py-10 text-[#475569] sm:px-6 lg:px-8 lg:py-14">
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#c9a227]">UAE Membership</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0f1729] [font-family:var(--font-uae-display)] sm:text-4xl">
              {memberRecord.full_name}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              {memberRecord.member_id} · {branchName ?? "Unknown Branch"}
            </p>
          </div>
          <Link
            href={`/main-admin/branches/${memberRecord.branch_id}`}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-slate-50"
          >
            Back to Members
          </Link>
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm font-medium text-[#0f1729]">{memberRecord.phone}</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(memberRecord.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID Number</p>
            <p className="mt-1 text-sm text-slate-700">{memberRecord.id_number || "-"}</p>
          </div>
        </div>

        <MemberProfileForm
          memberId={memberRecord.id}
          fullName={memberRecord.full_name}
          phone={memberRecord.phone}
          idNumber={memberRecord.id_number}
          status={memberRecord.status}
          kbgSharesBf={memberRecord.kbg_shares_bf}
          sheetOrder={memberRecord.sheet_order ?? suggestedSheetOrder}
        />

        <section className="mt-8">
          <MemberDetailsTabs
            memberId={memberRecord.id}
            familyDetails={(familyDetails ?? null) as FamilyDetails | null}
            children={(children ?? []) as ChildRow[]}
            beneficiaryDeclaration={(beneficiaryDeclaration ?? null) as BeneficiaryDeclaration | null}
          />
        </section>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <DeleteMemberButton
            memberId={memberRecord.id}
            memberName={memberRecord.full_name}
            memberNumber={memberRecord.member_id}
          />
        </div>
      </section>
    </main>
  );
}
