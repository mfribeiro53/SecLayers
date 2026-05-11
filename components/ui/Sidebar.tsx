"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TOPICS,
  ACT_TEXT,
  ACT_BG,
  ACT_BORDER,
  ACT_LABELS,
  groupTopicsByAct,
} from "@/lib/topics";
import { useApp } from "@/components/ui/AppContext";

const ACT_NUMBERS = Object.keys(groupTopicsByAct())
  .map(Number)
  .sort((a, b) => a - b);

// Chevron SVG
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Check icon
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3.5 h-3.5 shrink-0 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Circle icon
function CircleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-3 h-3 shrink-0 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { completedTopics } = useApp();
  const groups = groupTopicsByAct();
  const completedCount = completedTopics.size;
  const totalCount = TOPICS.length;

  // Track which acts are collapsed; none collapsed by default
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  function toggleAct(act: number) {
    setCollapsed((prev) => ({ ...prev, [act]: !prev[act] }));
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 h-screen overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link href="/" className="block group">
          <div
            className="text-base font-bold tracking-tight group-hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-primary)" }}
          >
            🔐 SecLayers
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Application Security, Visually
          </div>
        </Link>
      </div>

      {/* Progress bar */}
      <div
        className="px-5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Progress
          </span>
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
            {completedCount}/{totalCount}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
              background:
                "linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)",
            }}
          />
        </div>
      </div>

      {/* Chapter nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {ACT_NUMBERS.map((act) => {
          const topics = groups[act] ?? [];
          const isOpen = !collapsed[act];
          const actText = ACT_TEXT[act];

          return (
            <div key={act} className="mb-0.5">
              {/* Act header */}
              <button
                onClick={() => toggleAct(act)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/5"
              >
                <Chevron open={isOpen} />
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${actText}`}
                >
                  {ACT_LABELS[act]}
                </span>
              </button>

              {/* Topic items */}
              {isOpen && (
                <ul>
                  {topics.map((topic) => {
                    const isActive = pathname === `/${topic.slug}` || pathname === `/${topic.slug}/tool`;
                    const isDone = completedTopics.has(topic.num);
                    const actBg = ACT_BG[topic.act];
                    const actBorder = ACT_BORDER[topic.act];

                    return (
                      <li key={topic.slug}>
                        <Link
                          href={`/${topic.slug}`}
                          className={`flex items-center gap-2.5 pl-7 pr-4 py-1.5 text-xs transition-all border-l-2 ${
                            isActive
                              ? `${actBg} ${actBorder}`
                              : "border-transparent hover:bg-white/5"
                          }`}
                          style={{
                            color: isActive
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                          }}
                        >
                          {isDone ? (
                            <CheckIcon className={actText} />
                          ) : (
                            <CircleIcon className="text-[color:var(--text-muted)]" />
                          )}
                          <span className="font-mono text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                            {String(topic.num).padStart(2, "0")}
                          </span>
                          <span className="leading-snug">{topic.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div
        className="shrink-0 px-4 py-3 space-y-1"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <Link
          href="/glossary"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Glossary
          <kbd className="ml-auto text-[9px] px-1 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>G</kbd>
        </Link>
        <Link
          href="/exam"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          Final Exam
        </Link>
      </div>
    </aside>
  );
}
