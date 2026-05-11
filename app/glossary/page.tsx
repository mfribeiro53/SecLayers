"use client";

import { useState, useMemo } from "react";
import glossary from "@/content/glossary.json";
import { ACT_COLORS, ACT_LABELS } from "@/lib/topics";
import Link from "next/link";
import type { GlossaryEntry } from "@/types";

const entries = glossary as GlossaryEntry[];

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [actFilter, setActFilter] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.definition.toLowerCase().includes(q) ||
          e.relatedTopics.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (actFilter) {
      result = result.filter((e) => e.act === actFilter);
    }
    return result.sort((a, b) => a.term.localeCompare(b.term));
  }, [search, actFilter]);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
      {/* Header card */}
      <header
        className="rounded-2xl p-7 lg:p-9 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#a5b4fc" }}
        >
          Reference
        </p>
        <h1
          className="mt-2 text-3xl lg:text-4xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Glossary
        </h1>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {entries.length} AppSec terms across{" "}
          {Object.keys(ACT_LABELS).length} domains
        </p>
      </header>

      {/* Controls */}
      <div className="mt-8 space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms, definitions, or related topics…"
          className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActFilter(null)}
            className="px-3 py-1 text-xs rounded-full font-medium transition-colors"
            style={{
              background: !actFilter ? "var(--accent)" : "var(--bg-surface)",
              color: !actFilter ? "white" : "var(--text-secondary)",
              border: `1px solid ${!actFilter ? "var(--accent)" : "var(--border-subtle)"}`,
            }}
          >
            All
          </button>
          {Object.entries(ACT_LABELS).map(([actStr, label]) => {
            const act = parseInt(actStr);
            const active = actFilter === act;
            const color = `var(--act-${ACT_COLORS[act]})`;
            return (
              <button
                key={act}
                onClick={() => setActFilter(active ? null : act)}
                className="px-3 py-1 text-xs rounded-full font-medium transition-colors"
                style={{
                  background: active
                    ? color
                    : "var(--bg-surface)",
                  color: active ? "#0b1020" : color,
                  border: `1px solid ${active ? color : "var(--border-subtle)"}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {filtered.length} term{filtered.length !== 1 ? "s" : ""}
          {actFilter && ` in ${ACT_LABELS[actFilter]}`}
        </p>
      </div>

      {/* Term list */}
      <div className="mt-6 space-y-3">
        {filtered.map((entry) => {
          const act = entry.act ?? 1;
          const color = `var(--act-${ACT_COLORS[act]})`;
          return (
            <article
              key={entry.term}
              className="p-5 rounded-xl"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3
                  className="font-semibold text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  {entry.term}
                </h3>
                <span
                  className="shrink-0 px-2 py-0.5 text-[10px] rounded-full font-medium uppercase tracking-wider"
                  style={{
                    background: "transparent",
                    color: color,
                    border: `1px solid ${color}`,
                  }}
                >
                  {ACT_LABELS[act]}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed mt-2"
                style={{ color: "var(--text-secondary)" }}
              >
                {entry.definition}
              </p>
              {entry.relatedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.relatedTopics.map((slug) => (
                    <Link
                      key={slug}
                      href={`/${slug}`}
                      className="px-2 py-0.5 text-[11px] rounded font-mono transition-colors"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {slug.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
