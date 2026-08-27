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

type RawAnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  target_type: string;
};

// PostgREST's .or() can't filter on a related table's column (announcement_branches.branch_id)
// from a top-level query on `announcements` - that syntax silently produces an invalid query.
// Instead we fetch the two visible sets separately (broadcast announcements, and branch-targeted
// announcements linked to this member's branch) and merge them here.
async function getVisibleAnnouncementRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  branchId: string
): Promise<RawAnnouncementRow[]> {
  const { data: broadcastAnnouncements, error: broadcastError } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, target_type")
    .eq("target_type", "all");

  if (broadcastError) {
    throw broadcastError;
  }

  const { data: branchLinks, error: branchLinksError } = await supabase
    .from("announcement_branches")
    .select("announcement_id")
    .eq("branch_id", branchId);

  if (branchLinksError) {
    throw branchLinksError;
  }

  const branchAnnouncementIds = [
    ...new Set((branchLinks ?? []).map((row) => row.announcement_id as string)),
  ];

  let branchAnnouncements: RawAnnouncementRow[] = [];

  if (branchAnnouncementIds.length > 0) {
    const { data, error: branchAnnouncementsError } = await supabase
      .from("announcements")
      .select("id, title, body, created_at, target_type")
      .in("id", branchAnnouncementIds);

    if (branchAnnouncementsError) {
      throw branchAnnouncementsError;
    }

    branchAnnouncements = data ?? [];
  }

  // De-dupe by id (an announcement shouldn't match both sets since target_type is
  // exclusive, but this keeps the merge correct either way) and sort newest first.
  const byId = new Map<string, RawAnnouncementRow>();
  for (const row of [...(broadcastAnnouncements ?? []), ...branchAnnouncements]) {
    byId.set(row.id, row);
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getVisibleAnnouncementsForMember(): Promise<MemberAnnouncement[]> {
  const { supabase, member } = await getAuthenticatedMemberContext();

  const announcements = await getVisibleAnnouncementRows(supabase, member.branch_id);

  const { data: readRows, error: readRowsError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("member_id", member.id);

  if (readRowsError) {
    throw readRowsError;
  }

  const readIds = new Set((readRows ?? []).map((row) => row.announcement_id));

  return announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    createdAt: announcement.created_at,
    isRead: readIds.has(announcement.id),
  }));
}

export async function getUnreadAnnouncementCountForMember(): Promise<number> {
  const { supabase, member } = await getAuthenticatedMemberContext();

  const visibleAnnouncements = await getVisibleAnnouncementRows(supabase, member.branch_id);

  if (visibleAnnouncements.length === 0) {
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
