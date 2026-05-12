# SecLayer Codebase Evaluation

Date: 2026-05-11

---

## What's well done

### Architecture is clean and disciplined
The project uses Next.js 14 App Router correctly — server components for chapter pages (`app/[slug]/page.tsx` reads MDX from disk at request time), client components gated behind `"use client"` for interactive tools, and `dynamic(() => import(...), { ssr: false })` in `ToolRenderer` for WASM-dependent tools. The server/client boundary is respected throughout.

### Component composition is well layered
- `ChapterShell` wraps every chapter with consistent header, navigation, misconception card, and interview section.
- `ToolShell` wraps every interactive tool with a consistent header, description, and "IN-BROWSER" badge.
- `AppContext` provides lightweight global state (depth mode, interview toggle, completed topics, glossary panel) without over-engineering.

This is the right abstraction depth for the scope.

### TypeScript is used seriously
- `strict: true` in tsconfig.
- Centralized types in `types/index.ts` (`Topic`, `ChapterContent`, `InterviewQuestion`, `GlossaryEntry`, `ExamQuestion`, `UserProgress`).
- The `TOPICS` array uses `as const` for literal type inference.
- No `any` usage observed except for catch blocks.
- Path aliases (`@/*`) keep imports clean.

### Content quality is high
The SQL injection MDX chapter is accurate, comprehensive (in-band, blind, out-of-band, second-order, ORM caveats, multi-language code examples), and avoids the "just use an ORM" oversimplification common in security education. Interview questions are properly leveled (junior/mid/senior) with detailed answers. The 120-term glossary has act-tagged cross-references.

### The SQLi sandbox is real
It spins up sql.js WASM, creates an actual in-memory SQLite database with `users`, `products`, and `orders` tables, then runs user input through a *vulnerable* string-concatenation query vs a *safe* parameterized query side-by-side. This is the gold-standard tool — the attack actually executes against a real database engine, not a regex simulation.

### Consistent dark theme
CSS custom properties (`--bg-page`, `--text-primary`, `--accent`, `--act-web`, etc.) applied everywhere via inline styles. No Tailwind color class leakage into the rendered UI — the theme is fully controllable from `globals.css`.

### Static generation coverage
`generateStaticParams()` on both chapter pages and tool pages means all 41 chapters pre-render. Good for SEO and load performance.

### Error boundaries exist
`error.tsx` with reset, `not-found.tsx`, and try/catch on `fs.readFileSync` in the chapter loader.

---

## Gaps and issues

### 1. Many tools are simulation-only or missing key features from the plan
The CSPSandbox evaluates policies against hardcoded logic — it doesn't actually enforce CSP. The CryptoPlayground does SHA-256 and AES-GCM but lacks the ECB penguin demo and multi-algorithm comparison the plan describes. The DfdBuilder is a flat list of labeled elements — no canvas, no drag-and-drop, no visual trust boundaries. This pattern likely repeats across the toolset.

### 2. Misconception data is hardcoded to a placeholder
In `loadChapterData()`:

```typescript
const misconception = {
  myth: "A common myth about this topic will appear here.",
  reality: "The corrected reality will be explained with evidence."
};
```

This is returned for *every* chapter regardless of MDX content. The SQL injection MDX has a real misconception section at the bottom, but `ChapterShell` renders the hardcoded placeholder from `loadChapterData`, not the MDX content. Every chapter shows the same placeholder text under "Common Misconception."

### 3. `fs.readFileSync` in a server component
The chapter page uses synchronous file reads:

```typescript
source = fs.readFileSync(mdxPath, "utf8");
```

This blocks the Node.js event loop. Should use `fs.promises.readFile`. For a static site (everything is pre-rendered), the practical impact is minimal, but it's a code smell.

### 4. No `generateMetadata` on chapter pages
The tool page exports it; the chapter page doesn't. This means chapter pages have no unique `<title>` or `<meta description>` — all 41 chapters share the layout default.

