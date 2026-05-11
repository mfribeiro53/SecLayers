# SecLayers — Product Plan (Revised)

## Overview

**SecLayers** is an interactive, visual Application Security learning platform modeled on the same architecture as Foundry (this LLM app). Topics are grouped by **security domain** across 7 Acts (Foundations, Web, API, Mobile, Systems, Cloud, Supply Chain) and presented as 41 numbered chapters, each with an interactive tool, real exploit demos, KaTeX-rendered theory, interview/exam mode, and misconception cards.

---

## 1. Topic Taxonomy (Acts → Chapters)

### Foundations — Secure Design & Core Concepts (color: slate)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 1 | Threat Modeling with STRIDE | Interactive DFD builder — drag trust boundaries, data flows, external entities; auto-generate threat list |
| 2 | Cryptography for Developers | Crypto playground — encrypt/decrypt with different algorithms, see ciphertext properties; ECB penguin demo; timing side-channel visualizer |
| 3 | Input Validation & Output Encoding | Encoding sandbox — type input, choose context (HTML/JS/CSS/URL/SQL/shell), see correct encoding side-by-side with dangerous shortcuts |
| 4 | The Secure SDLC | SDLC timeline — drag security activities into phases; see coverage gaps |

### Act I — Web Security (color: blue)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 5 | SQL Injection | Live query sandbox — type input, watch the injected SQL execute |
| 6 | XSS (Cross-Site Scripting) | DOM visualizer showing reflected vs stored vs DOM-based XSS |
| 7 | CSRF & SameSite | Request forger simulator with cookie policy toggles |
| 8 | Authentication & Session Management | JWT decoder/editor; session fixation demo |
| 9 | IDOR & Access Control | Object reference explorer — toggle roles, watch what leaks |
| 10 | SSRF | Request proxy visualizer — internal network map |
| 11 | HTTP Security Headers | Live header grader against a sample response |
| 12 | Content Security Policy | CSP sandbox — write a policy, test what it blocks |
| 13 | Defensive Coding Patterns | Code snippet lab — vulnerable snippet presented, student selects the correct fix; covers parameterization, output encoding, auth middleware, safe file I/O |

### Act II — API Security (color: violet)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 14 | REST API Auth (OAuth, PKCE) | OAuth flow animator |
| 15 | GraphQL Security | Introspection query explorer; batching attack demo |
| 16 | JWT Deep Dive | JWT anatomy tool — decode, tamper, verify |
| 17 | Rate Limiting & Abuse | Token bucket / leaky bucket simulator |
| 18 | API Versioning & Info Leakage | Header diff tool across API versions |

### Act III — Mobile Security (color: emerald)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 19 | Insecure Data Storage | File system explorer — show what ends up in plaintext |
| 20 | Insecure Communication | TLS handshake visualizer; cert pinning toggle |
| 21 | Reverse Engineering & Tampering | APK/IPA structure explorer |
| 22 | Biometric & Credential Security | Auth bypass decision tree |
| 23 | Deep Links & Intent Hijacking | Intent router simulator (Android) |

### Act IV — Systems / Native (color: orange)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 24 | Memory Layout & Stack | Interactive stack frame — push/pop, visualize return address |
| 25 | Buffer Overflows | Overflow animator — watch the return address get overwritten |
| 26 | Format String Bugs | Printf simulator — arbitrary read/write demo |
| 27 | Use-After-Free & Heap | Heap allocator visualizer |
| 28 | Mitigations (ASLR, NX, Stack Canaries) | Toggle mitigations, see attack feasibility score change |
| 29 | Race Conditions & TOCTOU | Thread timeline simulator |

