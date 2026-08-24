"use server";

import { createMember } from "@/lib/auth/createMember";
import { createClient } from "@/lib/supabase/server";

export type BulkImportMember = {
  full_name: string;
  phone: string;
};

export type BulkImportResult = {
  full_name: string;
  success: boolean;
  memberId?: string;
  error?: string;
};

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

export async function bulkImportMembers(
  members: BulkImportMember[],
  branchId: string
): Promise<BulkImportResult[]> {
  const normalizedBranchId = branchId.trim();

  if (!normalizedBranchId) {
    throw new Error("Please select a branch before importing members.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    throw new Error("You are not allowed to bulk import members.");
  }

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id")
    .eq("id", normalizedBranchId)
    .maybeSingle();

  if (branchError || !branch) {
    throw new Error("The selected branch could not be found.");
  }

  const results: BulkImportResult[] = [];

  for (const member of members) {
    const fullName = member.full_name.trim();
    const phone = member.phone.trim();

    if (!fullName || !phone) {
      results.push({
        full_name: fullName || member.full_name || "Unknown member",
        success: false,
        error: "Full name and phone are required.",
      });
      continue;
    }

    try {
      const { memberId } = await createMember({
        fullName,
        phone,
        branchId: branch.id,
      });

      results.push({
        full_name: fullName,
        success: true,
        memberId,
      });
    } catch (error) {
      results.push({
        full_name: fullName,
        success: false,
        error: toErrorMessage(error),
      });
    }
  }

  return results;
}