### 5. `globals.css` has ~150 lines of `!important` overrides
The `.tool-surface` section forces dark-theme colors onto Tailwind's default light-mode utility classes (`bg-red-50`, `text-slate-700`, etc.) used inside tool components. This is a symptom: tool components use Tailwind light-mode classes (because they were written against a light background), then the CSS overrides them for the dark theme. The tools should use CSS custom properties instead of Tailwind color classes so the overrides aren't necessary.

### 6. The tool registry is maintained in three places
Adding a tool requires edits to:
- `components/tools/NewTool.tsx` (the implementation)
- `lib/tool-map.tsx` (the `TOOL_KEYS` Set)
- `components/ui/ToolRenderer.tsx` (the dynamic import map)

These are not mechanically checked against each other. A typo in one produces a silent failure.

### 7. `lib/tool-meta.ts` is 55KB
A single file with metadata for all 41 tools. It works but will become unwieldy. Splitting per-act would help.

### 8. No tests anywhere
No `__tests__/`, no Jest/Vitest config, no test script. The SQLi tool (which runs a real database) and the JWT editor (which does encoding/decoding) would benefit most from unit tests. The tool-meta and topics data would benefit from snapshot or validation tests to catch regressions.

### 9. The exam questions are inlined in the page component
`app/exam/page.tsx` contains a 40+ question array directly in the component body. This should be a separate JSON file alongside the interview questions.

### 10. The plan describes features that aren't implemented
CTF labs (`app/labs/[slug]` exists but is empty), Pyodide/WASM Python (only sql.js is used), ECB penguin demo, timing side-channel visualizer, cheat sheets, OWASP crosswalk, user accounts + Supabase, and cheat sheet pages are all planned but absent.

### 11. No security headers on the app itself
The app teaches CSP and security headers but doesn't set them on its own responses. No `helmet` middleware, no `Content-Security-Policy` header, no `next.config.js` security header configuration visible.

### 12. Accessibility is absent
No ARIA attributes, no focus management, no keyboard navigation for the sidebar collapse/expand, no screen-reader labels on the progress bar or tool controls. The interview card and glossary panel (which appear as overlays/modals) likely have no focus trapping.

### 13. No loading skeletons
No `loading.tsx` files. The SQLi tool shows "Loading SQL engine (WASM)..." inline, but there's no Suspense boundary or skeleton UI for MDX content loading.

---

## Summary

The codebase is **well-structured for its current phase** (Phase 1 — static content + client-side tools). The architecture decisions (server components for content, dynamic imports for WASM tools, CSS custom properties for theming, React Context for lightweight state) are appropriate and consistently applied. The MDX content and interview questions show real domain expertise.

The gaps are primarily in **completeness** (placeholder misconception data, tools that simulate rather than demonstrate, unimplemented plan features) and **polish** (no tests, no metadata, CSS override hack, synchronous file I/O, no accessibility). These are typical for a solo-developed educational platform moving through early phases — none are architectural dead ends.

### Highest-impact fixes (in order)
1. Wire misconception data to read from MDX frontmatter or a separate JSON file — the placeholder currently sits on every chapter.
2. Export `generateMetadata` on chapter pages for SEO.
3. Extract exam questions from `app/exam/page.tsx` into `content/exam-questions.json`.
4. Split `lib/tool-meta.ts` into per-act files.
5. Replace `fs.readFileSync` with `fs.promises.readFile` in the chapter loader.
6. Add a test suite (Vitest) covering at minimum the JWT utilities, SQLi query builder, and data integrity checks.
7. Replace Tailwind light-mode color classes in tool components with CSS custom property references to eliminate the `.tool-surface` `!important` override block.

---

## Making tools real: Library and API proposals

Context: Phase 1 is fully client-side. Every "real" engine must run in-browser via WASM or pure JS. Below is a tool-by-tool assessment of what libraries can replace simulation with actual execution.