### Act V — Cloud & Infrastructure (color: rose)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 30 | IAM & Least Privilege | Policy simulator — attach/detach policies, see blast radius |
| 31 | Misconfigured S3 / Storage | Bucket ACL configurator with leak indicator |
| 32 | Container Security | Dockerfile linter + capability drop visualizer |
| 33 | Kubernetes RBAC | RBAC role builder + privilege escalation paths |
| 34 | Secrets Management | Secret sprawl visualizer — hardcoded vs vault |
| 35 | Infrastructure as Code Security | Terraform snippet scanner |
| 36 | Logging, Monitoring & IR | Log injector simulator — inject malicious payloads; SIEM alert rule builder; incident timeline exercise |

### Act VI — Supply Chain & Software Integrity (color: cyan)

| # | Title | Interactive Tool |
|---|-------|-----------------|
| 37 | Dependency Confusion & Typosquatting | Package resolver simulator |
| 38 | SCA & CVE Triage | SBOM explorer — dependency tree with CVE overlay |
| 39 | CI/CD Pipeline Security | Pipeline DAG — inject a malicious step, watch propagation |
| 40 | Code Signing & SLSA | Provenance chain visualizer |
| 41 | Security Testing & Tooling | Interactive SAST rule builder — write a Semgrep-style rule, test against vulnerable/clean snippets; Burp/ZAP walkthrough |

---

## 2. Feature List

| Feature | Description |
|---------|-------------|
| **Interactive Tools** | Every chapter has a browser-based interactive tool (Pyodide/WASM for Phase 1, Docker-backed for Phase 2+ labs) |
| **MDX Content** | Theory prose with embedded KaTeX (`$...$` inline, `$$...$$` block) and shortcode components |
| **Misconception Cards** | Callout boxes with common myths vs reality — per chapter |
| **Interview Mode** | Per-chapter Q&A (junior/mid/senior) in accordion format |
| **Exam Mode** | 40-question randomized draw (Phase 1), structured code-review assessment (Phase 3) |
| **Glossary** | 120+ AppSec terms with definitions, related topics, and act tags |
| **OWASP Crosswalk** | Mapping to OWASP Top 10 / MASVS / ASVS (Phase 2) |
| **CTF Labs** | Phase 1: client-side mock labs (Act I + II). Phase 2: Docker-backed real exploitation labs per Act |
| **Cheat Sheets** | Per-Act printable reference sheets (Phase 2) |
| **Depth Toggle** | Beginner (guided demos) vs Advanced (raw exploits, CVE deep-dives, architecture review exercises) — Phase 2 |
| **Progress Persistence** | localStorage-based chapter completion, exam scores, last-visited (Phase 2) |
| **User Accounts** | Supabase-backed accounts + cloud progress sync (Phase 3) |
| **Community** | Moderated user-submitted misconception cards (Phase 3) |

---

## 3. Directory Structure

