import Link from "next/link";
import type { Topic } from "@/lib/topics";
import { ACT_COLORS, ACT_LABELS } from "@/lib/topics";

interface ToolIntroProps {
  topic: Topic;
  summary: string;
  quickStart: string[];
}

export function ToolIntro({ topic, summary, quickStart }: ToolIntroProps) {
  const actColor = `var(--act-${ACT_COLORS[topic.act]})`;

  return (
    <div className="mb-8 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <Link
          href={`/${topic.slug}`}
          className="flex items-center gap-1 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Chapter {topic.num}
        </Link>
        <span>·</span>
        <span style={{ color: actColor }}>{ACT_LABELS[topic.act]}</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {topic.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {summary}
        </p>
      </div>

      {/* Quick-start */}
      {quickStart.length > 0 && (
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: `color-mix(in srgb, ${actColor} 8%, var(--bg-elevated))`,
            border: `1px solid color-mix(in srgb, ${actColor} 25%, var(--border-subtle))`,
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: actColor }}
          >
            Try this in 30 seconds
          </p>
          <ol className="space-y-1.5">
            {quickStart.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span
                  className="mt-0.5 w-4.5 h-4.5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: actColor, color: "#fff", minWidth: "1.125rem", minHeight: "1.125rem" }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
