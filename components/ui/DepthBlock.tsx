"use client";

import { useState, ReactNode } from "react";
import { useApp } from "@/components/ui/AppContext";

interface DepthBlockProps {
  label: string;
  children: ReactNode;
}

export function DepthBlock({ label, children }: DepthBlockProps) {
  const { depthMode } = useApp();
  const [open, setOpen] = useState(false);

  if (depthMode === "advanced") {
    return (
      <div
        className="my-6 pl-4 rounded-r-lg"
        style={{
          borderLeft: "2px solid rgba(139,92,246,0.5)",
          background: "rgba(139,92,246,0.04)",
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest py-2"
          style={{ color: "rgba(167,139,250,0.8)" }}
        >
          Advanced — {label}
        </p>
        <div className="pb-2">{children}</div>
      </div>
    );
  }

  // Beginner mode — collapsible
  return (
    <div className="my-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: "rgba(139,92,246,0.8)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {open ? "Hide" : "Show"} {label}
      </button>
      {open && (
        <div
          className="mt-3 pl-4 rounded-r-lg"
          style={{
            borderLeft: "2px solid rgba(139,92,246,0.5)",
            background: "rgba(139,92,246,0.04)",
          }}
        >
          <div className="py-2">{children}</div>
        </div>
      )}
    </div>
  );
}
