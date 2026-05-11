import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
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
          style={{ color: "var(--text-muted)" }}
        >
          404
        </p>
        <h1
          className="mt-2 text-2xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          We couldn&rsquo;t find the chapter or page you&rsquo;re looking for.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Back to home
          </Link>
          <Link
            href="/glossary"
            className="px-4 py-2 rounded-md text-sm"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Glossary
          </Link>
        </div>
      </div>
    </main>
  );
}
