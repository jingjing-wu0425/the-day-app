"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Fragment } from "@/lib/types";
import {
  getAllRecords,
  saveAllRecords,
  getTodayDate,
  getRecordForDate,
  addFragmentToRecord,
  formatDateCN,
  getDateLabel,
} from "@/lib/store";

function now(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  if (h < 12) return `上午 ${h}:${String(m).padStart(2, "0")}`;
  if (h === 12) return `下午 12:${String(m).padStart(2, "0")}`;
  return `下午 ${h - 12}:${String(m).padStart(2, "0")}`;
}

function periodLabel(t: string): string {
  const h = Number(t.split(":")[0]);
  if (h < 6) return "深夜";
  if (h < 9) return "清晨";
  if (h < 12) return "上午";
  if (h < 14) return "中午";
  if (h < 18) return "下午";
  if (h < 20) return "傍晚";
  return "夜晚";
}

function groupByPeriod(frags: Fragment[]) {
  const periods: { label: string; items: Fragment[] }[] = [];
  let cur = "";
  for (const f of frags) {
    const p = periodLabel(f.timestamp);
    if (p !== cur) {
      periods.push({ label: p, items: [] });
      cur = p;
    }
    periods[periods.length - 1].items.push(f);
  }
  return periods;
}

function dateAdd(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

export default function Home() {
  const [records, setRecords] = useState<ReturnType<typeof getAllRecords>>([]);
  const today = getTodayDate();
  const [viewDate, setViewDate] = useState(today);
  const [text, setText] = useState("");
  const [swipeX, setSwipeX] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  // Calendar month defaults to current viewing date's month
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const fileRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    setRecords(getAllRecords());
  }, []);

  // Auto-refresh at midnight
  useEffect(() => {
    const check = () => {
      const newToday = getTodayDate();
      if (newToday !== today) {
        window.location.reload();
      }
    };
    // Check every 30 seconds
    const interval = setInterval(check, 30000);
    // Also set a timeout for exact midnight
    const now2 = new Date();
    const msUntilMidnight =
      new Date(now2.getFullYear(), now2.getMonth(), now2.getDate() + 1).getTime() - now2.getTime();
    const midnightTimeout = setTimeout(() => {
      window.location.reload();
    }, msUntilMidnight + 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [today]);

  // Persist whenever records change
  useEffect(() => {
    if (records.length > 0) saveAllRecords(records);
  }, [records]);

  const isToday = viewDate === today;
  const currentRecord = getRecordForDate(records, viewDate);
  const periods = groupByPeriod(currentRecord.fragments);
  const hasPrev = !!getRecordForDate(records, dateAdd(viewDate, -1)).fragments.length || dateAdd(viewDate, -1) >= "2020-01-01";
  const label = getDateLabel(viewDate);

  // Dates with records for calendar
  const recordedDates = useMemo(() => new Set(records.map((r) => r.date)), [records]);

  const goDay = useCallback(
    (dir: -1 | 1) => {
      setSwipeX(0);
      setViewDate((prev) => dateAdd(prev, dir));
    },
    []
  );

  const selectDate = (d: string) => {
    setViewDate(d);
    setShowCalendar(false);
  };

  const handleSubmit = () => {
    const t = text.trim();
    if (!t) return;
    const updated = addFragmentToRecord(records, today, {
      type: "text",
      content: t,
      timestamp: now(),
    });
    setRecords(updated);
    saveAllRecords(updated);
    setText("");
    // If viewing today, stay; else switch back
    if (viewDate !== today) setViewDate(today);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const updated = addFragmentToRecord(records, today, {
      type: "photo",
      content: "",
      timestamp: now(),
      imageUrl: url,
    });
    setRecords(updated);
    saveAllRecords(updated);
    e.target.value = "";
    if (viewDate !== today) setViewDate(today);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 10) setSwipeX(dx);
  };

  const onTouchEnd = () => {
    if (swipeX > 60) goDay(-1); // right swipe → previous day (yesterday)
    else if (swipeX < -60 && !isToday) goDay(1); // left swipe → next day (towards today)
    setSwipeX(0);
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const isEmpty = currentRecord.fragments.length === 0;

  return (
    <div
      className="max-w-lg mx-auto min-h-dvh bg-bg relative overflow-hidden"
      onTouchStart={showCalendar ? undefined : onTouchStart}
      onTouchMove={showCalendar ? undefined : onTouchMove}
      onTouchEnd={showCalendar ? undefined : onTouchEnd}
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${swipeX * 0.3}px)` }}
      >
        <div className="px-6 pt-14 pb-40">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setShowCalendar(true)}
                className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-muted/40 hover:text-fg/70 hover:bg-fg/5 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </button>
              <div>
                <p className="text-xs text-muted/40 font-light tracking-widest mb-1">
                  {formatDateCN(viewDate)}
                  {label && <span className="text-muted/25 ml-2">{label}</span>}
                </p>
                <h1 className="font-serif text-2xl font-semibold text-fg/80 tracking-wide">
                  {isToday ? "今天" : label}
                </h1>
                <div className="w-8 h-px bg-fg/20 mt-3" />
              </div>
            </div>
          </div>

          {/* Swipe hints */}
          {!isToday && (
            <p className="text-[10px] text-muted/25 mb-6 font-light tracking-wide">
              ← 左滑回到今天
            </p>
          )}

          {/* Empty state */}
          {isEmpty && isToday && (
            <div className="mt-16 text-center">
              <p className="text-muted/30 text-[14px] font-light">今天还没有记录</p>
              <p className="text-muted/20 text-[12px] font-light mt-2">在下方输入框记下这一刻</p>
            </div>
          )}

          {isEmpty && !isToday && (
            <div className="mt-16 text-center">
              <p className="text-muted/30 text-[14px] font-light">这天没有记录</p>
            </div>
          )}

          {/* Vertical timeline */}
          {!isEmpty && (
            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

              {periods.map((period) => (
                <div key={period.label} className="mb-8 last:mb-0">
                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="w-[11px] h-[11px] rounded-full bg-fg/10 border-2 border-fg/30 shrink-0 z-10" />
                    <span className="text-[11px] text-muted font-light tracking-widest">{period.label}</span>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>

                  {period.items.map((fragment, i) => (
                    <div key={fragment.id} className="relative pl-8 pb-6 last:pb-0 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full z-10 flex items-center justify-center ${fragment.type === "photo" ? "bg-fg" : "bg-bg border-2 border-border"}`}>
                        {fragment.type === "photo" && <div className="w-[3px] h-[3px] rounded-full bg-white" />}
                      </div>
                      <p className="text-[11px] text-muted/60 font-light tracking-wide mb-1">{formatTime(fragment.timestamp)}</p>
                      {fragment.type === "text" ? (
                        <p className="text-[14px] text-fg/75 font-light leading-relaxed">{fragment.content}</p>
                      ) : (
                        <div className="w-full aspect-[4/3] rounded-xl card-float overflow-hidden mt-1">
                          {fragment.imageUrl ? (
                            <img src={fragment.imageUrl} alt="记录的照片" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-muted/30">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              <div className="relative flex items-center gap-3">
                <div className="w-[11px] h-[11px] rounded-full bg-fg/20 shrink-0 z-10" />
                <span className="text-[11px] text-muted/40 font-light">一天结束</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar overlay */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="absolute inset-0 bg-fg/10 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
          <div className="relative bg-white rounded-2xl card-float px-6 pt-5 pb-6 w-[340px] animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-muted/50 hover:text-fg transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span className="text-[14px] text-fg/80 font-light tracking-wide">
                {calYear} {MONTHS[calMonth]}
              </span>
              <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center text-muted/50 hover:text-fg transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[11px] text-muted/40 font-light text-center py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasRecord = recordedDates.has(dateStr);
                const isSelected = dateStr === viewDate;
                const isCurrent = dateStr === today;
                const isFuture = dateStr > today;

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isFuture && selectDate(dateStr)}
                    disabled={isFuture}
                    className={`relative h-10 flex flex-col items-center justify-center rounded-full transition-all text-[13px]
                      ${isFuture ? "text-muted/15 cursor-default" : "cursor-pointer hover:bg-fg/5"}
                      ${isSelected ? "bg-fg text-white font-medium" : hasRecord ? "text-fg/70 font-light" : !isFuture ? "text-muted/40 font-light" : ""}
                      ${isCurrent && !isSelected ? "text-fg/90 font-medium" : ""}
                    `}
                  >
                    {day}
                    {hasRecord && !isSelected && (
                      <div className="absolute bottom-1 w-1 h-1 rounded-full bg-fg/30" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCalendar(false)}
              className="mt-5 w-full text-[12px] text-muted/40 font-light tracking-wide text-center hover:text-fg/60 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar — input only on today */}
      <div className="fixed bottom-0 left-0 right-0 glass">
        {isToday ? (
          <div className="max-w-lg mx-auto px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center text-muted/60 hover:text-fg/80 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="记下这一刻..."
                className="flex-1 bg-transparent text-[15px] text-fg placeholder:text-muted/40 outline-none font-light"
              />
              <button
                onClick={handleSubmit}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  text.trim() ? "bg-fg text-white scale-100" : "bg-transparent text-muted/30 scale-90"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <p className="text-[12px] text-muted/30 text-center font-light">→ 右滑回到今天</p>
          </div>
        )}
      </div>
    </div>
  );
}
