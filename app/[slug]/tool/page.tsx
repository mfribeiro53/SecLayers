import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopicBySlug, TOPICS } from "@/lib/topics";
import { TOOL_META } from "@/lib/tool-meta";
import { ToolRenderer } from "@/components/ui/ToolRenderer";
import { ToolIntro } from "@/components/ui/ToolIntro";

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
    </div>
  );
}
