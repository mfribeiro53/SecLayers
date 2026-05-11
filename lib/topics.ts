import type { Topic } from "@/types";

export type { Topic };

export const TOPICS: Topic[] = [
  // ── Foundations (act 1) ──────────────────────────────────
  { num: 1,  act: 1, title: "Threat Modeling with STRIDE",   slug: "threat-modeling",     actLabel: "Foundations",                  toolComponent: "DfdBuilderTool",       tags: ["stride", "design"] },
  { num: 2,  act: 1, title: "Cryptography for Developers",   slug: "cryptography",        actLabel: "Foundations",                  toolComponent: "CryptoPlaygroundTool",  tags: ["crypto", "hashing", "aead"] },
  { num: 3,  act: 1, title: "Input Validation & Encoding",   slug: "input-validation",    actLabel: "Foundations",                  toolComponent: "EncodingSandboxTool",   tags: ["validation", "encoding"] },
  { num: 4,  act: 1, title: "The Secure SDLC",               slug: "secure-sdlc",         actLabel: "Foundations",                  toolComponent: "SdlcTimelineTool",      tags: ["sdlc", "shift-left"] },

  // ── Act I — Web Security (act 2) ─────────────────────────
  { num: 5,  act: 2, title: "SQL Injection",                 slug: "sql-injection",       actLabel: "Act I — Web Security",         toolComponent: "SQLiSandboxTool",         tags: ["injection", "owasp-a03"] },
  { num: 6,  act: 2, title: "XSS (Cross-Site Scripting)",    slug: "xss",                 actLabel: "Act I — Web Security",         toolComponent: "DOMXSSVisualizerTool",    tags: ["xss", "owasp-a03"] },
  { num: 7,  act: 2, title: "CSRF & SameSite",               slug: "csrf",                actLabel: "Act I — Web Security",         toolComponent: "CsrfSimulatorTool",       tags: ["csrf", "owasp-a01"] },
  { num: 8,  act: 2, title: "Auth & Session Management",     slug: "auth-sessions",       actLabel: "Act I — Web Security",         toolComponent: "JWTEditorTool",           tags: ["auth", "owasp-a07"] },
  { num: 9,  act: 2, title: "IDOR & Access Control",         slug: "idor",                actLabel: "Act I — Web Security",         toolComponent: "IdorExplorerTool",        tags: ["idor", "owasp-a01"] },
  { num: 10, act: 2, title: "SSRF",                          slug: "ssrf",                actLabel: "Act I — Web Security",         toolComponent: "SsrfVisualizerTool",      tags: ["ssrf", "owasp-a10"] },
  { num: 11, act: 2, title: "HTTP Security Headers",         slug: "security-headers",    actLabel: "Act I — Web Security",         toolComponent: "HeaderGraderTool",        tags: ["headers", "owasp-a05"] },
  { num: 12, act: 2, title: "Content Security Policy",       slug: "csp",                 actLabel: "Act I — Web Security",         toolComponent: "CSPSandboxTool",          tags: ["csp", "defense-in-depth"] },
  { num: 13, act: 2, title: "Defensive Coding Patterns",     slug: "defensive-patterns",  actLabel: "Act I — Web Security",         toolComponent: "DefensiveCodeLabTool",    tags: ["secure-coding", "fixes"] },

  // ── Act II — API Security (act 3) ────────────────────────
  { num: 14, act: 3, title: "REST API Auth (OAuth, PKCE)",   slug: "api-auth",            actLabel: "Act II — API Security",        toolComponent: "OAuthFlowAnimatorTool",   tags: ["oauth", "pkce"] },
  { num: 15, act: 3, title: "GraphQL Security",              slug: "graphql",             actLabel: "Act II — API Security",        toolComponent: "GraphQLExplorerTool",     tags: ["graphql", "introspection"] },
  { num: 16, act: 3, title: "JWT Deep Dive",                 slug: "jwt",                 actLabel: "Act II — API Security",        toolComponent: "JWTAnatomyTool",          tags: ["jwt", "tokens"] },
  { num: 17, act: 3, title: "Rate Limiting & Abuse",         slug: "rate-limiting",       actLabel: "Act II — API Security",        toolComponent: "RateLimiterTool",         tags: ["rate-limit", "dos"] },
  { num: 18, act: 3, title: "API Versioning & Info Leakage", slug: "api-versioning",      actLabel: "Act II — API Security",        toolComponent: "ApiDiffTool",             tags: ["versioning", "info-leak"] },

  // ── Act III — Mobile Security (act 4) ────────────────────
  { num: 19, act: 4, title: "Insecure Data Storage",         slug: "mobile-storage",      actLabel: "Act III — Mobile Security",    toolComponent: "MobileFSExplorerTool",    tags: ["mobile", "storage"] },
  { num: 20, act: 4, title: "Insecure Communication",        slug: "mobile-tls",          actLabel: "Act III — Mobile Security",    toolComponent: "TLSVisualizerTool",       tags: ["mobile", "tls"] },
  { num: 21, act: 4, title: "Reverse Engineering & Tampering",slug: "mobile-reversing",   actLabel: "Act III — Mobile Security",    toolComponent: "APKExplorerTool",         tags: ["mobile", "reversing"] },
  { num: 22, act: 4, title: "Biometric & Credential Security",slug: "mobile-biometrics",  actLabel: "Act III — Mobile Security",    toolComponent: "AuthBypassTreeTool",      tags: ["mobile", "biometrics"] },
  { num: 23, act: 4, title: "Deep Links & Intent Hijacking", slug: "mobile-intents",      actLabel: "Act III — Mobile Security",    toolComponent: "IntentRouterTool",        tags: ["mobile", "android"] },

  // ── Act IV — Systems / Native (act 5) ────────────────────
  { num: 24, act: 5, title: "Memory Layout & Stack",         slug: "stack",               actLabel: "Act IV — Systems",             toolComponent: "StackFrameTool",          tags: ["binary", "memory"] },
  { num: 25, act: 5, title: "Buffer Overflows",              slug: "buffer-overflow",     actLabel: "Act IV — Systems",             toolComponent: "OverflowAnimatorTool",    tags: ["binary", "overflow"] },
  { num: 26, act: 5, title: "Format String Bugs",            slug: "format-string",       actLabel: "Act IV — Systems",             toolComponent: "PrintfSimulatorTool",     tags: ["binary", "format-string"] },
  { num: 27, act: 5, title: "Use-After-Free & Heap",         slug: "heap",                actLabel: "Act IV — Systems",             toolComponent: "HeapVisualizerTool",      tags: ["binary", "heap"] },
  { num: 28, act: 5, title: "Mitigations (ASLR, NX, Canaries)",slug: "mitigations",       actLabel: "Act IV — Systems",             toolComponent: "MitigationToggleTool",    tags: ["binary", "defense"] },
  { num: 29, act: 5, title: "Race Conditions & TOCTOU",      slug: "race-conditions",     actLabel: "Act IV — Systems",             toolComponent: "ThreadTimelineTool",      tags: ["binary", "concurrency"] },

  // ── Act V — Cloud & Infrastructure (act 6) ───────────────
  { num: 30, act: 6, title: "IAM & Least Privilege",         slug: "iam",                 actLabel: "Act V — Cloud & Infrastructure", toolComponent: "IAMPolicySimulatorTool",  tags: ["cloud", "aws"] },
  { num: 31, act: 6, title: "Misconfigured Storage",         slug: "cloud-storage",       actLabel: "Act V — Cloud & Infrastructure", toolComponent: "BucketACLTool",            tags: ["cloud", "s3"] },
  { num: 32, act: 6, title: "Container Security",            slug: "containers",          actLabel: "Act V — Cloud & Infrastructure", toolComponent: "DockerfileLinterTool",    tags: ["cloud", "docker"] },
  { num: 33, act: 6, title: "Kubernetes RBAC",               slug: "k8s-rbac",            actLabel: "Act V — Cloud & Infrastructure", toolComponent: "K8sRBACBuilderTool",      tags: ["cloud", "kubernetes"] },
  { num: 34, act: 6, title: "Secrets Management",            slug: "secrets",             actLabel: "Act V — Cloud & Infrastructure", toolComponent: "SecretSprawlTool",        tags: ["cloud", "secrets"] },
  { num: 35, act: 6, title: "IaC Security",                  slug: "iac",                 actLabel: "Act V — Cloud & Infrastructure", toolComponent: "TerraformScannerTool",    tags: ["cloud", "terraform"] },
  { num: 36, act: 6, title: "Logging, Monitoring & IR",      slug: "logging-monitoring",  actLabel: "Act V — Cloud & Infrastructure", toolComponent: "LogInjectorTool",         tags: ["cloud", "siem", "incident-response"] },

  // ── Act VI — Supply Chain (act 7) ────────────────────────
  { num: 37, act: 7, title: "Dependency Confusion",          slug: "dep-confusion",       actLabel: "Act VI — Supply Chain",        toolComponent: "DepResolverTool",         tags: ["supply-chain", "typosquatting"] },
  { num: 38, act: 7, title: "SCA & CVE Triage",              slug: "sca",                 actLabel: "Act VI — Supply Chain",        toolComponent: "SBOMExplorerTool",        tags: ["supply-chain", "cve"] },
  { num: 39, act: 7, title: "CI/CD Pipeline Security",       slug: "cicd",                actLabel: "Act VI — Supply Chain",        toolComponent: "PipelineDAGTool",         tags: ["supply-chain", "ci-cd"] },
  { num: 40, act: 7, title: "Code Signing & SLSA",           slug: "slsa",                actLabel: "Act VI — Supply Chain",        toolComponent: "ProvenanceChainTool",     tags: ["supply-chain", "slsa"] },
  { num: 41, act: 7, title: "Security Testing & Tooling",    slug: "sec-tooling",         actLabel: "Act VI — Supply Chain",        toolComponent: "SASTRuleBuilderTool",     tags: ["tooling", "sast", "dast"] },
] as const;

