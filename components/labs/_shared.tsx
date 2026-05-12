"use client";

import { useState } from "react";

export function HintPanel({
  hints,
  hintsUsed,
  onReveal,
}: {
  hints: string[];
  hintsUsed: number;
  onReveal: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
        style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}
      >
        <span>Hints ({hintsUsed}/{hints.length} revealed)</span>
        <span style={{ color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3" style={{ background: "var(--bg-surface)" }}>
          {hints.slice(0, hintsUsed).map((hint, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span
                className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded h-fit"
                style={{
                  background: "var(--bg-elevated)",
                  color: "#a5b4fc",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {i + 1}
              </span>
              <span style={{ color: "var(--text-secondary)" }}>{hint}</span>
            </div>
          ))}
          {hintsUsed === 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No hints revealed yet.
            </p>
          )}
          {hintsUsed < hints.length ? (
            <button
              onClick={onReveal}
              className="text-xs px-3 py-1.5 rounded transition-colors"
              style={{
                background: "var(--bg-elevated)",
                color: "#a5b4fc",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Show hint {hintsUsed + 1}
            </button>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              All hints revealed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SolvedBanner({
  flag,
  explanation,
}: {
  flag: string;
  explanation: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(flag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-lg p-5 space-y-3"
      style={{
        background: "rgba(52,211,153,0.08)",
        border: "1px solid rgba(52,211,153,0.3)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">🏁</span>
        <span className="font-semibold text-sm" style={{ color: "#6ee7b7" }}>
          Flag captured!
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <code
          className="font-mono text-sm px-2 py-1 rounded"
          style={{
            background: "var(--bg-elevated)",
            color: "#6ee7b7",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
        >
          {flag}
        </code>
        <button
          onClick={copy}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{
            background: "var(--bg-elevated)",
            color: copied ? "#6ee7b7" : "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
          What you exploited:{" "}
        </span>
        {explanation}
      </p>
    </div>
  );
}
