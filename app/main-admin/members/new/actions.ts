"use server";

import { createMember } from "@/lib/auth/createMember";
import { createClient } from "@/lib/supabase/server";
import type { NewMemberFormState } from "./form-state";

type AdminRole = "main_admin" | "superadmin";

function getJoinedBranchName(
  branchRelation: { name: string } | Array<{ name: string }> | null | undefined
) {
  if (!branchRelation) return null;
  if (Array.isArray(branchRelation)) {
    return branchRelation[0]?.name ?? null;
  }
  return branchRelation.name ?? null;
}

function isAllowedKenyanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("07")) return true;
  if (digits.length === 12 && digits.startsWith("2547")) return true;
  return false;
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

  return "Unable to create member right now. Please try again.";
}

export async function addMemberAction(
  _previousState: NewMemberFormState,
  formData: FormData
): Promise<NewMemberFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const selectedBranchId = String(formData.get("branchId") ?? "").trim();

  const defaults = {
    fullName,
    phone,
    idNumber,
    selectedBranchId,
  };

  if (!fullName || !phone) {
    return {
      status: "error",
      errorMessage: "Full Name and Phone Number are required.",
      defaults,
    };
  }

  if (!isAllowedKenyanPhone(phone)) {
    return {
      status: "error",
      errorMessage:
        "Phone number format is invalid. Use 07XXXXXXXX or 2547XXXXXXXX.",
      defaults,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      errorMessage: "Your session has expired. Please log in again.",
      defaults,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, branch_id, branches(name)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      status: "error",
      errorMessage: "Could not load your admin profile.",
      defaults,
    };
  }

  const role = profile.role as AdminRole | null;
  const ownBranchId = profile.branch_id as string | null;
  const ownBranchName = getJoinedBranchName(
    profile.branches as { name: string } | Array<{ name: string }> | null
  );

  const isElevated = role === "main_admin" || role === "superadmin";

  if (role !== "main_admin" && role !== "superadmin") {
    return {
      status: "error",
      errorMessage: "You are not allowed to add members.",
      defaults,
    };
  }

  let branchIdToUse = ownBranchId;
  let branchNameToUse = ownBranchName;

  if (isElevated) {
    if (!selectedBranchId) {
      return {
        status: "error",
        errorMessage: "Please choose a branch.",
        defaults,
      };
    }

    const { data: selectedBranch, error: branchError } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", selectedBranchId)
      .single();

    if (branchError || !selectedBranch) {
      return {
        status: "error",
        errorMessage: "The selected branch could not be found.",
        defaults,
      };
    }

    branchIdToUse = selectedBranch.id;
    branchNameToUse = selectedBranch.name;
  }

  if (!branchIdToUse) {
    return {
      status: "error",
      errorMessage:
        "No branch is assigned to your profile. Contact a superadmin.",
      defaults,
    };
  }

  try {
    const { memberId, initialPassword } = await createMember({
      fullName,
      phone,
      idNumber: idNumber || undefined,
      branchId: branchIdToUse,
    });

    return {
      status: "success",
      memberId,
      initialPassword,
      successPhone: initialPassword,
      successBranchName: branchNameToUse ?? "Selected Branch",
      defaults: {
        fullName: "",
        phone: "",
        idNumber: "",
        selectedBranchId: branchIdToUse,
      },
    };
  } catch (error) {
    return {
      status: "error",
      errorMessage: toErrorMessage(error),
      defaults,
    };
  }
}