---

### Already in place (no change needed)

| Tool | Engine | Status |
|------|--------|--------|
| SQLiSandbox | **sql.js** (SQLite WASM) | Real — queries execute against a live in-memory database |
| CryptoPlayground | **Web Crypto API** (browser-native) | Real — AES-GCM and SHA-256 via `crypto.subtle` |

---

### High-impact libraries, ready to integrate

#### 1. Pyodide — Python 3.12 in WASM
**npm:** `pyodide` (one 8MB WASM binary, loaded once and shared across tools)
**The plan already calls for this.** It unlocks real execution across multiple tools:

| Tool | What Pyodide enables |
|------|---------------------|
| **CryptoPlayground** | **Supplement, don't replace** the existing Web Crypto API implementation. AES-GCM and SHA-256 via `crypto.subtle` are already real cryptography — rewriting them in Python adds complexity without adding correctness. Use Pyodide for what Web Crypto can't do: MD5/SHA-1 (deprecated, not in `crypto.subtle`), bcrypt/Argon2 cost factor demos, the ECB penguin demo (encrypt a BMP with ECB in Python, render the output), and timing side-channels via `time.perf_counter()`. |
| **EncodingSandbox** | Real `html.escape()`, `urllib.parse.quote()`, `json.dumps()`, `base64` — no hand-rolled JS encoders that miss edge cases |
| **DefensiveCodeLab** | Run student code submissions in sandboxed Python. Validate whether their fix passes predefined test cases |
| **TerraformScanner** | Run `hcl2` parser or `checkov` rules against HCL snippets |
| **SASTRuleBuilder** | Run actual `semgrep`-style pattern matching against code snippets |
| **DepResolver** | Resolve real `requirements.txt` / `Pipfile` dependency trees |

**Integration approach:**
- Create a shared `lib/pyodide-context.ts` that lazily initializes Pyodide once
- Each tool imports the shared context and executes Python strings
- Output capture via `pyodide.setStdout()` → React state
- Security: Pyodide runs in the browser's WASM sandbox — no filesystem or network access unless explicitly configured

#### 2. `jose` — Real JWT signing and verification
**npm:** `jose`
**Replaces:** Hand-rolled `base64UrlEncode` / `buildJWT` in JWTEditor and JWTAnatomy

| Tool | What `jose` enables |
|------|---------------------|
| **JWTEditor** | Actually sign JWTs with HS256/RS256/ES256. Verify signatures. Generate key pairs. Show that tampered payloads fail verification. `alg: none` detection by attempting real verification |
| **JWTAnatomy** | Decode and inspect real JWT internals. Show header claims, verify expiration, validate audience/issuer |

**Impact:** One afternoon of work. The "aha" moment when a student modifies a JWT payload and sees `Signature verification failed` is the core pedagogical value.

#### 3. React Flow — Canvas-based diagramming
**npm:** `@xyflow/react`
**Replaces:** Flat lists of labeled elements in DfdBuilder, PipelineDAG, and others

| Tool | What React Flow enables |
|------|------------------------|
| **DfdBuilder** | Drag entities, processes, data stores, and trust boundaries onto a real canvas. Draw directed arrows between them. Highlight trust boundary crossings. Auto-generate STRIDE threats per crossing |
| **PipelineDAG** | Visualize CI/CD stages as connected nodes. Each stage expands with attack vectors on click |
| **ThreadTimeline** | Timeline visualization of concurrent thread execution with race windows highlighted |
| **OAuthFlowAnimator** | Animated sequence diagram: Resource Owner → Client → Auth Server → Resource Server |
| **AuthBypassTree** | Decision tree visualization for biometric/auth bypass paths |
| **ProvenanceChain** | Chain-of-custody with verified attestation links between stages |

React Flow handles zoom, pan, minimap, edge routing, custom node rendering, and drag-and-drop — the hard parts.

