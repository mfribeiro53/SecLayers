"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const V1_RESPONSE = {
  id: 123,
  name: "Alice Johnson",
  email: "alice@example.com",
  address: "123 Main St, Springfield",
  phone: "+1-555-0100",
  ssn_last4: "1234",
  created_at: "2023-01-15T08:30:00Z",
};

const V2_RESPONSE = {
  id: 123,
  name: "Alice Johnson",
  created_at: "2023-01-15T08:30:00Z",
};

type V1Key = keyof typeof V1_RESPONSE;
const LEAKED_FIELDS = (Object.keys(V1_RESPONSE) as V1Key[]).filter(
  (k) => !(k in V2_RESPONSE)
);

export default function ApiDiffTool() {
  const [showV1, setShowV1] = useState(false);

  return (
    <ToolShell title="API Version Diff Tool" description="Compare API versions and see what data leaks through deprecated endpoints.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setShowV1(true)} className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700">GET /api/v1/users/123</button>
          <button onClick={() => setShowV1(false)} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700">GET /api/v2/users/123</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className={`p-4 rounded-lg border ${showV1 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
            <p className="text-sm font-semibold mb-2">{showV1 ? "⚠️ v1 Response (deprecated but still live)" : "v2 Response (current)"}</p>
            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">{JSON.stringify(showV1 ? V1_RESPONSE : V2_RESPONSE, null, 2)}</pre>
          </div>
        </div>

        {showV1 && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Fields leaked by v1:</p>
            {LEAKED_FIELDS.map((f) => (
              <p key={f} className="text-xs text-red-700">
                <code className="bg-red-100 px-1 rounded">{f}</code>: {JSON.stringify(V1_RESPONSE[f])}
              </p>
            ))}
            <p className="text-xs text-red-600 mt-2">v1 was deprecated but never deactivated. Attackers probing old endpoints find sensitive data that v2 intentionally hides.</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
