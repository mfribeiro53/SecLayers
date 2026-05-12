"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{f0e1b7a4c6d29538}";

const HINTS = [
  "GraphQL introspection lets you query the schema itself. Try: { __schema { types { name } } } to list all available types.",
  "You will see a type called AdminSecret that is not in the public docs. Query its fields: { __type(name: \"AdminSecret\") { fields { name } } }",
  "Once you know the field name, query it directly: { adminSecret { adminFlag } }",
];

type QueryResult = { data?: unknown; errors?: { message: string }[] };

function simulateQuery(query: string): QueryResult {
  const q = query.replace(/\s+/g, " ").trim().toLowerCase();

  if (q.includes("__schema") && q.includes("types")) {
    return {
      data: {
        __schema: {
          types: [
            { name: "Query" },
            { name: "User" },
            { name: "Post" },
            { name: "AdminSecret" },
            { name: "String" },
            { name: "Boolean" },
            { name: "Int" },
            { name: "__Schema" },
            { name: "__Type" },
            { name: "__Field" },
          ],
        },
      },
    };
  }

  if (q.includes("__type") && q.includes("adminsecret")) {
    return {
      data: {
        __type: {
          name: "AdminSecret",
          fields: [
            { name: "adminFlag", type: { name: "String" } },
            { name: "createdAt", type: { name: "String" } },
          ],
        },
      },
    };
  }

  if (q.includes("adminsecret") && q.includes("adminflag")) {
    return {
      data: {
        adminSecret: {
          adminFlag: FLAG,
          createdAt: "2023-01-01T00:00:00Z",
        },
      },
    };
  }

  if (q.includes("__schema") || q.includes("__type")) {
    return {
      data: {
        __schema: {
          types: [{ name: "Query" }, { name: "User" }, { name: "String" }],
        },
      },
    };
  }

  return {
    errors: [{ message: `Cannot query field "${q.split("{")[1]?.split("}")[0]?.trim() ?? "unknown"}" on type "Query".` }],
  };
}

export function GraphQLIntrospectionLabTool() {
  const [query, setQuery] = useState("{\n  \n}");
  const [results, setResults] = useState<{ query: string; result: QueryResult }[]>([]);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function runQuery(e: React.FormEvent) {
    e.preventDefault();
    const result = simulateQuery(query);
    setResults((prev) => [...prev, { query: query.trim(), result }]);

    const q = query.toLowerCase();
    if (q.includes("adminsecret") && q.includes("adminflag") && result.data) {
      setSolved(true);
    }
  }

  const EXAMPLES = [
    { label: "List types", value: "{\n  __schema {\n    types {\n      name\n    }\n  }\n}" },
    {
      label: "Inspect AdminSecret",
      value: '{\n  __type(name: "AdminSecret") {\n    fields {\n      name\n    }\n  }\n}',
    },
  ];

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          DevCorp's GraphQL API has introspection enabled in production. The schema contains types
          that are not in the public documentation. Use introspection to discover them, then query
          the hidden field.
        </p>
        <div
          className="mt-2 text-xs font-mono p-2 rounded"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          POST https://api.devcorp.internal/graphql
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Query editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Query editor
            </p>
            <div className="flex gap-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setQuery(ex.value)}
                  className="text-[10px] px-2 py-1 rounded"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={runQuery} className="space-y-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-md text-sm font-mono resize-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
              spellCheck={false}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Run →
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Response log
          </p>
          <div
            className="rounded-lg p-3 space-y-3 overflow-y-auto max-h-64"
            style={{ background: "#0a0d18", border: "1px solid var(--border-subtle)" }}
          >
            {results.length === 0 ? (
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                // responses will appear here
              </p>
            ) : (
              [...results].reverse().map((r, i) => (
                <div key={i} className="space-y-1">
                  <p
                    className="text-[10px] font-mono truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    &gt; {r.query.replace(/\n/g, " ").slice(0, 60)}
                  </p>
                  <pre
                    className="text-xs overflow-x-auto"
                    style={{
                      color: r.result.errors
                        ? "#fca5a5"
                        : solved && i === 0
                        ? "#6ee7b7"
                        : "#93c5fd",
                    }}
                  >
                    {JSON.stringify(r.result, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
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
          explanation="Introspection exposed a type (AdminSecret) that was implemented but not documented. By querying __schema and __type, you enumerated the full schema and discovered a field (adminFlag) that should have been internal. The fix: disable introspection in production (Apollo: introspection: false) or enforce auth on introspection queries."
        />
      )}
    </div>
  );
}
