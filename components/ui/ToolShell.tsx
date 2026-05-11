"use client";

import { ReactNode } from "react";

interface ToolShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background: "var(--bg-surface-2)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="w-1.5 h-5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          )}
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          IN-BROWSER
        </span>
      </div>
      <div
        className="p-5 tool-surface"
        style={{ color: "var(--text-primary)" }}
      >
        {children}
      </div>
    </div>
  );
}
