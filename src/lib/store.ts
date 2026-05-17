import { supabase } from "./supabase";
import { Fragment } from "./types";

export interface DayRecord {
  date: string;
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
  return records.find((r) => r.date === date) || { date, fragments: [] };
}

// ─── Supabase: ensure DayRecord exists ───────

async function ensureDayRecord(userId: string, date: string): Promise<string> {
  const { data, error } = await supabase
    .from("day_records")
    .upsert({ user_id: userId, date }, { onConflict: "user_id,date" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// ─── Supabase: data operations ───────────────

export async function lcGetRecordDates(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("day_records")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map((r: any) => r.date as string);
}

export async function lcGetDayRecord(userId: string, date: string): Promise<DayRecord> {
  const { data: record, error: rErr } = await supabase
    .from("day_records")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .single();
  if (rErr || !record) return { date, fragments: [] };

  const { data: frags, error: fErr } = await supabase
    .from("fragments")
    .select("*")
    .eq("record_id", record.id)
    .order("created_at", { ascending: true });
  if (fErr) throw fErr;

  return {
    date,
    fragments: (frags || []).map((f: any) => ({
      id: f.id as string,
      type: f.type as "text" | "photo" | "voice" | "summary",
      content: (f.content as string) || "",
      timestamp: f.timestamp as string,
      imageUrl: f.type === "photo" ? (f.media_url as string) : undefined,
      audioUrl: f.type === "voice" ? (f.media_url as string) : undefined,
    })),
  };
}

export async function lcAddFragment(
  userId: string,
  date: string,
  fragment: Omit<Fragment, "id">,
  blob?: Blob | null,
): Promise<Fragment> {
  const recordId = await ensureDayRecord(userId, date);

  let mediaUrl: string | undefined;
  if (blob && (fragment.type === "photo" || fragment.type === "voice")) {
    const ext = fragment.type === "photo" ? "jpg" : "webm";
    const path = `${userId}/${date}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("diary-media")
      .upload(path, blob, { contentType: blob.type, upsert: true });
    if (uploadErr) throw uploadErr;
    const { data: urlData } = supabase.storage.from("diary-media").getPublicUrl(path);
    mediaUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("fragments")
    .insert({
      record_id: recordId,
      user_id: userId,
      type: fragment.type,
      content: fragment.content,
      timestamp: fragment.timestamp,
      media_url: mediaUrl || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    type: fragment.type,
    content: fragment.content,
    timestamp: fragment.timestamp,
    imageUrl: fragment.type === "photo" ? mediaUrl : undefined,
    audioUrl: fragment.type === "voice" ? mediaUrl : undefined,
  };
}

export async function lcUpdateFragment(_userId: string, fragmentId: string, updates: { content?: string }): Promise<void> {
  const { error } = await supabase
    .from("fragments")
    .update(updates)
    .eq("id", fragmentId);
  if (error) throw error;
}

export async function lcDeleteFragment(_userId: string, fragmentId: string): Promise<void> {
  const { error } = await supabase
    .from("fragments")
    .delete()
    .eq("id", fragmentId);
  if (error) throw error;
}

// ─── Supabase: friends ───────────────────────

export async function lcSearchUser(phone: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, phone, nickname")
    .eq("phone", phone)
    .single();
  if (error || !data) return null;
  return data;
}

export async function lcSendFriendRequest(fromId: string, toId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .eq("requester_id", fromId)
    .eq("addressee_id", toId)
    .single();
  if (existing) return;

  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: fromId, addressee_id: toId, status: "pending" });
  if (error) throw error;
}

export async function lcGetFriendships(userId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select("id, status, requester_id, addressee_id, created_at, requester:requester_id(id, phone, nickname), addressee:addressee_id(id, phone, nickname)")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function lcAcceptFriendship(objectId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", objectId);
  if (error) throw error;
}

export async function lcRejectFriendship(objectId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("id", objectId);
  if (error) throw error;
}

// ─── Migration: localStorage → Supabase ──────

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
      await lcAddFragment(userId, record.date, {
        type: frag.type,
        content: frag.content,
        timestamp: frag.timestamp,
      }, blob);
    }
  }

  localStorage.setItem("the-day-migrated", "true");
}
