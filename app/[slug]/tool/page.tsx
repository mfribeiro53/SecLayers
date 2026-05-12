import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopicBySlug, TOPICS, ACT_COLORS } from "@/lib/topics";
import { TOOL_META } from "@/lib/tool-meta";
import { ToolRenderer } from "@/components/ui/ToolRenderer";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { ToolHelpButton } from "@/components/ui/ToolHelpButton";

export function generateStaticParams() {
  return TOPICS.filter((t) => !!TOOL_META[t.toolComponent]).map((t) => ({
    slug: t.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const topic = getTopicBySlug(params.slug);
  if (!topic) return { title: "Tool not found" };
  return { title: `${topic.title} — Interactive Tool` };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const topic = getTopicBySlug(params.slug);
  if (!topic) notFound();

  if (!TOOL_META[topic.toolComponent]) notFound();

  const meta = TOOL_META[topic.toolComponent];
  const actColor = `var(--act-${ACT_COLORS[topic.act]})`;

  return (
    <div className="px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full">
      {meta && (
        <ToolIntro
          topic={topic}
          summary={meta.summary}
          quickStart={meta.quickStart}
        />
      )}
      <ToolRenderer toolComponent={topic.toolComponent} />
      {meta?.help && (
        <div className="mt-6 flex justify-end">
          <ToolHelpButton
            goal={meta.help.goal}
            steps={meta.help.steps}
            lookFor={meta.help.lookFor}
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: `color-mix(in srgb, ${actColor} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${actColor} 30%, transparent)`,
                color: actColor,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              How to use this tool
            </span>
          </ToolHelpButton>
        </div>
      )}
    </div>
  );
}
