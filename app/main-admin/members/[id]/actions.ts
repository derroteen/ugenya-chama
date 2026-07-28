"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AdminRole = "main_admin" | "superadmin";

type ActionResult = {
  status: "success" | "error";
  message: string;
};

const MARITAL_STATUSES = ["single", "married", "widowed"] as const;
const EMPLOYMENT_STATUSES = ["employed", "self_employed", "unemployed"] as const;
const PARENT_STATUSES = ["alive", "deceased"] as const;
const MAX_GENERIC_TEXT_LENGTH = 120;
const MAX_ID_NUMBER_LENGTH = 20;
const MAX_PHONE_LENGTH = 20;

function validateMaxLength(value: string, fieldName: string, maxLength: number) {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
}

function asOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  validateMaxLength(normalized, "Field value", MAX_GENERIC_TEXT_LENGTH);
  return normalized.length > 0 ? normalized : null;
}

function asOptionalTextWithMax(value: FormDataEntryValue | null, fieldName: string, maxLength: number) {
  const normalized = String(value ?? "").trim();
  validateMaxLength(normalized, fieldName, maxLength);
  return normalized.length > 0 ? normalized : null;
}

function asOptionalNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;

  return Math.max(0, Math.floor(parsed));
}

function asOptionalDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function asOptionalEnum<T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T
): T[number] | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return allowedValues.includes(normalized) ? (normalized as T[number]) : null;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }

  return "Could not save changes. Please try again.";
}

async function ensureMemberWriteAccess(memberId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Could not load your admin profile.");
  }

  const role = profile.role as AdminRole | null;
  if (role !== "main_admin" && role !== "superadmin") {
    throw new Error("You do not have permission to edit this member.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Member not found or you do not have access.");
  }

  return supabase;
}

export async function upsertFamilyDetails(memberId: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await ensureMemberWriteAccess(memberId);

    const payload = {
      member_id: memberId,
      marital_status: asOptionalEnum(formData.get("maritalStatus"), MARITAL_STATUSES),
      employment_status: asOptionalEnum(formData.get("employmentStatus"), EMPLOYMENT_STATUSES),
      occupation: asOptionalText(formData.get("occupation")),
      residential_location: asOptionalText(formData.get("residentialLocation")),
      home_district: asOptionalText(formData.get("homeDistrict")),
      home_location: asOptionalText(formData.get("homeLocation")),
      home_village: asOptionalText(formData.get("homeVillage")),
      spouse_name: asOptionalText(formData.get("spouseName")),
      spouse_district: asOptionalText(formData.get("spouseDistrict")),
      spouse_location: asOptionalText(formData.get("spouseLocation")),
      spouse_sub_location: asOptionalText(formData.get("spouseSubLocation")),
      spouse_village: asOptionalText(formData.get("spouseVillage")),
      spouse_id_number: asOptionalTextWithMax(formData.get("spouseIdNumber"), "Spouse ID Number", MAX_ID_NUMBER_LENGTH),
    };

    const { error } = await supabase
      .from("member_family_details")
      .upsert(payload, { onConflict: "member_id" });

    if (error) throw error;

    revalidatePath(`/main-admin/members/${memberId}`);

    return {
      status: "success",
      message: "Family details saved successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function upsertBeneficiaryDeclaration(
  memberId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await ensureMemberWriteAccess(memberId);

    const payload = {
      member_id: memberId,
      father_name: asOptionalText(formData.get("fatherName")),
      father_date_of_birth: asOptionalDate(formData.get("fatherDateOfBirth")),
      father_id_number: asOptionalTextWithMax(formData.get("fatherIdNumber"), "Father ID Number", MAX_ID_NUMBER_LENGTH),
      father_status: asOptionalEnum(formData.get("fatherStatus"), PARENT_STATUSES),
      mother_name: asOptionalText(formData.get("motherName")),
      mother_date_of_birth: asOptionalDate(formData.get("motherDateOfBirth")),
      mother_id_number: asOptionalTextWithMax(formData.get("motherIdNumber"), "Mother ID Number", MAX_ID_NUMBER_LENGTH),
      mother_status: asOptionalEnum(formData.get("motherStatus"), PARENT_STATUSES),
      guardian_name: asOptionalText(formData.get("guardianName")),
      guardian_date_of_birth: asOptionalDate(formData.get("guardianDateOfBirth")),
      guardian_id_number: asOptionalTextWithMax(formData.get("guardianIdNumber"), "Guardian ID Number", MAX_ID_NUMBER_LENGTH),
      beneficiary_full_name: asOptionalText(formData.get("beneficiaryFullName")),
      beneficiary_date_of_birth: asOptionalDate(formData.get("beneficiaryDateOfBirth")),
      beneficiary_mobile: asOptionalTextWithMax(formData.get("beneficiaryMobile"), "Beneficiary Mobile", MAX_PHONE_LENGTH),
      beneficiary_relationship: asOptionalText(formData.get("beneficiaryRelationship")),
    };

    const { error } = await supabase
      .from("member_beneficiary_declarations")
      .upsert(payload, { onConflict: "member_id" });

    if (error) throw error;

    revalidatePath(`/main-admin/members/${memberId}`);

    return {
      status: "success",
      message: "Beneficiary declaration saved successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function addChild(memberId: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await ensureMemberWriteAccess(memberId);

    const fullName = String(formData.get("childName") ?? "").trim();
    validateMaxLength(fullName, "Child Name", MAX_GENERIC_TEXT_LENGTH);
    const age = asOptionalNumber(formData.get("childAge"));

    if (!fullName) {
      return {
        status: "error",
        message: "Child name is required.",
      };
    }

    const { error } = await supabase.from("member_children").insert({
      member_id: memberId,
      full_name: fullName,
      age,
    });

    if (error) throw error;

    revalidatePath(`/main-admin/members/${memberId}`);

    return {
      status: "success",
      message: "Child added successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}

export async function deleteChild(memberId: string, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await ensureMemberWriteAccess(memberId);

    const childId = String(formData.get("childId") ?? "").trim();
    if (!childId) {
      return {
        status: "error",
        message: "Invalid child record.",
      };
    }

    const { error } = await supabase
      .from("member_children")
      .delete()
      .eq("id", childId)
      .eq("member_id", memberId);

    if (error) throw error;

    revalidatePath(`/main-admin/members/${memberId}`);

    return {
      status: "success",
      message: "Child removed successfully.",
    };
  } catch (error) {
    return {
      status: "error",
      message: toErrorMessage(error),
    };
  }
}