#### 4. DOMPurify — Real XSS sanitization
**npm:** `dompurify`
**Replaces:** Hardcoded "allowed/blocked" logic in DOMXSSVisualizer and defensive tools

| Tool | What DOMPurify enables |
|------|------------------------|
| **DOMXSSVisualizer** | Show what `innerHTML` does vs `textContent` vs `DOMPurify.sanitize()`. Render the actual DOM output of each. Demonstrate nested context handling |
| **DefensiveCodeLab** | Let users write sanitization code. Test their output against DOMPurify. Show differences between manual regex sanitizers and a real HTML-aware sanitizer |

---

### Medium-impact, domain-specific libraries

#### GraphQL.js — Real GraphQL engine
**npm:** `graphql`
**For:** GraphQLExplorer

- Build a real GraphQL schema programmatically
- Execute introspection queries — show exactly what `__schema` reveals
- Demonstrate query complexity analysis (batching attacks)
- Implement field-level authorization resolvers that leak data when misconfigured

#### OPA WASM — Real policy evaluation
**npm:** `@open-policy-agent/opa-wasm`
**For:** IAMPolicySimulator

- Compile Rego policies to WASM
- Evaluate "can user X perform action Y on resource Z" with a real policy engine
- Show blast radius: which resources become accessible when you add `*` to a policy
- Same engine AWS IAM Access Analyzer uses internally

#### Dockerfile AST — Real Dockerfile parsing
**npm:** `dockerfile-ast`
**For:** DockerfileLinter

- Parse a real Dockerfile into an AST
- Detect `FROM latest` (non-deterministic builds), `USER root`, exposed secrets in `ENV`, missing healthchecks, multi-stage build gaps
- Rules run against the actual parsed structure, not regex

#### CycloneDX SBOM — Real SBOM parsing
**npm:** `@cyclonedx/cyclonedx-library`
**For:** SBOMExplorer

- Parse real CycloneDX JSON/XML SBOMs
- Cross-reference components against the OSV.dev API (public JSON endpoint, fetchable from browser)
- Build transitive dependency graphs
- Show CVE severity scores and fix versions

#### Config parsers — HCL + YAML
**npm:** `hcl2-parser`, `js-yaml`
**For:** TerraformScanner, K8sRBACBuilder

- Parse real HCL (Terraform) and YAML (Kubernetes manifests) into ASTs
- Run policy checks: flag `*` verbs, overly permissive roles, public buckets, unencrypted resources
- Show the actual resource that violates the policy with line numbers

---

### Specialized WASM modules (higher effort, lower priority)

#### Capstone.js — Real disassembly
**npm:** `capstone` (compiled to WASM via Emscripten)
**For:** StackFrameTool, OverflowAnimator, HeapVisualizer

- Show actual x86/ARM instructions for a given binary blob
- Visualize stack frames with real register state
- ~5MB WASM binary. Worth it only if Systems act (Ch 24-29) is a priority

#### quickjs-emscripten — Sandboxed JavaScript
**npm:** `quickjs-emscripten`
**For:** CSPSandbox, DOMXSSVisualizer

- Run untrusted code in a sandboxed JS interpreter
- Test whether a given CSP policy blocks a given script by executing in the sandbox
- Execute XSS payloads in isolation and observe side effects

---

### Low-effort, high-value wins