```
SecLayer/
├── app/
│   ├── layout.tsx                  # Root layout + providers (theme, progress context)
│   ├── page.tsx                    # Home — Act grid, chapter listing
│   ├── globals.css                 # Tailwind directives + act color CSS variables
│   ├── [slug]/page.tsx             # Chapter page (dynamic route)
│   ├── glossary/page.tsx           # Glossary with search + filter by Act
│   ├── exam/page.tsx               # 40-question randomized exam
│   ├── owasp-map/page.tsx          # OWASP crosswalk (Phase 2)
│   └── labs/[slug]/page.tsx        # CTF labs (Phase 2+)
├── components/
│   ├── layout/
│   │   ├── ChapterShell.tsx        # Act-colored header, prev/next, misconception, interview
│   │   └── Navbar.tsx              # Global nav
│   ├── tools/                      # One per chapter (e.g. SQLiSandbox.tsx, JWTEditor.tsx)
│   │   ├── DfdBuilderTool.tsx
│   │   ├── CryptoPlaygroundTool.tsx
│   │   ├── EncodingSandboxTool.tsx
│   │   ├── SdlcTimelineTool.tsx
│   │   ├── SQLiSandboxTool.tsx
│   │   ├── DOMXSSVisualizerTool.tsx
│   │   ├── CsrfSimulatorTool.tsx
│   │   ├── JWTEditorTool.tsx
│   │   ├── IdorExplorerTool.tsx
│   │   ├── SsrfVisualizerTool.tsx
│   │   ├── HeaderGraderTool.tsx
│   │   ├── CSPSandboxTool.tsx
│   │   ├── DefensiveCodeLabTool.tsx
│   │   ├── OAuthFlowAnimatorTool.tsx
│   │   ├── GraphQLExplorerTool.tsx
│   │   ├── JWTAnatomyTool.tsx
│   │   ├── RateLimiterTool.tsx
│   │   └── ApiDiffTool.tsx
│   ├── ui/                         # Shared primitives
│   │   ├── ActBadge.tsx            # Colored act label badge
│   │   ├── MisconceptionCard.tsx   # Myth vs reality callout
│   │   ├── InterviewCard.tsx       # Q&A accordion
│   │   ├── KaTeX.tsx              # Math rendering wrapper
│   │   └── ToolShell.tsx          # Tool wrapper (title, description, responsive container)
│   └── stages/                    # Per-chapter prose + tool composition (Phase 1)
│       └── Ch01ThreatModeling.tsx
├── lib/
│   ├── topics.ts                  # TOPICS array (41 entries) + ACT_COLORS + ACT_LABELS
│   ├── progress.ts                # localStorage progress persistence
│   └── utils.ts                   # Shared helpers
├── content/
│   ├── glossary.json              # 120+ AppSec terms
│   ├── interview/                 # Per-chapter interview Q&A JSON
│   │   ├── threat-modeling.json
│   │   ├── sql-injection.json
│   │   └── ...
│   └── chapters/                  # MDX chapter content
│       ├── threat-modeling.mdx
│       ├── sql-injection.mdx
│       └── ...
├── types/
│   └── index.ts                   # Shared TypeScript types
├── public/
│   └── (static assets)
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── postcss.config.js
```

---

## 4. Data Model (`lib/topics.ts`)

