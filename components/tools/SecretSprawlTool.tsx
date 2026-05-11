"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface LeakLocation {
  id: string;
  label: string;
  code: string;
  leaks: { start: number; end: number; label: string }[];
  fix: string;
}

const LOCATIONS: LeakLocation[] = [
  {
    id: "env",
    label: ".env / environment variables",
    code: `# .env committed to git
DATABASE_URL=postgres://admin:P@ssw0rd!@prod-db.internal/app
STRIPE_SECRET_KEY=sk_live_4xFqN9...AbcD
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`,
    leaks: [
      { start: 23, end: 68, label: "DB password in connection string" },
      { start: 69, end: 105, label: "Stripe live secret key" },
    ],
    fix: "Add .env to .gitignore. Use a secrets manager (Vault, AWS Secrets Manager) and inject at runtime. Never commit credentials.",
  },
  {
    id: "dockerfile",
    label: "Dockerfile ARG / ENV",
    code: `FROM node:20
ARG GITHUB_TOKEN=ghp_abc123XYZ
ENV GITHUB_TOKEN=$GITHUB_TOKEN
RUN npm install
# Token visible via: docker history <image>`,
    leaks: [
      { start: 16, end: 42, label: "ARG baked into layer; visible in docker history" },
    ],
    fix: "Use BuildKit --secret mount: RUN --mount=type=secret,id=gh_token. Never use ARG/ENV for secrets in Dockerfiles.",
  },
  {
    id: "code",
    label: "Hardcoded in source code",
    code: `// config.js
const API_KEY = "AIzaSyD-...XYZ";
const JWT_SECRET = "my_super_secret_key_do_not_share";

function callAPI() {
  return fetch(endpoint, { headers: { "X-API-Key": API_KEY } });
}`,
    leaks: [
      { start: 19, end: 37, label: "Google API key in source" },
      { start: 55, end: 91, label: "JWT signing secret hardcoded" },
    ],
    fix: "Use environment variables: process.env.API_KEY. Add gitleaks or truffleHog to pre-commit hooks to block secrets from reaching git.",
  },
  {
    id: "logs",
    label: "Leaked via logs",
    code: `2024-01-15 INFO  User login: admin
2024-01-15 DEBUG Request headers: {
  Authorization: "Bearer eyJhbGc...token_here",
  X-API-Key: "sk_live_4xFqN9AbcD"
}
2024-01-15 ERROR DB connect failed: postgres://admin:P@ssw0rd!@db`,
    leaks: [
      { start: 80, end: 120, label: "Bearer token logged at DEBUG level" },
      { start: 121, end: 150, label: "API key in log" },
    ],
    fix: "Never log Authorization headers, tokens, or credentials. Use log levels correctly — DEBUG should never reach production. Scrub sensitive headers before logging.",
  },
];

export default function SecretSprawlTool() {
  const [locId, setLocId] = useState("env");
  const [revealed, setRevealed] = useState(false);
  const loc = LOCATIONS.find(l => l.id === locId)!;

  const switchLoc = (id: string) => { setLocId(id); setRevealed(false); };

  return (
    <ToolShell title="Secret Sprawl Explorer" description="See how secrets leak across common locations and how to prevent it.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map(l => (
            <button key={l.id} onClick={() => switchLoc(l.id)} className={`px-3 py-1 text-xs rounded border transition-colors ${locId === l.id ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-relaxed">{loc.code}</pre>
          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 rounded">
              <button onClick={() => setRevealed(true)} className="px-4 py-2 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">
                Reveal secrets
              </button>
            </div>
          )}
        </div>

        {revealed && (
          <div className="space-y-2">
            {loc.leaks.map((leak, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <span className="text-red-500 font-bold shrink-0">!</span>
                <span className="text-red-800">{leak.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs">
          <p className="font-medium text-emerald-800 mb-1">Fix</p>
          <p className="text-emerald-700">{loc.fix}</p>
        </div>
      </div>
    </ToolShell>
  );
}
