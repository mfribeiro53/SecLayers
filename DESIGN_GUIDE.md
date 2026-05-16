# SecLayers — Design & Architecture Guide

A living reference **and reusable design template** for this codebase. Every section explains *what* exists, *where* it lives, *how* it is structured, and *why* it is done that way. Template callouts show how to adapt each pattern for a new educational domain.

Update this document whenever a pattern changes, a new system is added, or a convention is established.

> **Current state:** 2026-05-16 · 43 chapters · 229 glossary terms · 10 CTF labs  
> **Template substitution variables** (replace when forking):  
> `APP_NAME` = SecLayers · `DOMAIN` = AppSec · `ACT_COUNT` = 8 · `CHAPTER_COUNT` = 44

---

## Table of Contents

1. [Project Overview & Stack](#1-project-overview--stack)
2. [Repository Layout](#2-repository-layout)
3. [Theme & Design System](#3-theme--design-system)
4. [Global Layout & Shell](#4-global-layout--shell)
5. [Application State (AppContext)](#5-application-state-appcontext)
6. [Topic System](#6-topic-system)
7. [Chapter Pages (MDX)](#7-chapter-pages-mdx)
8. [Chapter Shell & Navigation](#8-chapter-shell--navigation)
9. [Content Components (Callout, DepthBlock, CodeBlock)](#9-content-components)
10. [Interview & Misconception System](#10-interview--misconception-system)
11. [Interactive Tools System](#11-interactive-tools-system)
12. [CTF Labs System](#12-ctf-labs-system)
13. [Glossary](#13-glossary)
14. [Exam Page](#14-exam-page)
15. [Data Files & Schemas](#15-data-files--schemas)
16. [Key Conventions & Pitfalls](#16-key-conventions--pitfalls)
17. [Adding a New Chapter — Checklist](#17-adding-a-new-chapter--checklist)
18. [Forking for a New Domain — Template Guide](#18-forking-for-a-new-domain--template-guide)

---

## 1. Project Overview & Stack

**SecLayers** is a purely client-side interactive AppSec learning platform. There is no backend. All computation (tool logic, lab exploit simulation, interview questions, glossary) runs in the browser.

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| MDX | `next-mdx-remote/rsc` (server component rendering) |
| MDX plugins | `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight` |
| Icons | `lucide-react` |
| Font | `Inter` via `next/font/google` |

### Key design decisions

- **No backend.** Everything is either statically generated or runs in the browser. Avoids infrastructure cost and latency.
- **MDX for chapter prose.** Writers edit Markdown; custom components (`<Callout>`, `<DepthBlock>`, `<CodeBlock>`) are available as JSX.
- **Tools are dynamic imports with `ssr: false`.** Prevents hydration errors from canvas, `window`, and `document` APIs.
- **Content and code are colocated.** Each chapter's MDX, interview JSON, and tool component share a common slug as their identifier.

> **Template note:** This stack works for any educational domain. Replace AppSec content with your domain (e.g. ML, DevOps, Systems Design). The only domain-specific parts are the CSS act colors, the `TOPICS` array, and the content files — the shell, routing, and component patterns are generic.

---

## 2. Repository Layout

```
SecLayer/
├── app/
│   ├── layout.tsx               # Root layout — Sidebar + TopNav + footer shell
│   ├── globals.css              # CSS variables, .prose styles, .tool-surface, semantic utils
│   ├── page.tsx                 # Home page (static)
│   ├── [slug]/
│   │   ├── page.tsx             # Chapter page — MDX rendering + ChapterShell
│   │   ├── loading.tsx          # Skeleton shown while chapter MDX loads
│   │   └── tool/
│   │       ├── page.tsx         # Tool page — ToolIntro + ToolRenderer + ToolHelpButton
│   │       └── loading.tsx
│   ├── glossary/
│   │   └── page.tsx             # Full searchable glossary (client component)
│   ├── labs/
│   │   ├── page.tsx             # Labs listing page
│   │   └── [slug]/
│   │       └── page.tsx         # Individual CTF lab
│   ├── exam/
│   │   └── page.tsx             # Final exam (shuffled interview questions)
│   ├── error.tsx                # Error boundary
│   └── not-found.tsx            # 404 page
│
├── components/
│   ├── layout/
│   │   └── ChapterShell.tsx     # Chapter wrapper: header, prose, misconception, tool link, nav
│   ├── ui/
│   │   ├── AppContext.tsx        # Global React context + localStorage hydration
│   │   ├── Sidebar.tsx          # Left nav: acts, chapters, progress
│   │   ├── TopNav.tsx           # Sticky header: depth, interview mode, tools button, glossary
│   │   ├── GlossaryPanel.tsx    # Slide-in glossary panel (keyboard shortcut: g)
│   │   ├── ToolsModal.tsx       # Full-screen tool catalog
│   │   ├── ToolIntro.tsx        # Standard tool page header (summary + quick-start)
│   │   ├── ToolHelpButton.tsx   # Help modal for tools (goal / steps / lookFor)
│   │   ├── ToolRenderer.tsx     # Dynamic-import registry for all tool components
│   │   ├── ToolShell.tsx        # Optional card wrapper for tool content areas
│   │   ├── Callout.tsx          # MDX callout box (insight / warning / danger / info)
│   │   ├── DepthBlock.tsx       # Beginner/advanced content gating
│   │   ├── CodeBlock.tsx        # Syntax-highlighted code block with copy button
│   │   ├── InterviewCard.tsx    # Interview questions accordion (interview mode)
│   │   └── MisconceptionCard.tsx # Myth/reality card rendered below every chapter
│   ├── tools/                   # 43 interactive tool components (one per chapter)
│   └── labs/                    # 10 CTF lab components + _shared.tsx
│
├── lib/
│   ├── topics.ts                # TOPICS array + ACT_* color maps + helper functions
│   ├── tool-meta/               # Tool metadata split by act (summary, quickStart, help)
│   │   ├── index.ts             # Merges all act files into TOOL_META record
│   │   ├── types.ts             # ToolMeta / ToolHelp interfaces
│   │   ├── prologue.ts
│   │   ├── foundations.ts
│   │   ├── web.ts
│   │   ├── api.ts
│   │   ├── mobile.ts
│   │   ├── systems.ts
│   │   ├── cloud.ts
│   │   └── supply-chain.ts
│   └── labs.ts                  # LAB_REGISTRY + groupLabsByAct helper
│
├── content/
│   ├── chapters/                # One .mdx file per chapter (named by slug)
│   │   ├── threat-modeling.mdx
│   │   ├── sql-injection.mdx
│   │   └── … (43 total)
│   ├── interview/               # One .json file per chapter (named by slug)
│   │   ├── threat-modeling.json
│   │   ├── sql-injection.json
│   │   └── … (43 total)
│   └── glossary.json            # 229 AppSec terms with definitions and act mapping
│
├── types/
│   └── index.ts                 # Shared TypeScript interfaces (Topic, GlossaryEntry, etc.)
│
├── DESIGN_GUIDE.md              # This file
└── Seclayers_plan.md            # Product roadmap and chapter planning doc
```

---

## 3. Theme & Design System

### CSS custom properties (`app/globals.css`)

All colors use CSS variables. Never hardcode hex values in components — use the variables.

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
  --text-primary:   #e6e9f5;  /* Main text */
  --text-secondary: #aab0c6;  /* Prose, descriptions */
  --text-muted:     #6d748d;  /* Labels, timestamps, hints */

  /* Brand */
  --accent:      #6366f1;               /* Indigo — links, focus rings, CTAs */
  --accent-soft: rgba(99,102,241,0.15); /* Accent tint for backgrounds */

  /* Act accent colors — one per security domain */
  --act-attacker:    #f59e0b;  /* Amber   — Prologue */
  --act-foundations: #94a3b8;  /* Slate   — Foundations */
  --act-web:         #60a5fa;  /* Blue    — Act I Web */
  --act-api:         #a78bfa;  /* Violet  — Act II API */
  --act-mobile:      #34d399;  /* Emerald — Act III Mobile */
  --act-systems:     #fb923c;  /* Orange  — Act IV Systems */
  --act-cloud:       #fb7185;  /* Rose    — Act V Cloud */
  --act-supply-chain:#22d3ee;  /* Cyan    — Act VI Supply Chain */
}
```

### Act color system

The 44 topics are grouped into 8 acts (0–7). Each act has an accent color used in the chapter header, sidebar, tags, and tool UI. The mapping lives in `lib/topics.ts`.

> **Template note:** Acts are your top-level subject groupings. Choose one color per group. The act number (0–N) is the only thing that needs to change — all downstream UI derives from it automatically.

```ts
// The string key maps to the --act-* CSS variable name
export const ACT_COLORS: Record<number, string> = {
  0: "attacker",      // Prologue
  1: "foundations",
  2: "web",
  3: "api",
  4: "mobile",
  5: "systems",
  6: "cloud",
  7: "supply-chain",
};

// Tailwind text / bg / border classes for act-colored UI
export const ACT_TEXT: Record<number, string> = {
  0: "text-amber-400",
  1: "text-slate-400",
  2: "text-blue-400",
  3: "text-violet-400",
  4: "text-emerald-400",
  5: "text-orange-400",
  6: "text-rose-400",
  7: "text-cyan-400",
};

export const ACT_BG:     Record<number, string> = { … };  // bg-*-900/30
export const ACT_BORDER: Record<number, string> = { … };  // border-*-500/40
```

**Usage pattern:** anywhere you need the act CSS variable value inline:
```tsx
const actColor = `var(--act-${ACT_COLORS[topic.act]})`;
// e.g. var(--act-web) → #60a5fa
```

For Tailwind classes (sidebar, chapter headers):
```tsx
<div className={`${ACT_BG[topic.act]} ${ACT_BORDER[topic.act]}`}>…</div>
```

### Prose styles (`.prose`)

Chapter MDX content is wrapped in `<div className="prose max-w-none">`. The `.prose` class is defined entirely in `globals.css` (not Tailwind Typography) and applies dark-mode aware styles for:

- `h1–h4`, `p`, `strong`, `em`, `a`, `ul`, `ol`, `li`, `hr`
- `blockquote` → rendered as a left-bordered callout with `--accent`
- Inline `code` → lavender (`#c4b5fd`), dark background, border
- `pre code` → `github-dark` from highlight.js, dark bg `#0d1117`
- Tables → rounded, dark header row, alternating hover

One intentional quirk: `h1:first-child { display: none }` — the chapter title is already displayed in the `<ChapterShell>` header card, so the H1 from the MDX file is suppressed to avoid duplication.

### `.tool-surface` class

Interactive tool components apply `tool-surface` to their container div. This class remaps light-mode Tailwind utilities to dark-mode equivalents without modifying every individual class:

```css
/* Inputs */
.tool-surface input, .tool-surface select, .tool-surface textarea {
  background-color: var(--bg-elevated);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

/* Remaps: bg-blue-600 → var(--accent), bg-red-600 → #ef4444, etc. */
.tool-surface .bg-blue-600 { background-color: var(--accent); }
```

This allows reusing standard Tailwind color classes in tools without them rendering incorrectly on the dark background.

### Semantic tint utilities

Instead of `bg-red-50 text-red-800` (light-mode), use the semantic utility classes from `globals.css`:

```
.bg-danger-subtle   .border-danger-subtle   .text-danger
.bg-success-subtle  .border-success-subtle  .text-success
.bg-warning-subtle  .border-warning-subtle  .text-warning
.bg-info-subtle     .border-info-subtle     .text-info
.bg-orange-subtle   .bg-purple-subtle       .bg-cyan-subtle  …
```

These are RGBA values that work correctly on dark surfaces.

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
│                 │  Footer (copyright, shrink-0)           │
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
      <footer className="shrink-0 py-2 px-6 text-center text-xs …">…</footer>
    </div>
  </div>
  <GlossaryPanel />
</AppProvider>
```

**Critical:** `overflow-hidden` on the outer flex container is intentional. Without it, the page scrolls as a whole and the sidebar/TopNav scroll away. Only `<main>` should scroll.

### Sidebar (`components/ui/Sidebar.tsx`)

Fixed left panel, `w-64`. From top to bottom:
1. **Logo** — app name + tagline, links to `/`
2. **Progress bar** — `completedTopics.size / TOPICS.length`, color based on percentage
3. **Chapter list** — grouped by act with act-color label. Active chapter: `border-l-2` in act color. Completed: checkmark icon.
4. **Bottom links** — Glossary, Labs, Exam

### TopNav (`components/ui/TopNav.tsx`)

Sticky header, `z-40`. Three zones:

| Zone | Content |
|---|---|
| Left | Depth mode segmented control (`beginner` / `advanced`) |
| Center | Interview mode toggle + difficulty buttons (`junior` / `mid` / `senior`) |
| Right | Tools catalog button (opens `ToolsModal`) + Glossary button (opens `GlossaryPanel`) |

The `G` keyboard shortcut chip on the glossary button reflects the actual `g` key shortcut registered in `GlossaryPanel.tsx`.

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

  completedTopics: Set<number>;        // chapter nums, persisted
  markTopicComplete: (n: number) => void;

  glossaryOpen: boolean;
  setGlossaryOpen: (v: boolean) => void;
}
```

**localStorage key:** `seclayers-completed` — JSON array of completed chapter `num` values.

Hydrated once on mount via `useEffect`. The `Set` is serialized as `JSON.stringify([...set])` and deserialized as `new Set(JSON.parse(saved))`.

```tsx
import { useApp } from "@/components/ui/AppContext";
const { depthMode, interviewMode, difficulty, completedTopics } = useApp();
```

`useApp()` throws if called outside `<AppProvider>`, with a clear error message.

---

## 6. Topic System

### `TOPICS` array (`lib/topics.ts`)

The **single source of truth** for all chapter metadata. Every route, sidebar entry, tool page, and exam question derives from this array.

> **Template note:** This is the first file to populate when creating a new educational app. Define your acts and chapters here before writing any content. Every other system (routing, sidebar, tool pages, glossary filters, exam) auto-derives from this array.

```ts
export const TOPICS: Topic[] = [
  { num: 0,  act: 0, title: "The Attacker's Mindset", slug: "attacker-mindset",
    actLabel: "Prologue",  toolComponent: "KillChainPlannerTool",  tags: ["kill-chain", "recon"] },
  { num: 1,  act: 1, title: "Threat Modeling with STRIDE", slug: "threat-modeling",
    actLabel: "Foundations", toolComponent: "DfdBuilderTool", tags: ["stride", "design"] },
  // … 43 entries total (num 0–43)
] as const;
```

**Fields:**

| Field | Type | Purpose |
|---|---|---|
| `num` | number | Chapter number (0 = Prologue, 1–43 = chapters). Used in localStorage and nav. |
| `act` | number | Act group (0–7). Drives all color theming. |
| `title` | string | Display name in sidebar, header, breadcrumbs. |
| `slug` | string | Kebab-case ID. Used in URLs (`/[slug]`), MDX filenames, interview JSON filenames. |
| `actLabel` | string | Human-readable act label for the chapter header. |
| `toolComponent` | string | Name of the React component in `ToolRenderer.tsx` and the key in `TOOL_META`. |
| `tags` | string[] | Tag chips shown in the chapter header card. |

### Helper functions

```ts
getTopicBySlug(slug: string): Topic | undefined
getAdjacentTopics(slug: string): { current, prev, next } | null
```

### Static route generation

The chapter page uses:
```ts
export function generateStaticParams() {
  return TOPICS.map((topic) => ({ slug: topic.slug }));
}
```

Same pattern for the tool page (`/[slug]/tool`), filtered to only topics with a `TOOL_META` entry.

---

## 7. Chapter Pages (MDX)

**Route:** `app/[slug]/page.tsx` — a server component.

### Loading flow

```
1. params.slug → getAdjacentTopics() → topic, prev, next
2. fs.readFile("content/chapters/{slug}.mdx") — chapter prose
3. fs.readFile("content/interview/{slug}.json") — interview questions
4. parseMisconceptionSection(rawSource) — strips the ## Misconception section
   from the MDX (rendered separately in MisconceptionCard)
5. MDXRemote renders the remaining source with remarkGfm, remarkMath,
   rehypeKatex, rehypeHighlight, and the custom component map
6. ChapterShell receives: topic, misconception, interviewQuestions, prev, next
```

### MDX component map

Only three custom components are available in chapter MDX files:

| Component | Usage |
|---|---|
| `<Callout kind="info|warning|danger|insight">` | Callout boxes |
| `<DepthBlock label="...">` | Advanced-only collapsible content |
| `<CodeBlock language="..." title="...">` | Copy-button code block |

Everything else is standard Markdown rendered via `.prose` CSS.

### Misconception extraction

Every chapter MDX file should end with a `## Misconception` (or `## Common Misconception`) section in one of two formats:

```markdown
## Misconception

**Myth:** "The myth text"

**Reality:** The corrected reality…
```

or (used in some supply chain chapters):
```markdown
## Misconception

**"The myth text"** The corrected reality…
```

The server parses this section out of the MDX source before rendering, strips it, and passes `{ myth, reality }` to `ChapterShell` so `MisconceptionCard` can render it in its own styled container.

### Fallback for missing MDX

If `content/chapters/{slug}.mdx` doesn't exist, the page renders a placeholder paragraph. The chapter still appears in the sidebar and routing still works.

---

## 8. Chapter Shell & Navigation

`components/layout/ChapterShell.tsx` — a client component (needs `useApp()`).

### Layout

```
<article max-w-4xl mx-auto px-6 py-10>
  ├── <header>   Chapter header card (act color, title, tags, depth badge)
  ├── <div .prose>   MDX content (children)
  ├── <section>  MisconceptionCard
  ├── <section>  Tool link → /{slug}/tool
  ├── <section>  InterviewCard (only if interviewMode && questions.length > 0)
  └── <nav>      Prev / Mark Complete / Next
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

Tag chips and the depth badge both use `color-mix()` against the act color variable for consistent theming.

### Tool link

Every chapter has a prominent link to its tool at the bottom of the prose:
```tsx
<Link href={`/${topic.slug}/tool`} …>
  <span style={{ background: actColor }} />
  Interactive Tool
  <span style={{ color: actColor }}>Open →</span>
</Link>
```

### Mark Complete

Calls `markTopicComplete(topic.num)` from AppContext, which adds the num to `completedTopics` and persists to localStorage. The button is non-reversible (no "un-mark").

---

## 9. Content Components

### `<Callout>` (`components/ui/Callout.tsx`)

Four kinds, each with a distinct icon, accent color, and label:

| `kind` | Color | Icon | Default label |
|---|---|---|---|
| `insight` | Chapter accent (inherits `--chapter-accent`) | Lightbulb | "Key Insight" |
| `warning` | Amber `#fbbf24` | Triangle | "Warning" |
| `danger` | Red `#f87171` | Circle-exclamation | "Critical" |
| `info` | Cyan `#67e8f9` | Circle-i | "Note" |

```mdx
<Callout kind="warning">
  Never use MD5 for password hashing.
</Callout>

<Callout kind="info" title="RFC 6238">
  TOTP generates a 6-digit code every 30 seconds.
</Callout>
```

The `insight` kind uses `var(--chapter-accent, #a5b4fc)` — this CSS variable would be set per chapter if chapter-level theming is added in the future. Currently falls back to indigo.

### `<DepthBlock>` (`components/ui/DepthBlock.tsx`)

Wraps advanced content. In beginner mode it renders a `▶ Show [label]` toggle. In advanced mode it always shows with a subtle left border.

```mdx
<DepthBlock label="why ECDHE gives forward secrecy">
  Each TLS handshake generates an ephemeral key pair…
</DepthBlock>
```

### `<CodeBlock>` (`components/ui/CodeBlock.tsx`)

Dark code block with a copy-to-clipboard button. Used in MDX when you need a titled block or copy functionality. Plain fenced code blocks (` ``` `) are handled by rehype-highlight and styled via `.prose pre`.

```mdx
<CodeBlock language="python" title="vuln.py" code={`
import pickle
pickle.loads(user_data)  # arbitrary code execution
`} />
```

### `<ToolShell>` (`components/ui/ToolShell.tsx`)

Optional wrapper for tool content panels. Adds a header bar with title, optional description, and an "IN-BROWSER" badge. Inner content gets the `.tool-surface` class.

```tsx
<ToolShell title="Stack Frame Visualizer" description="Call a function to see its frame">
  {/* tool UI */}
</ToolShell>
```

---

## 10. Interview & Misconception System

### Data source: per-chapter JSON files

Each chapter has its own file at `content/interview/{slug}.json`. The schema is a flat array:

```ts
// types/index.ts
interface InterviewQuestion {
  id: string;          // e.g. "sqli-junior-01"
  question: string;
  answer: string;      // Markdown-formatted long answer
  category: "junior" | "mid" | "senior";
}
```

```json
[
  {
    "id": "sqli-junior-01",
    "question": "What is SQL injection and how does it work?",
    "answer": "SQL injection inserts malicious SQL into…",
    "category": "junior"
  }
]
```

**Convention:** 2 questions per category (6 total per chapter), id format: `{slug-prefix}-{category}-{nn}`.

The chapter page loads this file server-side, parses it, and passes the array as `interviewQuestions` to `ChapterShell`.

### `<InterviewCard>` (`components/ui/InterviewCard.tsx`)

Rendered only when `interviewMode === true` in AppContext AND the chapter has questions. Reads `difficulty` from AppContext to filter displayed questions.

```
Container: rounded-2xl, amber tint
├── Header: "Interview Questions" + difficulty badge
└── Questions filtered to current difficulty
    Each question: collapsible card
    ├── Question text (button to expand)
    └── Answer (MDX-like text with markdown formatting)
```

Difficulty colors:
```ts
{ junior: "text-green-400", mid: "text-blue-400", senior: "text-purple-400" }
```

### `<MisconceptionCard>` (`components/ui/MisconceptionCard.tsx`)

Always shown below chapter prose, regardless of interview mode. Receives `{ myth, reality }` extracted from the MDX file by the server page component.

```
Container: rounded-2xl, red tint
├── "✗" in red — myth text in text-red-300
└── "→" — reality text in text-secondary
```

---

## 11. Interactive Tools System

### Architecture

Each tool is a three-layer stack:

```
/[slug]/tool (page.tsx)
  └── ToolIntro          — summary + quick-start steps
  └── ToolRenderer       — dynamic import of the actual tool component
  └── ToolHelpButton     — "How to use this tool" modal
```

### Tool metadata (`lib/tool-meta/`)

Tool metadata is defined separately from the tool components, split into one file per act. Each file exports a partial `Record<string, ToolMeta>`:

```ts
// lib/tool-meta/types.ts
interface ToolHelp {
  goal: string;       // One sentence: what skill this tool teaches
  steps: string[];    // Ordered "how to use it" steps
  lookFor?: string;   // Optional: what to notice / what it means
}

interface ToolMeta {
  summary: string;       // One-sentence description (shown in ToolIntro)
  quickStart: string[];  // 3-4 "Try this first" bullet steps
  help?: ToolHelp;       // Optional help modal content
}
```

All act files are merged in `lib/tool-meta/index.ts`:
```ts
export const TOOL_META: Record<string, ToolMeta> = {
  ...prologueMeta,
  ...foundationsMeta,
  ...webMeta,
  ...apiMeta,
  ...mobileMeta,
  ...systemsMeta,
  ...cloudMeta,
  ...supplyChainMeta,
};
```

The key in `TOOL_META` must exactly match the `toolComponent` field in `TOPICS`.

### Tool page (`app/[slug]/tool/page.tsx`)

A server component. Static params generated from `TOPICS` filtered to entries where `TOOL_META[topic.toolComponent]` exists (i.e., tool is implemented). If no meta exists, returns 404.

```tsx
<div className="px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full">
  <ToolIntro topic={topic} summary={meta.summary} quickStart={meta.quickStart} />
  <ToolRenderer toolComponent={topic.toolComponent} />
  {meta?.help && <ToolHelpButton goal={…} steps={…} lookFor={…}>…</ToolHelpButton>}
</div>
```

Tool pages use `max-w-5xl` (wider than chapter prose `max-w-4xl`).

### `ToolRenderer` (`components/ui/ToolRenderer.tsx`)

A client component holding the `TOOLS` dynamic import registry:

```ts
const TOOLS: Record<string, React.ComponentType> = {
  KillChainPlannerTool: dynamic(() => import("@/components/tools/KillChainPlannerTool"), { ssr: false }),
  DfdBuilderTool:       dynamic(() => import("@/components/tools/DfdBuilderTool"),       { ssr: false }),
  // … one entry per tool component
};

export function ToolRenderer({ toolComponent }: { toolComponent: string }) {
  const Tool = TOOLS[toolComponent];
  if (!Tool) return null;
  return <Tool />;
}
```

**Critical:** every tool import must use `ssr: false`. Tools access browser APIs (`window`, `canvas`, `document`) that fail during server rendering.

### `<ToolIntro>` (`components/ui/ToolIntro.tsx`)

Standard header block at the top of every tool page. Renders:
- Act label + chapter number breadcrumb (links to `/{slug}`)
- Chapter title
- Tool summary sentence
- Quick-start numbered list in a bordered card

### `<ToolHelpButton>` (`components/ui/ToolHelpButton.tsx`)

Help icon that opens a `createPortal` modal with three sections:
- **Goal** — what skill this tool teaches
- **Steps** — ordered how-to list
- **Look for** (optional) — what patterns to notice

Uses the `mounted` guard pattern to avoid SSR errors:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
return createPortal(<Modal />, document.body);
```

### Tool component patterns

Tool components (`components/tools/`) are plain React client components. Common patterns:

- **State:** `useState` for all controls; `useMemo` for expensive derived values
- **Colors:** Use CSS variables (`var(--accent)`, `var(--bg-surface)`, etc.) or semantic utility classes
- **Styling:** Apply `tool-surface` class to the root container (or use `<ToolShell>`)
- **Dark-mode inputs:** Inherit from `.tool-surface` — no per-input dark styles needed
- **Act color:** Many tools highlight act-specific elements using `var(--act-${ACT_COLORS[act]})` passed from the tool page, or hardcode the act color for their specific chapter

### `ToolsModal` (`components/ui/ToolsModal.tsx`)

Full-screen catalog of all tools, opened from TopNav. Groups tools by act using the same color maps. Each entry links to `/{slug}/tool`.

---

## 12. CTF Labs System

Labs are fully client-side exploit simulations — no real backend, no real vulnerabilities.

### Data source (`lib/labs.ts`)

```ts
interface Lab {
  slug: string;
  title: string;
  objective: string;   // One-sentence goal shown on the listing card
  act: number;         // Which act this lab belongs to
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const LAB_REGISTRY: Lab[] = [ … ];
export function groupLabsByAct(): Record<number, Lab[]> { … }
```

### Routes

- `/labs` — listing page, groups labs by act, links to `/labs/[slug]`
- `/labs/[slug]` — individual lab rendered by `LabRenderer`

### Lab components (`components/labs/`)

Each lab is a standalone React component. A shared `_shared.tsx` exports reusable primitives (flag display, hint system, submit button).

`LabRenderer` (`components/labs/LabRenderer.tsx`) routes by slug:
```ts
const LABS: Record<string, React.ComponentType> = {
  "sqli-basic":    SQLiLabTool,
  "xss-reflected": XSSLabTool,
  // …
};
```

### Current labs

| Slug | Topic |
|---|---|
| `sqli-basic` | SQL injection — UNION-based flag extraction |
| `xss-reflected` | Reflected XSS — script injection |
| `csrf-token` | CSRF — token bypass |
| `idor-object` | IDOR — horizontal privilege escalation |
| `broken-api` | Broken API auth |
| `graphql-introspection` | GraphQL schema leakage |
| `mobile-storage` | Insecure storage flag |
| `mobile-tls` | TLS misconfiguration |
| `mobile-intent` | Intent hijacking |

---

## 13. Glossary

### Data source (`content/glossary.json`)

```ts
// types/index.ts
interface GlossaryEntry {
  term: string;
  definition: string;
  relatedTopics: string[];   // Array of chapter slugs
  act: number;               // 1–7 — drives the act filter on the glossary page
}
```

Terms do not need to be sorted — both the page and the panel sort alphabetically at runtime.

**Current size:** 229 terms across all 8 acts.

### Glossary page (`app/glossary/page.tsx`)

Client component with:
- **Search input** — fuzzy match on `term`, `definition`, and `relatedTopics`
- **Act filter pills** — one per act; active pill shows act color as background
- **Term cards** — `relatedTopics` slugs rendered as monospace chips that link to `/{slug}`

### `<GlossaryPanel>` (`components/ui/GlossaryPanel.tsx`)

Right-side slide-in panel, `fixed inset-0 z-50`. Toggled by:
- The "Glossary" button in TopNav
- The `g` key (when no input is focused)
- `Escape` to close

The panel has its own search input and A-Z jump navigation.

---

## 14. Exam Page

`app/exam/page.tsx` — pure client component.

**How it works:**
1. Loads all interview JSON files (imported statically at build time via a barrel or dynamic `require`)
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
  num: number;           // Chapter number (0–43)
  act: number;           // Act number (0–7)
  title: string;
  slug: string;          // URL slug and file name base
  actLabel: string;      // e.g. "Act I — Web Security"
  toolComponent: string; // Key in TOOL_META and ToolRenderer
  tags: readonly string[];
}
```

### `content/chapters/{slug}.mdx`

Standard Markdown + GFM + math. Available custom components: `<Callout>`, `<DepthBlock>`, `<CodeBlock>`. Must end with a `## Misconception` section — the server parser strips it and passes it to `MisconceptionCard`.

### `content/interview/{slug}.json`

```ts
Array<{
  id: string;          // "{slug-prefix}-{category}-{nn}"
  question: string;
  answer: string;      // Multi-paragraph markdown string
  category: "junior" | "mid" | "senior";
}>
```

Convention: 2 questions per category, 6 total per chapter.

### `content/glossary.json`

```ts
Array<{
  term: string;
  definition: string;
  relatedTopics: string[];   // Chapter slugs
  act: number;               // 0–7
}>
```

### `lib/tool-meta/{act}.ts`

```ts
Record<string, {
  summary: string;
  quickStart: string[];
  help?: {
    goal: string;
    steps: string[];
    lookFor?: string;
  };
}>
```

---

## 16. Key Conventions & Pitfalls

### 1. `lib/topics.ts` is the single source of truth

Never hardcode chapter numbers, slugs, or act labels anywhere else. The sidebar, tool pages, chapter pages, static params, and exam all derive from `TOPICS`. If you add a chapter, add it here first.

### 2. `toolComponent` is the join key across three systems

The string in `topic.toolComponent` must match:
- The key in `ToolRenderer`'s `TOOLS` record (dynamic import)
- The key in `TOOL_META` (from `lib/tool-meta/`)
- The component name exported from `components/tools/`

If any of these three are out of sync, the tool page returns 404 or renders nothing.

### 3. Tool imports must use `ssr: false`

Tools use browser APIs. Dynamic import with `{ ssr: false }` prevents Next.js from trying to render them on the server. Forgetting this causes hydration errors or build failures.

### 4. MDX components must be explicitly passed

`MDXRemote` in `app/[slug]/page.tsx` receives a `components` prop:
```ts
components={{ Callout, DepthBlock, CodeBlock }}
```
A component used in MDX but not registered here will render as plain text. New content components must be added here.

### 5. The `## Misconception` section is stripped from MDX

The chapter page server-parses the MDX source before rendering and removes the final `## Misconception` section. Do not render it a second time inside the prose — it will be empty or absent.

### 6. Interview question `category` maps to `difficulty` in AppContext

The JSON uses `"junior" | "mid" | "senior"`. The AppContext `difficulty` state uses the same values. `InterviewCard` filters `questions.filter(q => q.category === difficulty)`.

### 7. Tool pages use `max-w-5xl`, chapter pages use `max-w-4xl`

Tool UIs need more horizontal space. Stick to this convention.

### 8. Act CSS variable pattern

When you need the act color as an inline style value:
```tsx
const actColor = `var(--act-${ACT_COLORS[topic.act]})`;
style={{ color: actColor, borderColor: actColor }}
```

When you need Tailwind classes: use `ACT_TEXT[act]`, `ACT_BG[act]`, `ACT_BORDER[act]`.

Do not mix the two approaches in the same element.

### 9. Semantic utility classes for tool UI colors

Inside tool components, use `.bg-danger-subtle`, `.text-danger`, etc. from `globals.css` instead of light-mode Tailwind tint classes (`bg-red-50 text-red-800`). Those tint classes don't read on dark backgrounds.

### 10. Modal portaling pattern

Both `ToolsModal` and `ToolHelpButton` use `createPortal(jsx, document.body)` to escape `overflow-hidden` stacking contexts. Requires the `mounted` guard:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null;
return createPortal(<Modal />, document.body);
```

### 11. Keyboard shortcuts

| Key | Action | Registered in |
|---|---|---|
| `g` | Open GlossaryPanel | `GlossaryPanel.tsx` |
| `Escape` | Close any open modal/panel | Each modal/panel individually |

Both check that no input element is currently focused before firing.

### 12. Progress is stored by chapter `num`, not slug

`completedTopics` is a `Set<number>` of topic `num` values. If a chapter is ever renumbered, existing localStorage data will be stale. Prefer adding chapters at the end of an act.

---

## 17. Adding a New Chapter — Checklist

Follow this order to avoid broken states:

- [ ] **`lib/topics.ts`** — add entry to `TOPICS` at the correct position. Assign `num`, `act`, `slug`, `toolComponent`, `tags`. If inserting mid-list, renumber subsequent entries.
- [ ] **`content/chapters/{slug}.mdx`** — write the chapter prose. End with `## Misconception` section.
- [ ] **`content/interview/{slug}.json`** — write 6 interview questions (2 per `junior`/`mid`/`senior`).
- [ ] **`components/tools/{ToolName}Tool.tsx`** — implement the tool component. Apply `.tool-surface` class.
- [ ] **`components/ui/ToolRenderer.tsx`** — add dynamic import entry in the `TOOLS` record.
- [ ] **`lib/tool-meta/{act}.ts`** — add `ToolMeta` entry (summary, quickStart, help). Key must match `toolComponent`.
- [ ] **`content/glossary.json`** — add any new terms introduced by the chapter.
- [ ] **TypeScript check** — `npx tsc --noEmit`. Must produce no output.

---

## 18. Forking for a New Domain — Template Guide

This section is a self-contained blueprint for building a new interactive educational app using the SecLayers architecture. Replace `YOUR_DOMAIN` with your subject area (e.g. "MLSystems", "DevOps", "TypeScript Internals").

### Step 1 — Define your acts and color palette

Open `lib/topics.ts` and replace the `TOPICS` array and all color maps. This drives everything else.

```ts
// lib/topics.ts — TEMPLATE
export const TOPICS: Topic[] = [
  // Act 0: Prologue / Mindset (optional)
  { num: 0, act: 0, title: "Introduction",     slug: "intro",     actLabel: "Prologue",      toolComponent: "IntroTool",   tags: ["overview"] },

  // Act 1: Foundations
  { num: 1, act: 1, title: "Core Concept A",   slug: "concept-a", actLabel: "Foundations",   toolComponent: "ConceptATool", tags: ["basics"] },
  { num: 2, act: 1, title: "Core Concept B",   slug: "concept-b", actLabel: "Foundations",   toolComponent: "ConceptBTool", tags: ["basics"] },

  // Act 2: Advanced Topic Group
  { num: 3, act: 2, title: "Advanced Topic 1", slug: "topic-1",   actLabel: "Act I — ...",   toolComponent: "Topic1Tool",   tags: ["advanced"] },
  // ... add more
] as const;

// One CSS variable name per act (maps to --act-* in globals.css)
export const ACT_COLORS: Record<number, string> = {
  0: "intro",       // --act-intro
  1: "foundations", // --act-foundations
  2: "advanced",    // --act-advanced
};

// Tailwind classes — pick a distinct color per act
export const ACT_TEXT:   Record<number, string> = { 0: "text-amber-400", 1: "text-slate-400", 2: "text-blue-400" };
export const ACT_BG:     Record<number, string> = { 0: "bg-amber-900/30", 1: "bg-slate-900/30", 2: "bg-blue-900/30" };
export const ACT_BORDER: Record<number, string> = { 0: "border-amber-500/40", 1: "border-slate-500/40", 2: "border-blue-500/40" };
export const ACT_LABELS: Record<number, string> = { 0: "Prologue", 1: "Foundations", 2: "Act I — Advanced" };
```

### Step 2 — Add act CSS variables

In `app/globals.css`, add a CSS variable for each act color you defined above:

```css
:root {
  /* Replace or extend these with your act colors */
  --act-intro:       #f59e0b;
  --act-foundations: #94a3b8;
  --act-advanced:    #60a5fa;
  /* ... */
}
```

### Step 3 — Write chapter MDX content

For each entry in `TOPICS`, create `content/chapters/{slug}.mdx`. Every MDX file must:

1. Start with an `# H1 Title` (it will be suppressed in rendering — the chapter header shows the title from `TOPICS`)
2. Use `<Callout>`, `<DepthBlock>`, `<CodeBlock>` as needed
3. End with a `## Misconception` section:

```mdx
# Your Chapter Title

Opening paragraph explaining the topic.

## Section One

Content…

<Callout kind="warning">
  Common mistake to avoid.
</Callout>

<DepthBlock label="deep dive into X">
  Advanced explanation only shown to advanced-mode learners.
</DepthBlock>

---

## Misconception

**Myth:** The common wrong belief about this topic.

**Reality:** The correct explanation, supported by evidence.
```

### Step 4 — Write interview questions

For each chapter, create `content/interview/{slug}.json`:

```json
[
  {
    "id": "concept-a-junior-01",
    "question": "Explain X in simple terms.",
    "answer": "X is... [multi-paragraph markdown answer]",
    "category": "junior"
  },
  {
    "id": "concept-a-junior-02",
    "question": "What is the difference between X and Y?",
    "answer": "The key difference is...",
    "category": "junior"
  },
  {
    "id": "concept-a-mid-01",
    "question": "How does X affect Y in a production system?",
    "answer": "In production...",
    "category": "mid"
  },
  {
    "id": "concept-a-mid-02",
    "question": "Walk me through debugging X.",
    "answer": "First, identify...",
    "category": "mid"
  },
  {
    "id": "concept-a-senior-01",
    "question": "Design a system that handles X at scale.",
    "answer": "At scale, the trade-offs are...",
    "category": "senior"
  },
  {
    "id": "concept-a-senior-02",
    "question": "What are the failure modes of X?",
    "answer": "The primary failure modes...",
    "category": "senior"
  }
]
```

Convention: **6 questions per chapter, 2 per level.**

### Step 5 — Build a tool component

Create `components/tools/{ToolName}Tool.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export function ConceptATool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function handleRun() {
    // All logic runs client-side — no API calls needed
    setResult(`Result for: ${input}`);
  }

  return (
    <ToolShell title="Concept A Explorer" description="Experiment with Concept A interactively">
      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input…"
          className="flex-1 px-3 py-2 rounded-lg text-sm border"
        />
        <button
          onClick={handleRun}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Run
        </button>
      </div>

      {/* Output */}
      {result && (
        <div className="p-4 rounded-lg bg-success-subtle border border-success-subtle">
          <p className="text-success text-sm font-mono">{result}</p>
        </div>
      )}
    </ToolShell>
  );
}
```

Key rules:
- Always wrap content in `<ToolShell>` or apply `className="tool-surface"` to the root element
- Use semantic utility classes (`.bg-danger-subtle`, `.text-success`, etc.) for status colors
- Never access `window` or `document` outside a `useEffect` or event handler

### Step 6 — Register the tool

**`components/ui/ToolRenderer.tsx`** — add one dynamic import:
```ts
ConceptATool: dynamic(() => import("@/components/tools/ConceptATool"), { ssr: false }),
```

**`lib/tool-meta/{act}.ts`** — add the metadata entry:
```ts
ConceptATool: {
  summary: "One sentence: what this tool lets you do.",
  quickStart: [
    "First action to take in 30 seconds",
    "Second thing to try",
    "Third exploration step",
  ],
  help: {
    goal: "One sentence: the skill or insight this tool teaches.",
    steps: [
      "Step 1 — do X",
      "Step 2 — observe Y",
      "Step 3 — toggle Z and compare",
    ],
    lookFor: "Optional: what pattern to notice and why it matters.",
  },
},
```

### Step 7 — Add glossary terms

Add to `content/glossary.json`:
```json
{
  "term": "Concept A",
  "definition": "One to three sentences. What it is, why it matters, and the key implication.",
  "relatedTopics": ["concept-a", "concept-b"],
  "act": 1
}
```

Good glossary entries answer: *what is it, why does it exist, what goes wrong without it?*

### Step 8 — Verify

```bash
npx tsc --noEmit     # Must be clean
npm run build        # Must build without errors
```

Manually check: chapter renders, tool page renders, interview questions appear in interview mode, misconception card appears, prev/next navigation works.

---

### Full architecture at a glance (template)

```
TOPICS array (lib/topics.ts)
    │
    ├── /[slug]           ← reads content/chapters/{slug}.mdx
    │                        reads content/interview/{slug}.json
    │
    ├── /[slug]/tool      ← TOOL_META[topic.toolComponent]
    │                        ToolRenderer → dynamic import
    │
    ├── /glossary         ← content/glossary.json (filtered by act)
    ├── /labs/[slug]      ← lib/labs.ts + components/labs/
    └── /exam             ← all interview JSONs, filtered by difficulty
```

Everything downstream derives from `TOPICS`. Add a chapter there first; everything else follows.