| Tool | Library / Data | What it does |
|------|---------------|-------------|
| **HeaderGrader** | Mozilla Observatory dataset (public JSON) | Grade against 12+ real security headers with recommended values. No hardcoded thresholds |
| **RateLimiter** | No library — pure algorithm | Token bucket math is ~20 lines. Make it real by driving it with `performance.now()` and showing actual request timing |
| **API Diff** | `openapi-diff` (npm) | Compare two OpenAPI specs. Show added/removed/changed endpoints, parameters, schemas |
| **TLSVisualizer** | `@peculiar/x509` (npm) | Parse real X.509 certificates. Show chain validation. Flag expired, mismatched, or self-signed certs |
| **SecretSprawl** | Yelp `detect-secrets` regex patterns | Port the high-entropy detection regexes. Scan strings/files for AWS keys, GitHub tokens, JWT secrets |
| **CsrfSimulator** | No library — pure logic | Already conceptually real (SameSite cookie simulation). Could add actual `fetch` with different `credentials` modes to demonstrate browser behavior |
| **IdorExplorer** | No library — pure logic | Already real (shows role-based data visibility). Could add incremental ID enumeration simulation with response timing |

---

### Priority sequencing

The highest leverage is adding the fewest dependencies that upgrade the most tools:

1. **Pyodide** — one WASM binary, upgrades 6+ tools from simulation to real execution. The plan already calls for it. ~8MB payload, shared across tools.
2. **`jose`** — one afternoon of work. Two JWT tools go from fake base64 manipulation to real cryptographic operations. The pedagogical value is immediate.
3. **React Flow** — upgrades every diagram-based tool from flat lists to interactive canvases. The visual gap is the most obvious to users visiting the DFD builder or pipeline visualizer.
4. **DOMPurify** — cheap, makes the XSS visualizer demonstrate real sanitization vs raw injection with actual DOM output.
5. **OPA WASM** — makes IAMPolicySimulator evaluate real Rego policies. Closes the gap between "toy simulator" and "this is how AWS actually works."
6. **GraphQL.js** — makes GraphQLExplorer a real introspection engine, not a mock.
7. **CycloneDX + OSV API** — makes SBOMExplorer parse real SBOMs and cross-reference live CVE data.
8. **Config parsers** (HCL + YAML) — makes TerraformScanner and K8sRBACBuilder parse real configs.
9. **Capstone.js + quickjs** — lower priority. Only if Systems act becomes a focus.

### Architectural note

With Pyodide and multiple WASM modules, the `ToolRenderer` dynamic import pattern already handles lazy loading well. The key addition would be a shared WASM initialization layer:

```
lib/
  wasm-context.ts       ← single entry point, manages Pyodide init, exposes to all tools
  tool-map.tsx           ← existing
  tool-meta.ts           ← existing (needs splitting)
  topics.ts              ← existing
```

Each tool imports `wasm-context.ts` and calls `getPyodide()` — if already initialized, returns immediately. If not, initializes, caches, and returns.

---

## Pyodide integration spec

### Architecture overview

Pyodide is a single 8MB WASM binary loaded once and shared across independently-rendered tools. Each tool needs its own captured stdout/stderr, and some tools need `micropip`-installed packages. This must work within Next.js SSR constraints where WASM doesn't exist at build time.

```
lib/pyodide-context.ts    ← singleton: init, cache, expose
lib/use-pyodide.ts        ← React hook per tool
components/tools/...      ← tools consume the hook
```

---

### `lib/pyodide-context.ts` — singleton module

Pure module, no React. Responsibilities: lazy-init Pyodide, cache the promise, track installed packages, expose `isReady()`.

```typescript
// lib/pyodide-context.ts
import type { PyodideInterface } from "pyodide";

let pyodidePromise: Promise<PyodideInterface> | null = null;
let installedPackages = new Set<string>();

export async function getPyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = (async () => {
    // Dynamic import — pyodide is browser-only, must not bundle server-side
    const { loadPyodide } = await import("pyodide");
    const pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    await pyodide.loadPackage("micropip");
    return pyodide;
  })();

  return pyodidePromise;
}

export async function installPackages(names: string[]): Promise<void> {
  const pyodide = await getPyodide();
  const toInstall = names.filter((n) => !installedPackages.has(n));
  if (toInstall.length === 0) return;

  const micropip = pyodide.pyimport("micropip");
  await micropip.install(toInstall);
  for (const n of toInstall) installedPackages.add(n);
}

export function isReady(): boolean {
  return pyodidePromise !== null;
}
```

