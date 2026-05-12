"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{d4a6b8c3f1e07259}";

type UserRecord = {
  id: number;
  username: string;
  role: string;
  email: string;
  secret_flag?: string;
};

const DB: Record<number, UserRecord> = {
  1:  { id: 1,  username: "admin",    role: "superadmin", email: "admin@corp.internal", secret_flag: FLAG },
  2:  { id: 2,  username: "jsmith",   role: "user",       email: "j.smith@example.com" },
  3:  { id: 3,  username: "alice",    role: "user",       email: "alice@example.com" },
  7:  { id: 7,  username: "bob",      role: "user",       email: "bob.t@example.com" },
  42: { id: 42, username: "you",      role: "user",       email: "your@email.com" },
};

const HINTS = [
  "You are authenticated as user #42. The endpoint is /api/users/{id}/profile — try different ID values.",
  "There is no server-side check that the requested ID belongs to the authenticated user. Any integer is accepted.",
  "Admin accounts often get the first IDs. Try ID=1.",
];

export function IDORLabTool() {
  const [userId, setUserId] = useState("42");
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(userId, 10);

    if (!id || isNaN(id) || id < 1) {
      setStatusCode(400);
      setResponse(JSON.stringify({ error: "Invalid user ID." }, null, 2));
      return;
    }

    const user = DB[id];
    if (!user) {
      setStatusCode(404);
      setResponse(JSON.stringify({ error: "User not found." }, null, 2));
      return;
    }

    setStatusCode(200);
    setResponse(JSON.stringify(user, null, 2));
    if (id === 1) setSolved(true);
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
          CorpApp returns user profiles by ID. You are authenticated as user #42. The endpoint
          accepts any ID without checking ownership.
        </p>
        <div
          className="mt-2 text-xs font-mono p-2 rounded"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          <span>GET /api/users/</span>
          <span style={{ color: "#a5b4fc" }}>{"{id}"}</span>
          <span>/profile</span>
          <br />
          <span>Authorization: Bearer eyJhbGc...  </span>
          <span style={{ color: "var(--text-muted)" }}>(user_id=42)</span>
        </div>
      </div>

      {/* Request builder */}
      <form onSubmit={sendRequest} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            GET /api/users/
            <span style={{ color: "#a5b4fc" }}>[ id ]</span>
            /profile
          </label>
          <input
            type="number"
            min={1}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 rounded-md text-sm font-mono"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
            }}
            placeholder="42"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium shrink-0"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Send →
        </button>
      </form>

      {/* Response */}
      {response !== null && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <div
            className="px-3 py-2 flex items-center gap-3"
            style={{
              background: "var(--bg-surface-2)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: statusCode === 200 ? "#6ee7b7" : "#fca5a5" }}
            >
              HTTP {statusCode}
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              /api/users/{userId}/profile
            </span>
          </div>
          <pre
            className="p-4 text-xs overflow-x-auto"
            style={{
              background: "#0a0d18",
              color: solved ? "#6ee7b7" : "var(--text-secondary)",
            }}
          >
            {response}
          </pre>
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
          explanation="The endpoint used the ID from the URL path as the sole lookup key, never comparing it to the authenticated user's ID. This Insecure Direct Object Reference (IDOR) lets any authenticated user enumerate IDs to access other users' data. The fix: verify that req.userId === tokenUserId before returning the record."
        />
      )}
    </div>
  );
}
