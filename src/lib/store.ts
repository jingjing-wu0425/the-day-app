import Bmob from "./bmob";
import { Fragment } from "./types";

// hydrogen-js-sdk has recursive type issues with BmobPromise.
// Cast all async query results to `any` to break the cycle.
const Q = (table: string) => Bmob.Query(table) as any;
const F = (name: string, file: File) => Bmob.File(name, file) as any;

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

// ─── Bmob: ensure DayRecord exists ──────────

async function ensureDayRecord(userId: string, date: string): Promise<string> {
  const q = Q("DayRecord");
  q.equalTo("date", "==", date);
  q.equalTo("owner", "==", Bmob.Pointer("_User").set(userId));
  const results = await q.find();
  if (results.length > 0) return results[0].objectId;

  const record = Q("DayRecord");
  record.set("date", date);
  record.set("owner", Bmob.Pointer("_User").set(userId));
  const acl = { "*": { read: true }, [userId]: { read: true, write: true } };
  record.set("ACL", acl);
  const saved = await record.save();
  return saved.objectId as string;
}

// ─── Bmob: data operations ──────────────────

export async function lcGetRecordDates(userId: string): Promise<string[]> {
  const q = Q("DayRecord");
  q.equalTo("owner", "==", Bmob.Pointer("_User").set(userId));
  q.limit(1000);
  q.order("-date");
  const results = await q.find();
  return results.map((r: any) => r.date as string);
}

export async function lcGetDayRecord(userId: string, date: string): Promise<DayRecord> {
  const q = Q("DayRecord");
  q.equalTo("date", "==", date);
  q.equalTo("owner", "==", Bmob.Pointer("_User").set(userId));
  const records = await q.find();
  if (records.length === 0) return { date, fragments: [] };

  const fq = Q("Fragment");
  fq.equalTo("dayRecord", "==", Bmob.Pointer("DayRecord").set(records[0].objectId));
  fq.order("createdAt");
  const frags = await fq.find();

  return {
    date,
    fragments: frags.map((f: any) => ({
      id: f.objectId as string,
      type: f.type as string,
      content: (f.content as string) || "",
      timestamp: f.timestamp as string,
      imageUrl: f.type === "photo" ? (f.mediaUrl as string) : undefined,
      audioUrl: f.type === "voice" ? (f.mediaUrl as string) : undefined,
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
    const fileObj = new File([blob], `fragment_${Date.now()}.${ext}`, { type: blob.type });
    const uploaded = await F(`fragment_${Date.now()}.${ext}`, fileObj).save();
    mediaUrl = (uploaded as any)[0].url;
  }

  const frag = Q("Fragment");
  frag.set("type", fragment.type);
  frag.set("content", fragment.content);
  frag.set("timestamp", fragment.timestamp);
  frag.set("dayRecord", Bmob.Pointer("DayRecord").set(recordId));
  frag.set("owner", Bmob.Pointer("_User").set(userId));
  if (mediaUrl) frag.set("mediaUrl", mediaUrl);
  const acl = { "*": { read: true }, [userId]: { read: true, write: true } };
  frag.set("ACL", acl);
  const saved = await frag.save();

  return {
    id: saved.objectId as string,
    type: fragment.type,
    content: fragment.content,
    timestamp: fragment.timestamp,
    imageUrl: fragment.type === "photo" ? mediaUrl : undefined,
    audioUrl: fragment.type === "voice" ? mediaUrl : undefined,
  };
}

export async function lcUpdateFragment(_userId: string, fragmentId: string, updates: { content?: string }): Promise<void> {
  const q = Q("Fragment");
  if (updates.content !== undefined) q.set("content", updates.content);
  await q.save(fragmentId);
}

export async function lcDeleteFragment(_userId: string, fragmentId: string): Promise<void> {
  const q = Q("Fragment");
  await q.destroy(fragmentId);
}

// ─── Bmob: friends ──────────────────────────

export async function lcSearchUser(phone: string): Promise<any | null> {
  const q = Q("_User");
  q.equalTo("username", "==", phone);
  const results = await q.find();
  return results.length > 0 ? results[0] : null;
}

export async function lcSendFriendRequest(fromId: string, toId: string): Promise<void> {
  // Check if already exists
  const q1 = Q("Friendship");
  q1.equalTo("fromUser", "==", Bmob.Pointer("_User").set(fromId));
  q1.equalTo("toUser", "==", Bmob.Pointer("_User").set(toId));
  const existing = await q1.find();
  if (existing.length > 0) return;

  const f = Q("Friendship");
  f.set("fromUser", Bmob.Pointer("_User").set(fromId));
  f.set("toUser", Bmob.Pointer("_User").set(toId));
  f.set("status", "pending");
  await f.save();
}

export async function lcGetFriendships(userId: string) {
  const me = Bmob.Pointer("_User").set(userId);

  // Query where fromUser = me
  const q1 = Q("Friendship");
  q1.equalTo("fromUser", "==", me);

  // Query where toUser = me
  const q2 = Q("Friendship");
  q2.equalTo("toUser", "==", me);

  // Use OR
  const q = Q("Friendship");
  q.or([q1, q2]);
  q.include("fromUser", "toUser");
  q.order("-createdAt");

  return await q.find();
}

export async function lcAcceptFriendship(objectId: string): Promise<void> {
  const q = Q("Friendship");
  q.set("status", "accepted");
  await q.save(objectId);
}

export async function lcRejectFriendship(objectId: string): Promise<void> {
  const q = Q("Friendship");
  q.set("status", "rejected");
  await q.save(objectId);
}

// ─── Migration: localStorage → Bmob ─────────

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
