"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export type CreateBranchResult = {
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
    throw new Error("You do not have permission to manage branches.");
  }

  return { supabase };
}

// Branch creation is expected to be rare (new physical branches don't open often),
// but admins need a way to do it without going into Supabase directly.
export async function createBranch(nameInput: string, codeInput: string): Promise<CreateBranchResult> {
  try {
    const requestHeaders = await headers();
    const ip = getClientIpFromHeaders(requestHeaders);
    const rateLimit = checkRateLimit(ip, "create_branch", 20);
    if (!rateLimit.allowed) {
      return { status: "error", message: "Too many attempts. Please try again in 15 minutes." };
    }

    const { supabase } = await ensureAdminAccess();

    const name = nameInput.trim();
    if (!name) {
      return { status: "error", message: "Branch name is required." };
    }
    if (name.length > 100) {
      return { status: "error", message: "Branch name must be 100 characters or fewer." };
    }

    const code = codeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      return { status: "error", message: "Branch code must be 2-10 letters/numbers, e.g. KIS." };
    }

    const { error } = await supabase.from("branches").insert({ name, code });

    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: "A branch with that code already exists. Choose a different code." };
      }
      throw error;
    }

    revalidatePath("/main-admin/branches");
    revalidatePath("/main-admin/sheets");
    revalidatePath("/main-admin/members/new");

    return { status: "success", message: `Branch "${name}" was created successfully.` };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error && error.message ? error.message : "Unable to create branch.",
    };
  }
}
