"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function GraphQLExplorerTool() {
  const [mode, setMode] = useState<"introspection" | "batch" | "depth">("introspection");
  const [depth, setDepth] = useState(3);
  const [batchCount, setBatchCount] = useState(5);

  const introQuery = `{
  __schema {
    types {
      name
      fields { name }
    }
  }
}`;

  const generateDepthQuery = (d: number): string => {
    let q = "{\n  users {\n";
    for (let i = 0; i < d; i++) {
      q += `    posts {\n    author {\n`;
    }
    q += `    name\n`;
    for (let i = 0; i < d; i++) {
      q += `    }\n  }\n`;
    }
    q += "}";
    return q;
  };

  const generateBatchQuery = (n: number): string => {
    let q = "query {\n";
    for (let i = 0; i < n; i++) {
      q += `  q${i}: login(password: "guess${i}") { token }\n`;
    }
    q += "}";
    return q;
  };

  const data = {
    __schema: {
      types: [
        { name: "Query", fields: [{ name: "users" }, { name: "login" }, { name: "adminStats" }, { name: "deleteUser" }] },
        { name: "User", fields: [{ name: "id" }, { name: "email" }, { name: "ssn" }, { name: "password" }] },
      ],
    },
  };

  return (
    <ToolShell title="GraphQL Security Explorer" description="Explore GraphQL-specific attacks: introspection, batching, and deep queries.">
      <div className="space-y-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {(["introspection", "batch", "depth"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize ${mode === m ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>{m}</button>
          ))}
        </div>

        {mode === "introspection" && (
          <div className="space-y-3">
            <pre className="p-3 rounded-md text-xs font-mono bg-slate-900 text-green-400 overflow-x-auto">{introQuery}</pre>
            <pre className="p-3 rounded-md text-xs font-mono bg-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-48">{JSON.stringify(data, null, 2)}</pre>
            <p className="text-xs text-slate-500">The attacker discovers hidden fields: <code>adminStats</code>, <code>deleteUser</code>, <code>ssn</code>. Disable introspection in production.</p>
          </div>
        )}

        {mode === "depth" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Depth:</span>
              <input type="range" min={1} max={8} value={depth} onChange={(e) => setDepth(parseInt(e.target.value))} className="w-32" />
              <span className="text-xs font-mono text-slate-700">{depth}</span>
            </div>
            <pre className="p-3 rounded-md text-xs font-mono bg-slate-900 text-green-400 overflow-x-auto max-h-48">{generateDepthQuery(depth)}</pre>
            <p className="text-xs text-slate-500">Depth {depth} can return exponentially many objects. Enforce a query depth limit (4-7) in production.</p>
          </div>
        )}

        {mode === "batch" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Aliased queries:</span>
              <input type="range" min={1} max={50} value={batchCount} onChange={(e) => setBatchCount(parseInt(e.target.value))} className="w-32" />
              <span className="text-xs font-mono text-slate-700">{batchCount}</span>
            </div>
            <pre className="p-3 rounded-md text-xs font-mono bg-slate-900 text-green-400 overflow-x-auto max-h-48">{generateBatchQuery(batchCount)}</pre>
            <p className="text-xs text-slate-500">{batchCount} login attempts in one request. Count each aliased query against rate limits individually.</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