```typescript
export interface Topic {
  num: number;
  act: number;
  title: string;
  slug: string;
  actLabel: string;
  toolComponent: string;
  tags: string[];
}

export const TOPICS: Topic[] = [
  // Foundations (act 1)
  { num: 1,  act: 1, title: "Threat Modeling with STRIDE",   slug: "threat-modeling",     actLabel: "Foundations",                  toolComponent: "DfdBuilderTool",       tags: ["stride", "design"] },
  { num: 2,  act: 1, title: "Cryptography for Developers",   slug: "cryptography",        actLabel: "Foundations",                  toolComponent: "CryptoPlaygroundTool",  tags: ["crypto", "hashing", "aead"] },
  { num: 3,  act: 1, title: "Input Validation & Encoding",   slug: "input-validation",    actLabel: "Foundations",                  toolComponent: "EncodingSandboxTool",   tags: ["validation", "encoding"] },
  { num: 4,  act: 1, title: "The Secure SDLC",               slug: "secure-sdlc",         actLabel: "Foundations",                  toolComponent: "SdlcTimelineTool",      tags: ["sdlc", "shift-left"] },

  // Act I — Web Security (act 2)
  { num: 5,  act: 2, title: "SQL Injection",                 slug: "sql-injection",       actLabel: "Act I — Web Security",         toolComponent: "SQLiSandboxTool",         tags: ["injection", "owasp-a03"] },
  { num: 6,  act: 2, title: "XSS (Cross-Site Scripting)",    slug: "xss",                 actLabel: "Act I — Web Security",         toolComponent: "DOMXSSVisualizerTool",    tags: ["xss", "owasp-a03"] },
  { num: 7,  act: 2, title: "CSRF & SameSite",               slug: "csrf",                actLabel: "Act I — Web Security",         toolComponent: "CsrfSimulatorTool",       tags: ["csrf", "owasp-a01"] },
  { num: 8,  act: 2, title: "Auth & Session Management",     slug: "auth-sessions",       actLabel: "Act I — Web Security",         toolComponent: "JWTEditorTool",           tags: ["auth", "owasp-a07"] },
  { num: 9,  act: 2, title: "IDOR & Access Control",         slug: "idor",                actLabel: "Act I — Web Security",         toolComponent: "IdorExplorerTool",        tags: ["idor", "owasp-a01"] },
  { num: 10, act: 2, title: "SSRF",                          slug: "ssrf",                actLabel: "Act I — Web Security",         toolComponent: "SsrfVisualizerTool",      tags: ["ssrf", "owasp-a10"] },
  { num: 11, act: 2, title: "HTTP Security Headers",         slug: "security-headers",    actLabel: "Act I — Web Security",         toolComponent: "HeaderGraderTool",        tags: ["headers", "owasp-a05"] },
  { num: 12, act: 2, title: "Content Security Policy",       slug: "csp",                 actLabel: "Act I — Web Security",         toolComponent: "CSPSandboxTool",          tags: ["csp", "defense-in-depth"] },
  { num: 13, act: 2, title: "Defensive Coding Patterns",     slug: "defensive-patterns",  actLabel: "Act I — Web Security",         toolComponent: "DefensiveCodeLabTool",    tags: ["secure-coding", "fixes"] },

  // Act II — API Security (act 3)
  { num: 14, act: 3, title: "REST API Auth (OAuth, PKCE)",   slug: "api-auth",            actLabel: "Act II — API Security",        toolComponent: "OAuthFlowAnimatorTool",   tags: ["oauth", "pkce"] },
  { num: 15, act: 3, title: "GraphQL Security",              slug: "graphql",             actLabel: "Act II — API Security",        toolComponent: "GraphQLExplorerTool",     tags: ["graphql", "introspection"] },
  { num: 16, act: 3, title: "JWT Deep Dive",                 slug: "jwt",                 actLabel: "Act II — API Security",        toolComponent: "JWTAnatomyTool",          tags: ["jwt", "tokens"] },
  { num: 17, act: 3, title: "Rate Limiting & Abuse",         slug: "rate-limiting",       actLabel: "Act II — API Security",        toolComponent: "RateLimiterTool",         tags: ["rate-limit", "dos"] },
  { num: 18, act: 3, title: "API Versioning & Info Leakage", slug: "api-versioning",      actLabel: "Act II — API Security",        toolComponent: "ApiDiffTool",             tags: ["versioning", "info-leak"] },

  // Act III — Mobile Security (act 4)
  { num: 19, act: 4, title: "Insecure Data Storage",         slug: "mobile-storage",      actLabel: "Act III — Mobile Security",    toolComponent: "MobileFSExplorerTool",    tags: ["mobile", "storage"] },
  { num: 20, act: 4, title: "Insecure Communication",        slug: "mobile-tls",          actLabel: "Act III — Mobile Security",    toolComponent: "TLSVisualizerTool",       tags: ["mobile", "tls"] },
  { num: 21, act: 4, title: "Reverse Engineering & Tampering",slug: "mobile-reversing",   actLabel: "Act III — Mobile Security",    toolComponent: "APKExplorerTool",         tags: ["mobile", "reversing"] },
  { num: 22, act: 4, title: "Biometric & Credential Security",slug: "mobile-biometrics",  actLabel: "Act III — Mobile Security",    toolComponent: "AuthBypassTreeTool",      tags: ["mobile", "biometrics"] },
  { num: 23, act: 4, title: "Deep Links & Intent Hijacking", slug: "mobile-intents",      actLabel: "Act III — Mobile Security",    toolComponent: "IntentRouterTool",        tags: ["mobile", "android"] },

  // Act IV — Systems / Native (act 5)
  { num: 24, act: 5, title: "Memory Layout & Stack",         slug: "stack",               actLabel: "Act IV — Systems",             toolComponent: "StackFrameTool",          tags: ["binary", "memory"] },
  { num: 25, act: 5, title: "Buffer Overflows",              slug: "buffer-overflow",     actLabel: "Act IV — Systems",             toolComponent: "OverflowAnimatorTool",    tags: ["binary", "overflow"] },
  { num: 26, act: 5, title: "Format String Bugs",            slug: "format-string",       actLabel: "Act IV — Systems",             toolComponent: "PrintfSimulatorTool",     tags: ["binary", "format-string"] },
  { num: 27, act: 5, title: "Use-After-Free & Heap",         slug: "heap",                actLabel: "Act IV — Systems",             toolComponent: "HeapVisualizerTool",      tags: ["binary", "heap"] },
  { num: 28, act: 5, title: "Mitigations (ASLR, NX, Canaries)",slug: "mitigations",       actLabel: "Act IV — Systems",             toolComponent: "MitigationToggleTool",    tags: ["binary", "defense"] },
  { num: 29, act: 5, title: "Race Conditions & TOCTOU",      slug: "race-conditions",     actLabel: "Act IV — Systems",             toolComponent: "ThreadTimelineTool",      tags: ["binary", "concurrency"] },

  // Act V — Cloud & Infrastructure (act 6)
  { num: 30, act: 6, title: "IAM & Least Privilege",         slug: "iam",                 actLabel: "Act V — Cloud & Infrastructure", toolComponent: "IAMPolicySimulatorTool",  tags: ["cloud", "aws"] },
  { num: 31, act: 6, title: "Misconfigured Storage",         slug: "cloud-storage",       actLabel: "Act V — Cloud & Infrastructure", toolComponent: "BucketACLTool",            tags: ["cloud", "s3"] },
  { num: 32, act: 6, title: "Container Security",            slug: "containers",          actLabel: "Act V — Cloud & Infrastructure", toolComponent: "DockerfileLinterTool",    tags: ["cloud", "docker"] },
  { num: 33, act: 6, title: "Kubernetes RBAC",               slug: "k8s-rbac",            actLabel: "Act V — Cloud & Infrastructure", toolComponent: "K8sRBACBuilderTool",      tags: ["cloud", "kubernetes"] },
  { num: 34, act: 6, title: "Secrets Management",            slug: "secrets",             actLabel: "Act V — Cloud & Infrastructure", toolComponent: "SecretSprawlTool",        tags: ["cloud", "secrets"] },
  { num: 35, act: 6, title: "IaC Security",                  slug: "iac",                 actLabel: "Act V — Cloud & Infrastructure", toolComponent: "TerraformScannerTool",    tags: ["cloud", "terraform"] },
  { num: 36, act: 6, title: "Logging, Monitoring & IR",      slug: "logging-monitoring",  actLabel: "Act V — Cloud & Infrastructure", toolComponent: "LogInjectorTool",         tags: ["cloud", "siem", "incident-response"] },

  // Act VI — Supply Chain (act 7)
  { num: 37, act: 7, title: "Dependency Confusion",          slug: "dep-confusion",       actLabel: "Act VI — Supply Chain",        toolComponent: "DepResolverTool",         tags: ["supply-chain", "typosquatting"] },
  { num: 38, act: 7, title: "SCA & CVE Triage",              slug: "sca",                 actLabel: "Act VI — Supply Chain",        toolComponent: "SBOMExplorerTool",        tags: ["supply-chain", "cve"] },
  { num: 39, act: 7, title: "CI/CD Pipeline Security",       slug: "cicd",                actLabel: "Act VI — Supply Chain",        toolComponent: "PipelineDAGTool",         tags: ["supply-chain", "ci-cd"] },
  { num: 40, act: 7, title: "Code Signing & SLSA",           slug: "slsa",                actLabel: "Act VI — Supply Chain",        toolComponent: "ProvenanceChainTool",     tags: ["supply-chain", "slsa"] },
  { num: 41, act: 7, title: "Security Testing & Tooling",    slug: "sec-tooling",         actLabel: "Act VI — Supply Chain",        toolComponent: "SASTRuleBuilderTool",     tags: ["tooling", "sast", "dast"] },
] as const;

export const ACT_COLORS: Record<number, string> = {
  1: "slate",
  2: "blue",
  3: "violet",
  4: "emerald",
  5: "orange",
  6: "rose",
  7: "cyan",
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
```

