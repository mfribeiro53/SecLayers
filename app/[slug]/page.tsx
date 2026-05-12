import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { getAdjacentTopics, getTopicBySlug, TOPICS } from "@/lib/topics";
import { ChapterShell } from "@/components/layout/ChapterShell";
import { notFound } from "next/navigation";
import type { InterviewQuestion } from "@/types";
import { Callout } from "@/components/ui/Callout";
import { DepthBlock } from "@/components/ui/DepthBlock";
import { CodeBlock } from "@/components/ui/CodeBlock";

const MDX_OPTIONS = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [rehypeKatex, rehypeHighlight],
};

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ slug: topic.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const topic = getTopicBySlug(params.slug);
  if (!topic) return { title: "Chapter not found" };
  return {
    title: `${topic.title} — SecLayer`,
    description: `Chapter ${topic.num}: ${topic.title}. ${topic.actLabel} security course with interactive tools.`,
  };
}

interface ChapterData {
  source: string;
  hasMdx: boolean;
  misconception: { myth: string; reality: string };
  interviewQuestions: InterviewQuestion[];
}

function parseMisconceptionSection(source: string): {
  myth: string;
  reality: string;
  strippedSource: string;
} {
  const sectionIdx = source.search(/\n##\s+(?:Common\s+)?Misconception/);
  if (sectionIdx === -1) return { myth: "", reality: "", strippedSource: source };

  const section = source.slice(sectionIdx);
  const strippedSource = source.slice(0, sectionIdx).replace(/\n\n---\s*$/, "");

  // Format 1: **Myth:** ... / **Reality:** ... (most chapters)
  const mythMatch = section.match(/\*\*Myth:\*\*\s+(.*?)\n/);
  const realityMatch = section.match(/\*\*Reality:\*\*\s+([\s\S]+?)(?:\n\n---|\n##|$)/);
  if (mythMatch && realityMatch) {
    return { myth: mythMatch[1].trim(), reality: realityMatch[1].trim(), strippedSource };
  }

  // Format 2: **"Myth text"** Reality text (cicd, dep-confusion, sca, sec-tooling, slsa)
  const singleMatch = section.match(/\*\*"([^"]+)"\*\*\s+([\s\S]+?)(?:\n\n---|\n##|$)/);
  if (singleMatch) {
    return { myth: singleMatch[1].trim(), reality: singleMatch[2].trim(), strippedSource };
  }

  return { myth: "", reality: "", strippedSource: source };
}

async function loadChapterData(slug: string): Promise<ChapterData> {
  const chaptersDir = path.join(process.cwd(), "content", "chapters");
  const interviewDir = path.join(process.cwd(), "content", "interview");
  const mdxPath = path.join(chaptersDir, `${slug}.mdx`);
  const interviewPath = path.join(interviewDir, `${slug}.json`);
  const [mdxResult, interviewResult] = await Promise.allSettled([
    fs.readFile(mdxPath, "utf8"),
    fs.readFile(interviewPath, "utf8"),
  ]);
  const rawSource = mdxResult.status === "fulfilled" ? mdxResult.value : "";
  const hasMdx = mdxResult.status === "fulfilled";
  let interviewQuestions: InterviewQuestion[] = [];
  if (interviewResult.status === "fulfilled") {
    try { interviewQuestions = JSON.parse(interviewResult.value) as InterviewQuestion[]; } catch { interviewQuestions = []; }
  }
  const { myth, reality, strippedSource } = parseMisconceptionSection(rawSource);
  const source = myth ? strippedSource : rawSource;
  const misconception = myth
    ? { myth, reality }
    : { myth: "A common myth about this topic will appear here.", reality: "The corrected reality will be explained with evidence." };
  return { source, hasMdx, misconception, interviewQuestions };
}

export default async function ChapterPage({ params }: { params: { slug: string } }) {
  const adjacent = getAdjacentTopics(params.slug);
  if (!adjacent) notFound();
  const { current, prev, next } = adjacent;
  const { source, hasMdx, misconception, interviewQuestions } = await loadChapterData(params.slug);
  return (
    <ChapterShell
      topic={current}
      misconception={misconception}
      interviewQuestions={interviewQuestions}
      prevTopic={prev}
      nextTopic={next}
    >
      {hasMdx
        ? <MDXRemote source={source} options={{ mdxOptions: MDX_OPTIONS }} components={{ Callout, DepthBlock, CodeBlock }} />
        : (
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">
              <strong>{current.title}</strong> &mdash; Chapter {current.num} of SecLayers, part of {current.actLabel}.
            </p>
            <p className="text-slate-600">Full chapter content is being written in MDX. Check back soon.</p>
          </div>
        )
      }
    </ChapterShell>
  );
}
