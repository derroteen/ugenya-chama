"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AnnouncementTargetType = "all" | "branches";

export type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  createdAt: string;
  updatedAt: string;
  branchIds: string[];
  branchNames: string[];
};

function toAnnouncementTarget(value: string | null | undefined): AnnouncementTargetType {
  return value === "branches" ? "branches" : "all";
}

function sanitizeText(value: string, fieldName: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    throw new Error(`${fieldName} is required.`);
  }

  return cleaned;
}

async function ensureAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Your admin profile could not be loaded.");
  }

  if (profile.role !== "main_admin" && profile.role !== "superadmin") {
    throw new Error("You do not have permission to manage announcements.");
  }

  return { supabase, user };
}

export async function getBranchOptionsForAdmin(): Promise<Array<{ id: string; name: string }>> {
  const { supabase } = await ensureAdminAccess();

  const { data, error } = await supabase.from("branches").select("id, name").order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((branch) => ({
    id: branch.id,
    name: branch.name,
  }));
}

export async function getAnnouncementsForAdmin(): Promise<AnnouncementRecord[]> {
  const { supabase } = await ensureAdminAccess();

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("id, title, body, target_type, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const { data: branchLinks, error: branchLinksError } = await supabase
    .from("announcement_branches")
    .select("announcement_id, branch_id, branches(name)")
    .order("branch_id", { ascending: true });

  if (branchLinksError) {
    throw branchLinksError;
  }

  const branchIdsByAnnouncement = new Map<string, string[]>();
  const branchNamesByAnnouncement = new Map<string, string[]>();

  for (const row of branchLinks ?? []) {
    const announcementId = row.announcement_id as string;
    const branchId = typeof row.branch_id === "string" ? row.branch_id : "";
    const branchName = typeof (row.branches as { name?: string } | null)?.name === "string"
      ? (row.branches as { name?: string }).name ?? ""
      : "";

    const currentIds = branchIdsByAnnouncement.get(announcementId) ?? [];
    const currentNames = branchNamesByAnnouncement.get(announcementId) ?? [];

    if (branchId && !currentIds.includes(branchId)) {
      currentIds.push(branchId);
      branchIdsByAnnouncement.set(announcementId, currentIds);
    }

    if (branchName && !currentNames.includes(branchName)) {
      currentNames.push(branchName);
      branchNamesByAnnouncement.set(announcementId, currentNames);
    }
  }

  return (announcements ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    targetType: toAnnouncementTarget(announcement.target_type),
    createdAt: announcement.created_at,
    updatedAt: announcement.updated_at,
    branchIds: branchIdsByAnnouncement.get(announcement.id) ?? [],
    branchNames: branchNamesByAnnouncement.get(announcement.id) ?? [],
  }));
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  branchIds: string[];
}) {
  const { supabase, user } = await ensureAdminAccess();
  const title = sanitizeText(input.title, "Title");
  const body = sanitizeText(input.body, "Body");
  const targetType = input.targetType === "branches" ? "branches" : "all";

  if (targetType === "branches" && (!Array.isArray(input.branchIds) || input.branchIds.length === 0)) {
    throw new Error("Please select at least one branch for branch-targeted announcements.");
  }

  const { data: createdAnnouncement, error: createError } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      target_type: targetType,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (createError) {
    throw createError;
  }

  if (targetType === "branches") {
    const uniqueBranchIds = [...new Set(input.branchIds.filter(Boolean))];
    const branchRows = uniqueBranchIds.map((branchId) => ({
      announcement_id: createdAnnouncement.id,
      branch_id: branchId,
    }));

    if (branchRows.length > 0) {
      const { error: branchError } = await supabase.from("announcement_branches").insert(branchRows);
      if (branchError) {
        throw branchError;
      }
    }
  }

  revalidatePath("/main-admin/announcements");
  revalidatePath("/member");
  return { success: true };
}

export async function updateAnnouncement(input: {
  id: string;
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  branchIds: string[];
}) {
  const { supabase } = await ensureAdminAccess();
  const title = sanitizeText(input.title, "Title");
  const body = sanitizeText(input.body, "Body");
  const targetType = input.targetType === "branches" ? "branches" : "all";

  if (targetType === "branches" && (!Array.isArray(input.branchIds) || input.branchIds.length === 0)) {
    throw new Error("Please select at least one branch for branch-targeted announcements.");
  }

  const { error: updateError } = await supabase
    .from("announcements")
    .update({
      title,
      body,
      target_type: targetType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (updateError) {
    throw updateError;
  }

  const { error: branchClearError } = await supabase
    .from("announcement_branches")
    .delete()
    .eq("announcement_id", input.id);

  if (branchClearError) {
    throw branchClearError;
  }

  if (targetType === "branches") {
    const uniqueBranchIds = [...new Set(input.branchIds.filter(Boolean))];
    const branchRows = uniqueBranchIds.map((branchId) => ({
      announcement_id: input.id,
      branch_id: branchId,
    }));

    if (branchRows.length > 0) {
      const { error: branchInsertError } = await supabase.from("announcement_branches").insert(branchRows);
      if (branchInsertError) {
        throw branchInsertError;
      }
    }
  }

  revalidatePath("/main-admin/announcements");
  revalidatePath("/member");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const { supabase } = await ensureAdminAccess();

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    throw error;
  }

  revalidatePath("/main-admin/announcements");
  revalidatePath("/member");
  return { success: true };
}
