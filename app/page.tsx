import Link from "next/link";
import { TOPICS, ACT_COLORS, ACT_LABELS, groupTopicsByAct } from "@/lib/topics";

export default function Home() {
  const groups = groupTopicsByAct();
  const actNumbers = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);
  const firstTopic = TOPICS[0];

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
      {/* Hero */}
      <section
        className="rounded-2xl p-10 lg:p-14 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
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
          SecLayers · Phase 1
        </p>
        <h1
          className="mt-3 text-4xl lg:text-5xl font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Application Security,{" "}
          <span style={{ color: "#a5b4fc" }}>visually.</span>
        </h1>
        <p
          className="mt-5 text-lg max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {TOPICS.length} interactive chapters across 7 domains — from threat
          modeling to supply-chain attacks. Built-in interview questions, a
          {" "}{TOPICS.length}-question exam, and a glossary of every term you
          need.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/${firstTopic.slug}`}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all"
            style={{
              background: "var(--accent)",
              color: "white",
            }}
          >
            Start with chapter 1 →
          </Link>
          <Link
            href="/exam"
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-strong)",
            }}
          >
            Take the exam
          </Link>
          <Link
            href="/glossary"
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{
              color: "var(--text-secondary)",
            }}
          >
            Browse glossary
          </Link>
        </div>
      </section>

      {/* Acts */}
      <section className="mt-12 space-y-10">
        {actNumbers.map((act) => {
          const topics = groups[act];
          const color = `var(--act-${ACT_COLORS[act]})`;
          return (
            <div key={act}>
              <div className="flex items-baseline gap-3 mb-4">
                <span
                  className="w-1.5 h-6 rounded-full"
                  style={{ background: color }}
                />
                <h2
                  className="text-xl font-bold"
                  style={{ color }}
                >
                  {ACT_LABELS[act]}
                </h2>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {topics.length} chapters
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/${topic.slug}`}
                    className="group block p-4 rounded-xl transition-all relative overflow-hidden"
                    style={{
                      background: `linear-gradient(180deg,
                        color-mix(in srgb, ${color} 6%, var(--bg-surface)) 0%,
                        var(--bg-surface) 100%)`,
                      border: `1px solid color-mix(in srgb, ${color} 18%, var(--border-subtle))`,
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-0.5"
                      style={{ background: color }}
                    />
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {topic.num.toString().padStart(2, "0")}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <p
                      className="font-medium mt-2 leading-snug group-hover:text-white transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {topic.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {topic.tags.slice(0, 2).map((tag) => (
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
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer
        className="mt-16 pt-8 text-center text-xs"
        style={{
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        Built with Next.js, MDX, KaTeX, and Tailwind CSS.
      </footer>
    </div>
  );
}
