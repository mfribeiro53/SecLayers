import { ReactNode } from "react";

type CalloutKind = "insight" | "warning" | "danger" | "info";

const STYLES: Record<
  CalloutKind,
  { accent: string; bg: string; border: string; label: string }
> = {
  insight: {
    // `--chapter-accent` is set on each chapter <article>; fallback to indigo
    // outside a chapter context.
    accent: "var(--chapter-accent, #a5b4fc)",
    bg: "color-mix(in srgb, var(--chapter-accent, #a5b4fc) 8%, transparent)",
    border: "color-mix(in srgb, var(--chapter-accent, #a5b4fc) 40%, transparent)",
    label: "Key Insight",
  },
  warning: {
    accent: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.35)",
    label: "Warning",
  },
  danger: {
    accent: "#f87171",
    bg: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.35)",
    label: "Critical",
  },
  info: {
    accent: "#67e8f9",
    bg: "rgba(103, 232, 249, 0.08)",
    border: "rgba(103, 232, 249, 0.35)",
    label: "Note",
  },
};

export function Callout({
  kind = "insight",
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const s = STYLES[kind];
  return (
    <div
      className="my-6 rounded-xl p-5 flex gap-4"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <div className="shrink-0 mt-0.5">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke={s.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {kind === "insight" && (
            <>
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 00-4 12.7c.5.4.8 1 .8 1.6V18h6.4v-1.7c0-.6.3-1.2.8-1.6A7 7 0 0012 2z" />
            </>
          )}
          {kind === "warning" && (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          )}
          {kind === "danger" && (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
          {kind === "info" && (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </>
          )}
        </svg>
      </div>
      <div className="min-w-0">
        <p
          className="text-[11px] font-bold uppercase tracking-widest mb-1.5"
          style={{ color: s.accent }}
        >
          {title ?? s.label}
        </p>
        <div
          className="text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
