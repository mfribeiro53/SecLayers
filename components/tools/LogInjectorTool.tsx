"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface LogEntry {
  ts: string;
  level: string;
  msg: string;
  injected?: boolean;
}

const BASE_LOGS: LogEntry[] = [
  { ts: "2024-01-15 09:00:01", level: "INFO",  msg: "Server started on :8080" },
  { ts: "2024-01-15 09:00:45", level: "INFO",  msg: "User login: alice@example.com" },
  { ts: "2024-01-15 09:01:10", level: "INFO",  msg: "GET /api/dashboard 200 42ms" },
];

function parseLogInjection(input: string): LogEntry[] {
  const ts = "2024-01-15 09:02:00";
  if (input.includes("\n") || input.includes("\\n")) {
    const cleaned = input.replace(/\\n/g, "\n");
    const lines = cleaned.split("\n");
    return [
      { ts, level: "INFO", msg: `User login attempt: ${lines[0]}` },
      ...lines.slice(1).map(l => ({ ts: "2024-01-15 09:02:01", level: "INFO", msg: l.trim(), injected: true })),
    ];
  }
  return [{ ts, level: "INFO", msg: `User login attempt: ${input}` }];
}

export default function LogInjectorTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"raw" | "structured">("raw");
  const [logs, setLogs] = useState<LogEntry[]>(BASE_LOGS);
  const [attacked, setAttacked] = useState(false);

  const EXAMPLES = {
    normal: "alice@example.com",
    inject: "alice@example.com\n2024-01-15 09:02:01 INFO User login: admin@example.com\n2024-01-15 09:02:02 INFO Privilege escalated to admin",
    crlf:   "alice@example.com\\n2024-01-15 09:02:01 WARN Security check bypassed",
  };

  const submit = () => {
    const newEntries = parseLogInjection(input);
    const hasInjection = newEntries.some(e => e.injected);
    setLogs([...BASE_LOGS, ...newEntries]);
    setAttacked(hasInjection);
  };

  const reset = () => { setLogs(BASE_LOGS); setInput(""); setAttacked(false); };

  const levelColor: Record<string, string> = {
    INFO: "text-blue-400", WARN: "text-amber-400", ERROR: "text-red-400",
  };

  return (
    <ToolShell title="Log Injection Demo" description="See how unsanitized input can forge log entries.">
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-secondary font-medium">Mode:</span>
          <button onClick={() => setMode("raw")} className={`px-2 py-1 text-xs rounded border ${mode === "raw" ? "bg-slate-800 text-white border-slate-800" : "bg-surface-2 border-subtle text-secondary"}`}>Raw string concat</button>
          <button onClick={() => setMode("structured")} className={`px-2 py-1 text-xs rounded border ${mode === "structured" ? "bg-emerald-700 text-white border-emerald-700" : "bg-surface-2 border-subtle text-secondary"}`}>Structured JSON</button>
        </div>

        {mode === "raw" ? (
          <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-200">
            <span className="text-slate-500">// Vulnerable: string concatenation</span><br />
            <span className="text-amber-300">logger</span>.info(<span className="text-green-300">`User login attempt: $&#123;username&#125;`</span>);
          </div>
        ) : (
          <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-200">
            <span className="text-slate-500">// Safe: structured logging</span><br />
            <span className="text-amber-300">logger</span>.info(<span className="text-emerald-300">&#123; event: &quot;login&quot;, username &#125;</span>);
            <br /><span className="text-slate-500">// Output: &#123;&quot;event&quot;:&quot;login&quot;,&quot;username&quot;:&quot;...&quot;&#125;</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500">Examples:</span>
          {Object.entries(EXAMPLES).map(([k, v]) => (
            <button key={k} onClick={() => setInput(v)} className="px-2 py-0.5 text-xs bg-elevated text-secondary rounded hover:bg-strong">
              {k}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter username..."
            className="flex-1 text-xs border border-subtle rounded px-2 py-1.5 font-mono"
          />
          <button onClick={submit} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Submit</button>
          <button onClick={reset} className="px-3 py-1.5 bg-elevated text-secondary rounded text-xs hover:bg-strong">Reset</button>
        </div>

        {attacked && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            Log injection detected! Fake entries were injected into the log stream. An attacker can forge audit trails, hide actions, or confuse SIEM correlation rules.
            {mode === "structured" && " Structured logging would have escaped the newlines, preventing this."}
          </div>
        )}

        <div className="bg-slate-900 rounded p-3 font-mono text-xs leading-relaxed max-h-56 overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className={`${l.injected ? "bg-red-900/40 px-1 rounded" : ""}`}>
              <span className="text-slate-500">{l.ts} </span>
              <span className={levelColor[l.level] ?? "text-slate-300"}>{l.level} </span>
              <span className={l.injected ? "text-red-300" : "text-slate-200"}>{l.msg}</span>
              {l.injected && <span className="text-red-500 ml-2">[INJECTED]</span>}
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
