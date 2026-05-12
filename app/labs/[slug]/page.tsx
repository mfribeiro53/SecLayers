import { notFound } from "next/navigation";
import Link from "next/link";
import { getLabBySlug, LABS, LAB_ACT_LABELS } from "@/lib/labs";
import { LabRenderer } from "@/components/labs/LabRenderer";
import type { Lab } from "@/types";

const DIFFICULTY_STYLES: Record<Lab["difficulty"], { bg: string; text: string; label: string }> = {
  easy:   { bg: "rgba(52,211,153,0.12)",  text: "#6ee7b7", label: "Easy" },
  medium: { bg: "rgba(251,191,36,0.12)",  text: "#fcd34d", label: "Medium" },
  hard:   { bg: "rgba(248,113,113,0.12)", text: "#fca5a5", label: "Hard" },
};

const ACT_COLORS: Record<number, string> = {
  2: "var(--act-web)",
  3: "var(--act-api)",
};

export function generateStaticParams() {
  return LABS.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLabBySlug(slug);
  if (!lab) return {};
  return { title: lab.title };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLabBySlug(slug);
  if (!lab) notFound();

  const diff = DIFFICULTY_STYLES[lab.difficulty];
  const color = ACT_COLORS[lab.act] ?? "var(--accent)";
  const actLabel = LAB_ACT_LABELS[lab.act] ?? "Lab";

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      {/* Back link */}
      <Link
        href="/labs"
        className="inline-flex items-center gap-1.5 text-xs mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        All labs
      </Link>

      {/* Header */}
      <header
        className="rounded-2xl p-7 lg:p-9 relative overflow-hidden mb-8"
        style={{
          background: "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {actLabel}
          </span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: diff.bg, color: diff.text }}
          >
            {diff.label}
          </span>
        </div>
        <h1
          className="text-2xl lg:text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {lab.title}
        </h1>
        <p
          className="mt-3 text-sm leading-relaxed max-w-2xl"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Objective:{" "}
          </span>
          {lab.objective}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {lab.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-mono rounded"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tag}
            </span>
          ))}
          <Link
            href={`/${lab.chapterSlug}`}
            className="ml-auto text-xs transition-colors"
            style={{ color: "#a5b4fc" }}
          >
            Read chapter →
          </Link>
        </div>
      </header>

      {/* Lab component */}
      <LabRenderer slug={slug} />
    </div>
  );
}
