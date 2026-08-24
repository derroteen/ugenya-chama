"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionResult = {
  status: "idle" | "success" | "error";
  message: string;
};

const MAX_FULL_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 20;
const MAX_MEMBER_ID_LENGTH = 20;

function validateMaxLength(value: string, fieldName: string, maxLength: number) {
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
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

  return "Unable to update member profile right now.";
}

function asOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("KBG Shares (legacy) must be a non-negative number.");
  }
  return parsed;
}

function asOptionalPositiveInteger(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Sheet Position (Row No.) must be a positive integer.");
  }
  return parsed;
}

export async function updateMemberProfile(
  memberId: string,
  _previousState: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { status: "error", message: "Your session has expired. Please sign in again." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
      return { status: "error", message: "You do not have permission to edit members." };
    }

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const idNumber = String(formData.get("idNumber") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const kbgSharesBf = asOptionalNumber(formData.get("kbgSharesBf"));
    const sheetOrder = asOptionalPositiveInteger(formData.get("sheetOrder"));

    validateMaxLength(fullName, "Full Name", MAX_FULL_NAME_LENGTH);
    validateMaxLength(phone, "Phone", MAX_PHONE_LENGTH);
    validateMaxLength(idNumber, "ID Number", MAX_MEMBER_ID_LENGTH);

    if (!fullName || !phone) {
      return { status: "error", message: "Full Name and Phone are required." };
    }

    if (status !== "active" && status !== "inactive" && status !== "suspended") {
      return { status: "error", message: "Invalid member status." };
    }

    if (sheetOrder !== null) {
      const { data: currentMember, error: currentMemberError } = await supabase
        .from("members")
        .select("branch_id")
        .eq("id", memberId)
        .single();

      if (currentMemberError || !currentMember) {
        throw currentMemberError ?? new Error("Member not found.");
      }

      const { data: conflictingMember, error: conflictError } = await supabase
        .from("members")
        .select("full_name")
        .eq("branch_id", currentMember.branch_id)
        .eq("sheet_order", sheetOrder)
        .neq("id", memberId)
        .maybeSingle();

      if (conflictError) {
        throw conflictError;
      }

      if (conflictingMember) {
        return {
          status: "error",
          message: `Sheet position ${sheetOrder} is already assigned to ${conflictingMember.full_name} in this branch. Choose a different position.`,
        };
      }
    }

    const { error } = await supabase
      .from("members")
      .update({
        full_name: fullName,
        phone,
        id_number: idNumber || null,
        status,
        kbg_shares_bf: kbgSharesBf,
        sheet_order: sheetOrder,
      })
      .eq("id", memberId);

    if (error) {
      throw error;
    }

    revalidatePath(`/main-admin/members/${memberId}`);
    revalidatePath("/main-admin/members");

    return { status: "success", message: "Member profile updated successfully." };
  } catch (error) {
    return { status: "error", message: toErrorMessage(error) };
  }
}
