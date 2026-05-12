"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Config {
  blockPublicAcls: boolean;
  blockPublicPolicy: boolean;
  bucketPolicyPublic: boolean;
  objectAclPublic: boolean;
  encryption: boolean;
  versioning: boolean;
  logging: boolean;
}

const DEFAULT: Config = {
  blockPublicAcls: false,
  blockPublicPolicy: false,
  bucketPolicyPublic: true,
  objectAclPublic: true,
  encryption: false,
  versioning: false,
  logging: false,
};

function getFindings(c: Config): { severity: "critical" | "high" | "medium" | "info"; text: string }[] {
  const f: { severity: "critical" | "high" | "medium" | "info"; text: string }[] = [];
  const isPublic = (!c.blockPublicPolicy && c.bucketPolicyPublic) || (!c.blockPublicAcls && c.objectAclPublic);
  if (isPublic) f.push({ severity: "critical", text: "Bucket is publicly readable — anyone on the internet can list and download objects" });
  if (!c.blockPublicAcls) f.push({ severity: "high", text: "Block Public ACLs is disabled — object-level ACLs can make individual objects public" });
  if (!c.blockPublicPolicy) f.push({ severity: "high", text: "Block Public Bucket Policies is disabled — a bucket policy can grant public access" });
  if (!c.encryption) f.push({ severity: "medium", text: "No server-side encryption — objects stored in plaintext on disk" });
  if (!c.versioning) f.push({ severity: "medium", text: "Versioning disabled — deleted or overwritten objects are unrecoverable (ransomware risk)" });
  if (!c.logging) f.push({ severity: "medium", text: "Access logging disabled — no audit trail for who accessed which objects" });
  if (f.length === 0) f.push({ severity: "info", text: "Bucket appears securely configured" });
  return f;
}

const severityColor: Record<string, string> = {
  critical: "bg-red-100 border-red-300 text-red-800",
  high:     "bg-orange-100 border-orange-300 text-orange-800",
  medium:   "bg-amber-100 border-amber-300 text-amber-800",
  info:     "bg-emerald-100 border-emerald-300 text-emerald-800",
};

export default function BucketACLTool() {
  const [cfg, setCfg] = useState<Config>(DEFAULT);

  const toggle = (k: keyof Config) => setCfg(prev => ({ ...prev, [k]: !prev[k] }));
  const findings = getFindings(cfg);
  const isPublic = (!cfg.blockPublicPolicy && cfg.bucketPolicyPublic) || (!cfg.blockPublicAcls && cfg.objectAclPublic);

  const controls: { key: keyof Config; label: string; desc: string }[] = [
    { key: "blockPublicAcls",    label: "Block Public ACLs",          desc: "Reject any ACL that grants public access" },
    { key: "blockPublicPolicy",  label: "Block Public Bucket Policies", desc: "Reject bucket policies that grant public access" },
    { key: "bucketPolicyPublic", label: "Bucket Policy Grants Public Read", desc: "Policy contains Principal: \"*\" with s3:GetObject" },
    { key: "objectAclPublic",    label: "Object ACL: public-read",    desc: "Objects have public-read ACL set" },
    { key: "encryption",         label: "SSE-S3 Encryption",          desc: "Encrypt all objects at rest with AES-256" },
    { key: "versioning",         label: "Versioning Enabled",         desc: "Retain all object versions for recovery" },
    { key: "logging",            label: "Server Access Logging",      desc: "Log every request to a separate audit bucket" },
  ];

  return (
    <ToolShell title="S3 Bucket ACL Checker" description="Toggle bucket configuration flags and see the security impact.">
      <div className="space-y-4">
        <div className={`text-center py-2 rounded text-sm font-bold ${isPublic ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {isPublic ? "PUBLIC — Data exposed to the internet" : "PRIVATE — Not publicly accessible"}
        </div>

        <div className="space-y-2">
          {controls.map(c => (
            <div key={c.key} className="flex items-start gap-3 p-2 rounded border border-subtle">
              <button onClick={() => toggle(c.key)} className={`mt-0.5 w-8 h-4 rounded-full relative transition-colors shrink-0 ${cfg[c.key] ? "bg-emerald-500" : "bg-strong"}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-surface-2 transition-all ${cfg[c.key] ? "left-4" : "left-0.5"}`} />
              </button>
              <div>
                <p className="text-xs font-medium text-secondary">{c.label}</p>
                <p className="text-xs text-slate-400">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-secondary">Findings:</p>
          {findings.map((f, i) => (
            <div key={i} className={`text-xs px-2 py-1.5 rounded border ${severityColor[f.severity]}`}>
              <span className="font-medium uppercase text-[10px]">{f.severity}</span> — {f.text}
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
