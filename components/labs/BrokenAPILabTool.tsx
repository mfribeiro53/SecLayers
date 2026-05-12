"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{e5d3a8f2b09c6147}";

// Pre-built expired JWT: header.payload.signature
// Payload: {sub:"api_user",iat:1680000000,exp:1680003600,role:"admin",scope:"admin:read"}
// exp 1680003600 = 2023-03-28T13:00:00Z — long expired
const EXPIRED_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiJhcGlfdXNlciIsImlhdCI6MTY4MDAwMDAwMCwiZXhwIjoxNjgwMDAzNjAwLCJyb2xlIjoiYWRtaW4iLCJzY29wZSI6ImFkbWluOnJlYWQifQ" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const DECODED_PAYLOAD = {
  sub: "api_user",
  iat: 1680000000,
  exp: 1680003600,
  role: "admin",
  scope: "admin:read",
};

const HINTS = [
  "Decode the JWT payload (the middle section, base64url) — look at the exp claim. What date does it correspond to?",
  "The server validates the JWT signature, but the middleware has a bug: it never checks that Date.now() < exp * 1000.",
  "Just send the expired token. The buggy server will accept it and return the admin user list.",
];

type SendMode = "none" | "expired";

const ADMIN_RESPONSE = {
  users: [
    { id: 1, username: "admin", role: "superadmin" },
    { id: 2, username: "jsmith", role: "user" },
    { id: 3, username: "alice", role: "user" },
  ],
  _debug_flag: FLAG,
};

export function BrokenAPILabTool() {
  const [decoded, setDecoded] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>("none");
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function sendRequest(mode: SendMode) {
    setSendMode(mode);
    if (mode === "none") {
      setResponse({
        status: 401,
        body: JSON.stringify({ error: "Unauthorized — missing Authorization header." }, null, 2),
      });
    } else {
      setResponse({
        status: 200,
        body: JSON.stringify(ADMIN_RESPONSE, null, 2),
      });
      setSolved(true);
    }
  }

  const expDate = new Date(DECODED_PAYLOAD.exp * 1000).toUTCString();

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          You intercepted a JWT from a previous admin session (network traffic from a shared
          Wi-Fi). The token is expired. The admin endpoint <code style={{ color: "#a5b4fc" }}>GET /api/v1/admin/users</code> should
          reject it — but the middleware has a bug.
        </p>
      </div>

      {/* Token vault */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Intercepted token
        </p>
        <code
          className="block text-xs font-mono break-all leading-relaxed"
          style={{ color: "#a5b4fc" }}
        >
          {EXPIRED_JWT}
        </code>

        <button
          onClick={() => setDecoded(true)}
          className="text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            background: decoded ? "rgba(52,211,153,0.08)" : "var(--bg-surface-2)",
            border: `1px solid ${decoded ? "rgba(52,211,153,0.3)" : "var(--border-subtle)"}`,
            color: decoded ? "#6ee7b7" : "var(--text-secondary)",
          }}
        >
          {decoded ? "✓ Decoded" : "Decode payload →"}
        </button>

        {decoded && (
          <div
            className="p-3 rounded text-xs font-mono space-y-1"
            style={{ background: "#0a0d18", border: "1px solid var(--border-subtle)" }}
          >
            {Object.entries(DECODED_PAYLOAD).map(([k, v]) => (
              <div key={k}>
                <span style={{ color: "var(--text-muted)" }}>&quot;{k}&quot;: </span>
                <span
                  style={{
                    color: k === "exp" ? "#fca5a5" : k === "role" ? "#fcd34d" : "#93c5fd",
                  }}
                >
                  {typeof v === "string" ? `"${v}"` : String(v)}
                </span>
                {k === "exp" && (
                  <span style={{ color: "#fca5a5" }}>  ← EXPIRED ({expDate})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API request */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Send request to GET /api/v1/admin/users
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => sendRequest("none")}
            className="px-3 py-1.5 text-xs rounded"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Without token
          </button>
          <button
            onClick={() => sendRequest("expired")}
            className="px-3 py-1.5 text-xs rounded font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            With expired token →
          </button>
        </div>

        {response && (
          <div
            className="rounded overflow-hidden text-xs"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="px-3 py-2 font-mono flex items-center gap-3"
              style={{
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border-subtle)",
                color: response.status === 200 ? "#6ee7b7" : "#fca5a5",
              }}
            >
              <span>HTTP {response.status}</span>
              <span style={{ color: "var(--text-muted)" }}>GET /api/v1/admin/users</span>
              {sendMode === "expired" && (
                <span style={{ color: "#fcd34d" }}>
                  Authorization: Bearer {EXPIRED_JWT.slice(0, 20)}…
                </span>
              )}
            </div>
            <pre
              className="p-3 overflow-x-auto"
              style={{
                background: "#0a0d18",
                color: solved ? "#6ee7b7" : "var(--text-secondary)",
              }}
            >
              {response.body}
            </pre>
          </div>
        )}
      </div>

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The middleware verified the JWT signature (ensuring it was genuinely issued by the server) but skipped the expiry check. An expired token with a valid signature was accepted as authentic. The fix: always validate exp — most JWT libraries do this automatically unless you pass ignoreExpiration: true."
        />
      )}
    </div>
  );
}
