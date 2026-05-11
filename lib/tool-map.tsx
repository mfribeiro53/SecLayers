// Server-safe — no React imports, just the set of available tool keys.
export const TOOL_KEYS = new Set([
  // Foundations
  "DfdBuilderTool",
  "CryptoPlaygroundTool",
  "EncodingSandboxTool",
  "SdlcTimelineTool",
  // Act I — Web Security
  "SQLiSandboxTool",
  "DOMXSSVisualizerTool",
  "CsrfSimulatorTool",
  "JWTEditorTool",
  "IdorExplorerTool",
  "SsrfVisualizerTool",
  "HeaderGraderTool",
  "CSPSandboxTool",
  "DefensiveCodeLabTool",
  // Act II — API Security
  "OAuthFlowAnimatorTool",
  "GraphQLExplorerTool",
  "JWTAnatomyTool",
  "RateLimiterTool",
  "ApiDiffTool",
  // Act III — Mobile Security
  "MobileFSExplorerTool",
  "TLSVisualizerTool",
  "APKExplorerTool",
  "AuthBypassTreeTool",
  "IntentRouterTool",
  // Act IV — Systems / Native
  "StackFrameTool",
  "OverflowAnimatorTool",
  "PrintfSimulatorTool",
  "HeapVisualizerTool",
  "MitigationToggleTool",
  "ThreadTimelineTool",
  // Act V — Cloud & Infrastructure
  "IAMPolicySimulatorTool",
  "BucketACLTool",
  "DockerfileLinterTool",
  "K8sRBACBuilderTool",
  "SecretSprawlTool",
  "TerraformScannerTool",
  "LogInjectorTool",
  // Act VI — Supply Chain
  "DepResolverTool",
  "SBOMExplorerTool",
  "PipelineDAGTool",
  "ProvenanceChainTool",
  "SASTRuleBuilderTool",
]);

