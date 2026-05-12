"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

// ── SDL parser ───────────────────────────────────────────────────
interface GQLField {
  name: string;
  type: string;
  directives: string[];
  line: string;
}

interface GQLType {
  kind: string;
  name: string;
  fields: GQLField[];
}

function parseSDL(sdl: string): GQLType[] {
  const types: GQLType[] = [];
  const typeRe = /(type|input|interface|enum|union)\s+(\w+)[^{]*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = typeRe.exec(sdl)) !== null) {
    const kind = m[1];
    const name = m[2];
    const body = m[3];
    const fields: GQLField[] = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const fm = line.match(/^(\w+)(\([^)]*\))?\s*:\s*([\w\[\]!]+)(.*)?$/);
      if (!fm) continue;
      const directives = (fm[4] ?? "").match(/@\w+/g) ?? [];
      fields.push({ name: fm[1], type: fm[3].replace(/[!\[\]]/g, ""), directives, line });
    }
    types.push({ kind, name, fields });
  }
  return types;
}

const SENSITIVE_NAMES = new Set([
  "password", "passwd", "secret", "token", "apikey", "api_key", "ssn",
  "creditcard", "credit_card", "cvv", "pin", "privatekey", "private_key",
  "accesstoken", "access_token", "refreshtoken", "refresh_token",
]);

interface SchemaFinding {
  severity: "critical" | "high" | "medium" | "info";
  message: string;
}

function auditSchema(types: GQLType[]): SchemaFinding[] {
  const findings: SchemaFinding[] = [];

  for (const t of types) {
    for (const f of t.fields) {
      const nameLower = f.name.toLowerCase().replace(/_/g, "");
      if (SENSITIVE_NAMES.has(nameLower)) {
        findings.push({
          severity: "high",
          message: `${t.name}.${f.name} exposes a sensitive field. Consider removing this field from public types or hiding it behind an auth check.`,
        });
      }
      if (
        (nameLower.startsWith("admin") || nameLower.includes("delete") || nameLower.includes("drop")) &&
        !f.directives.some((d) => /auth|admin|guard|protect/i.test(d))
      ) {
        findings.push({
          severity: "critical",
          message: `${t.name}.${f.name} looks privileged but has no @auth/@admin directive. It may be accessible without authorization.`,
        });
      }
    }
  }

  const queryType = types.find((t) => t.name === "Query" || t.name === "Mutation");
  if (queryType) {
    const hasAuth = queryType.fields.some((f) => f.directives.length > 0);
    if (!hasAuth) {
      findings.push({
        severity: "medium",
        message: `No auth directives found on any field. Without @auth or equivalent middleware, all fields are publicly accessible.`,
      });
    }
  }

  if (types.length > 0 && findings.length === 0) {
    findings.push({ severity: "info", message: "No obvious issues detected in this schema snippet." });
  }

  return findings;
}

// ── Depth counter ────────────────────────────────────────────────
function countQueryDepth(query: string): number {
  let max = 0, current = 0;
  for (const ch of query) {
    if (ch === "{") { current++; if (current > max) max = current; }
    else if (ch === "}") current--;
  }
  return max;
}

function countAliases(query: string): number {
  return (query.match(/\b\w+\s*:/g) ?? []).length;
}

// ── Defaults ─────────────────────────────────────────────────────
const DEFAULT_SCHEMA = `type Query {
  users: [User]
  login(username: String, password: String): AuthResult
  adminStats: AdminStats
  deleteUser(id: ID): Boolean
}

type User {
  id: ID
  email: String
  ssn: String
  password: String
  role: String
}

type AuthResult {
  token: String
  user: User
}

type AdminStats {
  totalRevenue: Float
  activeUsers: Int
}`;

const DEFAULT_DEPTH_QUERY = `{
  users {
    posts {
      author {
        posts {
          title
        }
      }
    }
  }
}`;

const sev: Record<string, string> = {
  critical: "border-l-red-500 bg-danger-subtle text-danger",
  high:     "border-l-orange-500 bg-orange-subtle text-orange",
  medium:   "border-l-amber-500 bg-warning-subtle text-warning",
  info:     "border-l-blue-500 bg-info-subtle text-info",
};

