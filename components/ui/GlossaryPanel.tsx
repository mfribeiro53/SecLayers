"use client";

import { useEffect, useState, useMemo } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { createPortal } from "react-dom";
import Link from "next/link";
import glossaryData from "@/content/glossary.json";
import { TOPICS } from "@/lib/topics";
import { useApp } from "@/components/ui/AppContext";
import type { GlossaryEntry } from "@/types";

const entries = glossaryData as GlossaryEntry[];

// Build a map from slug → topic num
const slugToNum: Record<string, number> = {};
for (const t of TOPICS) slugToNum[t.slug] = t.num;

export function GlossaryPanel() {
  const { glossaryOpen, setGlossaryOpen } = useApp();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: 'g' to open, Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const active = document.activeElement;
      const isTyping =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable);

      if (e.key === "Escape") {
        setGlossaryOpen(false);
      } else if (e.key === "g" && !isTyping && !glossaryOpen) {
        setGlossaryOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [glossaryOpen, setGlossaryOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [...entries].sort((a, b) => a.term.localeCompare(b.term));
    const q = search.toLowerCase();
    return entries
      .filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q)
      )
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [search]);

  // Build A–Z sections
  const sections = useMemo(() => {
    const map: Record<string, GlossaryEntry[]> = {};
    for (const e of filtered) {
      const letter = e.term[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(e);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const trapRef = useFocusTrap(glossaryOpen);

  if (!mounted) return null;

  const panel = (
    <>
      {/* Backdrop */}
      {glossaryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={() => setGlossaryOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-panel-title"
        aria-hidden={!glossaryOpen}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col transition-transform duration-300"
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          transform: glossaryOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span id="glossary-panel-title" className="font-semibold text-sm flex-1" style={{ color: "var(--text-primary)" }}>
            Glossary
          </span>
          <Link
            href="/glossary"
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setGlossaryOpen(false)}
          >
            Full page →
          </Link>
          <button
            onClick={() => setGlossaryOpen(false)}
            aria-label="Close glossary"
            className="p-1 rounded transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="relative">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search terms..."
              aria-label="Search glossary terms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm pl-8 pr-3 py-2 rounded-lg outline-none transition-colors"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* Terms list */}
        <div className="flex-1 overflow-y-auto">
          {sections.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              No terms match &ldquo;{search}&rdquo;
            </p>
          ) : (
            sections.map(([letter, terms]) => (
              <div key={letter}>
                <div
                  className="px-5 py-1.5 text-xs font-bold uppercase tracking-widest sticky top-0"
                  style={{
                    background: "color-mix(in srgb, var(--bg-surface) 95%, transparent)",
                    backdropFilter: "blur(4px)",
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {letter}
                </div>
                {terms.map((entry) => {
                  const slug = entry.relatedTopics?.[0];
                  const num = slug ? slugToNum[slug] : undefined;
                  return (
                    <div
                      key={entry.term}
                      className="px-5 py-3 group"
                      style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {entry.term}
                        </span>
                        {num !== undefined && (
                          <Link
                            href={`/${slug}`}
                            onClick={() => setGlossaryOpen(false)}
                            className="shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80"
                            style={{
                              background: "var(--bg-elevated)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Ch.{num}
                          </Link>
                        )}
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {entry.definition}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
