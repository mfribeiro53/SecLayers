"use client";

import dynamic from "next/dynamic";

// ── Dynamic tool imports (ssr: false prevents WASM/canvas hydration errors) ──
const TOOLS: Record<string, React.ComponentType> = {
  SQLiSandboxTool: dynamic(() => import("@/components/tools/SQLiSandboxTool"), { ssr: false }),
  DOMXSSVisualizerTool: dynamic(() => import("@/components/tools/DOMXSSVisualizerTool"), { ssr: false }),
  DfdBuilderTool: dynamic(() => import("@/components/tools/DfdBuilderTool"), { ssr: false }),
  CryptoPlaygroundTool: dynamic(() => import("@/components/tools/CryptoPlaygroundTool"), { ssr: false }),
  EncodingSandboxTool: dynamic(() => import("@/components/tools/EncodingSandboxTool"), { ssr: false }),
  SdlcTimelineTool: dynamic(() => import("@/components/tools/SdlcTimelineTool"), { ssr: false }),
  CsrfSimulatorTool: dynamic(() => import("@/components/tools/CsrfSimulatorTool"), { ssr: false }),
  JWTEditorTool: dynamic(() => import("@/components/tools/JWTEditorTool"), { ssr: false }),
  IdorExplorerTool: dynamic(() => import("@/components/tools/IdorExplorerTool"), { ssr: false }),
  SsrfVisualizerTool: dynamic(() => import("@/components/tools/SsrfVisualizerTool"), { ssr: false }),
  HeaderGraderTool: dynamic(() => import("@/components/tools/HeaderGraderTool"), { ssr: false }),
  CSPSandboxTool: dynamic(() => import("@/components/tools/CSPSandboxTool"), { ssr: false }),
  DefensiveCodeLabTool: dynamic(() => import("@/components/tools/DefensiveCodeLabTool"), { ssr: false }),
  OAuthFlowAnimatorTool: dynamic(() => import("@/components/tools/OAuthFlowAnimatorTool"), { ssr: false }),
  GraphQLExplorerTool: dynamic(() => import("@/components/tools/GraphQLExplorerTool"), { ssr: false }),
  JWTAnatomyTool: dynamic(() => import("@/components/tools/JWTAnatomyTool"), { ssr: false }),
  RateLimiterTool: dynamic(() => import("@/components/tools/RateLimiterTool"), { ssr: false }),
  ApiDiffTool: dynamic(() => import("@/components/tools/ApiDiffTool"), { ssr: false }),
};

export function ToolRenderer({ toolComponent }: { toolComponent: string }) {
  const Tool = TOOLS[toolComponent];
  if (!Tool) return null;
  return <Tool />;
}