export default function GraphQLExplorerTool() {
  const [mode, setMode] = useState<"introspection" | "depth" | "batch">("introspection");
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [depthQuery, setDepthQuery] = useState(DEFAULT_DEPTH_QUERY);
  const [batchCount, setBatchCount] = useState(10);

  // Introspection mode
  const types = parseSDL(schema);
  const findings = auditSchema(types);

  // Depth mode
  const depth = countQueryDepth(depthQuery);

  // Batch mode
  const generateBatch = (n: number): string => {
    let q = "query BruteForce {\n";
    for (let i = 0; i < n; i++) {
      q += `  q${i}: login(password: "guess${i}") { token }\n`;
    }
    q += "}";
    return q;
  };
  const batchQuery = generateBatch(batchCount);
  const aliasCount = countAliases(batchQuery);

  return (
    <ToolShell
      title="GraphQL Security Explorer"
      description="Audit schemas for exposed sensitive fields, measure real query depth, and understand batching attacks."
    >
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-1 bg-elevated p-1 rounded-lg w-fit">
          {(["introspection", "depth", "batch"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize ${
                mode === m
                  ? "bg-surface-2 shadow-sm text-secondary"
                  : "text-slate-500 hover:text-secondary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* ── Introspection ── */}
        {mode === "introspection" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                GraphQL Schema SDL (editable)
              </label>
              <textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                className="w-full p-3 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={16}
                spellCheck={false}
              />
            </div>

            {types.length > 0 && (
              <div>
                <p className="text-xs font-medium text-secondary mb-1">
                  Parsed introspection — {types.length} type{types.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-1.5">
                  {types.map((t) => (
                    <div key={t.name} className="px-2 py-1.5 bg-surface-2 border border-subtle rounded text-xs">
                      <span className="text-slate-500 text-[10px] mr-1">{t.kind}</span>
                      <span className="font-mono font-semibold text-blue-400">{t.name}</span>
                      <span className="text-slate-500 ml-2">
                        {t.fields.map((f) => f.name).join(", ") || "(no fields)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-secondary">
                Security findings ({findings.length})
              </p>
              {findings.map((f, i) => (
                <div key={i} className={`border-l-4 pl-3 py-1.5 rounded-r text-xs ${sev[f.severity]}`}>
                  <span className="font-bold uppercase text-[10px]">{f.severity}</span>
                  <p className="mt-0.5">{f.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Depth ── */}
        {mode === "depth" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Query (edit or paste your own)
              </label>
              <textarea
                value={depthQuery}
                onChange={(e) => setDepthQuery(e.target.value)}
                className="w-full p-3 bg-slate-900 text-green-400 text-xs font-mono leading-5 rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={12}
                spellCheck={false}
              />
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-2 rounded border text-sm font-semibold ${
                  depth > 7
                    ? "bg-danger-subtle border-red-300 text-danger"
                    : depth > 4
                    ? "bg-warning-subtle border-amber-300 text-warning"
                    : "bg-success-subtle border-emerald-300 text-success"
                }`}
              >
                Depth: {depth}
              </div>
              <p className="text-xs text-slate-500">
                {depth > 7
                  ? "Dangerous — this query can return exponentially many objects. Enforce a max depth of 4–7."
                  : depth > 4
                  ? "Deep — monitor resolver performance. Consider a depth limit."
                  : "Acceptable depth."}
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Depth is counted by nesting level of <code className="font-mono">{"{"}</code> braces.
              At depth {depth}, a single query can resolve O(n^{depth}) objects if not limited.
            </p>
          </div>
        )}

        {/* ── Batch ── */}
        {mode === "batch" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary">Aliased queries:</span>
              <input
                type="range"
                min={1}
                max={100}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-xs font-mono text-secondary">{batchCount}</span>
            </div>

            <pre className="p-3 rounded bg-slate-900 text-green-400 text-xs font-mono overflow-x-auto max-h-48 leading-5">
              {batchQuery}
            </pre>

            <div
              className={`px-3 py-2 rounded border text-xs font-semibold w-fit ${
                aliasCount > 20
                  ? "bg-danger-subtle border-red-300 text-danger"
                  : "bg-warning-subtle border-amber-300 text-warning"
              }`}
            >
              {aliasCount} operation alias{aliasCount !== 1 ? "es" : ""} in one HTTP request
            </div>

            <p className="text-xs text-slate-500">
              GraphQL allows multiple aliased fields in one query. Each alias runs a separate resolver — a
              single request can test {batchCount} passwords with one HTTP call, bypassing naive IP-based
              rate limiting. Fix: count each alias independently against per-user rate limits.
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
