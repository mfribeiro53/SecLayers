import Link from "next/link";
import { groupLabsByAct, LAB_ACT_LABELS } from "@/lib/labs";
import type { Lab } from "@/types";

const DIFFICULTY_COLORS: Record<Lab["difficulty"], { bg: string; text: string; label: string }> = {
  easy:   { bg: "rgba(52,211,153,0.12)",  text: "#6ee7b7", label: "Easy" },
  medium: { bg: "rgba(251,191,36,0.12)",  text: "#fcd34d", label: "Medium" },
  hard:   { bg: "rgba(248,113,113,0.12)", text: "#fca5a5", label: "Hard" },
};

const ACT_COLORS: Record<number, string> = {
  2: "var(--act-web)",
  3: "var(--act-api)",
};

export default function LabsPage() {
  const groups = groupLabsByAct();
  const actNumbers = Object.keys(groups).map(Number).sort((a, b) => a - b);
  const totalLabs = Object.values(groups).flat().length;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-12">
      {/* Hero */}
      <section
        className="rounded-2xl p-10 lg:p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#a5b4fc" }}
        >
          SecLayers · CTF Labs
        </p>
        <h1
          className="mt-2 text-3xl lg:text-4xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Hands-on Practice
        </h1>
        <p className="mt-3 text-sm max-w-xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {totalLabs} client-side labs covering web and API vulnerabilities. Read the chapter,
          then prove you understand it by capturing the flag.
        </p>
      </section>

      {/* Labs by act */}
      <div className="mt-10 space-y-10">
        {actNumbers.map((act) => {
          const labs = groups[act];
          const color = ACT_COLORS[act] ?? "var(--accent)";
          return (
            <div key={act}>
              <div className="flex items-baseline gap-3 mb-4">
                <span
                  className="w-1.5 h-6 rounded-full"
                  style={{ background: color }}
                />
                <h2 className="text-xl font-bold" style={{ color }}>
                  {LAB_ACT_LABELS[act]}
                </h2>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {labs.length} lab{labs.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {labs.map((lab) => {
                  const diff = DIFFICULTY_COLORS[lab.difficulty];
                  return (
                    <Link
                      key={lab.slug}
                      href={`/labs/${lab.slug}`}
                      className="group block p-5 rounded-xl transition-all relative overflow-hidden"
                      style={{
                        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 5%, var(--bg-surface)) 0%, var(--bg-surface) 100%)`,
                        border: `1px solid color-mix(in srgb, ${color} 15%, var(--border-subtle))`,
                      }}
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-0.5"
                        style={{ background: color }}
                      />
                      {/* Difficulty badge */}
                      <span
                        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3"
                        style={{ background: diff.bg, color: diff.text }}
                      >
                        {diff.label}
                      </span>
                      <p
                        className="font-semibold text-sm leading-snug group-hover:text-white transition-colors"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {lab.title}
                      </p>
                      <p
                        className="mt-2 text-xs leading-relaxed line-clamp-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {lab.objective}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {lab.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] rounded font-mono"
                            style={{
                              background: "var(--bg-elevated)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <footer
        className="mt-16 pt-8 text-center text-xs"
        style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
      >
        All labs run entirely in your browser. No backend, no data sent anywhere.
      </footer>
    </div>
  );
}
