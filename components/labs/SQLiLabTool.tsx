"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{a3f8c2d1e5b79046}";

const HINTS = [
  "Single quotes break SQL string boundaries — try typing a ' by itself in the username field and look at the query preview.",
  "The WHERE clause checks username AND password. If you make just the username condition always true, the rest gets ignored.",
  "Classic bypass: username = ' OR '1'='1  — this closes the username string, appends a condition that is always true, and the trailing quote matches the original closing quote.",
];

function isBypass(input: string): boolean {
  const s = input.toLowerCase();
  return (
    /'\s*or\s/i.test(s) ||
    /'\s*--/.test(s) ||
    /'#/.test(s) ||
    /1\s*=\s*1/.test(s) ||
    /'\s*or\s*'1/i.test(s)
  );
}

export function SQLiLabTool() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [log, setLog] = useState<string[]>([
    "// ShopCo Admin Panel — query log",
    "// Awaiting login attempt...",
  ]);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const next = [...log, `> ${query}`];

    if (isBypass(username) || isBypass(password)) {
      next.push(
        "< RESULT  [row] {id:1, username:'admin', role:'superadmin'}",
        "< AUTH    Passed — session granted.",
        "< SECRET  Fetching flag from secure_data...",
        `< FLAG    ${FLAG}`,
      );
      setSolved(true);
    } else {
      next.push(
        "< RESULT  0 rows returned.",
        "< AUTH    Failed — invalid credentials.",
      );
    }
    setLog(next);
  }

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>
          VULNERABLE CODE
        </p>
        <pre
          className="text-xs overflow-x-auto leading-relaxed"
          style={{ color: "#c4b5fd" }}
        >{`# Python (Flask)
query = (
    "SELECT * FROM users WHERE username='"
    + request.form["username"]
    + "' AND password='"
    + request.form["password"] + "'"
)
db.execute(query)  # no parameterization!`}</pre>
      </div>

      {/* Login form */}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm font-mono"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              placeholder="username"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              className="text-xs mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm font-mono"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              placeholder="password"
              autoComplete="off"
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: "var(--accent)", color: "white" }}
        >
          Login →
        </button>
      </form>

      {/* Query log */}
      <div
        className="rounded-lg p-4 font-mono text-xs space-y-1 overflow-y-auto max-h-48"
        style={{ background: "#0a0d18", border: "1px solid var(--border-subtle)" }}
      >
        {log.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.startsWith("<")
                ? line.includes(FLAG)
                  ? "#6ee7b7"
                  : line.includes("Failed")
                  ? "#fca5a5"
                  : "#93c5fd"
                : "var(--text-muted)",
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The payload ' OR '1'='1 closes the username string, injects a condition that is always true, and the trailing quote satisfies the SQL parser. The WHERE clause evaluates to true for every row, returning admin's record and bypassing the password check entirely."
        />
      )}
    </div>
  );
}
