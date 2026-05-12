"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const EXAMPLES = {
  insecure: `FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl wget
ADD . /app
WORKDIR /app
ARG DB_PASSWORD=supersecret123
ENV DB_PASS=$DB_PASSWORD
RUN pip install -r requirements.txt
EXPOSE 22
CMD ["python", "app.py"]`,
  better: `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN adduser --disabled-password appuser
USER appuser
EXPOSE 8080
CMD ["python", "app.py"]`,
};

interface Finding {
  line: number | null;
  severity: "critical" | "high" | "medium" | "info";
  rule: string;
  detail: string;
}

function lint(content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    const n = i + 1;
    const l = line.trim();

    if (/^FROM\s+\S+:latest/i.test(l))
      findings.push({ line: n, severity: "high", rule: "DL3007", detail: "Using :latest tag — image may change unexpectedly. Pin to a specific digest or version." });

    if (/^FROM\s+ubuntu/i.test(l) || /^FROM\s+debian(?!-slim)/i.test(l))
      findings.push({ line: n, severity: "medium", rule: "DL3006", detail: "Large base image. Prefer slim or distroless variants to reduce attack surface." });

    if (/^ADD\s/i.test(l))
      findings.push({ line: n, severity: "medium", rule: "DL3020", detail: "ADD can unpack archives and fetch URLs. Use COPY for local files unless you need ADD features." });

    if (/^ARG\s+\w+=\S+/i.test(l))
      findings.push({ line: n, severity: "critical", rule: "DL3025", detail: "ARG with a default value containing a secret is baked into the image layer and visible via docker history." });

    if (/^ENV\s+.*(?:PASS|SECRET|KEY|TOKEN|PWD)\s*=/i.test(l))
      findings.push({ line: n, severity: "critical", rule: "SC-001", detail: "Secret in ENV variable — visible to all processes in the container and via docker inspect." });

    if (/EXPOSE\s+22\b/.test(l))
      findings.push({ line: n, severity: "high", rule: "SC-002", detail: "Exposing SSH port 22 — containers should not run SSH daemons. Use kubectl exec or docker exec instead." });

    if (/wget\s+http:\/\//i.test(l) || /curl\s+http:\/\//i.test(l))
      findings.push({ line: n, severity: "medium", rule: "SC-003", detail: "Downloading over HTTP (not HTTPS) — susceptible to MITM and content tampering." });
  });

  const hasUser = lines.some(l => /^USER\s+(?!root)/i.test(l.trim()));
  const hasRoot = lines.some(l => /^USER\s+root/i.test(l.trim()));
  if (!hasUser || hasRoot)
    findings.push({ line: null, severity: "high", rule: "DL3002", detail: "No non-root USER directive — container runs as root. Any RCE grants root inside the container." });

  return findings;
}

const severityColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50",
  high:     "border-l-orange-500 bg-orange-50",
  medium:   "border-l-amber-500 bg-amber-50",
  info:     "border-l-blue-500 bg-blue-50",
};
const severityText: Record<string, string> = {
  critical: "text-red-700", high: "text-orange-700", medium: "text-amber-700", info: "text-blue-700",
};

export default function DockerfileLinterTool() {
  const [source, setSource] = useState(EXAMPLES.insecure);
  const findings = lint(source);

  return (
    <ToolShell title="Dockerfile Security Linter" description="Paste a Dockerfile to scan for security issues.">
      <div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={() => setSource(EXAMPLES.insecure)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Load insecure example</button>
          <button onClick={() => setSource(EXAMPLES.better)} className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">Load better example</button>
        </div>

        <textarea
          value={source}
          onChange={e => setSource(e.target.value)}
          className="w-full h-48 font-mono text-xs p-3 border border-subtle rounded bg-surface-2 resize-none"
          spellCheck={false}
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-secondary">{findings.length} finding{findings.length !== 1 ? "s" : ""}</p>
          {findings.length === 0 && <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">No issues found.</p>}
          {findings.map((f, i) => (
            <div key={i} className={`border-l-4 pl-3 py-1.5 rounded-r text-xs ${severityColor[f.severity]}`}>
              <div className="flex gap-2 items-center">
                <span className={`font-bold uppercase text-[10px] ${severityText[f.severity]}`}>{f.severity}</span>
                <span className="font-mono text-slate-500">{f.rule}</span>
                {f.line && <span className="text-slate-400">line {f.line}</span>}
              </div>
              <p className="text-secondary mt-0.5">{f.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
