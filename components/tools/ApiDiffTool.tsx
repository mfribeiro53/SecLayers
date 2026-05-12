"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const DEFAULT_V1 = JSON.stringify(
  {
    id: 123,
    name: "Alice Johnson",
    email: "alice@example.com",
    address: "123 Main St, Springfield",
    phone: "+1-555-0100",
    ssn_last4: "1234",
    created_at: "2023-01-15T08:30:00Z",
  },
  null,
  2
);

const DEFAULT_V2 = JSON.stringify(
  {
    id: 123,
    name: "Alice Johnson",
    email: "alice@example.com",
    created_at: "2023-01-15T08:30:00Z",
    profile_url: "/users/123",
  },
  null,
  2
);

interface DiffResult {
  removed: string[];
  added: string[];
  changed: { key: string; from: unknown; to: unknown }[];
  same: string[];
}

function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): DiffResult {
  const aKeys = new Set(Object.keys(a));
  const bKeys = new Set(Object.keys(b));
  const removed = [...aKeys].filter((k) => !bKeys.has(k));
  const added = [...bKeys].filter((k) => !aKeys.has(k));
  const common = [...aKeys].filter((k) => bKeys.has(k));
  const changed = common
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => ({ key: k, from: a[k], to: b[k] }));
  const same = common.filter(
    (k) => JSON.stringify(a[k]) === JSON.stringify(b[k])
  );
  return { removed, added, changed, same };
}

function fmt(v: unknown): string {
  const s = JSON.stringify(v);
  return s.length > 40 ? s.slice(0, 37) + "…" : s;
}

export default function ApiDiffTool() {
  const [v1Text, setV1Text] = useState(DEFAULT_V1);
  const [v2Text, setV2Text] = useState(DEFAULT_V2);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleDiff = () => {
    let a: unknown, b: unknown;
    try {
      a = JSON.parse(v1Text);
    } catch {
      setParseError("v1: Invalid JSON");
      return;
    }
    try {
      b = JSON.parse(v2Text);
    } catch {
      setParseError("v2: Invalid JSON");
      return;
    }
    if (typeof a !== "object" || Array.isArray(a) || a === null) {
      setParseError("v1: Expected a JSON object {}");
      return;
    }
    if (typeof b !== "object" || Array.isArray(b) || b === null) {
      setParseError("v2: Expected a JSON object {}");
      return;
    }
    setParseError(null);
    setDiff(
      diffObjects(
        a as Record<string, unknown>,
        b as Record<string, unknown>
      )
    );
  };

  return (
    <ToolShell
      title="API Version Diff Tool"
      description="Paste two API responses and compare them. See which fields are leaked by deprecated endpoints."
    >
      <div className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              v1 response (deprecated)
            </label>
            <textarea
              value={v1Text}
              onChange={(e) => {
                setV1Text(e.target.value);
                setDiff(null);
                setParseError(null);
              }}
              className="w-full p-2.5 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-amber-500/40 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={12}
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              v2 response (current)
            </label>
            <textarea
              value={v2Text}
              onChange={(e) => {
                setV2Text(e.target.value);
                setDiff(null);
                setParseError(null);
              }}
              className="w-full p-2.5 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-emerald-500/40 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={12}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Compare button */}
        <button
          onClick={handleDiff}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
        >
          Compare
        </button>

        {parseError && (
          <p className="text-xs text-amber-500">{parseError}</p>
        )}

        {/* Diff results */}
        {diff && (
          <div className="space-y-3">
            {/* Removed = leaked by v1 */}
            {diff.removed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 mb-1">
                  Removed in v2 — fields leaked by v1 ({diff.removed.length})
                </p>
                <div className="space-y-1">
                  {diff.removed.map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 px-2 py-1 bg-danger-subtle border border-danger-subtle rounded text-xs"
                    >
                      <span className="text-red-500 font-bold">−</span>
                      <span className="font-mono text-danger font-semibold">{k}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  v1 was deprecated but never deactivated. Attackers probing old endpoints find data that v2 intentionally hides.
                </p>
              </div>
            )}

            {/* Added in v2 */}
            {diff.added.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-1">
                  Added in v2 ({diff.added.length})
                </p>
                <div className="space-y-1">
                  {diff.added.map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 px-2 py-1 bg-success-subtle border border-success-subtle rounded text-xs"
                    >
                      <span className="text-emerald-500 font-bold">+</span>
                      <span className="font-mono text-success font-semibold">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changed values */}
            {diff.changed.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-400 mb-1">
                  Changed ({diff.changed.length})
                </p>
                <div className="space-y-1">
                  {diff.changed.map(({ key, from, to }) => (
                    <div
                      key={key}
                      className="px-2 py-1 bg-warning-subtle border border-warning-subtle rounded text-xs"
                    >
                      <span className="font-mono text-warning font-semibold">{key}</span>
                      <span className="text-slate-500 ml-2">
                        <span className="text-danger line-through">{fmt(from)}</span>
                        <span className="mx-1">→</span>
                        <span className="text-success">{fmt(to)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unchanged */}
            {diff.same.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Unchanged ({diff.same.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {diff.same.map((k) => (
                    <span
                      key={k}
                      className="px-1.5 py-0.5 bg-surface-2 border border-subtle rounded text-[10px] font-mono text-slate-500"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
