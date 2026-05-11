import fs from "fs";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAdjacentTopics, TOPICS } from "@/lib/topics";
import { ChapterShell } from "@/components/layout/ChapterShell";
import { notFound } from "next/navigation";
import type { InterviewQuestion } from "@/types";

// ── Tool registry ──────────────────────────────────────────
import SQLiSandboxTool from "@/components/tools/SQLiSandboxTool";
import DOMXSSVisualizerTool from "@/components/tools/DOMXSSVisualizerTool";
import DfdBuilderTool from "@/components/tools/DfdBuilderTool";
import CryptoPlaygroundTool from "@/components/tools/CryptoPlaygroundTool";
import EncodingSandboxTool from "@/components/tools/EncodingSandboxTool";
import SdlcTimelineTool from "@/components/tools/SdlcTimelineTool";
import CsrfSimulatorTool from "@/components/tools/CsrfSimulatorTool";
import JWTEditorTool from "@/components/tools/JWTEditorTool";
import IdorExplorerTool from "@/components/tools/IdorExplorerTool";
import SsrfVisualizerTool from "@/components/tools/SsrfVisualizerTool";
import HeaderGraderTool from "@/components/tools/HeaderGraderTool";
import CSPSandboxTool from "@/components/tools/CSPSandboxTool";
import DefensiveCodeLabTool from "@/components/tools/DefensiveCodeLabTool";
import OAuthFlowAnimatorTool from "@/components/tools/OAuthFlowAnimatorTool";
import GraphQLExplorerTool from "@/components/tools/GraphQLExplorerTool";
import JWTAnatomyTool from "@/components/tools/JWTAnatomyTool";
import RateLimiterTool from "@/components/tools/RateLimiterTool";
import ApiDiffTool from "@/components/tools/ApiDiffTool";
import MobileFSExplorerTool from "@/components/tools/MobileFSExplorerTool";
import TLSVisualizerTool from "@/components/tools/TLSVisualizerTool";
import APKExplorerTool from "@/components/tools/APKExplorerTool";
import AuthBypassTreeTool from "@/components/tools/AuthBypassTreeTool";
import IntentRouterTool from "@/components/tools/IntentRouterTool";
import { Callout } from "@/components/ui/Callout";
import { DepthBlock } from "@/components/ui/DepthBlock";
import { CodeBlock } from "@/components/ui/CodeBlock";

const TOOL_MAP: Record<string, React.ComponentType> = {
  SQLiSandboxTool, DOMXSSVisualizerTool, DfdBuilderTool,
  CryptoPlaygroundTool, EncodingSandboxTool, SdlcTimelineTool,
  CsrfSimulatorTool, JWTEditorTool, IdorExplorerTool,
  SsrfVisualizerTool, HeaderGraderTool, CSPSandboxTool,
  DefensiveCodeLabTool, OAuthFlowAnimatorTool, GraphQLExplorerTool,
  JWTAnatomyTool, RateLimiterTool, ApiDiffTool,
  MobileFSExplorerTool, TLSVisualizerTool, APKExplorerTool,
  AuthBypassTreeTool, IntentRouterTool,
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
  const ToolComponent = TOOL_MAP[current.toolComponent] ?? null;
  return (
    <ChapterShell topic={current} tool={ToolComponent ? <ToolComponent /> : <div className="flex items-center justify-center h-32 text-slate-400 italic border-2 border-dashed border-slate-200 rounded-lg">Interactive tool for &ldquo;{current.title}&rdquo; &mdash; coming soon.</div>} misconception={misconception} interviewQuestions={interviewQuestions} prevTopic={prev} nextTopic={next}>
      {hasMdx ? <MDXRemote source={source} components={{ Callout, DepthBlock, CodeBlock }} /> : <div className="space-y-4"><p className="text-lg leading-relaxed"><strong>{current.title}</strong> &mdash; Chapter {current.num} of SecLayers, part of {current.actLabel}.</p><p className="text-slate-600">Full chapter content is being written in MDX. Check back soon.</p></div>}
    </ChapterShell>
  );
}
