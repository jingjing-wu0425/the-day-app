"use client";

import { Fragment } from "@/lib/types";

interface FragmentListProps {
  fragments: Fragment[];
}

export default function FragmentList({ fragments }: FragmentListProps) {
  return (
    <div className="px-6 pb-32 space-y-1">
      {fragments.map((fragment, index) => (
        <div
          key={fragment.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          {/* Time label */}
          <div className="flex items-center gap-3 py-3">
            <span className="text-[11px] text-muted font-light tracking-wide w-10 shrink-0">
              {fragment.timestamp}
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Content */}
          {fragment.type === "text" ? (
            <p className="text-[15px] text-fg/80 leading-relaxed pl-[52px] font-light breathing-text">
              {fragment.content}
            </p>
          ) : (
            <div className="pl-[52px]">
              <div className="w-full aspect-[16/10] rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 card-float overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-muted/40 text-sm">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