Key decisions:
- `import("pyodide")` is dynamic — prevents Next.js from bundling it server-side.
- `indexURL` points to jsDelivr CDN — the WASM binary is a runtime fetch, not part of the app bundle. Browser HTTP cache handles subsequent visits.
- `micropip` is loaded first so individual tools can request Python packages without coordinating.

---

### `lib/use-pyodide.ts` — React hook

Manages per-tool stdout/stderr capture, async init lifecycle, and exposes a `runPython` function. Each tool gets its own capture scope — two tools mounted simultaneously won't mix output.

```typescript
// lib/use-pyodide.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getPyodide, installPackages } from "@/lib/pyodide-context";
import type { PyodideInterface } from "pyodide";

interface UsePyodideOptions {
  packages?: string[];        // e.g. ["cryptography", "hashlib"]
  autoInit?: boolean;         // default true
}

interface UsePyodideResult {
  pyodide: PyodideInterface | null;
  stdout: string;
  stderr: string;
  runPython: (code: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export function usePyodide(opts: UsePyodideOptions = {}): UsePyodideResult {
  const { packages = [], autoInit = true } = opts;
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stdoutRef = useRef("");
  const stderrRef = useRef("");

  useEffect(() => {
    if (!autoInit) return;
    let cancelled = false;

    async function init() {
      setIsLoading(true);
      setError(null);
      try {
        const p = await getPyodide();
        if (cancelled) return;

        // Per-tool stdout/stderr capture
        stdoutRef.current = "";
        stderrRef.current = "";
        p.setStdout({ batched: (text: string) => { stdoutRef.current += text + "\n"; } });
        p.setStderr({ batched: (text: string) => { stderrRef.current += text + "\n"; } });

        if (packages.length > 0) {
          await installPackages(packages);
        }

        if (!cancelled) setPyodide(p);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [autoInit]);

  const runPython = useCallback(async (code: string): Promise<string> => {
    if (!pyodide) throw new Error("Pyodide not initialized");
    stdoutRef.current = "";
    stderrRef.current = "";
    try {
      const result = pyodide.runPython(code);
      return String(result ?? stdoutRef.current || "(no output)");
    } catch (e: any) {
      return `Error: ${e.message}\n${stderrRef.current}`;
    }
  }, [pyodide]);

  return {
    pyodide,
    stdout: stdoutRef.current,
    stderr: stderrRef.current,
    runPython,
    isLoading,
    error,
  };
}
```

---

### Tool integration example: CryptoPlayground (upgraded)

```typescript
// components/tools/CryptoPlaygroundTool.tsx
"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";
import { usePyodide } from "@/lib/use-pyodide";

export default function CryptoPlaygroundTool() {
  const [plaintext, setPlaintext] = useState("Hello, world!");
  const [results, setResults] = useState<Record<string, string>>({});

  const { runPython, isLoading, error } = usePyodide({
    packages: ["hashlib", "cryptography"],
  });

  const compareHashes = async () => {
    if (isLoading) return;
    const code = `
import hashlib, time

data = ${JSON.stringify(plaintext)}.encode()
results = {}

for algo in ["md5", "sha1", "sha256"]:
    start = time.perf_counter()
    h = hashlib.new(algo, data).hexdigest()
    elapsed = (time.perf_counter() - start) * 1000
    results[algo] = f"{h}  ({elapsed:.2f}ms)"

# bcrypt is intentionally slow — demonstrate
import bcrypt
salt = bcrypt.gensalt()
start = time.perf_counter()
h = bcrypt.hashpw(data, salt)
elapsed = (time.perf_counter() - start) * 1000
results["bcrypt"] = f"{h.decode()}  ({elapsed:.2f}ms — deliberately slow)"

results
`;
    const output = await runPython(code);
    // Parse Python dict repr into state
    // ...
  };

  // ... render ...
}
```

