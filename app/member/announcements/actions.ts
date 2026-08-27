"use server";

import { createClient } from "@/lib/supabase/server";

export type MemberAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export type UnreadAnnouncementSummary = {
  count: number;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function getAuthenticatedMemberContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, branch_id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Your member record could not be found.");
  }

  return { supabase, member };
}

export async function getVisibleAnnouncementsForMember(): Promise<MemberAnnouncement[]> {
  const { supabase, member } = await getAuthenticatedMemberContext();

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, target_type")
    .or(`target_type.eq.all,announcement_branches.branch_id.eq.${member.branch_id}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const { data: readRows, error: readRowsError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("member_id", member.id);

  if (readRowsError) {
    throw readRowsError;
  }

  const readIds = new Set((readRows ?? []).map((row) => row.announcement_id));

  return (announcements ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    createdAt: announcement.created_at,
    isRead: readIds.has(announcement.id),
  }));
}

export async function getUnreadAnnouncementCountForMember(): Promise<number> {
  const { supabase, member } = await getAuthenticatedMemberContext();

  const { data: visibleAnnouncements, error: visibleError } = await supabase
    .from("announcements")
    .select("id, target_type")
    .or(`target_type.eq.all,announcement_branches.branch_id.eq.${member.branch_id}`);

  if (visibleError) {
    throw visibleError;
  }

  if (!visibleAnnouncements || visibleAnnouncements.length === 0) {
    return 0;
  }

  const announcementIds = visibleAnnouncements.map((row) => row.id);

  const { data: readRows, error: readError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("member_id", member.id)
    .in("announcement_id", announcementIds);

  if (readError) {
    throw readError;
  }

  const readIds = new Set((readRows ?? []).map((row) => row.announcement_id));

  return visibleAnnouncements.filter((announcement) => !readIds.has(announcement.id)).length;
}

export async function markAnnouncementRead(announcementId: string): Promise<void> {
  const { supabase, member } = await getAuthenticatedMemberContext();

  const { data: existing, error: checkError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("announcement_id", announcementId)
    .eq("member_id", member.id)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabase.from("announcement_reads").insert({
    announcement_id: announcementId,
    member_id: member.id,
  });

  if (insertError) {
    throw insertError;
  }
}