export const ACT_COLORS: Record<number, string> = {
  1: "foundations",
  2: "web",
  3: "api",
  4: "mobile",
  5: "systems",
  6: "cloud",
  7: "supply-chain",
};

// Tailwind-class color maps by act — matches CSS var palette
export const ACT_TEXT: Record<number, string> = {
  1: "text-slate-400",
  2: "text-blue-400",
  3: "text-violet-400",
  4: "text-emerald-400",
  5: "text-orange-400",
  6: "text-rose-400",
  7: "text-cyan-400",
};

export const ACT_BG: Record<number, string> = {
  1: "bg-slate-900/30",
  2: "bg-blue-900/30",
  3: "bg-violet-900/30",
  4: "bg-emerald-900/30",
  5: "bg-orange-900/30",
  6: "bg-rose-900/30",
  7: "bg-cyan-900/30",
};

export const ACT_BORDER: Record<number, string> = {
  1: "border-slate-500/40",
  2: "border-blue-500/40",
  3: "border-violet-500/40",
  4: "border-emerald-500/40",
  5: "border-orange-500/40",
  6: "border-rose-500/40",
  7: "border-cyan-500/40",
};

export const ACT_LABELS: Record<number, string> = {
  1: "Foundations",
  2: "Act I — Web Security",
  3: "Act II — API Security",
  4: "Act III — Mobile Security",
  5: "Act IV — Systems",
  6: "Act V — Cloud & Infrastructure",
  7: "Act VI — Supply Chain",
};

/** Look up a topic by its slug. */
export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

/** Get prev/next topics for navigation. */
export function getAdjacentTopics(slug: string): {
  current: Topic;
  prev: Topic | null;
  next: Topic | null;
} | null {
  const index = TOPICS.findIndex((t) => t.slug === slug);
  if (index === -1) return null;
  return {
    current: TOPICS[index],
    prev: index > 0 ? TOPICS[index - 1] : null,
    next: index < TOPICS.length - 1 ? TOPICS[index + 1] : null,
  };
}

/** Group topics by act number. */
export function groupTopicsByAct(): Record<number, Topic[]> {
  const groups: Record<number, Topic[]> = {};
  for (const topic of TOPICS) {
    if (!groups[topic.act]) groups[topic.act] = [];
    groups[topic.act].push(topic);
  }
  return groups;
}