---

## 5. Prioritised Build Roadmap

### Phase 1 — Foundations + Web + API (Chapters 1–18)

**Architecture:** Fully client-side. Next.js static export. Pyodide/WASM for tools. No backend.

Success criteria:
- [ ] Foundations (ch 1–4): DFD builder, crypto playground, encoding sandbox, SDLC timeline
- [ ] Act I (ch 5–13): 8 web attack chapters + defensive patterns synthesis
- [ ] Act II (ch 14–18): 5 API security chapters
- [ ] Glossary page (120+ terms)
- [ ] Exam mode (40-question randomized draw — 5 per act, weighted toward web/API)
- [ ] Act I CTF lab — client-side mock: find SQLi, XSS, CSRF, IDOR
- [ ] Act II CTF lab — client-side mock: broken API with auth bypass, introspection leak
- [ ] Deploy to Vercel

### Phase 2 — Mobile + Systems + Cloud + Full CTF Labs (Chapters 19–36)

**Architecture:** FastAPI backend added. Docker-backed stateful CTF labs.

Success criteria:
- [ ] Act III (ch 19–23): Mobile security
- [ ] Act IV (ch 24–29): Systems/native
- [ ] Act V (ch 30–36): Cloud + Logging/IR
- [ ] CTF lab per Act (Docker-backed, full exploitation)
- [ ] Cheat sheet pages per Act
- [ ] OWASP Top 10 / MASVS / ASVS crosswalk (`/owasp-map`)
- [ ] Progress persistence (localStorage)
- [ ] Beginner/advanced depth toggle

