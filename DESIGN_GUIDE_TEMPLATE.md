# {{APP_NAME}} — Design & Architecture Guide

> **This is a living document.** It defines the shared design language across all educational apps built on this architecture (Compyler, SecLayers, Foundry, and future siblings). When a pattern evolves in one app, update this template so the others can adopt the change. Conventions documented here should be considered binding — deviating fragments the shared design language and makes cross-app maintenance harder.

> **App tiers** — apps in the family come in two topologies. Choose one when forking and follow the matching subsections throughout:
>
> - **Tier A — Frontend-only** (Compyler, SecLayers). Pure Next.js, all computation in the browser. Deployed as a single container.
> - **Tier B — Frontend + Backend** (Foundry). Next.js frontend + Python FastAPI backend, served behind nginx via Docker Compose. Use when tools need real server-side compute (live ML training via SSE, heavy numeric work, dataset access).
>
> Sections marked **[Tier B]** apply only to the second topology; everything else is shared.

> **Template substitution variables** — replace these when forking:
>
> | Variable | Example | Description |
> |---|---|---|
> | `{{APP_NAME}}` | `Foundry` | App display name |
> | `{{APP_SLUG}}` | `foundry` | Lowercase identifier (Docker image / compose project, package name) |
> | `{{DOMAIN}}` | `Large Language Models` | Subject area |
> | `{{ACT_COUNT}}` | `4` | Number of act groups |
> | `{{CHAPTER_COUNT}}` | `18` | Total chapter count |
> | `{{TERM_COUNT}}` | `200` | Glossary term count |
> | `{{STORAGE_KEY}}` | `foundry-completed` | localStorage key for progress |
> | `{{HOST_PORT}}` | `3000` | Docker host port mapped to the public entry (container :3000 for Tier A, nginx :80 for Tier B) |
> | `{{BACKEND_PORT}}` | `8000` | **[Tier B]** Host port for the FastAPI backend |
> | `{{FRONTEND_INTERNAL_PORT}}` | `3001` | **[Tier B]** Internal Next.js port (nginx proxies to this) |
> | `{{REPO_DIR}}` | `Foundry` | Repository folder name |
> | `{{BASE_PATH}}` | `/foundry` | Next.js `basePath` (or empty string). When non-empty, nginx must strip the prefix in Tier B. |

A living reference for this codebase. Every section explains *what* exists, *where* it lives, *how* it is structured, and *why* it is done that way.

Update this document whenever a pattern changes, a new system is added, or a convention is established — then propagate the change across sibling apps.

---

## Table of Contents

