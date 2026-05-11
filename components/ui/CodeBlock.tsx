"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="my-6 rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border-subtle)" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: "#0d0d1a",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          {/* Traffic-light dots */}
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          {(title || language) && (
            <span
              className="ml-2 text-[11px] font-mono"
              style={{ color: "#5555aa" }}
            >
              {title ?? language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded transition-all"
          style={{
            color: copied ? "#34d399" : "#5555aa",
            background: copied ? "rgba(52,211,153,0.1)" : "transparent",
          }}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <pre
        className="overflow-x-auto p-4 text-sm leading-relaxed"
        style={{ background: "#0a0a14", margin: 0 }}
      >
        <code style={{ color: "#c0c8ff", fontFamily: "var(--font-mono, monospace)" }}>
          {code}
        </code>
      </pre>
    </div>
  );
}
