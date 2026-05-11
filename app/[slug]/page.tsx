import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { getAdjacentTopics, TOPICS } from "@/lib/topics";
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

interface ChapterData {
  source: string;
  hasMdx: boolean;
  misconception: { myth: string; reality: string };
  interviewQuestions: InterviewQuestion[];
}

async function loadChapterData(slug: string): Promise<ChapterData> {
  const chaptersDir = path.join(process.cwd(), "content", "chapters");
  const interviewDir = path.join(process.cwd(), "content", "interview");
  const mdxPath = path.join(chaptersDir, `${slug}.mdx`);
  let source = "";
  let hasMdx = false;
  try { source = fs.readFileSync(mdxPath, "utf8"); hasMdx = true; } catch { source = ""; }
  const interviewPath = path.join(interviewDir, `${slug}.json`);
  let interviewQuestions: InterviewQuestion[] = [];
  try { interviewQuestions = JSON.parse(fs.readFileSync(interviewPath, "utf8")) as InterviewQuestion[]; } catch { interviewQuestions = []; }
  const misconception = { myth: "A common myth about this topic will appear here.", reality: "The corrected reality will be explained with evidence." };
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
