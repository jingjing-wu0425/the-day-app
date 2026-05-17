import { Fragment, Profile, Friendship } from "./types";
import { getSupabase } from "./supabase";

export interface DayRecord {
  date: string; // YYYY-MM-DD
  fragments: Fragment[];
}

// ─── Utility ────────────────────────────────

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${y} / ${m} / ${d} · 星期${weekdays[date.getDay()]}`;
}

export function getDateLabel(dateStr: string): string {
  const today = getTodayDate();
  const d = new Date(today);
  const yesterday = new Date(d);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === today) return "";
  if (dateStr === yesterdayStr) return "昨天";
  return "更早";
}

export function getRecordForDate(records: DayRecord[], date: string): DayRecord {
  const found = records.find((r) => r.date === date);
  return found || { date, fragments: [] };
}

// ─── Supabase: day records ──────────────────

export async function supaGetRecordDates(userId: string): Promise<string[]> {
  const { data } = await getSupabase().from("day_records").select("date").eq("user_id", userId);
  if (!data) return [];
  return data.map((r: { date: string }) => r.date);
}

export async function supaGetDayRecord(userId: string, date: string): Promise<DayRecord> {
  const { data: record } = await getSupabase()
    .from("day_records")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (!record) return { date, fragments: [] };

  const { data: frags } = await getSupabase()
    .from("fragments")
    .select("*")
    .eq("record_id", record.id)
    .order("sort_order", { ascending: true });

  if (!frags) return { date, fragments: [] };

  return {
    date,
    fragments: frags.map((f: Record<string, unknown>) => ({
      id: f.id as string,
      type: f.type as Fragment["type"],
      content: (f.content as string) || "",
      timestamp: f.timestamp as string,
      imageUrl: f.type === "photo" ? (f.media_url as string) : undefined,
      audioUrl: f.type === "voice" ? (f.media_url as string) : undefined,
    })),
  };
}

export async function supaAddFragment(
  userId: string,
  date: string,
  fragment: Omit<Fragment, "id">,
  blob?: Blob | null
): Promise<Fragment> {
  // Ensure day_record exists
  let { data: record } = await getSupabase()
    .from("day_records")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (!record) {
    const { data: newRecord } = await getSupabase()
      .from("day_records")
      .insert({ user_id: userId, date })
      .select("id")
      .single();
    record = newRecord;
  }

  const fragId = crypto.randomUUID();
  let mediaUrl: string | undefined;

  // Upload media if present
  if (blob && (fragment.type === "photo" || fragment.type === "voice")) {
    const ext = fragment.type === "photo" ? "jpg" : "webm";
    const path = `${userId}/${date}/${fragId}.${ext}`;
    await getSupabase().storage.from("diary-media").upload(path, blob, {
      contentType: fragment.type === "photo" ? "image/jpeg" : "audio/webm",
      upsert: true,
    });
    const { data: urlData } = getSupabase().storage.from("diary-media").getPublicUrl(path);
    mediaUrl = urlData.publicUrl;
  }

  const fragRow: Record<string, unknown> = {
    id: fragId,
    record_id: record!.id,
    user_id: userId,
    type: fragment.type,
    content: fragment.content,
    timestamp: fragment.timestamp,
    media_url: mediaUrl ?? null,
  };

  await getSupabase().from("fragments").insert(fragRow);

  return {
    id: fragId,
    type: fragment.type,
    content: fragment.content,
    timestamp: fragment.timestamp,
    imageUrl: fragment.type === "photo" ? mediaUrl : undefined,
    audioUrl: fragment.type === "voice" ? mediaUrl : undefined,
  };
}

export async function supaUpdateFragment(
  userId: string,
  fragmentId: string,
  updates: Partial<Pick<Fragment, "content">>
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.content !== undefined) row.content = updates.content;
  await getSupabase().from("fragments").update(row).eq("id", fragmentId).eq("user_id", userId);
}

export async function supaDeleteFragment(userId: string, fragmentId: string): Promise<void> {
  // Get fragment to check for media
  const { data: frag } = await getSupabase()
    .from("fragments")
    .select("media_url")
    .eq("id", fragmentId)
    .single();

  if (frag?.media_url) {
    // Extract path from public URL
    const url = new URL(frag.media_url as string);
    const pathParts = url.pathname.split("/storage/v1/object/public/diary-media/");
    if (pathParts[1]) {
      await getSupabase().storage.from("diary-media").remove([pathParts[1]]);
    }
  }

  await getSupabase().from("fragments").delete().eq("id", fragmentId).eq("user_id", userId);

  // Check if day_record is now empty, clean up
  // (optional, fragments cascade delete handles the data)
}

// ─── Supabase: friends ──────────────────────

export async function supaSearchUser(phone: string): Promise<Profile | null> {
  const { data } = await getSupabase().from("profiles").select("*").eq("phone", phone).single();
  return data;
}

export async function supaSendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  await getSupabase().from("friendships").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });
}

export async function supaGetFriendships(userId: string): Promise<Friendship[]> {
  const { data } = await getSupabase()
    .from("friendships")
    .select("*, requester_profile:profiles!requester_id(id,phone,nickname,created_at), addressee_profile:profiles!addressee_id(id,phone,nickname,created_at)")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data as unknown as Friendship[]) || [];
}

export async function supaAcceptFriendship(friendshipId: string): Promise<void> {
  await getSupabase().from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
}

export async function supaRejectFriendship(friendshipId: string): Promise<void> {
  await getSupabase().from("friendships").update({ status: "rejected" }).eq("id", friendshipId);
}

// ─── Migration: localStorage → Supabase ─────

export async function migrateFromLocalStorage(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("the-day-migrated") === "true") return;

  const raw = localStorage.getItem("the-day-records");
  if (!raw) { localStorage.setItem("the-day-migrated", "true"); return; }

  const records: DayRecord[] = JSON.parse(raw);
  for (const record of records) {
    for (const frag of record.fragments) {
      let blob: Blob | null = null;

      if (frag.type === "photo" && frag.imageUrl?.startsWith("data:")) {
        const res = await fetch(frag.imageUrl);
        blob = await res.blob();
      } else if (frag.type === "voice" && frag.audioUrl?.startsWith("data:")) {
        const res = await fetch(frag.audioUrl);
        blob = await res.blob();
      }

      await supaAddFragment(userId, record.date, {
        type: frag.type,
        content: frag.content,
        timestamp: frag.timestamp,
      }, blob);
    }
  }

  localStorage.setItem("the-day-migrated", "true");
}
