"use client";

import { Fragment } from "@/lib/types";

interface TimelineProps {
  fragments: Fragment[];
}

export default function Timeline({ fragments }: TimelineProps) {
  const times = fragments.map((f) => {
    const [h, m] = f.timestamp.split(":").map(Number);
    const minutes = h * 60 + m;
    const minTime = 6 * 60; // 06:00
    const maxTime = 24 * 60; // 24:00
    return {
      time: f.timestamp,
      position: ((minutes - minTime) / (maxTime - minTime)) * 100,
      isPhoto: f.type === "photo",
    };
  });

  return (
    <div className="w-full px-6 py-4">
      {/* Date label */}
      <p className="text-xs text-muted mb-3 font-light tracking-wider">
        2025 / 05 / 15 · 星期四
      </p>

      {/* Horizontal timeline */}
      <div className="relative h-8 flex items-center">
        {/* Track line */}
        <div className="absolute left-0 right-0 h-px bg-border" />

        {/* Dots */}
        {times.map((t, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${t.position}%` }}
          >
            <div
              className={`rounded-full transition-all duration-300 ${
                t.isPhoto
                  ? "w-2.5 h-2.5 bg-fg"
                  : "w-1.5 h-1.5 bg-muted/60"
              }`}
            />
            <span className="text-[9px] text-muted/70 mt-1.5 select-none">
              {t.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
