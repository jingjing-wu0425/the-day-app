import { Fragment } from "./types";

const STORAGE_KEY = "the-day-records";

export interface DayRecord {
  date: string; // YYYY-MM-DD
  fragments: Fragment[];
}

export function getAllRecords(): DayRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllRecords(records: DayRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getRecordForDate(records: DayRecord[], date: string): DayRecord {
  const found = records.find((r) => r.date === date);
  return found || { date, fragments: [] };
}

export function addFragmentToRecord(
  records: DayRecord[],
  date: string,
  fragment: Omit<Fragment, "id">
): DayRecord[] {
  const idx = records.findIndex((r) => r.date === date);
  const newFragment = { ...fragment, id: `f${Date.now()}` };

  if (idx >= 0) {
    const updated = [...records];
    updated[idx] = {
      ...updated[idx],
      fragments: [...updated[idx].fragments, newFragment],
    };
    return updated;
  }

  return [...records, { date, fragments: [newFragment] }];
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
