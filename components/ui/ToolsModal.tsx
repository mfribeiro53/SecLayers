"use client";

import { useState, useEffect } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { createPortal } from "react-dom";
import Link from "next/link";
import { TOPICS, ACT_TEXT, ACT_BG, ACT_BORDER, ACT_LABELS, groupTopicsByAct } from "@/lib/topics";
import { TOOL_META } from "@/lib/tool-meta";

// Only include topics that have a built tool
const BUILT_TOOL_SLUGS = new Set([
  // Foundations
  "threat-modeling", "cryptography", "input-validation", "secure-sdlc",
  // Act I — Web Security
  "sql-injection", "xss", "csrf", "auth-sessions", "idor", "ssrf",
  "security-headers", "csp", "defensive-patterns",
  // Act II — API Security
  "api-auth", "graphql", "jwt", "rate-limiting", "api-versioning",
  // Act III — Mobile Security
  "mobile-storage", "mobile-tls", "mobile-reversing", "mobile-biometrics", "mobile-intents",
  // Act IV — Systems / Native
  "stack", "buffer-overflow", "format-string", "heap", "mitigations", "race-conditions",
  // Act V — Cloud & Infrastructure
  "iam", "cloud-storage", "containers", "k8s-rbac", "secrets", "iac", "logging-monitoring",
  // Act VI — Supply Chain
  "dep-confusion", "sca", "cicd", "slsa", "sec-tooling",
]);

const ACT_NUMBERS = Object.keys(groupTopicsByAct())
  .map(Number)
  .sort((a, b) => a - b);

interface ToolsModalProps {
  open: boolean;
  onClose: () => void;
}

function ToolsModalContent({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const groups = groupTopicsByAct();
  const trapRef = useFocusTrap(true);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = search.toLowerCase().trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/70"
        style={{ backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 pb-8 pointer-events-none"
      >
        <div
          ref={trapRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tools-modal-title"
          className="relative w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span id="tools-modal-title" className="font-semibold text-sm flex-1" style={{ color: "var(--text-primary)" }}>
              Interactive Tools
            </span>
            {/* Search */}
            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="text-sm pl-8 pr-3 py-1.5 rounded-lg w-52 outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tool list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {ACT_NUMBERS.map((act) => {
              const topics = (groups[act] ?? []).filter((t) => {
                if (!BUILT_TOOL_SLUGS.has(t.slug)) return false;
                if (!q) return true;
                return (
                  t.title.toLowerCase().includes(q) ||
                  t.toolComponent.toLowerCase().includes(q) ||
                  (TOOL_META[t.toolComponent]?.summary ?? "").toLowerCase().includes(q)
                );
              });

              if (topics.length === 0) return null;

              const actText = ACT_TEXT[act];
              const actBg = ACT_BG[act];
              const actBorder = ACT_BORDER[act];

              return (
                <section key={act}>
                  {/* Act heading */}
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${actText}`}>
                    {ACT_LABELS[act]}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {topics.map((topic) => {
                      const meta = TOOL_META[topic.toolComponent];
                      return (
                        <Link
                          key={topic.slug}
                          href={`/${topic.slug}/tool`}
                          onClick={onClose}
                          className={`group flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all hover:brightness-125 ${actBg} ${actBorder}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="text-sm font-medium leading-snug"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {topic.title}
                            </span>
                            <span
                              className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded ${actText}`}
                              style={{
                                background: "rgba(0,0,0,0.2)",
                                border: "1px solid currentColor",
                                opacity: 0.7,
                              }}
                            >
                              Ch.{String(topic.num).padStart(2, "0")}
                            </span>
                          </div>
                          {meta && (
                            <p
                              className="text-xs leading-relaxed line-clamp-2"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {meta.summary}
                            </p>
                          )}
                          <span
                            className={`text-[10px] font-medium mt-0.5 ${actText} opacity-0 group-hover:opacity-100 transition-opacity`}
                          >
                            Open tool →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function ToolsModal({ open, onClose }: ToolsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !open) return null;
  return createPortal(<ToolsModalContent onClose={onClose} />, document.body);
}
