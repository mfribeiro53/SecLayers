# Foundry — Design & Architecture Guide

A comprehensive reference for replicating or adapting this educational app template. Every section explains *what* exists, *where* it lives, *how* it is structured, and *why* it is done that way.

---

## Table of Contents

1. [Project Overview & Stack](#1-project-overview--stack)
2. [Repository Layout](#2-repository-layout)
3. [Theme & Design System](#3-theme--design-system)
4. [Global Layout](#4-global-layout)
5. [Application State (AppContext)](#5-application-state-appcontext)
6. [Chapter System](#6-chapter-system)
7. [Chapter Shell & Navigation](#7-chapter-shell--navigation)
8. [Chapter Content Components](#8-chapter-content-components)
9. [Interview & Misconception System](#9-interview--misconception-system)
10. [Interactive Tools System](#10-interactive-tools-system)
11. [Glossary](#11-glossary)
12. [Final Exam Page](#12-final-exam-page)
13. [Home Page](#13-home-page)
14. [Backend API](#14-backend-api)
15. [Data Files & Schemas](#15-data-files--schemas)
16. [Key Conventions & Pitfalls](#16-key-conventions--pitfalls)

---

## 1. Project Overview & Stack

**Foundry** is a full-stack interactive educational app. The frontend is a Next.js 15 (App Router) TypeScript app. The backend is a Python FastAPI server that streams real ML training events via Server-Sent Events (SSE).

### Frontend dependencies

| Package | Purpose |
|---|---|
| `next` 15 | App Router, SSG, dynamic imports |
| `react` 19 | UI |
| `tailwindcss` v4 | Utility-class styling |
| `lucide-react` | Icon set used everywhere |
| `katex` | Math rendering |
| `d3` | Custom charts in tools |
| `plotly.js` + `react-plotly.js` | 3D scatter plots (e.g. Embedding Space) |
| `chart.js` + `react-chartjs-2` | 2D charts (e.g. loss curves) |
| `gpt-tokenizer`, `llama-tokenizer-js`, `@anthropic-ai/tokenizer` | In-browser tokenizer tools |
| `@huggingface/transformers` | In-browser model inference |
| `clsx` | Conditional className utility |

### Backend dependencies

| Package | Purpose |
|---|---|
| `fastapi` | HTTP framework |
| `uvicorn` | ASGI server |
| `torch` | Model training & inference |
| `sse-starlette` | Server-Sent Events streaming |
| `tokenizers` | HuggingFace tokenizer library |
| `pydantic` | Request/response validation |

### Dev & build

```
make setup   # creates backend/.venv, installs pip + npm deps
make dev     # runs backend (port 8000) and frontend (port 3000) concurrently
make backend # uvicorn main:app --reload --port 8000
make frontend # next dev --turbopack
```

---

## 2. Repository Layout

```
/
├── backend/
│   ├── main.py              # FastAPI app, router mounting, CORS
│   ├── requirements.txt
│   ├── data/
│   │   └── shakespeare.txt  # Training data for Pretraining Lab
│   ├── models/
│   │   ├── nano_gpt.py      # Tiny GPT (2-layer, 2-head, 64-dim)
│   │   ├── lora_adapter.py  # LoRA fine-tuning wrapper
│   │   └── reward_model.py  # Bradley-Terry reward model
│   └── routers/
│       ├── pretraining.py   # SSE: train a tiny GPT live
│       ├── sft.py           # SSE: supervised fine-tuning
│       ├── reward.py        # SSE: reward model training
│       ├── rlhf.py          # SSE: DPO/PPO training
│       ├── evaluation.py    # Eval metric endpoints
│       ├── architecture.py  # Parameter count calculations
│       ├── inference.py     # Inference simulation
│       ├── engine.py        # Engine architecture data
│       └── tokenization.py  # Tokenizer endpoints
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout — Sidebar + TopNav shell
│   │   ├── page.tsx         # Home page
│   │   ├── globals.css      # CSS variables + chapter-prose styles
│   │   ├── stages/
│   │   │   └── [stage]/
│   │   │       └── page.tsx # Dynamic chapter route
│   │   └── <tool-name>/
│   │       └── page.tsx     # One file per interactive tool
│   ├── components/
│   │   ├── ui/              # Shared layout primitives
│   │   │   ├── AppContext.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── GlossaryPanel.tsx
│   │   │   ├── ToolsModal.tsx
│   │   │   ├── ToolIntro.tsx
│   │   │   ├── ToolHelpButton.tsx
│   │   │   ├── Callout.tsx
│   │   │   ├── CodeBlock.tsx
│   │   │   ├── DepthBlock.tsx
│   │   │   └── Math.tsx
│   │   ├── stages/          # Chapter content + shell
│   │   │   ├── ChapterShell.tsx
│   │   │   ├── Ch01Intro.tsx … Ch18Safety.tsx
│   │   ├── interview/
│   │   │   ├── InterviewCard.tsx
│   │   │   └── MisconceptionCard.tsx
│   │   └── tools/           # One component per interactive tool
│   │       └── AttentionVisualizerTool.tsx … (38 tools)
│   ├── lib/
│   │   ├── chapters.ts      # Single source of truth for all chapters
│   │   ├── dataPipeline.ts
│   │   ├── embeddings.ts
│   │   └── scaling.ts
│   └── content/
│       ├── glossary.json
│       └── interview_questions/
│           └── index.json
│
└── Makefile
```

---

## 3. Theme & Design System

### CSS custom properties (`app/globals.css`)

```css
:root {
  --background: #09090e;   /* Near-black page background */
  --foreground: #e8e8f0;   /* Off-white default text */
  --card:       #111118;   /* Card surfaces */
  --card-border:#1e1e2e;   /* Card borders */
  --muted:      #8888aa;   /* Muted/secondary text */
}
```

These are registered with Tailwind v4's `@theme inline` block and used as `bg-[var(--background)]` or directly in inline styles.

### Font setup

Two Geist fonts from `next/font/google`:
- `Geist` → `--font-geist-sans` → default body font
- `Geist_Mono` → `--font-geist-mono` → code, mono elements

Applied in `layout.tsx`:
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

### Color palette: the Act system

The 18 chapters are split into 4 "Acts". Each act has its own accent color. All color maps live in `lib/chapters.ts` and are imported everywhere:

```ts
// lib/chapters.ts
export const ACT_TEXT: Record<number, string> = {
  1: "text-blue-400",     // Act I — Foundations
  2: "text-violet-400",   // Act II — The Transformer
  3: "text-emerald-400",  // Act III — Making It Useful
  4: "text-orange-400",   // Act IV — Real-World Deployment
};

export const ACT_BG: Record<number, string> = {
  1: "bg-blue-900/30",
  2: "bg-violet-900/30",
  3: "bg-emerald-900/30",
  4: "bg-orange-900/30",
};

export const ACT_BORDER: Record<number, string> = {
  1: "border-blue-500/40",
  2: "border-violet-500/40",
  3: "border-emerald-500/40",
  4: "border-orange-500/40",
};
```

**Usage pattern:** anywhere you render a chapter-specific UI element, do:
```tsx
import { ACT_BG, ACT_BORDER, ACT_TEXT } from "@/lib/chapters";
<div className={`${ACT_BG[act]} ${ACT_BORDER[act]}`}>…</div>
```

### Chapter prose CSS class

All chapter content is wrapped in `<div className="chapter-prose space-y-2">`. This class is defined in `globals.css` and sets:

- `h2`: 1.35rem, bold, bottom-border separator
- `h3`: 1.05rem, semi-bold
- `p`, `li`: `color: #b8b8d0`, `line-height: 1.8`
- `strong`: full foreground color

### Inline code

Bare `<code>` tags (not inside a `<pre>`) get auto-styled via:
```css
code:not([class]) {
  background: #1a1a28;
  border: 1px solid #2a2a40;
  color: #a5b4fc;  /* indigo-300 */
  border-radius: 0.3em;
  font-size: 0.87em;
}
```

### Scrollbar

Custom 6 px scrollbar, dark-themed, applied globally via `::-webkit-scrollbar` rules in `globals.css`.

### Math display blocks

`.math-block` class (used by `<BlockMath>`) gives KaTeX equations a dark card look:
```css
.math-block {
  background: #0d0d16;
  border: 1px solid #1e1e35;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  overflow-x: auto;
}
```

---

## 4. Global Layout

The root layout (`app/layout.tsx`) builds a three-panel shell:

```
┌─────────────┬──────────────────────────────────────┐
│             │  TopNav (sticky, h-14)                │
│  Sidebar    ├──────────────────────────────────────┤
│  (w-64)     │                                       │
│             │  <main>  (flex-1, overflow-auto)      │
│             │  {children}                           │
└─────────────┴──────────────────────────────────────┘
                    [GlossaryPanel — fixed overlay]
```

```tsx
// app/layout.tsx
<AppProvider>
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <TopNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  </div>
  <GlossaryPanel />   {/* fixed overlay, outside the flex layout */}
</AppProvider>
```

**Critical CSS:** the outer div uses `overflow-hidden` to lock the viewport so only `<main>` scrolls. If you forget `overflow-hidden` on the outer div, the sidebar and TopNav will scroll with the content.

### Sidebar (`components/ui/Sidebar.tsx`)

```
w-64 | bg-gray-950 | border-r border-gray-800
```

Sections from top to bottom:
1. **Logo block** — emoji + app name + tagline, links to `/`
2. **Progress bar** — `completedChapters.size / CHAPTERS.length`, gradient blue→violet→emerald
3. **Chapter nav** — chapters grouped by Act, each with `ACT_TEXT` label; active link has `border-l-2` + act-colored background; completed chapters show `<CheckCircle>` (act color), incomplete show `<Circle>` (gray)
4. **Bottom links** — Vocab Builder, Glossary, Final Exam

Active link detection: `usePathname() === "/stages/${ch.num}"`.

### TopNav (`components/ui/TopNav.tsx`)

```
sticky top-0 z-40 | bg-gray-950/95 backdrop-blur | h-14
```

Three sections:

**Left — Depth mode segmented control:**
- `beginner` → blue-600 active state
- `advanced` → violet-600 active state
- First-visit tooltip from localStorage (`llm-journey-depth-tooltip-seen` key)

**Center — Interview mode + difficulty:**
- Toggle switch (pill, amber when active)
- Three-button difficulty segmented (Internship / MLE / Research), disabled + dimmed when interview mode is off
- Active difficulty → amber-500 background, black text

**Right — Tools + Glossary buttons:**
- Opens `ToolsModal` (state local to TopNav)
- Opens `GlossaryPanel` (state in AppContext)
- Glossary button shows `G` keyboard shortcut chip

---

## 5. Application State (AppContext)

All global state lives in `components/ui/AppContext.tsx` via React Context.

```ts
interface AppState {
  // Content depth
  depthMode: "beginner" | "advanced";
  setDepthMode: (v: DepthMode) => void;

  // Interview mode
  interviewMode: boolean;
  setInterviewMode: (v: boolean) => void;

  // Interview difficulty (only relevant when interviewMode is true)
  difficulty: "internship" | "mlEngineer" | "researcher";
  setDifficulty: (v: Difficulty) => void;

  // Chapter progress (persisted to localStorage)
  completedChapters: Set<number>;
  markChapterComplete: (n: number) => void;

  // Glossary panel
  glossaryOpen: boolean;
  setGlossaryOpen: (v: boolean) => void;
}
```

**localStorage keys:**
- `llmj-completed` — JSON array of completed chapter numbers
- `llm-journey-depth-tooltip-seen` — `"1"` once the depth tooltip has been dismissed

**Usage:** any component that needs app state imports `useApp()`:
```tsx
import { useApp } from "@/components/ui/AppContext";
const { depthMode, interviewMode, difficulty } = useApp();
```

`useApp()` throws if called outside `<AppProvider>`, providing a clear error message.

---

## 6. Chapter System

### The `CHAPTERS` array (`lib/chapters.ts`)

This is the **single source of truth** for all chapter metadata. Every sidebar entry, chapter header, tool badge, glossary link, and static route is derived from this array.

```ts
export const CHAPTERS = [
  { num: 1,  act: 1, title: "What is an LLM?",           slug: "intro",         actLabel: "Act I — Foundations" },
  { num: 2,  act: 1, title: "Math Primer",                slug: "math-primer",   actLabel: "Act I — Foundations" },
  // ... 18 entries total
] as const;
```

Fields:
- `num` — chapter number (1–18), used in URLs (`/stages/1`) and as localStorage keys
- `act` — act number (1–4), drives the color system
- `title` — display name in sidebar, chapter header, breadcrumbs
- `slug` — kebab-case identifier; tools reference their chapter by `chapterSlug` matching this field
- `actLabel` — human-readable act label shown in the chapter header

### Static route generation

The chapter page at `app/stages/[stage]/page.tsx` generates all 18 pages at build time:

```ts
export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ stage: String(c.num) }));
}
```

If a number doesn't match a chapter, Next.js returns 404 via `notFound()`.

---

## 7. Chapter Shell & Navigation

`components/stages/ChapterShell.tsx` is the wrapper rendered by every chapter page. It receives `{ num, title, act }` and handles:

### Chapter header

```tsx
<div className={`mb-8 p-6 rounded-2xl border ${ACT_BORDER[act]} ${ACT_BG[act]}`}>
  <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${ACT_TEXT[act]}`}>
    Chapter {num}
  </div>
  <h1 className="text-3xl font-bold text-white">{title}</h1>
  {/* Act label + depth mode badge + interview mode badge */}
</div>
```

### Lazy-loaded chapter content

Chapter components are loaded via `next/dynamic` so the initial bundle stays small:

```ts
const chapterComponents: Record<number, ComponentType> = {
  1:  dynamic(() => import("./Ch01Intro")),
  2:  dynamic(() => import("./Ch02MathPrimer")),
  // ...
};
```

At render time: `const ChapterContent = chapterComponents[num]; <ChapterContent />`.

### Misconceptions (always shown)

```tsx
<MisconceptionCard chapterNum={num} />
```

Always rendered below chapter content regardless of interview mode.

### Interview questions (conditional)

```tsx
{interviewMode && <InterviewCard chapterNum={num} />}
```

Only rendered when interview mode is enabled in AppContext.

### Bottom navigation bar

```
← Ch.N Previous Title    [Mark Complete / Completed]    Ch.N+1 Next Title →
```

- Previous/next chapter links derived from `CHAPTERS.find(c => c.num === num ± 1)`
- "Mark Complete" button calls `markChapterComplete(num)` which persists to localStorage
- "Completed" state: `bg-emerald-900/40 border-emerald-500/40 text-emerald-400`
- Next button: always `bg-blue-600 hover:bg-blue-500` (not act-colored)

### Outer container

All chapter pages use `max-w-4xl mx-auto px-6 py-10` for the content width.

---

## 8. Chapter Content Components

Each chapter file (e.g. `Ch01Intro.tsx`) is a pure presentational React component. It composes these building blocks:

### `<Callout variant="..." title="...">` (`components/ui/Callout.tsx`)

Colored callout boxes for in-line prose annotations:

| `variant` | Color | Icon | Default label |
|---|---|---|---|
| `insight` | indigo | Lightbulb | "Key Insight" |
| `warning` | amber | AlertTriangle | "Watch Out" |
| `info` | sky | Info | "Note" |
| `paper` | emerald | BookOpen | "Seminal Paper" |

```tsx
<Callout variant="insight">
  The chain rule isn't a simplification — it's mathematically exact.
</Callout>

<Callout variant="warning" title="Common Trap">
  Avoid thinking of attention as memory storage.
</Callout>
```

Structure: `rounded-xl border`, icon on left, label + content on right.

### `<DepthBlock label="...">` (`components/ui/DepthBlock.tsx`)

Wraps content that is only appropriate for Advanced depth mode.

- **Advanced mode**: always visible, with a violet left border (`border-l-2 border-violet-600/40`) and a tiny "Advanced" label
- **Beginner mode**: collapsed; a `▶ Show [label]` toggle reveals it

```tsx
<DepthBlock label="why decoder-only won over encoder-decoder">
  <p>Encoder-decoder splits computation: a bidirectional encoder…</p>
</DepthBlock>
```

Any content that should only appear in advanced mode lives inside `<DepthBlock>`. This is how the same chapter file serves two audiences.

### `<CodeBlock code="..." language="python" title="...">` (`components/ui/CodeBlock.tsx`)

Dark-themed code block with a copy button:
- Background: `#0a0a14`
- Header bar: `#0d0d1a` with language/title label in `#5555aa`
- Text: `#c0c8ff` (cool lavender-white)
- Copy → check icon, 2s timeout

```tsx
<CodeBlock
  language="python"
  title="cross_entropy.py"
  code={`loss = F.cross_entropy(logits, targets)`}
/>
```

### `<InlineMath math="...">` and `<BlockMath math="...">` (`components/ui/Math.tsx`)

KaTeX wrappers using `useEffect` + `ref`:
```tsx
<InlineMath math="p(x_t \mid x_{<t})" />
<BlockMath math="\prod_{t=1}^{T} p(x_t \mid x_1, \ldots, x_{t-1})" />
```

`BlockMath` applies the `.math-block` CSS class (dark card, scrollable). Both use `throwOnError: false` so a bad LaTeX string shows a fallback rather than crashing.

### Inline `<code>` tags

Inside chapter prose, use `<code className="text-indigo-300">someSymbol</code>` for inline code that needs a specific color override (the global CSS auto-applies the box styles to unstyled `<code>`).

### Info grids

Chapters frequently use ad-hoc grid layouts for comparison tables:
```tsx
<div className="grid gap-3 my-4 md:grid-cols-3">
  {items.map((item) => (
    <div key={item.name} className={`border rounded-xl p-4 ${item.color}`}>
      <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${item.badge}`}>{item.name}</div>
      <div className="text-gray-400 text-xs space-y-1">…</div>
    </div>
  ))}
</div>
```

No separate component — these are inlined where needed.

---

## 9. Interview & Misconception System

### Data source

Both components read from `content/interview_questions/index.json`.

**Schema:**
```json
[
  {
    "chapter": 1,
    "questions": [
      {
        "question": "What is next-token prediction…?",
        "answers": {
          "internship": "Next-token prediction means…",
          "mlEngineer":  "The model is trained with cross-entropy loss…",
          "researcher":  "Next-token prediction is equivalent to learning…"
        },
        "wrongAnswers": [
          "\"The model memorizes the training data\"…",
          "\"It learns by labeled classification\"…"
        ]
      }
    ],
    "misconceptions": [
      {
        "myth": "LLMs understand language the way humans do",
        "reality": "LLMs are statistical models that predict tokens…"
      }
    ]
  }
]
```

Key points:
- Every chapter entry has a `chapter` number matching the chapter system
- Every question has exactly 3 answer tiers: `internship`, `mlEngineer`, `researcher`
- `wrongAnswers` is an array of strings (may be empty)
- `misconceptions` is optional (only show `MisconceptionCard` when non-empty)

### `<InterviewCard chapterNum={num}>` (`components/interview/InterviewCard.tsx`)

Rendered only when `interviewMode === true` in AppContext. Container styling:
```
bg-amber-950/20 | border border-amber-500/20 | rounded-2xl | p-6
```

- Header: `<GraduationCap>` icon + "Interview Questions" + difficulty badge
- Each question: bordered card (`border border-gray-700 rounded-xl`)
- Question button: full-width, left text, chevron right
- Revealed answer: `bg-gray-900/50` background, difficulty-tier label, answer HTML, optional "Common Wrong Answers" red box

**Tier color map:**
```ts
const TIER_COLOR: Record<Tier, string> = {
  internship: "text-green-400 border-green-500/30 bg-green-900/10",
  mlEngineer: "text-blue-400 border-blue-500/30 bg-blue-900/10",
  researcher: "text-purple-400 border-purple-500/30 bg-purple-900/10",
};
```

The answer is rendered with `dangerouslySetInnerHTML` to allow basic HTML formatting in the JSON (bold tags, etc.).

### `<MisconceptionCard chapterNum={num}>` (`components/interview/MisconceptionCard.tsx`)

Always rendered below chapter content (regardless of interview mode). Container:
```
bg-red-950/20 | border border-red-500/20 | rounded-2xl | p-6
```

Each misconception: `✗` in red, myth in `text-red-300`, reality in `text-gray-400`.

---

## 10. Interactive Tools System

### Architecture overview

Each tool is a three-layer stack:
1. **Page** (`app/<tool-name>/page.tsx`) — layout container, `ToolIntro`, `ToolHelpButton`
2. **Tool component** (`components/tools/<Name>Tool.tsx`) — the actual interactive UI
3. **`ToolsModal`** — the global catalog of all tools, accessible from TopNav

### Tool pages

Every tool page follows the same template:

```tsx
// app/attention/page.tsx
"use client";
import dynamic from "next/dynamic";
import ToolIntro from "@/components/ui/ToolIntro";
import ToolHelpButton from "@/components/ui/ToolHelpButton";

// Dynamic import to avoid SSR issues with canvas/WebGL/browser APIs
const AttentionVisualizerTool = dynamic(
  () => import("@/components/tools/AttentionVisualizerTool"),
  { ssr: false, loading: () => <div className="…">Loading...</div> }
);

export default function AttentionVisualizerPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ToolIntro
        chapter={5}
        chapterTitle="Attention"
        title="Attention Visualizer"
        accent="violet"
        summary={<>…</>}
        quickStart={[
          { text: <>…</> },
          { text: <>…</> },
        ]}
      />
      <AttentionVisualizerTool />
      <div className="mt-6">
        <ToolHelpButton goal={<>…</>} steps={[…]} lookFor={<>…</>}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/30 text-violet-400 …">
            <Info className="w-3.5 h-3.5" /> How to use this tool
          </span>
        </ToolHelpButton>
      </div>
    </div>
  );
}
```

Container width for tools is `max-w-6xl` (wider than chapters' `max-w-4xl`).

### `<ToolIntro>` (`components/ui/ToolIntro.tsx`)

Standard header block placed at the top of every tool page:

```ts
interface ToolIntroProps {
  chapter: number;          // Links to /stages/{chapter}
  chapterTitle: string;     // Breadcrumb text
  title: string;            // H1
  accent?: "fuchsia" | "violet" | "emerald" | "blue" | "cyan" | "amber" | "rose" | "indigo";
  summary: ReactNode;       // 1-3 sentence description
  details?: ReactNode;      // Optional second paragraph (smaller, gray)
  quickStart?: QuickStartStep[];  // "Try this in 30 seconds" checklist
  chapterAnchor?: string;   // Optional #anchor on the chapter link
}
```

**Accent colors** each resolve to a `{ text, border, bg, chip }` set of Tailwind classes. The accent drives:
- Breadcrumb chip color (`Chapter 5 · Attention · Interactive`)
- H1 color
- Quick-start box border/background

**Quick-start box:** numbered steps in the accent color, displayed in a bordered card beneath the summary.

### `<ToolHelpButton>` (`components/ui/ToolHelpButton.tsx`)

A help icon that opens a modal via `createPortal`:

```ts
interface ToolHelpButtonProps {
  goal: ReactNode;       // "What this tool teaches" section
  steps: HelpStep[];     // Numbered "How to use it" list
  lookFor?: ReactNode;   // Optional "What to look for" section
  children: ReactNode;   // The trigger element (button/span)
}
```

Modal structure:
- Sticky header: `HelpCircle` icon + "How to use this tool"
- Section 1 (blue label): "What this tool teaches" — `goal`
- Section 2 (emerald label): "How to use it" — ordered list of `steps`
- Section 3 (amber label, optional): "What to look for" — `lookFor`

The trigger (`children`) is rendered in normal document flow; the modal is portaled to `document.body` to escape `overflow-hidden` stacking contexts. Closes on backdrop click or `Escape`.

### `ToolsModal` (`components/ui/ToolsModal.tsx`)

A full-screen catalog of every tool, opened from TopNav.

**The `TOOLS` array** at the top of `ToolsModal.tsx` is the authoritative list of all tools. Each entry:
```ts
interface Tool {
  href: string;           // Route, e.g. "/attention"
  name: string;           // Display name
  description: string;    // One-paragraph description
  icon: LucideIcon;       // Lucide icon component
  chapterSlug: ChapterSlug; // Matches slug in CHAPTERS array
}
```

At render time, each tool is enriched with chapter metadata by looking up `chapterSlug` in `CHAPTERS`. This is important: **the TOOLS array does not store chapter numbers directly** — it references slugs, so if you renumber chapters, only `chapters.ts` needs updating.

Tools are grouped by act using the same `ACT_TEXT`, `ACT_BG`, `ACT_BORDER` maps.

Modal structure:
- Fixed overlay `z-[100]` with `bg-black/70 backdrop-blur-sm`
- `max-w-5xl` centered panel
- Sticky header with title + close button
- Per-act sections with numbered list items

Each tool card:
```
[two-digit step number]
[icon in act-colored box]   [Tool Name]  [Ch N · Title badge]
                            [description in gray-400]
```

The tool name links to the tool route; the chapter badge links to `/stages/{num}`.

### Tool component patterns

Tool components (`components/tools/`) are vanilla React client components. Common patterns:

- **State**: `useState` for all interactive controls
- **Computation**: `useMemo` for expensive derived values
- **Canvas/SVG**: inline `<svg>` or `<canvas>` with `useEffect` for D3
- **Plotly**: `react-plotly.js` with `ssr: false` on the import
- **Seeded randomness**: tools that need deterministic "fake" data use a custom `seededRand(seed)` function (mulitply-xorshift), so results are reproducible across renders
- **Backend calls**: streaming tools (Pretraining Lab, SFT Lab, etc.) use `EventSource` (SSE) to fetch from `http://localhost:8000/<router>/train`

---

## 11. Glossary

The glossary has two surfaces: a **slide-in panel** (global, keyboard-shortcut accessible) and a **dedicated page**.

### Data source (`content/glossary.json`)

```json
[
  {
    "term": "Attention",
    "definition": "A mechanism that allows each token to look at all other tokens…",
    "chapter": 5,
    "slug": "attention"
  }
]
```

`chapter` is a number matching the chapter system. `slug` is unused currently but included for future use.

### `<GlossaryPanel>` (`components/ui/GlossaryPanel.tsx`)

A right-side slide-in panel, `fixed inset-0 z-50`, rendered only when `glossaryOpen === true` in AppContext.

- **Backdrop**: `bg-black/50`, clicking closes panel
- **Panel**: `w-full max-w-md h-full` from right, `bg-gray-950 border-l border-gray-800`
- **Keyboard shortcut**: `g` key opens it (when no input is focused), `Escape` closes it
- **Search**: fuzzy search over `term` and `definition` fields
- **A-Z jump rail**: right-side vertical nav with single-letter buttons; disabled letters are dimmed
- **Letter sections**: sticky `h3` letter headers with `bg-gray-950/95 backdrop-blur`
- Each term links to its chapter with `Ch.{n}` badge and hover `ExternalLink` icon

### Glossary page (`app/glossary/page.tsx`)

Static server component. Groups terms by chapter number, renders each group as a `<section>` with:
- Chapter heading that links to `/stages/{ch}` 
- Grid of term cards: `bg-gray-900 border border-gray-800 rounded-xl p-4`

---

## 12. Final Exam Page

`app/exam/page.tsx` — a pure client component that builds a quiz from interview data.

**How it works:**
1. Builds a flat pool of all questions across all chapters at the current difficulty tier
2. Fisher-Yates shuffles the pool, takes first 30 (configurable via `EXAM_SIZE`)
3. Shows one question at a time
4. User clicks "Reveal Answer" → sees the model answer + wrong answers
5. Self-marks correct/incorrect
6. On completion: shows score, per-chapter breakdown table

**No backend** — entirely client-side from the JSON data.

---

## 13. Home Page

`app/page.tsx` — static server component.

Three sections:
1. **Hero**: emoji, title, tagline, two CTA buttons (Start Ch.1 → blue-600, Glossary → gray-800)
2. **Feature pills**: rounded pill chips in `bg-gray-900 border border-gray-800`, listing key capabilities
3. **Chapter grid**: grouped by act, `sm:grid-cols-2 lg:grid-cols-4` grid of chapter cards

Chapter cards:
```tsx
<Link className={`group relative p-4 rounded-xl border ${ACT_BORDER[act]} ${ACT_BG[act]} hover:brightness-125 transition-all`}>
  <div className="text-gray-500 text-xs mb-1">Chapter {ch.num}</div>
  <div className="text-white text-sm font-medium">{ch.title}</div>
  <ArrowRight className="absolute right-3 top-1/2 … opacity-0 group-hover:opacity-100" />
</Link>
```

The `hover:brightness-125` trick works well with semi-transparent `bg-*-900/30` backgrounds — it brightens them on hover without needing separate hover colors.

---

## 14. Backend API

`backend/main.py` sets up FastAPI with CORS allowing `localhost:3000` and `localhost:3001`, then mounts routers under prefixes.

### Router structure

Each router file exports an `APIRouter` and registers endpoints. Example streaming endpoint:

```python
# backend/routers/pretraining.py
@router.get("/train")
async def train_stream(warmup_steps: int = 20):
    async def event_generator():
        # ... train NanoGPT for 200 steps ...
        for step in range(max_steps):
            # ... compute loss ...
            yield {"data": json.dumps({"step": step, "loss": loss_val, "sample": sample})}
            await asyncio.sleep(0)  # yield to event loop
    return EventSourceResponse(event_generator())
```

Frontend connects with:
```ts
const es = new EventSource("http://localhost:8000/pretraining/train");
es.onmessage = (e) => {
  const { step, loss, sample } = JSON.parse(e.data);
  // update state
};
```

### NanoGPT model (`backend/models/nano_gpt.py`)

Deliberately tiny: `n_layer=2, n_head=2, n_embd=64, block_size=64`. Trains on Shakespeare in <30 seconds on CPU.

### Graceful degradation

The main app wraps ML router imports in a try/except:
```python
try:
    from routers import pretraining, sft, reward, rlhf, evaluation, architecture, inference, engine
    _ml_routers = True
except ModuleNotFoundError:
    _ml_routers = False
```

If PyTorch is not installed, only the tokenization router loads. The app won't crash — the ML-backed tools just won't stream real training data.

---

## 15. Data Files & Schemas

### `content/glossary.json`

Array of term objects:
```ts
{ term: string; definition: string; chapter: number; slug: string }
```

Terms do not need to be sorted — the `GlossaryPanel` sorts alphabetically at runtime.

### `content/interview_questions/index.json`

Array of chapter objects:
```ts
{
  chapter: number;
  questions: Array<{
    question: string;
    answers: {
      internship: string;
      mlEngineer: string;
      researcher: string;
    };
    wrongAnswers: string[];  // may be empty array
  }>;
  misconceptions: Array<{    // may be absent or empty
    myth: string;
    reality: string;
  }>;
}
```

**Important:** not every chapter needs to appear in the file. `InterviewCard` and `MisconceptionCard` do a `.find()` and return `null` if no data exists for that chapter.

---

## 16. Key Conventions & Pitfalls

### 1. The `chapters.ts` file is the single source of truth

Never hardcode chapter numbers, titles, or act labels elsewhere. Import from `@/lib/chapters`. The tools modal, sidebar, glossary page, exam, and chapter shell all reference this file.

### 2. Tool `chapterSlug` must match `chapters.ts`

In `ToolsModal.tsx`, each tool entry has a `chapterSlug` that is looked up against `CHAPTERS`. If it doesn't match any slug, a runtime error is thrown:
```ts
if (!chapter) throw new Error(`ToolsModal: unknown chapterSlug "${tool.chapterSlug}"`);
```

When adding a new tool, add it to `TOOLS` in `ToolsModal.tsx` with the correct slug.

### 3. Tool components must use `ssr: false`

Tools that use browser APIs (canvas, WebGL, `window`, `EventSource`, Plotly) must be dynamically imported with `ssr: false`:
```ts
const MyTool = dynamic(() => import("@/components/tools/MyTool"), { ssr: false });
```

`ToolHelpButton` uses `createPortal` and also needs `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);` before portaling.

### 4. Modal portaling pattern

Both `ToolsModal` and `ToolHelpButton` use `createPortal(jsx, document.body)` to escape `overflow-hidden` clipping. The `mounted` state guard prevents SSR errors:
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null;
return createPortal(<Modal />, document.body);
```

### 5. `overflow-hidden` on the root layout shell

The outer `<div className="flex h-screen overflow-hidden">` in `layout.tsx` is intentional. Without it, the full page would scroll, not just the main area. This is the most common mistake when replicating the shell.

### 6. Act color maps are imported, not inlined

Always import `ACT_TEXT`, `ACT_BG`, `ACT_BORDER` from `@/lib/chapters` — never hardcode `"text-blue-400"` conditionally. This ensures consistency if act colors ever change.

### 7. `depthMode` gates content — not pages

Advanced and beginner content coexists in the same chapter component file. `<DepthBlock>` wraps anything that should be hidden/collapsed in beginner mode. This is simpler than maintaining two separate page variants.

### 8. Interview difficulty is read from context

`InterviewCard` reads `difficulty` from `useApp()`, not from props. This means it automatically reflects whatever the user has set in the TopNav — you don't need to thread difficulty as a prop through `ChapterShell`.

### 9. Chapters use `max-w-4xl`, tools use `max-w-6xl`

Tools need more horizontal space for charts and controls. All tool pages use `max-w-6xl mx-auto px-6 py-8`. Chapter pages use `max-w-4xl mx-auto px-6 py-10`.

### 10. Progress persistence uses a `Set<number>` in state

The `completedChapters` is a React `Set<number>`. When persisting to localStorage, it's serialized as `JSON.stringify([...set])` and deserialized as `new Set(JSON.parse(saved))`. The `Set` is recreated immutably on each `markChapterComplete` call (`new Set(prev).add(n)`).

### 11. Backend CORS is localhost-only

CORS is configured for `localhost:3000` and `localhost:3001` only. For production deployment, update `allow_origins` in `main.py`.

### 12. The `ToolIntro` `accent` prop drives all color in the header

Pick one accent per tool and use it consistently for the `ToolIntro` header AND the `ToolHelpButton` trigger button color. This creates a per-tool color identity without needing to style anything else.

### 13. `dangerouslySetInnerHTML` in InterviewCard

Answer text in `index.json` can contain HTML tags (e.g. `<strong>`, `<code>`). The `InterviewCard` renders answers with `dangerouslySetInnerHTML`. Keep the JSON content trusted (it's a static build asset, not user input).

### 14. Keyboard shortcuts

- `g` → open GlossaryPanel (registered in `GlossaryPanel.tsx`)
- `Escape` → close any modal/panel (each modal registers its own listener)

Both handlers check that no input is focused before firing, preventing interference while the user types in a tool.

---

## Quick-start checklist for a new educational app

- [ ] Copy `lib/chapters.ts` structure and populate with your own chapter data
- [ ] Set up the same 4-level color map (`ACT_TEXT`, `ACT_BG`, `ACT_BORDER`) for your subject areas
- [ ] Copy `globals.css` (CSS vars, chapter-prose, math-block, scrollbar)
- [ ] Copy `layout.tsx` shell (Sidebar + TopNav + main + GlossaryPanel)
- [ ] Copy `AppContext.tsx` and remove/add modes you need
- [ ] Create your `content/glossary.json` and `content/interview_questions/index.json`
- [ ] Create chapter content components using `Callout`, `DepthBlock`, `CodeBlock`, `Math`
- [ ] Create tool pages using `ToolIntro` + `ToolHelpButton` + dynamic tool component
- [ ] Register tools in the `TOOLS` array in `ToolsModal.tsx`
- [ ] Add static route generation to `app/stages/[stage]/page.tsx`
- [ ] Set up the `ChapterShell` with your chapter navigation logic
