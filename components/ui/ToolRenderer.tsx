"use client";

import dynamic from "next/dynamic";

// ── Dynamic tool imports (ssr: false prevents WASM/canvas hydration errors) ──
const TOOLS: Record<string, React.ComponentType> = {
  // Prologue
  KillChainPlannerTool: dynamic(() => import("@/components/tools/KillChainPlannerTool"), { ssr: false }),
  // Foundations
  DfdBuilderTool: dynamic(() => import("@/components/tools/DfdBuilderTool"), { ssr: false }),
  CryptoPlaygroundTool: dynamic(() => import("@/components/tools/CryptoPlaygroundTool"), { ssr: false }),
  EncodingSandboxTool: dynamic(() => import("@/components/tools/EncodingSandboxTool"), { ssr: false }),
  SdlcTimelineTool: dynamic(() => import("@/components/tools/SdlcTimelineTool"), { ssr: false }),
  // Act I — Web Security
  SQLiSandboxTool: dynamic(() => import("@/components/tools/SQLiSandboxTool"), { ssr: false }),
  DOMXSSVisualizerTool: dynamic(() => import("@/components/tools/DOMXSSVisualizerTool"), { ssr: false }),
  CsrfSimulatorTool: dynamic(() => import("@/components/tools/CsrfSimulatorTool"), { ssr: false }),
  JWTEditorTool: dynamic(() => import("@/components/tools/JWTEditorTool"), { ssr: false }),
  IdorExplorerTool: dynamic(() => import("@/components/tools/IdorExplorerTool"), { ssr: false }),
  SsrfVisualizerTool: dynamic(() => import("@/components/tools/SsrfVisualizerTool"), { ssr: false }),
  HeaderGraderTool: dynamic(() => import("@/components/tools/HeaderGraderTool"), { ssr: false }),
  CSPSandboxTool: dynamic(() => import("@/components/tools/CSPSandboxTool"), { ssr: false }),
  DefensiveCodeLabTool: dynamic(() => import("@/components/tools/DefensiveCodeLabTool"), { ssr: false }),
  // Act II — API Security
  OAuthFlowAnimatorTool: dynamic(() => import("@/components/tools/OAuthFlowAnimatorTool"), { ssr: false }),
  GraphQLExplorerTool: dynamic(() => import("@/components/tools/GraphQLExplorerTool"), { ssr: false }),
  JWTAnatomyTool: dynamic(() => import("@/components/tools/JWTAnatomyTool"), { ssr: false }),
  RateLimiterTool: dynamic(() => import("@/components/tools/RateLimiterTool"), { ssr: false }),
  ApiDiffTool: dynamic(() => import("@/components/tools/ApiDiffTool"), { ssr: false }),
  // Act III — Mobile Security
  MobileFSExplorerTool: dynamic(() => import("@/components/tools/MobileFSExplorerTool"), { ssr: false }),
  TLSVisualizerTool: dynamic(() => import("@/components/tools/TLSVisualizerTool"), { ssr: false }),
  APKExplorerTool: dynamic(() => import("@/components/tools/APKExplorerTool"), { ssr: false }),
  AuthBypassTreeTool: dynamic(() => import("@/components/tools/AuthBypassTreeTool"), { ssr: false }),
  IntentRouterTool: dynamic(() => import("@/components/tools/IntentRouterTool"), { ssr: false }),
  // Act IV — Systems / Native
  CodeAuditWorkflowTool: dynamic(() => import("@/components/tools/CodeAuditWorkflowTool"), { ssr: false }),
  StackFrameTool: dynamic(() => import("@/components/tools/StackFrameTool"), { ssr: false }),
  OverflowAnimatorTool: dynamic(() => import("@/components/tools/OverflowAnimatorTool"), { ssr: false }),
  PrintfSimulatorTool: dynamic(() => import("@/components/tools/PrintfSimulatorTool"), { ssr: false }),
  HeapVisualizerTool: dynamic(() => import("@/components/tools/HeapVisualizerTool"), { ssr: false }),
  MitigationToggleTool: dynamic(() => import("@/components/tools/MitigationToggleTool"), { ssr: false }),
  ThreadTimelineTool: dynamic(() => import("@/components/tools/ThreadTimelineTool"), { ssr: false }),
  // Act V — Cloud & Infrastructure
  IAMPolicySimulatorTool: dynamic(() => import("@/components/tools/IAMPolicySimulatorTool"), { ssr: false }),
  BucketACLTool: dynamic(() => import("@/components/tools/BucketACLTool"), { ssr: false }),
  DockerfileLinterTool: dynamic(() => import("@/components/tools/DockerfileLinterTool"), { ssr: false }),
  K8sRBACBuilderTool: dynamic(() => import("@/components/tools/K8sRBACBuilderTool"), { ssr: false }),
  SecretSprawlTool: dynamic(() => import("@/components/tools/SecretSprawlTool"), { ssr: false }),
  TerraformScannerTool: dynamic(() => import("@/components/tools/TerraformScannerTool"), { ssr: false }),
  LogInjectorTool: dynamic(() => import("@/components/tools/LogInjectorTool"), { ssr: false }),
  // Act VI — Supply Chain
  DepResolverTool: dynamic(() => import("@/components/tools/DepResolverTool"), { ssr: false }),
  SBOMExplorerTool: dynamic(() => import("@/components/tools/SBOMExplorerTool"), { ssr: false }),
  PipelineDAGTool: dynamic(() => import("@/components/tools/PipelineDAGTool"), { ssr: false }),
  ProvenanceChainTool: dynamic(() => import("@/components/tools/ProvenanceChainTool"), { ssr: false }),
  SASTRuleBuilderTool: dynamic(() => import("@/components/tools/SASTRuleBuilderTool"), { ssr: false }),
};

export function ToolRenderer({ toolComponent }: { toolComponent: string }) {
  const Tool = TOOLS[toolComponent];
  if (!Tool) return null;
  return <Tool />;
}
