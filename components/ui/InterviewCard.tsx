"use client";

import { InterviewQuestion } from "@/types";
import { useState } from "react";

const CATEGORY_STYLES: Record<
  InterviewQuestion["category"],
  { label: string; bg: string; color: string; border: string }
> = {
  junior: {
    label: "Junior",
    bg: "rgba(52, 211, 153, 0.12)",
    color: "#34d399",
    border: "rgba(52, 211, 153, 0.3)",
  },
  mid: {
    label: "Mid-Level",
    bg: "rgba(251, 191, 36, 0.12)",
    color: "#fbbf24",
    border: "rgba(251, 191, 36, 0.3)",
  },
  senior: {
    label: "Senior",
    bg: "rgba(248, 113, 113, 0.12)",
    color: "#f87171",
    border: "rgba(248, 113, 113, 0.3)",
  },
};

interface InterviewCardProps {
  questions: InterviewQuestion[];
}

export function InterviewCard({ questions }: InterviewCardProps) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3">
      <p
        className="text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Click to reveal answers — covers junior, mid-level, and senior roles.
      </p>
      {questions.map((q) => (
        <InterviewItem key={q.id} question={q} />
      ))}
    </div>
  );
}

function InterviewItem({ question }: { question: InterviewQuestion }) {
  const [open, setOpen] = useState(false);
  const style = CATEGORY_STYLES[question.category];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex items-start justify-between gap-3 transition-colors hover:bg-[color:var(--bg-surface-2)]"
      >
        <div className="flex-1 min-w-0">
          <span
            className="inline-block px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider mb-2"
            style={{
              background: style.bg,
              color: style.color,
              border: `1px solid ${style.border}`,
            }}
          >
            {style.label}
          </span>
          <p
            className="leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {question.question}
          </p>
        </div>
        <span
          className="mt-1 shrink-0 text-lg transition-transform"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div
          className="px-4 pb-4 pt-3 text-sm leading-relaxed whitespace-pre-line"
          style={{
            color: "var(--text-secondary)",
            borderTop: "1px solid var(--border-subtle)",
            background: "var(--bg-surface-2)",
          }}
        >
          {question.answer}
        </div>
      )}
    </div>
  );
}