1. [Project Overview & Stack](#1-project-overview--stack)
2. [Repository Layout](#2-repository-layout)
3. [Theme & Design System](#3-theme--design-system)
4. [Global Layout & Shell](#4-global-layout--shell)
5. [Application State (AppContext)](#5-application-state-appcontext)
6. [Topic System](#6-topic-system)
7. [Chapter Pages (MDX or TSX)](#7-chapter-pages-mdx-or-tsx)
8. [Chapter Shell & Navigation](#8-chapter-shell--navigation)
9. [Content Components](#9-content-components)
10. [Interview & Misconception System](#10-interview--misconception-system)
11. [Interactive Tools System](#11-interactive-tools-system)
12. [Labs System](#12-labs-system)
13. [Glossary](#13-glossary)
14. [Exam Page](#14-exam-page)
15. [Data Files & Schemas](#15-data-files--schemas)
16. [Build, Lint & Verification](#16-build-lint--verification)
17. [Dockerization & Deployment](#17-dockerization--deployment)
18. [Backend Tier (Optional, Tier B)](#18-backend-tier-optional-tier-b)
19. [Key Conventions & Pitfalls](#19-key-conventions--pitfalls)
20. [Adding a New Chapter — Checklist](#20-adding-a-new-chapter--checklist)
21. [Forking for a New Domain](#21-forking-for-a-new-domain)
22. [Maintaining This Template](#22-maintaining-this-template)

---

## 1. Project Overview & Stack

**{{APP_NAME}}** is an interactive learning platform for {{DOMAIN}}. The frontend is always a Next.js app where the majority of computation runs in the browser. Some apps (Tier B) add a Python backend for work that genuinely needs a server — live ML training, large dataset access, expensive numeric work, or anything that can't be shipped to a browser.

### Picking a tier

Choose the smallest tier that does the job. Adding a backend is a real operational cost (more containers to run, more failure modes, harder to deploy on a static host) — only take it on when client-side compute can't deliver the experience.

| Want to … | Tier |
|---|---|
| Render charts, animations, simulators, in-browser tokenizers/inference with WASM models | **A — Frontend-only** |
| Stream live training loss curves while a real model trains on the server | **B — Frontend + Backend** |
| Run a large dataset through a transform that doesn't fit in WASM | **B** |
| Host alongside existing sibling apps under a shared domain with a path prefix | Either tier — see nginx pattern in §17 |

### Frontend stack (both tiers)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Chapters | MDX via `next-mdx-remote/rsc` **or** TSX components (see §7 for trade-offs) |
| MDX plugins (if MDX) | `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight` |
| Math (if TSX) | `katex` + thin `<InlineMath>` / `<BlockMath>` wrappers |
| Icons | `lucide-react` |
| Font | Geist via `next/font` |
| Charts (optional) | `d3` (custom SVG), `chart.js` + `react-chartjs-2` (2D), `plotly.js` + `react-plotly.js` (3D) |
| In-browser ML (optional) | `@huggingface/transformers`, `gpt-tokenizer`, `llama-tokenizer-js`, `@anthropic-ai/tokenizer` |
| Class helper | `clsx` |

### Backend stack **[Tier B]**

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Server | Uvicorn (ASGI) |
| Streaming | `sse-starlette` (Server-Sent Events) |
| Validation | Pydantic |
| ML / numerics | `torch`, `tokenizers` |

### Key design decisions

- **Computation lives where it belongs.** Anything that fits in the browser ships to the browser. Use the backend only for what genuinely needs a server.
- **Chapters are content first.** MDX is the default for prose-heavy chapters; TSX components are an explicit opt-in for chapters whose body is mostly interactive React (charts, math-heavy diagrams, custom widgets).
- **Tools are dynamic imports with `ssr: false`.** Prevents hydration errors from canvas, `window`, and `document` APIs.
- **Content and code are colocated by slug.** Each chapter's source, interview JSON, and tool component share a common slug as their identifier.
- **Streaming over polling [Tier B].** Live training, long-running compute, and any progressively-revealed result use SSE, not poll loops. SSE is the only streaming primitive in the family.

---

## 2. Repository Layout

### Tier A — Frontend-only (flat layout)

```
{{REPO_DIR}}/
├── app/
│   ├── layout.tsx               # Root layout — Sidebar + TopNav + footer shell
│   ├── globals.css              # CSS variables, .prose styles, .tool-surface, semantic utils
│   ├── page.tsx                 # Home page (static)
│   ├── [slug]/
│   │   ├── page.tsx             # Chapter page — MDX rendering + ChapterShell
│   │   └── tool/
│   │       └── page.tsx         # Tool page — ToolIntro + ToolRenderer + ToolHelpButton
│   ├── glossary/page.tsx
│   ├── labs/[slug]/page.tsx
│   └── exam/page.tsx
│
├── components/
│   ├── layout/ChapterShell.tsx
│   ├── ui/                      # AppContext, Sidebar, TopNav, GlossaryPanel,
│   │                              ToolsModal, ToolIntro, ToolHelpButton,
│   │                              ToolRenderer, ToolShell, Callout, DepthBlock,
│   │                              CodeBlock, InterviewCard, MisconceptionCard
│   ├── tools/                   # {{CHAPTER_COUNT}} interactive tool components (one per chapter)
│   └── labs/                    # Lab components + shared primitives
│
├── lib/
│   ├── topics.ts                # TOPICS array + ACT_* color maps + helper functions
│   ├── tool-meta/               # Tool metadata split by act
│   └── labs.ts                  # LAB_REGISTRY + groupLabsByAct helper
│
├── content/
│   ├── chapters/                # One .mdx file per chapter (named by slug)
│   ├── interview/               # One .json file per chapter (named by slug)
│   └── glossary.json
│
├── scripts/rebuild.sh           # Docker build + run script
├── Dockerfile
└── DESIGN_GUIDE_TEMPLATE.md
```

### Tier B — Frontend + Backend (split layout)

When a backend is added, the frontend collapses into `frontend/` and a sibling `backend/` appears. The `scripts/`, `Makefile`, `docker-compose.*`, and `nginx.conf` live at the repo root so they orchestrate both.

```
{{REPO_DIR}}/
├── frontend/                    # Everything from Tier A lives here unchanged
│   ├── app/ components/ lib/ content/
│   ├── next.config.ts           # basePath = "{{BASE_PATH}}", output = "standalone"
│   ├── Dockerfile               # Production image
│   └── Dockerfile.dev           # Hot-reload image for compose overrides
│
├── backend/
│   ├── main.py                  # FastAPI app — CORS, router mounting, graceful ML import
│   ├── requirements.txt
│   ├── data/                    # Training data, fixtures, anything read at runtime
│   ├── models/                  # Domain models (Torch nn.Modules, etc.)
│   ├── routers/                 # One file per feature — each exports an APIRouter
│   ├── tests/
│   └── Dockerfile
│
├── scripts/rebuild.sh           # docker compose build + up (see §17)
├── docker-compose.yml           # Production: backend + frontend + nginx
├── docker-compose.dev.yml       # Dev overlay: bind-mount volumes, --reload, npm run dev
├── nginx.conf                   # Reverse proxy: strips {{BASE_PATH}}, proxies to frontend
├── Makefile                     # make setup / make dev / make backend / make frontend
└── DESIGN_GUIDE.md
```

**The split is non-negotiable when a backend exists.** Mixing Node and Python into one tree makes `docker build` contexts, `.dockerignore` rules, and dependency caching painful. Keep them in separate directories with their own Dockerfiles.

---

## 3. Theme & Design System

### CSS custom properties (`app/globals.css`)

All colors use CSS variables. Never hardcode hex values in components.

```css
:root {
  /* Surfaces */
  --bg-page:       #0b1020;   /* Near-black page background */
  --bg-surface:    #111628;   /* Card surface */
  --bg-surface-2:  #161c32;   /* Slightly lighter card */
  --bg-elevated:   #1a2140;   /* Inputs, chips, elevated elements */
  --border-subtle: #1f2742;   /* Default border */
  --border-strong: #2a335b;   /* Emphasis border */

  /* Text */
  --text-primary:   #e6e9f5;
  --text-secondary: #aab0c6;
  --text-muted:     #6d748d;

  /* Brand */
  --accent:      #6366f1;
  --accent-soft: rgba(99,102,241,0.15);

  /* Act accent colors — one per subject group, named to match ACT_COLORS keys */
  --act-prologue:    #f59e0b;   /* Act 0 */
  --act-act1:        #94a3b8;   /* Act 1 */
  --act-act2:        #60a5fa;   /* Act 2 */
  /* ... add one per act */
}
```

### Act color system

Topics are grouped into {{ACT_COUNT}} acts (0–N). Each act has an accent color used in the chapter header, sidebar, tags, and tool UI. The mapping lives in `lib/topics.ts`.

```ts
// String key maps to the --act-* CSS variable name
export const ACT_COLORS: Record<number, string> = {
  0: "prologue",   // → var(--act-prologue)
  1: "act1",       // → var(--act-act1)
  // one entry per act
};

export const ACT_TEXT:   Record<number, string> = { 0: "text-amber-400", 1: "text-slate-400", /* … */ };
export const ACT_BG:     Record<number, string> = { 0: "bg-amber-900/30", 1: "bg-slate-900/30", /* … */ };
export const ACT_BORDER: Record<number, string> = { 0: "border-amber-500/40", 1: "border-slate-500/40", /* … */ };
```

**Usage:**
```tsx
// For inline styles:
const actColor = `var(--act-${ACT_COLORS[topic.act]})`;
style={{ color: actColor }}

// For Tailwind classes:
<div className={`${ACT_BG[topic.act]} ${ACT_BORDER[topic.act]}`} />
```

### Prose styles (`.prose`)

Chapter MDX content is wrapped in `<div className="prose max-w-none">`. The `.prose` class is defined in `globals.css` (not Tailwind Typography) and covers all heading, paragraph, code, table, and blockquote styles.

**Quirk:** `h1:first-child { display: none }` — the chapter title is displayed by `<ChapterShell>`, so the H1 in the MDX source is suppressed.

### `.tool-surface` class

Apply to the root container of every tool component. Remaps standard Tailwind color utilities to dark-mode equivalents without requiring per-element overrides.

```css
.tool-surface input, .tool-surface select, .tool-surface textarea {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
.tool-surface .bg-blue-600 { background-color: var(--accent); }
/* ... additional remaps */
```

### Semantic tint utilities

Use these instead of light-mode Tailwind tints (`bg-red-50 text-red-800`):

```
.bg-danger-subtle   .border-danger-subtle   .text-danger
.bg-success-subtle  .border-success-subtle  .text-success
.bg-warning-subtle  .border-warning-subtle  .text-warning
.bg-info-subtle     .border-info-subtle     .text-info
```

---

## 4. Global Layout & Shell

`app/layout.tsx` builds the full-screen shell:

```
┌─────────────────┬────────────────────────────────────────┐
│                 │  TopNav (sticky, h-14)                  │
│  Sidebar        ├────────────────────────────────────────┤
│  (w-64)         │                                         │
│                 │  <main>  (flex-1, overflow-auto)        │
│                 │  {children}                             │
│                 ├────────────────────────────────────────┤
│                 │  Footer (shrink-0)                      │
└─────────────────┴────────────────────────────────────────┘
                       [GlossaryPanel — fixed overlay]
```

```tsx
<AppProvider>
  <a href="#main-content" className="sr-only focus:not-sr-only …">Skip to main content</a>
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopNav />
      <main id="main-content" className="flex-1 overflow-auto">{children}</main>
      <footer>…</footer>
    </div>
  </div>
  <GlossaryPanel />
</AppProvider>
```

**Critical:** `overflow-hidden` on the outer flex container is intentional. Only `<main>` should scroll — without it, the sidebar and TopNav scroll away.

### Sidebar (`components/ui/Sidebar.tsx`)

Fixed left panel, `w-64`. From top to bottom:
1. **Logo** — app name + tagline, links to `/`
2. **Progress bar** — `completedTopics.size / TOPICS.length`
3. **Chapter list** — grouped by act with act-color label. Active chapter: `border-l-2` in act color. Completed: checkmark icon.
4. **Bottom links** — Glossary, Labs, Exam

### TopNav (`components/ui/TopNav.tsx`)

Sticky header, `z-40`. Three zones:

| Zone | Content |
|---|---|
| Left | Depth mode segmented control (`beginner` / `advanced`) |
| Center | Interview mode toggle + difficulty buttons (`junior` / `mid` / `senior`) |
| Right | Tools catalog button + Glossary button |

---

## 5. Application State (AppContext)

`components/ui/AppContext.tsx` — React context wrapping the entire app.

```ts
interface AppState {
  depthMode: "beginner" | "advanced";
  setDepthMode: (v: DepthMode) => void;

  interviewMode: boolean;
  setInterviewMode: (v: boolean) => void;

  difficulty: "junior" | "mid" | "senior";
  setDifficulty: (v: Difficulty) => void;

  completedTopics: Set<number>;        // chapter nums, persisted to localStorage
  markTopicComplete: (n: number) => void;

  glossaryOpen: boolean;
  setGlossaryOpen: (v: boolean) => void;
}
```

**localStorage key:** `{{STORAGE_KEY}}` — JSON array of completed chapter `num` values.

```tsx
import { useApp } from "@/components/ui/AppContext";
const { depthMode, interviewMode, difficulty, completedTopics } = useApp();
```

`useApp()` throws if called outside `<AppProvider>`.

---

## 6. Topic System

### `TOPICS` array (`lib/topics.ts`)

The **single source of truth** for all chapter metadata. Every route, sidebar entry, tool page, and exam question derives from this array.

> Add a chapter here first. Everything else — routing, sidebar, tool pages, static params, exam — auto-derives from this array.

```ts
export const TOPICS: Topic[] = [
  { num: 0,  act: 0, title: "Introduction",     slug: "intro",      actLabel: "Prologue",        toolComponent: "IntroTool",    tags: ["overview"] },
  { num: 1,  act: 1, title: "Core Concept A",   slug: "concept-a",  actLabel: "Act I — Basics",  toolComponent: "ConceptATool", tags: ["fundamentals"] },
  // … {{CHAPTER_COUNT}} entries total
] as const;
```

**Fields:**

| Field | Type | Purpose |
|---|---|---|
| `num` | number | Chapter number. Used in localStorage and navigation. |
| `act` | number | Act group (0–N). Drives all color theming. |
| `title` | string | Display name in sidebar, header, breadcrumbs. |
| `slug` | string | Kebab-case ID. Used in URLs, MDX filenames, interview JSON filenames. |
| `actLabel` | string | Human-readable act label for the chapter header. |
| `toolComponent` | string | React component name in `ToolRenderer` and the key in `TOOL_META`. |
| `tags` | string[] | Tag chips shown in the chapter header card. |

### Helper functions

```ts
getTopicBySlug(slug: string): Topic | undefined
getAdjacentTopics(slug: string): { current, prev, next } | null
```

### Static route generation

```ts
export function generateStaticParams() {
  return TOPICS.map((topic) => ({ slug: topic.slug }));
}
```

---

## 7. Chapter Pages (MDX or TSX)

Pick **one** chapter format per app and stick with it — mixing within a single app means two render paths to maintain. Both styles plug into the same `ChapterShell`.

### Choosing the format

| Chapter style | Use … | Examples |
|---|---|---|
| **MDX file per chapter** | Prose-heavy, light interactivity (callouts, depth blocks, code blocks, math) | Compyler, SecLayers |
| **TSX component per chapter** | Heavy interactivity inside the chapter body: charts, diagrams, custom widgets, math-dense layouts | Foundry |

The MDX route is simpler for writers and gives you free markdown editing. The TSX route is simpler when half the chapter is React anyway — at that point, MDX's JSX escape hatches stop helping and start fighting you (see "MDX prerender failures" in §16).

---

### Format A — MDX file per chapter

**Route:** `app/[slug]/page.tsx` — server component.

#### Loading flow

```
1. params.slug → getAdjacentTopics() → topic, prev, next
2. fs.readFile("content/chapters/{slug}.mdx")
3. fs.readFile("content/interview/{slug}.json")
4. parseMisconceptionSection(rawSource)
   → strips ## Misconception from MDX (rendered separately)
5. MDXRemote renders remaining source with plugins + component map
6. ChapterShell receives: topic, misconception, interviewQuestions, prev, next
```

#### MDX component map

Three custom components are available in MDX files:

| Component | Usage |
|---|---|
| `<Callout kind="info|warning|danger|insight">` | Callout boxes |
| `<DepthBlock label="...">` | Advanced-only collapsible content |
| `<CodeBlock language="..." title="...">` | Code block with copy button |

#### Misconception extraction

Every chapter MDX file should end with a `## Misconception` section:

```markdown
## Misconception

**Myth:** "The common wrong belief."

**Reality:** The correct explanation.
```

The server strips this section from the MDX before rendering and passes `{ myth, reality }` to `ChapterShell` for `MisconceptionCard`.

#### Fallback for missing MDX

If `content/chapters/{slug}.mdx` doesn't exist, the page renders a placeholder. The chapter still appears in the sidebar.

---

### Format B — TSX component per chapter

**Route:** `app/stages/[stage]/page.tsx` — passes `num` and `title` into `ChapterShell`, which dispatches to the right component via a dynamic-import registry.

#### Component registry

```tsx
// components/stages/ChapterShell.tsx
const chapterComponents: Record<number, ComponentType> = {
  1:  dynamic(() => import("./Ch01Intro")),
  2:  dynamic(() => import("./Ch02MathPrimer")),
  // ... one per chapter
};

const ChapterContent = chapterComponents[num];
return <ChapterContent />;
```

Dynamic import keeps the initial JS bundle small — only the active chapter's code ships on first load.

#### Chapter component shape

Each chapter is a plain client component that composes the shared content building blocks (`<Callout>`, `<DepthBlock>`, `<CodeBlock>`, `<InlineMath>`, `<BlockMath>`):

```tsx
// components/stages/Ch01Intro.tsx
"use client";
import Callout from "@/components/ui/Callout";
import DepthBlock from "@/components/ui/DepthBlock";
import { BlockMath } from "@/components/ui/Math";

export default function Ch01Intro() {
  return (
    <>
      <h2>What is an LLM?</h2>
      <p>An LLM is a statistical model trained to …</p>

      <Callout variant="insight">The chain rule isn't a simplification — it's exact.</Callout>

      <BlockMath math={String.raw`\prod_{t=1}^{T} p(x_t \mid x_{<t})`} />

      <DepthBlock label="why decoder-only won">
        <p>Encoder-decoder splits computation …</p>
      </DepthBlock>
    </>
  );
}
```

Wrap the dispatcher output in `<div className="chapter-prose space-y-2">` so all the global typography rules apply.

#### Where misconceptions and interview data live (Format B)

In TSX mode there is no MDX text to parse, so misconceptions are colocated with interview questions in `content/interview_questions/index.json` (see §15 — "tiered" schema). `MisconceptionCard` and `InterviewCard` look up their chapter by number and render `null` if no data exists.

---

## 8. Chapter Shell & Navigation

`components/layout/ChapterShell.tsx` — client component (needs `useApp()`).

### Layout

```
<article max-w-4xl mx-auto px-6 py-10>
  ├── <header>     Chapter header card (act color, title, tags, depth badge)
  ├── <div .prose> MDX content (children)
  ├── <section>    MisconceptionCard
  ├── <section>    Tool link → /{slug}/tool
  ├── <section>    InterviewCard (only if interviewMode && questions.length > 0)
  └── <nav>        Prev / Mark Complete / Next
```

### Chapter header card

```tsx
<header className={`mb-8 p-6 rounded-2xl border ${actBg} ${actBorder}`}>
  <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${actText}`}>
    {ACT_LABELS[topic.act]} · Chapter {topic.num}
  </div>
  <h1 style={{ color: "var(--text-primary)" }}>{topic.title}</h1>
  {/* Tag chips + depth badge */}
</header>
```

### Mark Complete

Calls `markTopicComplete(topic.num)` → adds to `completedTopics` Set → persists to localStorage. Non-reversible.

---

## 9. Content Components

### `<Callout>` (`components/ui/Callout.tsx`)

| `kind` | Color | Icon | Default label |
|---|---|---|---|
| `insight` | Chapter accent (`--chapter-accent`) | Lightbulb | "Key Insight" |
| `warning` | Amber `#fbbf24` | Triangle | "Warning" |
| `danger` | Red `#f87171` | Circle-exclamation | "Critical" |
| `info` | Cyan `#67e8f9` | Circle-i | "Note" |

```mdx
<Callout kind="warning">Never do X in production.</Callout>
<Callout kind="info" title="RFC 1234">Additional context here.</Callout>
```

### `<DepthBlock>` (`components/ui/DepthBlock.tsx`)

Wraps advanced content. In beginner mode: renders a `▶ Show [label]` toggle. In advanced mode: always visible with a subtle left border.

```mdx
<DepthBlock label="why this matters at scale">
  Deep-dive content only shown in advanced mode.
</DepthBlock>
```

### `<CodeBlock>` (`components/ui/CodeBlock.tsx`)

Dark code block with copy-to-clipboard. Use for titled blocks or when copy functionality is needed. Plain fenced code blocks (` ``` `) are handled by rehype-highlight.

```mdx
<CodeBlock language="rust" title="example.rs" code={`fn main() { println!("hello"); }`} />
```

### `<ToolShell>` (`components/ui/ToolShell.tsx`)

Optional wrapper for tool content panels. Adds a header bar with title, optional description, and an "IN-BROWSER" badge. Inner content gets the `.tool-surface` class.

```tsx
<ToolShell title="My Tool" description="What it does">
  {/* tool UI */}
</ToolShell>
```

---

## 10. Interview & Misconception System

### Data source: per-chapter JSON files

Each chapter has `content/interview/{slug}.json`. Schema is a flat array:

```ts
interface InterviewQuestion {
  id: string;          // "{slug-prefix}-{category}-{nn}"
  question: string;
  answer: string;      // Markdown-formatted
  category: "junior" | "mid" | "senior";
}
```

**Convention:** 2 questions per category, 6 total per chapter.

### `<InterviewCard>` (`components/ui/InterviewCard.tsx`)

Only rendered when `interviewMode === true` AND the chapter has questions. Reads `difficulty` from AppContext to filter by category.

### `<MisconceptionCard>` (`components/ui/MisconceptionCard.tsx`)

Always rendered below chapter prose. Receives `{ myth, reality }` extracted server-side from the MDX.

---

## 11. Interactive Tools System

### Architecture

```
/[slug]/tool (page.tsx)
  └── ToolIntro          — summary + quick-start steps
  └── ToolRenderer       — dynamic import of the tool component
  └── ToolHelpButton     — "How to use this tool" modal
```

### Tool metadata (`lib/tool-meta/`)

Split into one file per act, merged in `lib/tool-meta/index.ts`:

```ts
interface ToolMeta {
  summary: string;       // One-sentence description (shown in ToolIntro)
  quickStart: string[];  // 3-4 "Try this first" bullet steps
  help?: {
    goal: string;        // What skill this tool teaches
    steps: string[];     // How-to steps
    lookFor?: string;    // What pattern to notice
  };
}

export const TOOL_META: Record<string, ToolMeta> = {
  ...prologueMeta,
  ...act1Meta,
  // ... one spread per act file
};
```

The key in `TOOL_META` must exactly match `topic.toolComponent`.

### Tool page (`app/[slug]/tool/page.tsx`)

Server component. Static params generated from `TOPICS` filtered to entries where `TOOL_META[topic.toolComponent]` exists. Returns 404 if no meta entry.

Tool pages use `max-w-5xl` (wider than chapter prose `max-w-4xl`).

### `ToolRenderer` (`components/ui/ToolRenderer.tsx`)

Client component. Holds the dynamic import registry:

```ts
const TOOLS: Record<string, React.ComponentType> = {
  ConceptATool: dynamic(() => import("@/components/tools/ConceptATool"), { ssr: false }),
  // one entry per tool component
};
```

**Critical:** every import must use `{ ssr: false }`. Tools use browser APIs.

### Tool component pattern

```tsx
"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export function ConceptATool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function handleRun() {
    setResult(`Result for: ${input}`);
  }

  return (
    <ToolShell title="Concept A Explorer" description="Experiment interactively">
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input…"
          className="flex-1 px-3 py-2 rounded-lg text-sm border"
        />
        <button onClick={handleRun} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
          Run
        </button>
      </div>
      {result && (
        <div className="p-4 rounded-lg bg-success-subtle border border-success-subtle">
          <p className="text-success text-sm font-mono">{result}</p>
        </div>
      )}
    </ToolShell>
  );
}
```

Rules:
- Wrap in `<ToolShell>` or apply `className="tool-surface"` to the root
- Use semantic utility classes for status colors (`.bg-danger-subtle`, `.text-success`, etc.)
- Never access `window` or `document` outside a `useEffect` or event handler

### Visualization libraries

Tools that render charts or diagrams converge on a small set of libraries. Pick the lightest one that does the job — every extra chart library shows up in the bundle for the route that imports it.

| Need | Library | Notes |
|---|---|---|
| Custom inline SVG charts driven by data | inline `<svg>` + `d3` for scales / layouts | No runtime UI; D3 is used for math, you draw the markup |
| Standard 2D charts (line, bar, scatter) | `chart.js` + `react-chartjs-2` | Lowest-friction option |
| 3D plots (embedding space, surfaces) | `plotly.js` + `react-plotly.js` | Heavy — always behind `ssr: false` |
| Math typesetting in tool UIs | `katex` via `<InlineMath>` / `<BlockMath>` wrappers | `throwOnError: false` so a bad string degrades gracefully |
| In-browser tokenization | `gpt-tokenizer`, `llama-tokenizer-js`, `@anthropic-ai/tokenizer` | Ship the tokenizer; don't call out to a backend |
| In-browser model inference | `@huggingface/transformers` | WASM/WebGPU, no backend round-trip |

### Deterministic randomness

Tools that demo a "fake" run (a training curve, an attention pattern, a synthetic dataset) should use a seeded PRNG so re-renders, hot reloads, and shared screenshots show the same values. A 6-line multiply-with-carry / xorshift function is enough — don't pull in a library:

```ts
function seededRand(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
```

Expose the seed as a tool input when reproducibility matters; default it otherwise.

### Calling the backend from a tool **[Tier B]**

Streaming tools talk to the backend over SSE, never a poll loop:

```ts
const es = new EventSource(`${BACKEND_URL}/pretraining/train?warmup_steps=20`);
es.onmessage = (e) => {
  const { step, loss, sample } = JSON.parse(e.data);
  setCurve((c) => [...c, { step, loss }]);
};
es.onerror = () => es.close();        // browsers auto-reconnect otherwise
useEffect(() => () => es.close(), []); // close on unmount
```

`BACKEND_URL` is `http://localhost:{{BACKEND_PORT}}` in dev. In production behind nginx (§17), it's either the same origin (no host) or a sibling subdomain — never hardcode `localhost` in shipped code.

### Modal portaling pattern

`ToolsModal` and `ToolHelpButton` use `createPortal` to escape `overflow-hidden` stacking contexts:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null;
return createPortal(<Modal />, document.body);
```

---

## 12. Labs System

### Data source (`lib/labs.ts`)

```ts
interface Lab {
  slug: string;
  title: string;
  objective: string;       // One-sentence goal shown on the listing card
  act: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const LAB_REGISTRY: Lab[] = [ … ];
export function groupLabsByAct(): Record<number, Lab[]> { … }
```

### Routes

- `/labs` — listing page, groups by act
- `/labs/[slug]` — individual lab rendered by `LabRenderer`

### Lab components (`components/labs/`)

Each lab is a standalone React component. A shared file exports reusable primitives (flag display, hint system, submit button).

`LabRenderer` routes by slug:
```ts
const LABS: Record<string, React.ComponentType> = {
  "lab-slug": LabComponent,
};
```

---

## 13. Glossary

### Data source (`content/glossary.json`)

```ts
interface GlossaryEntry {
  term: string;
  definition: string;
  relatedTopics: string[];   // Chapter slugs
  act: number;               // Drives the act filter
}
```

**Convention:** 1–3 sentence definitions answering: *what is it, why does it exist, what goes wrong without it?*

### Glossary page (`app/glossary/page.tsx`)

Client component with:
- **Search** — fuzzy match on `term`, `definition`, and `relatedTopics`
- **Act filter pills** — active pill shows act color
- **Term cards** — `relatedTopics` rendered as chips linking to `/{slug}`

### `<GlossaryPanel>` (`components/ui/GlossaryPanel.tsx`)

Right-side slide-in panel, `fixed inset-0 z-50`. Toggled by:
- The "Glossary" button in TopNav
- The `g` key (when no input is focused)
- `Escape` to close

---

## 14. Exam Page

`app/exam/page.tsx` — pure client component.

1. Loads all interview JSON files (statically imported at build time)
2. Filters by current `difficulty` from AppContext
3. Fisher-Yates shuffles, takes first 30 questions
4. Shows one at a time; user clicks "Reveal Answer" then self-marks correct/incorrect
5. Completion: score + per-chapter breakdown

No backend. No answer verification. Self-assessment only.

---

## 15. Data Files & Schemas

### `lib/topics.ts`

```ts
interface Topic {
  num: number;           // Chapter number
  act: number;           // Act number
  title: string;
  slug: string;          // URL slug and file name base
  actLabel: string;
  toolComponent: string; // Key in TOOL_META and ToolRenderer
  tags: readonly string[];
}
```

### `content/chapters/{slug}.mdx`

Standard Markdown + GFM + math. Available components: `<Callout>`, `<DepthBlock>`, `<CodeBlock>`. Must end with `## Misconception` section.

### `content/interview/{slug}.json` — Schema A (per-tier questions)

```ts
Array<{
  id: string;          // "{slug-prefix}-{category}-{nn}"
  question: string;
  answer: string;      // Multi-paragraph markdown
  category: "junior" | "mid" | "senior";
}>
```

6 questions per chapter, 2 per level. The category names are configurable per app (e.g. `internship` / `mlEngineer` / `researcher` for Foundry), but the **string values must exactly match** the union in `AppContext.difficulty`. The interview UI filters questions by an equality check on this field — a mismatch silently hides the question.

### `content/interview_questions/index.json` — Schema B (tiered answers + colocated misconceptions)

An alternative that scales better when most questions apply to all tiers and only the depth of the *answer* varies. A single file holds every chapter's questions, plus its misconceptions inline.

```ts
Array<{
  chapter: number;
  questions: Array<{
    question: string;
    answers: Record<DifficultyTier, string>;   // one answer per tier
    wrongAnswers: string[];                    // common misconceptions, may be empty
  }>;
  misconceptions: Array<{
    myth: string;
    reality: string;
  }>;                                          // may be omitted/empty
}>
```

Trade-offs:

| | Schema A (one file per chapter) | Schema B (one combined file) |
|---|---|---|
| Source-of-truth granularity | Per-chapter files; easy to diff | One central file; easy to scan |
| Question reuse across tiers | Duplicate the row | Single row, three answers |
| Misconceptions | Extracted from MDX `## Misconception` section | Colocated as `misconceptions: [...]` |
| Best with | MDX chapter format (§7-A) | TSX chapter format (§7-B) |

Pair Schema B with the TSX chapter format — there's no MDX to extract misconceptions from in that mode, so colocation is the natural fit.

### `content/glossary.json`

```ts
Array<{
  term: string;
  definition: string;
  relatedTopics: string[];
  act: number;
}>
```

### `lib/tool-meta/{act}.ts`

```ts
Record<string, {
  summary: string;
  quickStart: string[];
  help?: { goal: string; steps: string[]; lookFor?: string; };
}>
```

---

## 16. Build, Lint & Verification

Every sibling app uses the same verification commands so they can share CI and tooling. A `Makefile` exposes the canonical entry points — exact targets depend on tier.

#### Tier A `Makefile`

```makefile
.PHONY: dev build start lint typecheck

dev:        ; npm run dev
build:      ; npm run build
start:      ; npm run start
lint:       ; npm run lint
typecheck:  ; npx tsc --noEmit
```

#### Tier B `Makefile`

When the repo has both `backend/` and `frontend/` directories, the Makefile owns the dev orchestration so contributors don't have to remember to start two processes. `make dev` runs both in parallel; `make setup` does one-time install.

```makefile
.PHONY: backend frontend dev setup

# Prefer the project venv; fall back to any python3.11+ on PATH
PYTHON ?= $(shell \
    [ -x backend/.venv/bin/python ] && echo backend/.venv/bin/python || \
    command -v python3.11 || command -v python3.12 || command -v python3.10 || \
    echo python3)

backend:
	cd backend && $(PYTHON) -m uvicorn main:app --reload --port {{BACKEND_PORT}}

frontend:
	cd frontend && npm run dev

dev:
	make -j2 backend frontend

setup:
	@echo "==> Creating Python virtual environment..."
	python3.11 -m venv backend/.venv
	@echo "==> Installing Python dependencies..."
	backend/.venv/bin/pip install -r backend/requirements.txt
	@echo "==> Installing frontend dependencies..."
	cd frontend && npm install
	@echo ""
	@echo "Setup complete. Run 'make dev' to start."
```

Two details that matter:

- The `PYTHON` fallback finds the venv if it exists and a system Python otherwise. Don't hardcode `python3` — different machines have different default versions.
- `make -j2` runs `backend` and `frontend` in parallel. Their output interleaves; that's fine — both prefix their own logs.

### Required clean states before any commit

| Command | What it checks | Must produce |
|---|---|---|
| `npx tsc --noEmit` | TypeScript correctness | No output |
| `npm run lint` | ESLint (`eslint.config.mjs`) | No errors |
| `npm run build` | Full Next.js production build, prerender every static page | Build succeeds |

The production build also exercises every MDX file via prerendering, which surfaces issues that `tsc` cannot catch — see the MDX gotchas below.

### Common MDX prerender failures

MDX runs every chapter source through `acorn` before rendering. These plain-text patterns crash the build:

| Pattern | Reason | Fix |
|---|---|---|
| `{q₀}`, `{some text}` in prose | `{ … }` parsed as JSX expression | Wrap in backticks: `` `{q₀}` `` |
| `<30 tokens`, `>50 items` | `<x` parsed as JSX tag opening | Use `&lt;30`, `&gt;50` |
| Unbalanced `<` or `>` outside code blocks | JSX parse error | Escape or wrap in code |

> **Rule of thumb:** any `<`, `>`, or `{` in prose that isn't a JSX tag or HTML entity should be inside backticks or a fenced code block.

### Next.js `next.config.ts` baseline

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "{{BASE_PATH}}",  // e.g. "/compyler" or ""
  output: "standalone",       // REQUIRED for the Docker runtime image
};

export default nextConfig;
```

`output: "standalone"` produces `.next/standalone/server.js`, which the Docker runner depends on. Removing it breaks the container.

---

## 17. Dockerization & Deployment

Every app in the family is deployable with one of two Docker topologies. Pick the one that matches your tier (§1) and follow only the matching subsection.

| Topology | Used by | What you get |
|---|---|---|
| **17.A — Single-container** | Tier A (frontend-only) | One `Dockerfile`, one `docker run`. Port `{{HOST_PORT}}` → container `:3000`. |
| **17.B — Compose + nginx** | Tier B (frontend + backend) | `docker-compose.yml` with three services (backend, frontend, nginx). Nginx is the only host-facing port. |

Sibling apps coexist on one host by claiming distinct `{{HOST_PORT}}` values (SecLayers `:3020`, Compyler `:3040`, Foundry `:3000`, etc.). Each app is otherwise self-contained.

---

### 17.A — Single-container (Tier A)

#### `Dockerfile` — three-stage build

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

**Why these choices:**

- **Alpine node:20** — small base image, consistent across apps.
- **Three stages (`deps` / `builder` / `runner`)** — final image excludes `node_modules` source, dev deps, and build cache. Runtime image is typically 150–200 MB.
- **Non-root `nextjs:nodejs` user (uid/gid 1001)** — same uid across all sibling apps so volumes are interchangeable.
- **`output: "standalone"`** in `next.config.ts` is required; the runner copies only `.next/standalone/server.js` and `.next/static`.
- **`HOSTNAME=0.0.0.0`** is required — Next.js defaults to `localhost` in standalone mode, which is unreachable from outside the container.

#### `.dockerignore`

```
node_modules
.next
.git
*.md
*.log
Dockerfile
.dockerignore
.env*
```

#### `scripts/rebuild.sh` (single-container)

```bash
#!/bin/bash
set -euo pipefail

LOG=/tmp/{{APP_SLUG}}-rebuild.log

notify() {
  osascript -e "display notification \"$1\" with title \"{{APP_NAME}} Build\" sound name \"Glass\""
}

{
  /usr/local/bin/docker stop {{APP_SLUG}}-app 2>/dev/null || true
  /usr/local/bin/docker rm   {{APP_SLUG}}-app 2>/dev/null || true

  PORT_PID=$(lsof -ti :{{HOST_PORT}} -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
  fi

  /usr/local/bin/docker build -t {{APP_SLUG}} /path/to/{{REPO_DIR}}
  /usr/local/bin/docker run -d -p {{HOST_PORT}}:3000 --name {{APP_SLUG}}-app {{APP_SLUG}}
} >> "$LOG" 2>&1 \
  && notify "Build succeeded. Running on port {{HOST_PORT}}." \
  || notify "Build FAILED. Check $LOG for details."
```

#### Manual run

```bash
docker build -t {{APP_SLUG}} .
docker run -d -p {{HOST_PORT}}:3000 --name {{APP_SLUG}}-app {{APP_SLUG}}
docker logs -f {{APP_SLUG}}-app
```

---

### 17.B — Compose + nginx (Tier B)

The compose stack has three services. Only nginx binds a host port — frontend is internal-only, backend is exposed for tools that hit it directly during development.

```
                 ┌────────────────────────────────────────────────┐
host :{{HOST_PORT}}     │                                                │
  ──────►       │   nginx (80)                                    │
                │     ├── /{{BASE_PATH}}/  →  frontend:{{FRONTEND_INTERNAL_PORT}}      │
                │     └── /api/  →  backend:{{BACKEND_PORT}}     │   (optional split)
host :{{BACKEND_PORT}} │                                                │
  ──────►       │   backend ({{BACKEND_PORT}})                    │
                │                                                │
                └────────────────────────────────────────────────┘
```

#### `docker-compose.yml` — production stack

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "{{BACKEND_PORT}}:{{BACKEND_PORT}}"
    restart: unless-stopped

  frontend:
    build: ./frontend
    expose:
      - "{{FRONTEND_INTERNAL_PORT}}"
    command: ["npm", "start", "--", "-p", "{{FRONTEND_INTERNAL_PORT}}"]
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "{{HOST_PORT}}:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
    restart: unless-stopped
```

Key points:

- **`expose` not `ports`** on the frontend. The frontend should only be reachable via nginx — `expose` keeps it on the internal Docker network and out of `docker ps -a` port columns. If you see a port mapping here, the deployment is wrong.
- **`depends_on`** orders startup but does not wait for readiness. Each container should be tolerant of its dependencies not being ready yet (the backend takes ~5–15 seconds to import torch in some apps).
- **nginx config is bind-mounted read-only** — re-deploys of the nginx routing only need a restart, not a rebuild.

#### `nginx.conf` — basePath strip + proxy

When the app is hosted under a path prefix (`{{BASE_PATH}}`), nginx is responsible for stripping it before proxying to Next.js. Next.js is unaware of the prefix at runtime; it knows it only at build time via `basePath` in `next.config.ts`.

```nginx
server {
    listen 80;
    absolute_redirect off;

    # Redirect {{BASE_PATH}} (no trailing slash) to {{BASE_PATH}}/
    location = {{BASE_PATH}} {
        return 308 {{BASE_PATH}}/;
    }

    # Strip {{BASE_PATH}} and proxy to Next.js.
    location {{BASE_PATH}}/ {
        proxy_pass http://frontend:{{FRONTEND_INTERNAL_PORT}}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Rewrite Location headers Next.js emits (e.g. trailing-slash 308s)
        # back into the {{BASE_PATH}}/ space.
        proxy_redirect ~^/(.+)$ {{BASE_PATH}}/$1;
        proxy_redirect / {{BASE_PATH}}/;
    }
}
```

Three subtleties that bite:

- **`absolute_redirect off`** + **`proxy_redirect` rewrites** are both required. Without them, Next.js's trailing-slash redirects send the browser to `/`, escaping the prefix.
- **The trailing slash on `proxy_pass http://frontend:{{FRONTEND_INTERNAL_PORT}}/`** is significant — it makes nginx strip the matched `location` from the forwarded URL. Removing it sends `{{BASE_PATH}}/page` to the backend untouched and Next.js 404s.
- **SSE streams need `proxy_http_version 1.1` + `Connection ""`.** Otherwise nginx defaults to HTTP/1.0 and buffers the entire response, breaking live streaming tools.

If the app is served at the root (`{{BASE_PATH}}` empty), drop the strip block and use `location / { proxy_pass http://frontend:{{FRONTEND_INTERNAL_PORT}}; }`.

#### Frontend `Dockerfile` (production)

Tier B frontends commonly use `npm start` rather than `output: "standalone"` because nginx is in front and the bundle-size win is marginal. Either is fine — pick one and document it:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE {{FRONTEND_INTERNAL_PORT}}
CMD ["npm", "start"]
```

#### Backend `Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE {{BACKEND_PORT}}
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "{{BACKEND_PORT}}"]
```

**Don't omit `--host 0.0.0.0`.** Uvicorn defaults to `127.0.0.1`, which inside a container means "nothing outside this container can reach me." This is the Tier B analogue of the `HOSTNAME=0.0.0.0` rule for Next.js standalone.

#### `docker-compose.dev.yml` — hot-reload overlay

Used as an overlay during development to mount source as a volume and switch to dev servers. Run with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`.

```yaml
services:
  backend:
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port {{BACKEND_PORT}} --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules        # anonymous volume — keeps container's node_modules
    command: npm run dev -- -p {{FRONTEND_INTERNAL_PORT}}
    environment:
      - WATCHPACK_POLLING=true   # required for file-watching on bind mounts
```

The anonymous `node_modules` volume is the key trick — without it, mounting the host's source over `/app` also replaces the `node_modules` that were installed during the image build, and the container instantly breaks. `WATCHPACK_POLLING=true` is mandatory on macOS (Docker Desktop) because inotify events don't propagate through the file-sharing layer.

The matching dev Dockerfile is minimal:

```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE {{FRONTEND_INTERNAL_PORT}}
CMD ["npm", "run", "dev"]
```

#### `scripts/rebuild.sh` (compose)

```bash
#!/bin/bash
set -euo pipefail

PROJECT_DIR=/path/to/{{REPO_DIR}}
LOG=/tmp/{{APP_SLUG}}-rebuild.log

notify() {
  osascript -e "display notification \"$1\" with title \"{{APP_NAME}} Build\" sound name \"Glass\""
}

{
  /usr/local/bin/docker compose -f "$PROJECT_DIR/docker-compose.yml" down --remove-orphans

  PORT_PID=$(lsof -ti :{{HOST_PORT}} -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$PORT_PID" ]; then
    kill -9 "$PORT_PID" 2>/dev/null || true
    sleep 1
  fi

  /usr/local/bin/docker compose -f "$PROJECT_DIR/docker-compose.yml" build --no-cache
  /usr/local/bin/docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d
} >> "$LOG" 2>&1 \
  && notify "Build succeeded. Running at http://localhost:{{HOST_PORT}}{{BASE_PATH}}/" \
  || notify "Build FAILED. Check $LOG for details."
```

Two things to keep an eye on:

- **`down --remove-orphans`** cleans up containers from previous stacks (e.g. if a service was renamed). Without it, orphaned containers hold their ports and the next `up` fails.
- **`--no-cache`** is intentional for a clean reproducibility test. For day-to-day iteration, drop it.

---

### Naming conventions (both topologies)

| Resource | Naming |
|---|---|
| Docker image / compose project | `{{APP_SLUG}}` |
| Container name (Tier A) | `{{APP_SLUG}}-app` |
| Container names (Tier B) | `{{APP_SLUG}}-{backend,frontend,nginx}-1` (compose default) |
| Public host port | `{{HOST_PORT}}` (3020 / 3040 / 3060 / …) |
| Container port (Tier A) | `3000` (always) |
| Frontend internal port (Tier B) | `{{FRONTEND_INTERNAL_PORT}}` (3001 by convention, never published) |
| Backend port (Tier B) | `{{BACKEND_PORT}}` (8000 by convention) |
| Build log | `/tmp/{{APP_SLUG}}-rebuild.log` |
| Notification title | `{{APP_NAME}} Build` |

### Common Docker failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Container in `created` state, never starts | Port already in use on host | `lsof -i :{{HOST_PORT}}` → kill the holder; rebuild.sh does this automatically |
| Container exits immediately, no logs | Tier A: missing `output: "standalone"`. Tier B: uvicorn bound to 127.0.0.1 | Fix the binding |
| `getaddrinfo ENOTFOUND` in browser | `HOSTNAME` not set to `0.0.0.0` (Next.js) or `--host 0.0.0.0` missing (uvicorn) | Add it |
| Prerender error during `npm run build` | MDX parse error (see [Section 16](#16-build-lint--verification)) | Fix the offending MDX file |
| Container runs but assets 404 | `basePath` mismatch between build and request URL | Confirm `basePath` matches the path you're hitting; verify nginx strips it |
| SSE stream cuts off after a few seconds | nginx buffering | Add `proxy_http_version 1.1;` + `proxy_set_header Connection "";` to the `location` block |
| Frontend container can't reach backend | Used `localhost` instead of service name | From inside compose, the backend is at `http://backend:{{BACKEND_PORT}}`, not `localhost` |
| Bind-mounted dev container fails on import | Host's `node_modules` clobbered the container's | Add the anonymous `- /app/node_modules` volume |
| File changes not picked up in dev (macOS) | inotify doesn't cross Docker file-sharing | Set `WATCHPACK_POLLING=true` |

---

## 18. Backend Tier (Optional, Tier B)

When client-side compute can't do the job — live model training, large dataset transforms, anything that genuinely needs a server — add a Python backend. Everything in this section is opt-in; Tier A apps skip it entirely.

### Layout (`backend/`)

```
backend/
├── main.py              # FastAPI app, CORS, router mounting, graceful imports
├── requirements.txt
├── data/                # Read at runtime — training corpora, fixtures, JSON
├── models/              # nn.Modules, dataclasses, anything domain-specific
├── routers/             # One file per feature; each exports an APIRouter
└── tests/
```

Routers, not monolithic endpoints. Each `routers/<feature>.py` exports a single `APIRouter` instance; `main.py` mounts them under prefixes. Adding a new feature means writing one router file and one mount line.

### `main.py` — the standard shape

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:{{HOST_PORT}}",
        "http://localhost:{{FRONTEND_INTERNAL_PORT}}",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cheap, always-present routers
from routers import tokenization
app.include_router(tokenization.router, prefix="/tokenization")

# Heavy ML routers — only load if torch is installed
try:
    from routers import pretraining, sft, reward, rlhf
    app.include_router(pretraining.router, prefix="/pretraining")
    app.include_router(sft.router,         prefix="/sft")
    app.include_router(reward.router,      prefix="/reward")
    app.include_router(rlhf.router,        prefix="/rlhf")
    _ml_routers = True
except ModuleNotFoundError:
    _ml_routers = False
```

### Graceful ML degradation

The `try`/`except ModuleNotFoundError` block above is load-bearing. ML dependencies (torch, transformers) are large and slow to install — contributors who only touch tokenizer endpoints shouldn't have to install gigabytes of CUDA wheels. The pattern:

- **Cheap routers** load unconditionally.
- **Expensive routers** are imported inside a `try`. If the import fails, those endpoints simply don't exist; the frontend tools that depend on them will surface a clear "backend feature unavailable" message rather than 500s.
- `_ml_routers` boolean can be exposed via a `/health` endpoint if the frontend needs to feature-detect.

This is the only place a `try`/`except ModuleNotFoundError` should appear in the backend — don't sprinkle it inside routers themselves. Top-level only.

### CORS

Configure `allow_origins` for **localhost in dev** and **the production origin** (typically empty if served same-origin behind nginx). Never use `["*"]` — the CORS preflight will fail for credentialed requests, and you lose a free layer of defense against drive-by browser callers.

### SSE streaming endpoints — the canonical shape

Any long-running endpoint (training, generation, expensive computation) streams progress via SSE instead of returning a single response after a long wait:

```python
import asyncio, json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

@router.get("/train")
async def train_stream(warmup_steps: int = 20):
    async def event_generator():
        for step in range(max_steps):
            loss = train_one_step()                   # cheap, synchronous step
            yield {"data": json.dumps({
                "step": step,
                "loss": float(loss),
                "sample": current_sample(),
            })}
            await asyncio.sleep(0)                     # yield to event loop
    return EventSourceResponse(event_generator())
```

Three rules:

- **`await asyncio.sleep(0)` after every event.** Without it, the generator never yields to the event loop and the entire stream buffers until the loop finishes — defeating the point of SSE.
- **Cast tensors / numpy values to plain Python before `json.dumps`.** `float(loss)` here. Otherwise JSON serialization raises.
- **Don't hold model state in module-level globals** that survive across requests. Either re-instantiate per request (tiny models) or use FastAPI dependencies (heavier ones) — but never share mutable training state between concurrent SSE clients.

The frontend consumer pattern is documented in §11 ("Calling the backend from a tool").

### Why not WebSockets?

SSE is one-way (server → client), text-only, auto-reconnecting, and works over plain HTTP/1.1 without any protocol negotiation. For "stream a training curve while the user watches" that's everything you need — WebSockets add complexity (full duplex, framing, connection lifecycle) for no benefit here. Reach for WebSockets only when the client needs to send messages mid-stream.

### Model files

Keep model definitions tiny enough to train in the time a user is willing to wait — typically <30 seconds on CPU. The point of the backend is to teach, not to ship a production trainer:

```python
# backend/models/nano_gpt.py
class NanoGPT(nn.Module):
    # n_layer=2, n_head=2, n_embd=64, block_size=64
    # Trains on Shakespeare in <30s on CPU.
```

If a tool needs a bigger model for realism, ship a pretrained checkpoint in `backend/data/` rather than training from scratch on each request.

---

## 19. Key Conventions & Pitfalls

### 1. `lib/topics.ts` is the single source of truth
Never hardcode slugs, chapter numbers, or act labels elsewhere.

### 2. `toolComponent` is the join key across three systems
The string must match the key in `ToolRenderer`'s `TOOLS` record, the key in `TOOL_META`, and the exported component name. If any of these three are out of sync, the tool page returns 404 or renders nothing.

### 3. Tool imports must use `ssr: false`
Tools use browser APIs. Forgetting this causes hydration errors or build failures.

### 4. MDX components must be explicitly passed
`MDXRemote` receives a `components` prop. A component used in MDX but not registered here will render as plain text.

### 5. The `## Misconception` section is stripped from MDX
Do not render it inside the prose — the server already passes it to `MisconceptionCard`.

### 6. Interview `category` maps to `difficulty` in AppContext
Both use `"junior" | "mid" | "senior"`.

### 7. Tool pages use `max-w-5xl`, chapter pages use `max-w-4xl`

### 8. Progress is stored by chapter `num`, not slug
`completedTopics` is a `Set<number>`. If chapters are renumbered, existing localStorage data becomes stale. Prefer appending chapters at the end of an act.

### 9. Keyboard shortcuts

| Key | Action | Registered in |
|---|---|---|
| `g` | Open GlossaryPanel | `GlossaryPanel.tsx` |
| `Escape` | Close modal/panel | Each modal individually |

Both check that no input is focused before firing.

### 10. Difficulty tier values are an app-level union; both ends must match exactly

`AppContext.difficulty` is typed as a string union (e.g. `"junior" | "mid" | "senior"` or `"internship" | "mlEngineer" | "researcher"`). Interview question `category` / `answers` keys, exam filters, and TopNav buttons all compare against this union with `===`. **One typo silently hides content** — there's no runtime check that the tiers in the JSON match the tiers in the type.

When forking, do a single search-and-replace across `AppContext.tsx`, `TopNav.tsx`, `InterviewCard.tsx`, the exam page, and the interview JSON. Don't try to translate per-file.

### 11. `next.config.ts` flags that disable build-time checks are a smell

```ts
// Avoid in production templates
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```

These exist as escape hatches for in-progress migrations. **Never check them in as the default.** The build is the canonical correctness gate; turning it off in `next.config.ts` instead of fixing the underlying errors leaves silent failures for the next person.

If a sibling app has them set, treat it as a debt item, not a pattern to copy.

### 12. Frontend ↔ backend address depends on context **[Tier B]**

Inside the compose network, the frontend reaches the backend at `http://backend:{{BACKEND_PORT}}`. From the host or browser, it's `http://localhost:{{BACKEND_PORT}}`. From behind nginx in production, it's typically the same origin with an `/api/` prefix routed by nginx.

Read the URL from an env var (`NEXT_PUBLIC_BACKEND_URL`) rather than hardcoding any of them. Default it to `http://localhost:{{BACKEND_PORT}}` for local dev and override in compose.

### 13. SSE requires HTTP/1.1 + `Connection ""` through nginx

If you add nginx in front of an SSE endpoint without these two headers, the stream appears to work for a few seconds, then stalls. nginx defaults to buffering the response. See §17.B.

### 14. Bind-mounted dev containers need an anonymous `node_modules` volume

`- ./frontend:/app` followed by `- /app/node_modules` keeps the host source visible to the container *and* preserves the container's own installed dependencies. Without the second line, the bind mount nukes `node_modules` and nothing imports.

### 15. macOS Docker file watching requires `WATCHPACK_POLLING=true`

Inotify events don't survive Docker Desktop's file-sharing layer. Next.js will run but won't pick up your edits until you set this env var. Same fix applies to most Node-based watchers.

### 16. The backend's heavy imports must be guarded with `try`/`except ModuleNotFoundError` **[Tier B]**

This is the only sanctioned use of that pattern in the codebase. See §18 — "Graceful ML degradation." Don't sprinkle it inside individual routers.

---

## 20. Adding a New Chapter — Checklist

Follow this order:

- [ ] **`lib/topics.ts`** — add entry to `TOPICS`. Assign `num`, `act`, `slug`, `toolComponent`, `tags`.
- [ ] **`content/chapters/{slug}.mdx`** — write prose. End with `## Misconception` section.
- [ ] **`content/interview/{slug}.json`** — write 6 questions (2 per `junior`/`mid`/`senior`).
- [ ] **`components/tools/{ToolName}Tool.tsx`** — implement the tool. Apply `.tool-surface`.
- [ ] **`components/ui/ToolRenderer.tsx`** — add dynamic import in the `TOOLS` record.
- [ ] **`lib/tool-meta/{act}.ts`** — add `ToolMeta` entry. Key must match `toolComponent`.
- [ ] **`content/glossary.json`** — add any new terms the chapter introduces.
- [ ] **Verify** — `npx tsc --noEmit` clean, `npm run lint` clean, `npm run build` succeeds.
- [ ] **Docker smoke test** — `./scripts/rebuild.sh` then open `http://localhost:{{HOST_PORT}}{{BASE_PATH}}/{slug}`.

---

## 21. Forking for a New Domain

### Step 0 — Pick a tier and a chapter format

Two upfront decisions shape every step that follows. Make them deliberately, write them in the README, and don't second-guess them halfway through.

| Decision | Options | Choose A if … | Choose B if … |
|---|---|---|---|
| **Tier** (§1, §17, §18) | A — frontend-only / B — frontend + backend | All tool logic fits in the browser | You need live server-side compute (real ML training, large datasets) |
| **Chapter format** (§7) | MDX files / TSX components | Chapters are mostly prose with light components | Chapters are mostly React (charts, diagrams, custom widgets) |

The combinations seen in the wild:

- **Tier A + MDX** — Compyler, SecLayers. The default for content-heavy apps.
- **Tier B + TSX** — Foundry. The default when the subject needs real compute and rich interactivity.

Tier A + TSX or Tier B + MDX are valid but rare; pick them only with a specific reason.

### Step 1 — Substitution variables

Find and replace all template variables listed at the top of this document.

Update `app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: "{{APP_NAME}} — Your tagline",
  description: "Your description.",
};
```

Update the localStorage key in `AppContext.tsx`:
```ts
const STORAGE_KEY = "{{STORAGE_KEY}}";
```

### Step 2 — Define acts and topics (`lib/topics.ts`)

This is the first file to populate. Define acts and chapters here before writing any content.

```ts
export const TOPICS: Topic[] = [
  { num: 0, act: 0, title: "Introduction", slug: "intro", actLabel: "Prologue", toolComponent: "IntroTool", tags: ["overview"] },
  { num: 1, act: 1, title: "Core Concept A", slug: "concept-a", actLabel: "Act I — Foundations", toolComponent: "ConceptATool", tags: ["basics"] },
  // ...
] as const;

export const ACT_COLORS: Record<number, string> = { 0: "prologue", 1: "foundations" /* … */ };
export const ACT_TEXT:   Record<number, string> = { 0: "text-amber-400", 1: "text-slate-400" /* … */ };
export const ACT_BG:     Record<number, string> = { 0: "bg-amber-900/30", 1: "bg-slate-900/30" /* … */ };
export const ACT_BORDER: Record<number, string> = { 0: "border-amber-500/40", 1: "border-slate-500/40" /* … */ };
export const ACT_LABELS: Record<number, string> = { 0: "Prologue", 1: "Act I — Foundations" /* … */ };
```

### Step 3 — Add act CSS variables (`app/globals.css`)

One variable per act, matching the `ACT_COLORS` keys:

```css
:root {
  --act-prologue:    #f59e0b;
  --act-foundations: #94a3b8;
  /* one per act */
}
```

### Step 4 — Write chapter MDX (`content/chapters/{slug}.mdx`)

```mdx
# Chapter Title

Opening paragraph.

## Section

Content with optional components:

<Callout kind="warning">Common mistake.</Callout>

<DepthBlock label="advanced detail">
  Extra depth for advanced mode.
</DepthBlock>

---

## Misconception

**Myth:** "The wrong belief."

**Reality:** The correct explanation.
```

### Step 5 — Write interview questions (`content/interview/{slug}.json`)

```json
[
  { "id": "concept-a-junior-01", "question": "Explain X.", "answer": "X is...", "category": "junior" },
  { "id": "concept-a-junior-02", "question": "What is Y?", "answer": "Y is...", "category": "junior" },
  { "id": "concept-a-mid-01",    "question": "How does X affect production?", "answer": "...", "category": "mid" },
  { "id": "concept-a-mid-02",    "question": "Walk me through debugging X.", "answer": "...", "category": "mid" },
  { "id": "concept-a-senior-01", "question": "Design a system for X at scale.", "answer": "...", "category": "senior" },
  { "id": "concept-a-senior-02", "question": "What are the failure modes of X?", "answer": "...", "category": "senior" }
]
```

### Step 6 — Build a tool (`components/tools/{ToolName}Tool.tsx`)

See the pattern in [Section 11](#11-interactive-tools-system).

### Step 7 — Register the tool

**`ToolRenderer.tsx`:**
```ts
ConceptATool: dynamic(() => import("@/components/tools/ConceptATool"), { ssr: false }),
```

**`lib/tool-meta/{act}.ts`:**
```ts
ConceptATool: {
  summary: "One sentence: what this tool lets you do.",
  quickStart: ["First action", "Second thing to try", "Third step"],
  help: {
    goal: "What skill this teaches.",
    steps: ["Step 1 — do X", "Step 2 — observe Y"],
    lookFor: "What pattern to notice.",
  },
},
```

### Step 8 — Add glossary terms (`content/glossary.json`)

```json
{ "term": "Concept A", "definition": "What it is and why it matters.", "relatedTopics": ["concept-a"], "act": 1 }
```

### Step 9 — Verify

```bash
npx tsc --noEmit   # Must be clean
npm run build      # Must succeed with no prerender errors
```

---

### Architecture at a glance

```
TOPICS array (lib/topics.ts)
    │
    ├── /[slug]           ← content/chapters/{slug}.mdx
    │                        content/interview/{slug}.json
    │
    ├── /[slug]/tool      ← TOOL_META[topic.toolComponent]
    │                        ToolRenderer → dynamic import
    │
    ├── /glossary         ← content/glossary.json
    ├── /labs/[slug]      ← lib/labs.ts + components/labs/
    └── /exam             ← all interview JSONs, filtered by difficulty
```

Everything derives from `TOPICS`. Add a chapter there first; everything else follows.

---

## 22. Maintaining This Template

This document is the **shared design language** across all educational apps in the family. Each sibling app (Compyler, SecLayers, etc.) keeps a local copy of this template with substitution variables replaced.

### When to update this template

- A new shared component, convention, or pattern is introduced in one app and should be available to the others.
- A pitfall is discovered (build failure, hydration bug, MDX parse error) that future forks should avoid.
- A dependency upgrade requires a new pattern (e.g. new Next.js API, breaking change in a plugin).
- A naming convention shifts (Docker, ports, file layout, CSS variables).

### Update workflow

1. Make the change in the originating app and confirm it works.
2. Update `DESIGN_GUIDE_TEMPLATE.md` in that same app.
3. Note the change in the version history below.
4. Port the documentation change to sibling apps' copies of this file.
5. Cherry-pick or backport the code change into sibling apps when convenient.

### What does NOT belong here

- App-specific content (chapter titles, glossary terms, lab scenarios).
- One-off experiments that haven't proven out across apps yet.
- Code that hasn't been validated against the build pipeline.

### Version history

| Date | Change | Originating app |
|---|---|---|
| 2026-05-17 | Initial generic template extracted from SecLayers; added Dockerization & Build sections | Compyler |
| 2026-05-17 | Introduced Tier A / Tier B split: added optional Python/FastAPI backend section, Docker Compose + nginx topology, basePath-stripping nginx pattern, dev-mode overlay with bind mounts, Tier B Makefile, SSE streaming conventions, TSX-component chapter format, tiered-answer interview schema, visualization library guidance, and 7 new pitfalls covering nginx/SSE/compose gotchas | Foundry |
