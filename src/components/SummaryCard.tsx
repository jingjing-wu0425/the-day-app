"use client";

interface SummaryCardProps {
  title: string;
  summary: string;
}

export default function SummaryCard({ title, summary }: SummaryCardProps) {
  return (
    <div className="px-6 pt-8 pb-2 animate-fade-up">
      {/* Title */}
      <h1 className="font-serif text-[28px] font-semibold text-fg tracking-wide leading-snug">
        {title}
      </h1>

      {/* Divider */}
      <div className="w-8 h-px bg-fg/20 mt-4 mb-5" />

      {/* Summary */}
      <p
        className="text-[14px] text-fg/65 font-light breathing-text leading-[1.9]"
        dangerouslySetInnerHTML={{ __html: summary }}
      />
    </div>
  );
}
