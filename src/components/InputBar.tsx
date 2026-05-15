"use client";

import { useState } from "react";

export default function InputBar() {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    // In a real app, this would send the fragment to the backend
    setText("");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 glass">
      <div className="max-w-lg mx-auto px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          {/* Photo button */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-muted/60 hover:text-fg/80 transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          {/* Input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="记下这一刻..."
            className="flex-1 bg-transparent text-[15px] text-fg placeholder:text-muted/40 outline-none font-light"
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              text.trim()
                ? "bg-fg text-white scale-100"
                : "bg-transparent text-muted/30 scale-90"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
