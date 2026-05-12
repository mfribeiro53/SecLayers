"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface TFCheck {
  severity: "critical" | "high" | "medium";
  rule: string;
  detail: string;
  regex: string;
  negate?: boolean;
}

interface Finding {
  severity: "critical" | "high" | "medium";
  rule: string;
  detail: string;
}

interface TFSnippet {
  id: string;
  label: string;
  code: string;
  checks: TFCheck[];
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
    checks: [
      {
        severity: "critical",
        rule: "AWS006",
        detail: "Ingress allows ALL ports (0–65535) from 0.0.0.0/0 — the entire internet can reach every service.",
        regex: "from_port\\s*=\\s*0",
      },
      {
        severity: "high",
        rule: "AWS007",
        detail: "Ingress CIDR 0.0.0.0/0 — restrict to known IP ranges or use private subnets + load balancer.",
        regex: "cidr_blocks.*0\\.0\\.0\\.0/0",
      },
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
    checks: [
      {
        severity: "critical",
        rule: "AWS077",
        detail: `acl = "public-read" makes all objects readable by anyone on the internet.`,
        regex: `acl\\s*=\\s*"public-read(?:-write)?"`,
      },
      {
        severity: "medium",
        rule: "AWS073",
        detail: `Versioning disabled — objects cannot be recovered after deletion or ransomware.`,
        regex: `status\\s*=\\s*"Disabled"`,
      },
      {
        severity: "medium",
        rule: "AWS072",
        detail: `No server-side encryption resource found — objects will be stored in plaintext.`,
        regex: `aws_s3_bucket_server_side_encryption_configuration`,
        negate: true,
      },
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
}

resource "aws_s3_bucket_versioning" "data" {
  bucket = aws_s3_bucket.data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
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
    checks: [
      {
        severity: "critical",
        rule: "AWS099",
        detail: `Action: "*" on Resource: "*" grants full AWS account access — equivalent to AdministratorAccess.`,
        regex: `Action\\s*=\\s*\\["\\*"\\]`,
      },
      {
        severity: "high",
        rule: "AWS097",
        detail: `Resource: "*" violates least privilege. Scope to specific ARNs the application needs.`,
        regex: `Resource\\s*=\\s*\\["\\*"\\]`,
      },
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
  critical: "border-l-red-500 bg-danger-subtle text-danger",
  high:     "border-l-orange-500 bg-orange-subtle text-orange",
  medium:   "border-l-amber-500 bg-warning-subtle text-warning",
};

function runChecks(code: string, checks: TFCheck[]): Finding[] {
  return checks.flatMap((c) => {
    const matched = new RegExp(c.regex, "i").test(code);
    const fires = c.negate ? !matched : matched;
    return fires
      ? [{ severity: c.severity, rule: c.rule, detail: c.detail }]
      : [];
  });
}

export default function TerraformScannerTool() {
  const [idx, setIdx] = useState(0);
  const [userCode, setUserCode] = useState(SNIPPETS[0].code);
  const [showFixed, setShowFixed] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [editing, setEditing] = useState(false);

  const snippet = SNIPPETS[idx];
  const displayCode = showFixed ? snippet.fixed : userCode;

  const switchSnippet = (i: number) => {
    setIdx(i);
    setUserCode(SNIPPETS[i].code);
    setShowFixed(false);
    setFindings(null);
    setEditing(false);
  };

  const handleScan = () => {
    setFindings(runChecks(displayCode, snippet.checks));
    setEditing(false);
  };

  const toggleFixed = () => {
    setShowFixed((v) => !v);
    setFindings(null);
  };

  return (
    <ToolShell
      title="Terraform Security Scanner"
      description="Scan Terraform resources for common misconfigurations. Edit the HCL and re-scan to see findings update in real time."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1.5">
          {SNIPPETS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => switchSnippet(i)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                idx === i
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Code area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-secondary">
              {showFixed ? "Fixed (reference)" : "HCL"}
            </span>
            {!showFixed && (
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                {editing ? "Done editing" : "Edit"}
              </button>
            )}
          </div>

          {editing && !showFixed ? (
            <textarea
              value={userCode}
              onChange={(e) => {
                setUserCode(e.target.value);
                setFindings(null);
              }}
              className="w-full p-3 bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={Math.max(8, userCode.split("\n").length)}
              spellCheck={false}
            />
          ) : (
            <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-relaxed border border-subtle">
              {displayCode}
            </pre>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleScan}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
          >
            Scan
          </button>
          <button
            onClick={toggleFixed}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              showFixed
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-surface-2 text-secondary border border-subtle hover:bg-strong"
            }`}
          >
            {showFixed ? "Show original" : "Show fixed"}
          </button>
        </div>

        {/* Findings */}
        {findings !== null && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-secondary">
              {findings.length} finding{findings.length !== 1 ? "s" : ""}
              {showFixed && findings.length === 0 && (
                <span className="ml-2 text-emerald-500">— all checks pass</span>
              )}
            </p>
            {findings.map((f, i) => (
              <div
                key={i}
                className={`border-l-4 pl-3 py-1.5 rounded-r text-xs ${sColor[f.severity]}`}
              >
                <span className="font-bold uppercase text-[10px]">{f.severity}</span>
                <span className="font-mono ml-2 text-[10px] opacity-70">{f.rule}</span>
                <p className="mt-0.5">{f.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
