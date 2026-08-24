"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export type FuneralSheetMember = {
  memberId: string;
  memberNo: string;
  memberName: string;
  sheetOrder: number | null;
};

export type FuneralCollectionRowInput = {
  memberId: string;
  amount: string;
};

export type SaveFuneralCollectionsResult = {
  status: "success" | "error";
  message: string;
};

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

function parseMoney(value: string) {
  const normalized = value.trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Amounts must be non-negative numbers.");
  }
  return parsed;
}

async function ensureAdminAccess() {
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

  if (profileError || !profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    throw new Error("You do not have permission to manage funeral collection sheets.");
  }

  return { supabase, userId: user.id };
}

export async function loadFuneralSheetMembers(branchId: string): Promise<FuneralSheetMember[]> {
  const { supabase } = await ensureAdminAccess();

  const { data: members, error } = await supabase
    .from("members")
    .select("id, member_id, full_name, sheet_order")
    .eq("branch_id", branchId)
    .eq("status", "active")
    .order("sheet_order", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true });

  if (error) throw error;

  return (members ?? []).map((member) => ({
    memberId: member.id,
    memberNo: member.member_id,
    memberName: member.full_name,
    sheetOrder: member.sheet_order,
  }));
}

export async function saveFuneralCollections(
  branchId: string,
  eventDescription: string,
  collectionDate: string,
  rows: FuneralCollectionRowInput[]
): Promise<SaveFuneralCollectionsResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "save_funeral_collections", 30);
    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many save attempts. Please try again in 15 minutes.",
      };
    }

    const { supabase, userId } = await ensureAdminAccess();

    const description = eventDescription.trim();
    if (!description) {
      return { status: "error", message: "Event description is required." };
    }
    if (description.length > 200) {
      return { status: "error", message: "Event description must be 200 characters or fewer." };
    }

    const date = collectionDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { status: "error", message: "A valid collection date is required." };
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return { status: "error", message: "No members to save." };
    }

    const payload: Array<{
      branch_id: string;
      member_id: string;
      event_description: string;
      collection_date: string;
      amount: number;
      created_by: string;
    }> = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      let amount: number;

      try {
        amount = parseMoney(String(row.amount ?? ""));
      } catch {
        return {
          status: "error",
          message: `Row ${index + 1}: Amount must be a non-negative number.`,
        };
      }

      if (amount > 0) {
        payload.push({
          branch_id: branchId,
          member_id: row.memberId,
          event_description: description,
          collection_date: date,
          amount,
          created_by: userId,
        });
      }
    }

    if (payload.length === 0) {
      return { status: "error", message: "Enter an amount for at least one member." };
    }

    const { error } = await supabase
      .from("funeral_collections")
      .upsert(payload, {
        onConflict: "branch_id,member_id,event_description,collection_date",
      });

    if (error) throw error;

    revalidatePath(`/main-admin/funeral-sheets/${branchId}`);
    revalidatePath("/main-admin/funeral-sheets");

    return {
      status: "success",
      message: `${payload.length} collection${payload.length === 1 ? "" : "s"} saved.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to save collections.",
    };
  }
}
