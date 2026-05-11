"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function CSPSandboxTool() {
  const [policy, setPolicy] = useState("default-src 'self'; script-src 'self'; object-src 'none'");
  const [testPayload, setTestPayload] = useState("<script>alert(1)</script>");

  // Simulate CSP evaluation
  function evaluate(pol: string): { directive: string; value: string; allowed: boolean; note: string }[] {
    const results = [];
    const hasScriptSelf = pol.includes("script-src") && pol.includes("'self'");
    const hasUnsafeInline = pol.includes("'unsafe-inline'");
    const hasObjectNone = pol.includes("object-src 'none'");
    const hasBaseSelf = pol.includes("base-uri 'self'");

    results.push({
      directive: "Inline <script>",
      value: testPayload,
      allowed: hasUnsafeInline,
      note: hasUnsafeInline
        ? "⚠️ Allowed — 'unsafe-inline' permits all inline scripts. CSP provides no XSS protection."
        : "✅ Blocked — inline scripts are not allowed. The CSP blocks this XSS vector.",
    });

    results.push({
      directive: "<script src='...'>",
      value: `<script src="https://evil.com/xss.js"></script>`,
      allowed: !hasScriptSelf || pol.includes("https://evil.com"),
      note: hasScriptSelf && !pol.includes("evil.com")
        ? "✅ Blocked — only 'self' scripts allowed. External scripts from evil.com rejected."
        : "⚠️ Allowed — either script-src is missing or the source is whitelisted.",
    });

    results.push({
      directive: "<object> / <embed>",
      value: `<object data="https://evil.com/exploit.swf"></object>`,
      allowed: !hasObjectNone,
      note: hasObjectNone
        ? "✅ Blocked — object-src 'none' prevents Flash/ActiveX attacks."
        : "⚠️ Allowed — add object-src 'none' to block legacy plugin vectors.",
    });

    results.push({
      directive: "<base> tag injection",
      value: `<base href="https://evil.com/">`,
      allowed: !hasBaseSelf,
      note: hasBaseSelf
        ? "✅ Blocked — base-uri 'self' prevents base tag hijacking."
        : "⚠️ Allowed — add base-uri 'self' to prevent base tag injection.",
    });

    results.push({
      directive: "Inline event handler",
      value: `<img src=x onerror="alert(1)">`,
      allowed: hasUnsafeInline,
      note: hasUnsafeInline
        ? "⚠️ Allowed — 'unsafe-inline' permits inline event handlers."
        : "✅ Blocked — inline event handlers are treated as inline scripts.",
    });

    return results;
  }

  const results = evaluate(policy);

  return (
    <ToolShell title="CSP Sandbox" description="Write a Content Security Policy and test what it blocks.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CSP Policy</label>
          <textarea value={policy} onChange={(e) => setPolicy(e.target.value)} className="w-full h-20 px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Test Payload</label>
          <input type="text" value={testPayload} onChange={(e) => setTestPayload(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs" />
        </div>
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`p-3 rounded-lg border text-sm ${r.allowed ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex justify-between items-start">
                <p className="font-medium text-slate-700">{r.directive}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${r.allowed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{r.allowed ? "Allowed" : "Blocked"}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{r.note}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
