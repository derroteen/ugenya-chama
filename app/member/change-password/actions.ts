"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function clearMustChangePasswordAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    throw getUserError ?? new Error("No valid session found.");
  }

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from("members")
    .update({ must_change_password: false })
    .eq("auth_id", user.id);

  if (updateError) {
    throw updateError;
  }

  return { success: true };
}
