"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface TFSnippet {
  id: string;
  label: string;
  code: string;
  findings: { severity: "critical" | "high" | "medium"; rule: string; detail: string }[];
  fixed: string;
}

const SNIPPETS: TFSnippet[] = [
  {
    id: "sg",
    label: "Security Group",
    code: `resource "aws_security_group" "web" {
  name = "web-sg"

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`,
    findings: [
      { severity: "critical", rule: "AWS006", detail: "Ingress allows ALL ports (0-65535) from 0.0.0.0/0 — the entire internet can reach every service." },
      { severity: "high",     rule: "AWS007", detail: "Ingress CIDR 0.0.0.0/0 — restrict to known IP ranges or use private subnets + load balancer." },
    ],
    fixed: `resource "aws_security_group" "web" {
  name = "web-sg"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`,
  },
  {
    id: "s3",
    label: "S3 Bucket",
    code: `resource "aws_s3_bucket" "data" {
  bucket = "company-customer-data"
  acl    = "public-read"
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration {
    status = "Disabled"
  }
}`,
    findings: [
      { severity: "critical", rule: "AWS077", detail: "acl = \"public-read\" makes all objects readable by anyone on the internet." },
      { severity: "medium",   rule: "AWS073", detail: "Versioning disabled — objects cannot be recovered after deletion or ransomware." },
      { severity: "medium",   rule: "AWS072", detail: "No server-side encryption configured — objects stored in plaintext." },
    ],
    fixed: `resource "aws_s3_bucket" "data" {
  bucket = "company-customer-data"
}

resource "aws_s3_bucket_public_access_block" "data" {
  bucket                  = aws_s3_bucket.data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`,
  },
  {
    id: "iam",
    label: "IAM Policy",
    code: `resource "aws_iam_policy" "app_policy" {
  name = "app-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["*"]
      Resource = ["*"]
    }]
  })
}`,
    findings: [
      { severity: "critical", rule: "AWS099", detail: "Action: \"*\" on Resource: \"*\" grants full AWS account access — equivalent to AdministratorAccess." },
      { severity: "high",     rule: "AWS097", detail: "Violates principle of least privilege. Scope to specific actions and resources the application needs." },
    ],
    fixed: `resource "aws_iam_policy" "app_policy" {
  name = "app-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject"]
      Resource = ["arn:aws:s3:::app-bucket/*"]
    }]
  })
}`,
  },
];

const sColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50 text-red-800",
  high:     "border-l-orange-500 bg-orange-50 text-orange-800",
  medium:   "border-l-amber-500 bg-amber-50 text-amber-800",
};

export default function TerraformScannerTool() {
  const [idx, setIdx] = useState(0);
  const [showFixed, setShowFixed] = useState(false);
  const [scanned, setScanned] = useState(false);
  const snippet = SNIPPETS[idx];

  const switchSnippet = (i: number) => { setIdx(i); setShowFixed(false); setScanned(false); };

  return (
    <ToolShell title="Terraform Security Scanner" description="Scan Terraform resources for common misconfigurations.">
      <div className="space-y-4">
        <div className="flex gap-1.5">
          {SNIPPETS.map((s, i) => (
            <button key={s.id} onClick={() => switchSnippet(i)} className={`px-3 py-1 text-xs rounded border transition-colors ${idx === i ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {s.label}
            </button>
          ))}
        </div>

        <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-relaxed">
          {showFixed ? snippet.fixed : snippet.code}
        </pre>

        <div className="flex gap-2">
          <button onClick={() => setScanned(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
            Scan
          </button>
          {scanned && (
            <button onClick={() => setShowFixed(v => !v)} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700">
              {showFixed ? "Show original" : "Show fixed"}
            </button>
          )}
        </div>

        {scanned && !showFixed && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">{snippet.findings.length} finding{snippet.findings.length !== 1 ? "s" : ""}</p>
            {snippet.findings.map((f, i) => (
              <div key={i} className={`border-l-4 pl-3 py-1.5 rounded-r text-xs ${sColor[f.severity]}`}>
                <span className="font-bold uppercase text-[10px]">{f.severity}</span>
                <span className="font-mono ml-2 text-[10px] opacity-70">{f.rule}</span>
                <p className="mt-0.5">{f.detail}</p>
              </div>
            ))}
          </div>
        )}

        {showFixed && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
            Fixed: all {snippet.findings.length} finding{snippet.findings.length !== 1 ? "s" : ""} resolved.
          </div>
        )}
      </div>
    </ToolShell>
  );
}