### Phase 3 — Supply Chain + Social + Enterprise (Chapters 37–41)

Success criteria:
- [ ] Act VI (ch 37–41): Supply chain + security tooling
- [ ] Act VI CTF lab
- [ ] User accounts + progress sync (Supabase)
- [ ] Community-submitted misconception cards (moderated)
- [ ] Structured assessment mode (code-review exercises, not just multiple choice)

---

## 6. Differentiation from Existing Resources

| Resource | Gap SecLayers fills |
|----------|-------------------|
| **OWASP** | Pure documentation — no interactivity, no visualizations |
| **PortSwigger Web Academy** | Excellent for web only; no mobile, systems, cloud, supply chain, or foundations |
| **HackTheBox / TryHackMe** | CTF-first, not concept-first; steep learning curve for developers; no secure coding patterns |
| **Secure Code Warrior** | Game-style, not referenceable; lacks theory depth |
| **SANS courses** | Prohibitive cost ($8k+); no interactive tools |

**SecLayers' edge:** Visual-first, domain-complete (7 domains in one platform), developer-friendly framing, defense-pattern focus (not just attacks), OWASP-mapped for compliance, proficiency track with CTF labs.

---

## 7. Architecture Notes

- **Next.js 14 App Router** — all content pages as server components; interactive tools as client components
- **MDX** — chapter prose in `content/chapters/*.mdx` compiled at build time via `@next/mdx`
- **KaTeX** — `remark-math` + `rehype-katex` plugins for math rendering
- **ChapterShell.tsx** — act-colored header, lazy-loaded tool, misconception card, interview accordion, prev/next nav
- **Pyodide/WASM** — Phase 1 tools run entirely in-browser (sql.js for SQLi sandbox, etc.)
- **FastAPI** — Phase 2 backend for stateful CTF labs with Docker sandboxing
- **Tailwind CSS** — act colors as CSS custom properties; responsive breakpoints for tool layouts
