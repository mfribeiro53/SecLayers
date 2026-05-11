"use client";

import { useState } from "react";
import { useApp } from "@/components/ui/AppContext";
import { ToolsModal } from "@/components/ui/ToolsModal";

type DepthMode = "beginner" | "advanced";
type Difficulty = "junior" | "mid" | "senior";

const DEPTH_OPTIONS: { value: DepthMode; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "advanced", label: "Advanced" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string; active: string }[] = [
  { value: "junior",  label: "Junior",  color: "text-emerald-400", active: "bg-emerald-600 text-white" },
  { value: "mid",     label: "Mid",     color: "text-amber-400",   active: "bg-amber-500 text-black" },
  { value: "senior",  label: "Senior",  color: "text-rose-400",    active: "bg-rose-600 text-white" },
];

export function TopNav() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const {
    depthMode,
    setDepthMode,
    interviewMode,
    setInterviewMode,
    difficulty,
    setDifficulty,
    setGlossaryOpen,
  } = useApp();

  return (
    <header
      className="sticky top-0 z-40 flex items-center h-14 px-4 gap-4 shrink-0"
      style={{
        background: "color-mix(in srgb, var(--bg-surface) 95%, transparent)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── Depth mode ── */}
      <div
        className="flex items-center gap-0.5 rounded-lg p-0.5"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {DEPTH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDepthMode(opt.value)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-all"
            style={
              depthMode === opt.value
                ? { background: "#4f46e5", color: "white" }
                : { color: "var(--text-muted)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Interview mode ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setInterviewMode(!interviewMode)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={
            interviewMode
              ? {
                  background: "rgba(251,191,36,0.15)",
                  border: "1px solid rgba(251,191,36,0.4)",
                  color: "#fbbf24",
                }
              : {
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                }
          }
        >
          {/* Toggle pill */}
          <span
            className="relative w-7 h-3.5 rounded-full transition-colors"
            style={{
              background: interviewMode
                ? "rgba(251,191,36,0.6)"
                : "var(--border-strong)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform"
              style={{
                transform: interviewMode ? "translateX(14px)" : "translateX(0)",
              }}
            />
          </span>
          Interview
        </button>

        {/* Difficulty selector — only when interview mode is on */}
        <div
          className={`flex items-center gap-0.5 rounded-lg p-0.5 transition-opacity ${
            interviewMode ? "opacity-100" : "opacity-30 pointer-events-none"
          }`}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                difficulty === opt.value ? opt.active : opt.color
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Tools ── */}
      <button
        onClick={() => setToolsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
        Tools
      </button>
      <ToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} />

      {/* ── Glossary ── */}
      <button
        onClick={() => setGlossaryOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        Glossary
        <kbd
          className="text-[9px] px-1 rounded"
          style={{
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          G
        </kbd>
      </button>
    </header>
  );
}
