"use client";

import { Topic, ACT_COLORS, ACT_LABELS, ACT_TEXT, ACT_BG, ACT_BORDER } from "@/lib/topics";
import { MisconceptionCard } from "@/components/ui/MisconceptionCard";
import { InterviewCard } from "@/components/ui/InterviewCard";
import { useApp } from "@/components/ui/AppContext";
import Link from "next/link";
import { ReactNode } from "react";
import type { InterviewQuestion } from "@/types";

interface ChapterShellProps {
  topic: Topic;
  children: ReactNode;
  tool: ReactNode;
  misconception: { myth: string; reality: string };
  interviewQuestions?: InterviewQuestion[];
  prevTopic: Topic | null;
  nextTopic: Topic | null;
}

export function ChapterShell({
  topic,
  children,
  tool,
  misconception,
  interviewQuestions = [],
  prevTopic,
  nextTopic,
}: ChapterShellProps) {
  const { interviewMode, completedTopics, markTopicComplete, depthMode } = useApp();
  const isDone = completedTopics.has(topic.num);
  const actColor = `var(--act-${ACT_COLORS[topic.act]})`;
  const actText = ACT_TEXT[topic.act];
  const actBg = ACT_BG[topic.act];
  const actBorder = ACT_BORDER[topic.act];

  return (
    <article className="min-h-full max-w-4xl mx-auto px-6 py-10">
      {/* ── Chapter header card ── */}
      <header
        className={`mb-8 p-6 rounded-2xl border ${actBg} ${actBorder}`}
      >
        <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${actText}`}>
          {ACT_LABELS[topic.act]} · Chapter {topic.num}
        </div>
        <h1 className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
          {topic.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {topic.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[11px] rounded-full font-medium"
              style={{
                background: `color-mix(in srgb, ${actColor} 12%, var(--bg-elevated))`,
                border: `1px solid color-mix(in srgb, ${actColor} 30%, var(--border-subtle))`,
                color: actColor,
              }}
            >
              {tag}
            </span>
          ))}
          {/* Depth badge */}
          <span
            className="ml-auto px-2 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider"
            style={{
              background: depthMode === "advanced" ? "rgba(139,92,246,0.15)" : "rgba(99,102,241,0.12)",
              border: depthMode === "advanced" ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(99,102,241,0.3)",
              color: depthMode === "advanced" ? "#c4b5fd" : "#a5b4fc",
            }}
          >
            {depthMode}
          </span>
        </div>
      </header>

      {/* ── MDX content ── */}
      <div className="prose max-w-none">
        {children}
      </div>

      {/* ── Misconception ── */}
      <section className="mt-10">
        <p
          className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Common Misconception
        </p>
        <MisconceptionCard myth={misconception.myth} reality={misconception.reality} />
      </section>

      {/* ── Interactive tool ── */}
      <section
        className="mt-10 rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{
            background: "var(--bg-surface-2)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span
            className="w-1.5 h-5 rounded-full"
            style={{ background: actColor }}
          />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Interactive Tool
          </h2>
          <Link
            href={`/${topic.slug}/tool`}
            className="ml-auto text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            Full screen →
          </Link>
        </div>
        <div className="p-5" style={{ background: "var(--bg-surface)" }}>
          {tool}
        </div>
      </section>

      {/* ── Interview questions (gated behind interview mode) ── */}
      {interviewMode && interviewQuestions.length > 0 && (
        <section className="mt-10">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Interview Questions
          </p>
          <InterviewCard questions={interviewQuestions} />
        </section>
      )}

      {/* ── Bottom nav ── */}
      <nav
        className="mt-10 pt-6 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        {prevTopic ? (
          <Link
            href={`/${prevTopic.slug}`}
            className="group flex flex-col items-start transition-opacity hover:opacity-80"
          >
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              ← Previous
            </span>
            <span className="font-medium mt-0.5 text-sm" style={{ color: "var(--text-primary)" }}>
              {prevTopic.num}. {prevTopic.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {/* Mark complete button */}
        <button
          onClick={() => !isDone && markTopicComplete(topic.num)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={
            isDone
              ? {
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.4)",
                  color: "#34d399",
                }
              : {
                  background: actBg.replace("bg-", "rgba(").replace("/30", ",0.15)") ?? "var(--bg-elevated)",
                  border: `1px solid var(--border-subtle)`,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }
          }
        >
          {isDone ? "✓ Completed" : "Mark Complete"}
        </button>

        {nextTopic ? (
          <Link
            href={`/${nextTopic.slug}`}
            className="group flex flex-col items-end transition-opacity hover:opacity-80"
          >
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Next →
            </span>
            <span className="font-medium mt-0.5 text-sm" style={{ color: "var(--text-primary)" }}>
              {nextTopic.num}. {nextTopic.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}

