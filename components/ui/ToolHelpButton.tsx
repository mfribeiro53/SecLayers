"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ToolHelpButtonProps {
  goal: string;
  steps: string[];
  lookFor?: string;
  children: React.ReactNode;
}

function HelpModal({
  goal,
  steps,
  lookFor,
  onClose,
}: Omit<ToolHelpButtonProps, "children"> & { onClose: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-black/60"
        style={{ backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 flex items-center gap-2 px-5 py-4"
            style={{
              background: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent)" }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="font-semibold text-sm flex-1" style={{ color: "var(--text-primary)" }}>
              How to use this tool
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded transition-colors hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* What this tool teaches — blue */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#60a5fa" }}
              >
                What this tool teaches
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {goal}
              </p>
            </div>

            {/* How to use it — emerald */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#34d399" }}
              >
                How to use it
              </p>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span
                      className="mt-0.5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "#34d399",
                        color: "#fff",
                        minWidth: "1.25rem",
                        minHeight: "1.25rem",
                        width: "1.25rem",
                        height: "1.25rem",
                      }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* What to look for — amber, optional */}
            {lookFor && (
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#fbbf24" }}
                >
                  What to look for
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {lookFor}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function ToolHelpButton({ goal, steps, lookFor, children }: ToolHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>
      {mounted &&
        open &&
        createPortal(
          <HelpModal
            goal={goal}
            steps={steps}
            lookFor={lookFor}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  );
}
