"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div
        className="max-w-md w-full text-center rounded-2xl p-10"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#f87171" }}
        >
          Something went wrong
        </p>
        <h1
          className="mt-2 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Unexpected error
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          The page hit an error while rendering. You can retry or head back
          home.
        </p>
        {error.digest && (
          <p
            className="mt-3 text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-md text-sm"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
