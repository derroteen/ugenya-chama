import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default async function MainAdminSheetsRootPage() {
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

  if (!profile || (profile.role !== "main_admin" && profile.role !== "superadmin")) {
    return null;
  }

  const { data: firstBranch } = await supabase
    .from("branches")
    .select("id")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!firstBranch) {
    return null;
  }

  redirect(`/main-admin/sheets/${firstBranch.id}?month=${currentMonth()}`);
}
