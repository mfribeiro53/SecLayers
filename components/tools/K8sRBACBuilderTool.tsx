"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const ROLES = [
  {
    name: "pod-reader",
    rules: [{ verbs: ["get", "list", "watch"], resources: ["pods"] }],
  },
  {
    name: "dangerous-role (wildcard)",
    rules: [{ verbs: ["*"], resources: ["*"] }],
  },
  {
    name: "secret-reader",
    rules: [{ verbs: ["get", "list"], resources: ["secrets"] }],
  },
  {
    name: "pod-exec",
    rules: [{ verbs: ["create"], resources: ["pods/exec"] }],
  },
];

const CHECKS = [
  { verb: "get",    resource: "pods",      label: "Get pods" },
  { verb: "exec",   resource: "pods/exec", label: "Exec into pod" },
  { verb: "get",    resource: "secrets",   label: "Read secrets" },
  { verb: "create", resource: "pods",      label: "Create pod" },
  { verb: "delete", resource: "nodes",     label: "Delete nodes" },
  { verb: "create", resource: "clusterrolebindings", label: "Create ClusterRoleBindings" },
];

const ESCALATION_WARNINGS: Record<string, string> = {
  "*":                       "Wildcard verb/resource — equivalent to cluster-admin. Can read all secrets, exec into any pod, modify RBAC, and achieve full cluster compromise.",
  "pods/exec":               "Pod exec grants interactive shell access to any running container — effectively root on the node if the container is privileged or the node filesystem is mounted.",
  "secrets":                 "Reading secrets gives access to service account tokens, database passwords, TLS private keys, and any other sensitive data stored as Kubernetes Secrets.",
  "clusterrolebindings":     "Creating ClusterRoleBindings allows privilege escalation by binding cluster-admin to any service account the attacker controls.",
};

function canDo(roleName: string, verb: string, resource: string): boolean {
  const role = ROLES.find(r => r.name === roleName);
  if (!role) return false;
  return role.rules.some(rule =>
    (rule.verbs.includes("*") || rule.verbs.includes(verb)) &&
    (rule.resources.includes("*") || rule.resources.includes(resource))
  );
}

function getEscalationWarning(roleName: string): string | null {
  const role = ROLES.find(r => r.name === roleName);
  if (!role) return null;
  for (const rule of role.rules) {
    if (rule.verbs.includes("*") || rule.resources.includes("*")) return ESCALATION_WARNINGS["*"];
    if (rule.resources.includes("pods/exec")) return ESCALATION_WARNINGS["pods/exec"];
    if (rule.resources.includes("secrets")) return ESCALATION_WARNINGS["secrets"];
    if (rule.resources.includes("clusterrolebindings")) return ESCALATION_WARNINGS["clusterrolebindings"];
  }
  return null;
}

export default function K8sRBACBuilderTool() {
  const [roleIdx, setRoleIdx] = useState(0);
  const role = ROLES[roleIdx];
  const warning = getEscalationWarning(role.name);

  return (
    <ToolShell title="Kubernetes RBAC Simulator" description="Select a role and check what actions it allows.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
          <select value={roleIdx} onChange={e => setRoleIdx(+e.target.value)} className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white">
            {ROLES.map((r, i) => <option key={i} value={i}>{r.name}</option>)}
          </select>
        </div>

        <div className="p-3 bg-slate-800 rounded font-mono text-xs text-slate-200 space-y-1">
          <p className="text-slate-400"># Role definition (YAML)</p>
          <p>rules:</p>
          {role.rules.map((rule, i) => (
            <div key={i} className="ml-2">
              <p>- verbs: [{rule.verbs.map(v => <span key={v} className="text-amber-300">{v}</span>).reduce((a, b) => <>{a}, {b}</>)}]</p>
              <p className="ml-2">resources: [{rule.resources.map(r => <span key={r} className="text-emerald-300">{r}</span>).reduce((a, b) => <>{a}, {b}</>)}]</p>
            </div>
          ))}
        </div>

        {warning && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <p className="font-medium">Escalation Risk</p>
            <p className="mt-0.5">{warning}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-600">Permission checks:</p>
          {CHECKS.map((c, i) => {
            const allowed = canDo(role.name, c.verb, c.resource);
            return (
              <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded text-xs border ${allowed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                <span className="text-slate-700">{c.label}</span>
                <span className={`font-bold ${allowed ? "text-emerald-700" : "text-slate-400"}`}>{allowed ? "ALLOW" : "DENY"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