---

### Loading state UX

Every tool that uses Pyodide handles three states consistently:

| State | UI |
|-------|-----|
| `isLoading` | Skeleton card: "Loading Python engine (8MB)..." with indeterminate progress bar |
| `error` | Error card: "Failed to load Python — try refreshing" with a retry button |
| `pyodide` ready | Tool UI — interactive controls |

The first tool a user visits triggers the 8MB download (~2-5 seconds on broadband). After that, all tools reuse the cached instance and initialize in <100ms.

---

### Package manifest per tool

| Tool | Packages needed |
|------|----------------|
| CryptoPlayground | `hashlib`, `cryptography`, `bcrypt`, `time` (stdlib) — supplements (does not replace) existing Web Crypto API |
| EncodingSandbox | `html` (stdlib), `urllib.parse` (stdlib), `json` (stdlib), `base64` (stdlib) |
| DefensiveCodeLab | `re` (stdlib), `ast` (stdlib) |
| TerraformScanner | `hcl2` (micropip), `jsonschema` (micropip) |
| SASTRuleBuilder | `re` (stdlib) |
| DepResolver | `toml` (micropip), `json` (stdlib) |

Stdlib packages don't need `micropip.install()` — they ship in the Pyodide base image.

---

### Design rules (what not to do)

- **Don't put Pyodide in a React Context Provider.** The singleton module pattern keeps it outside React's render cycle. Context would re-render the entire tree on init.
- **Don't import pyodide at the top level of any file.** Always use `import("pyodide")` dynamically. Otherwise Next.js tries to bundle it server-side and fails.
- **Don't share stdout between tools.** Each `usePyodide` call creates its own capture scope. Two tools mounted simultaneously (unlikely but possible via the tool modal) won't mix output.
- **Don't preload on the homepage.** Only load when a user opens a tool. The 8MB cost should be opt-in, not a tax on every visitor.
- **Don't construct Python code with string concatenation of user input.** Use `JSON.stringify()` to inject values into Python string literals, or pass values through `pyodide.globals.set()`.

---

### Files to create / modify

| File | Action |
|------|--------|
| `lib/pyodide-context.ts` | **New** — singleton module |
| `lib/use-pyodide.ts` | **New** — React hook |
| `package.json` | Add `"pyodide": "^0.26.4"` to dependencies |
| `components/ui/ToolRenderer.tsx` | No change — `dynamic(() => import(...), { ssr: false })` already handles WASM tools |
| `components/tools/CryptoPlaygroundTool.tsx` | **Rewrite** — replace Web Crypto calls with `usePyodide` + Python |
| `components/tools/EncodingSandboxTool.tsx` | **Rewrite** — replace hand-rolled JS encoders with `html.escape()`, `urllib.parse.quote()`, etc. |
| `components/tools/DefensiveCodeLabTool.tsx` | **Rewrite** — execute student Python code in sandbox |
| `components/tools/TerraformScannerTool.tsx` | **Upgrade** — parse real HCL via Python |
| `components/tools/SASTRuleBuilderTool.tsx` | **Upgrade** — run real `re`-based pattern matching |

---

### Risks

**Bundle size:** Pyodide's WASM binary is ~8MB. Since it's loaded from jsDelivr CDN (not bundled into the Next.js app), it doesn't affect the initial JS bundle. It's a runtime fetch, cached by the browser's HTTP cache. The npm package itself is just the JS loader (~50KB).

**Mobile:** 8MB over cellular is noticeable. The `isLoading` state shows a size-aware message. A lighter "core" build (~2.5MB without stdlib) exists but most tools here need stdlib modules. The full build is the right call. Users on metered connections will see the 8MB warning before download starts.

**First-tool latency:** The user's first tool interaction bears the full 8MB download. Subsequent tools are instant. This is acceptable because it mirrors how sql.js already works — first query loads WASM, subsequent queries are fast.


