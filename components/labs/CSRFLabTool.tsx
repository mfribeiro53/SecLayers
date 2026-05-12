"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{c912fe3a7b5d8e40}";

const HINTS = [
  "Look at the request tab — there is no X-CSRF-Token header or hidden token field. The server authenticates the request using only the session cookie, which the browser sends automatically.",
  "An attacker page can contain a <form> targeting the victim's settings endpoint and auto-submit it when the victim visits. The browser attaches the session cookie automatically — no XSS needed.",
  'Minimal attack: <html><body onload="document.forms[0].submit()"><form action="https://bank.local/api/settings" method="POST"><input type="hidden" name="email" value="attacker@evil.com"/></form></body></html>',
];

function detectForge(html: string): boolean {
  const s = html.toLowerCase();
  const hasForm = s.includes("<form") && (s.includes("api/settings") || s.includes("/settings"));
  const hasEmailField = s.includes('name="email"') || s.includes("name='email'");
  const hasAutoSubmit =
    s.includes("submit()") ||
    s.includes("onload") ||
    s.includes("document.forms");
  return hasForm && hasEmailField && hasAutoSubmit;
}

function extractEmail(html: string): string {
  const m = html.match(/name=["']email["'][^>]*value=["']([^"']+)["']|value=["']([^"']+)["'][^>]*name=["']email["']/i);
  return m ? (m[1] || m[2]) : "attacker@evil.com";
}

export function CSRFLabTool() {
  const [html, setHtml] = useState("");
  const [victimEmail, setVictimEmail] = useState("alice@bank.local");
  const [result, setResult] = useState<"success" | "fail" | null>(null);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function testAttack(e: React.FormEvent) {
    e.preventDefault();
    if (detectForge(html)) {
      const newEmail = extractEmail(html);
      setVictimEmail(newEmail);
      setResult("success");
      setSolved(true);
    } else {
      setResult("fail");
    }
  }

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          SafeBank lets logged-in users change their email via a POST request. There is no CSRF
          token. If you can trick alice into visiting your page, her email gets changed silently.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Victim's settings page */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Victim's settings (alice, logged in)
          </p>
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-muted)" }}>
                Account email
              </label>
              <input
                readOnly
                value={victimEmail}
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  background: solved ? "rgba(52,211,153,0.08)" : "var(--bg-surface-2)",
                  border: `1px solid ${solved ? "rgba(52,211,153,0.35)" : "var(--border-strong)"}`,
                  color: solved ? "#6ee7b7" : "var(--text-primary)",
                }}
              />
              {solved && (
                <p className="text-xs mt-1" style={{ color: "#6ee7b7" }}>
                  ✓ Email silently changed by forged request.
                </p>
              )}
            </div>
            {/* HTTP request breakdown */}
            <div
              className="text-xs p-3 rounded font-mono space-y-0.5"
              style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}
            >
              <div>POST /api/settings HTTP/1.1</div>
              <div>Host: bank.local</div>
              <div>Cookie: session=abc123xyz ← sent automatically</div>
              <div style={{ color: "#fcd34d" }}>X-CSRF-Token: (absent)</div>
              <div>&nbsp;</div>
              <div>email=alice%40bank.local</div>
            </div>
          </div>
        </div>

        {/* Attacker's HTML page */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Attacker's malicious page (write the HTML)
          </p>
          <form onSubmit={testAttack} className="space-y-2">
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={11}
              className="w-full px-3 py-2 rounded-md text-sm font-mono resize-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              placeholder={"<!-- Write your attack page HTML here -->\n<html>\n  ...\n</html>"}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Simulate: alice visits attacker page →
            </button>
          </form>
          {result === "fail" && (
            <div
              className="mt-2 text-xs p-3 rounded"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#fca5a5",
              }}
            >
              Page loaded but no valid settings request was forged. Check: correct form action?
              hidden email field? auto-submit trigger?
            </div>
          )}
        </div>
      </div>

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The settings endpoint relied solely on the session cookie for authentication. Cookies are sent automatically by the browser on cross-origin requests, so any page alice visited could forge a valid POST. A CSRF token (a secret value embedded in the form and verified server-side) would have prevented this — the attacker's page cannot read alice's token due to the same-origin policy."
        />
      )}
    </div>
  );
}
