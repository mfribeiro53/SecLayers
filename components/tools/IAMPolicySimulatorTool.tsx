"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const POLICIES = [
  {
    id: "dev-policy",
    name: "developer-policy",
    statements: [
      { effect: "Allow", actions: ["s3:GetObject", "s3:PutObject"], resources: ["arn:aws:s3:::app-uploads/*"] },
      { effect: "Allow", actions: ["ec2:DescribeInstances"], resources: ["*"] },
      { effect: "Deny",  actions: ["s3:DeleteObject"], resources: ["*"] },
    ],
  },
  {
    id: "admin-policy",
    name: "admin-policy (overly broad)",
    statements: [
      { effect: "Allow", actions: ["*"], resources: ["*"] },
    ],
  },
];

const REQUESTS = [
  { action: "s3:GetObject",         resource: "arn:aws:s3:::app-uploads/photo.jpg" },
  { action: "s3:DeleteObject",      resource: "arn:aws:s3:::app-uploads/photo.jpg" },
  { action: "s3:PutObject",         resource: "arn:aws:s3:::private-data/keys.txt" },
  { action: "ec2:TerminateInstances", resource: "arn:aws:ec2:::instance/i-1234" },
  { action: "iam:CreateUser",       resource: "*" },
];

function matchesResource(pattern: string, resource: string) {
  if (pattern === "*") return true;
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(resource);
}

function evaluate(policyId: string, action: string, resource: string): { result: string; reason: string } {
  const policy = POLICIES.find(p => p.id === policyId);
  if (!policy) return { result: "DENY", reason: "Policy not found" };

  let hasAllow = false;
  for (const stmt of policy.statements) {
    const actionMatch = stmt.actions.includes("*") || stmt.actions.includes(action);
    const resourceMatch = stmt.resources.some(r => matchesResource(r, resource));
    if (actionMatch && resourceMatch) {
      if (stmt.effect === "Deny") return { result: "DENY", reason: `Explicit Deny in statement covering ${stmt.actions.join(", ")} on ${stmt.resources.join(", ")}` };
      if (stmt.effect === "Allow") hasAllow = true;
    }
  }
  if (hasAllow) return { result: "ALLOW", reason: "Matched an Allow statement with no overriding Deny" };
  return { result: "DENY", reason: "Implicit Deny — no matching Allow statement" };
}

export default function IAMPolicySimulatorTool() {
  const [policyId, setPolicyId] = useState("dev-policy");
  const [reqIdx, setReqIdx] = useState(0);
  const [result, setResult] = useState<{ result: string; reason: string } | null>(null);

  const req = REQUESTS[reqIdx];
  const policy = POLICIES.find(p => p.id === policyId)!;

  const run = () => setResult(evaluate(policyId, req.action, req.resource));

  return (
    <ToolShell title="IAM Policy Simulator" description="Evaluate whether a policy allows or denies an action on a resource.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Policy</label>
            <select value={policyId} onChange={e => { setPolicyId(e.target.value); setResult(null); }} className="w-full text-xs border border-subtle rounded px-2 py-1.5 bg-surface-2">
              {POLICIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Request</label>
            <select value={reqIdx} onChange={e => { setReqIdx(+e.target.value); setResult(null); }} className="w-full text-xs border border-subtle rounded px-2 py-1.5 bg-surface-2">
              {REQUESTS.map((r, i) => <option key={i} value={i}>{r.action}</option>)}
            </select>
          </div>
        </div>

        <div className="p-3 bg-surface-2 rounded border border-subtle text-xs space-y-1 font-mono">
          <div><span className="text-slate-500">action:   </span><span className="text-blue-700">{req.action}</span></div>
          <div><span className="text-slate-500">resource: </span><span className="text-blue-700">{req.resource}</span></div>
        </div>

        <div className="p-3 bg-surface-2 rounded border border-subtle text-xs space-y-1">
          <p className="font-medium text-secondary mb-2">Policy statements ({policy.name}):</p>
          {policy.statements.map((s, i) => (
            <div key={i} className={`flex gap-2 items-start px-2 py-1 rounded ${s.effect === "Allow" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              <span className={`font-bold text-xs w-10 shrink-0 ${s.effect === "Allow" ? "text-emerald-700" : "text-red-700"}`}>{s.effect}</span>
              <span className="text-secondary">{s.actions.join(", ")} on {s.resources.join(", ")}</span>
            </div>
          ))}
        </div>

        <button onClick={run} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
          Evaluate Request
        </button>

        {result && (
          <div className={`p-4 rounded-lg border text-sm ${result.result === "ALLOW" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            <p className="font-bold text-base">{result.result}</p>
            <p className="text-xs mt-1">{result.reason}</p>
            {result.result === "DENY" && <p className="text-xs mt-2 text-slate-500">Rule: Explicit Deny &gt; Explicit Allow &gt; Implicit Deny (default)</p>}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
