"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface SecretRule {
  id: string;
  name: string;
  regex: string;
}

interface Match {
  line: number;
  snippet: string;
  ruleName: string;
  value: string;
}

const SECRET_RULES: SecretRule[] = [
  { id: "stripe",     name: "Stripe API Key",                regex: `sk_(live|test)_[A-Za-z0-9]{10,}` },
  { id: "aws-key",    name: "AWS Access Key ID",             regex: `AKIA[0-9A-Z]{16}` },
  { id: "aws-secret", name: "AWS Secret Access Key",         regex: `AWS_SECRET_ACCESS_KEY\\s*=\\s*[A-Za-z0-9/+=]{20,}` },
  { id: "gcp",        name: "Google API Key",                regex: `AIza[0-9A-Za-z\\-_]{35}` },
  { id: "github",     name: "GitHub Token",                  regex: `gh[ps]_[A-Za-z0-9]{8,}` },
  { id: "jwt-secret", name: "Hardcoded JWT/API Secret",      regex: `(?:JWT_SECRET|API_KEY|SECRET_KEY)\\s*=\\s*["'][^"']{8,}` },
  { id: "bearer",     name: "Bearer Token in Log",           regex: `Bearer\\s+[A-Za-z0-9._\\-+/]{20,}` },
  { id: "db-url",     name: "Database URL with Credentials", regex: `[a-z]+://[^:\\s]+:[^@\\s]+@[^\\s/]+` },
  { id: "password",   name: "Hardcoded Password Variable",   regex: `(?:PASSWORD|PASSWD)\\s*=\\s*["']?[^"'\\s]{4,}` },
];

function detectSecrets(code: string): Match[] {
  const lines = code.split("\n");
  const results: Match[] = [];
  for (const rule of SECRET_RULES) {
    const re = new RegExp(rule.regex, "gi");
    lines.forEach((line, i) => {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) {
        const val = m[0];
        results.push({
          line: i + 1,
          snippet: line.trim(),
          ruleName: rule.name,
          value: val.length > 30 ? val.slice(0, 27) + "…" : val,
        });
      }
    });
  }
  results.sort((a, b) => a.line - b.line);
  return results;
}

interface LeakLocation {
  id: string;
  label: string;
  code: string;
  fix: string;
}

const LOCATIONS: LeakLocation[] = [
  {
    id: "env",
    label: ".env / environment variables",
    code: `# .env committed to git
DATABASE_URL=postgres://admin:P@ssw0rd!@prod-db.internal/app
STRIPE_SECRET_KEY=sk_live_4xFqN9Kp2mRbT7yQsWv
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`,
    fix: "Add .env to .gitignore. Use a secrets manager (Vault, AWS Secrets Manager) and inject at runtime. Never commit credentials.",
  },
  {
    id: "dockerfile",
    label: "Dockerfile ARG / ENV",
    code: `FROM node:20
ARG GITHUB_TOKEN=ghp_Abc123XYZDef456GhiJkl789Mno0123456789
ENV GITHUB_TOKEN=$GITHUB_TOKEN
RUN npm install
# Token visible via: docker history <image>`,
    fix: "Use BuildKit --secret mount: RUN --mount=type=secret,id=gh_token. Never use ARG/ENV for secrets in Dockerfiles.",
  },
  {
    id: "code",
    label: "Hardcoded in source code",
    code: `// config.js
const API_KEY = "AIzaSyD1234567890abcdefghijklmnopqrstu";
const JWT_SECRET = "my_super_secret_key_do_not_share";

function callAPI() {
  return fetch(endpoint, { headers: { "X-API-Key": API_KEY } });
}`,
    fix: "Use environment variables: process.env.API_KEY. Add gitleaks or truffleHog to pre-commit hooks to block secrets from reaching git.",
  },
  {
    id: "logs",
    label: "Leaked via logs",
    code: `2024-01-15 INFO  User login: admin
2024-01-15 DEBUG Request headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig",
  X-API-Key: "sk_live_4xFqN9AbcD123xyz"
}
2024-01-15 ERROR DB connect failed: postgres://admin:P@ssw0rd!@db`,
    fix: "Never log Authorization headers, tokens, or credentials. Use log levels correctly — DEBUG should never reach production. Scrub sensitive headers before logging.",
  },
];

const CUSTOM_DEFAULT = `// Paste your code or config here, then click "Scan for secrets"
const apiKey = "AIzaSyD1234567890abcdefghijklmnopqrstu";
const db = "postgres://app:hunter2@db.internal/prod";`;

export default function SecretSprawlTool() {
  const [locId, setLocId] = useState<string | "custom">("env");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [customCode, setCustomCode] = useState(CUSTOM_DEFAULT);

  const isCustom = locId === "custom";
  const loc = isCustom ? null : LOCATIONS.find((l) => l.id === locId)!;

  const switchLoc = (id: string | "custom") => {
    setLocId(id);
    setMatches(null);
  };

  const scan = () => {
    const code = isCustom ? customCode : loc!.code;
    setMatches(detectSecrets(code));
  };

  const matchedLines = new Set(matches?.map((m) => m.line) ?? []);
  const displayCode = isCustom ? customCode : loc!.code;
  const lines = displayCode.split("\n");

  return (
    <ToolShell
      title="Secret Sprawl Explorer"
      description="See how secrets leak across common locations. Real regex patterns scan each example — try the Custom tab with your own code."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map((l) => (
            <button
              key={l.id}
              onClick={() => switchLoc(l.id)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                locId === l.id
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => switchLoc("custom")}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              isCustom
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Code display */}
        {isCustom ? (
          <textarea
            value={customCode}
            onChange={(e) => {
              setCustomCode(e.target.value);
              setMatches(null);
            }}
            className="w-full p-3 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={Math.max(6, customCode.split("\n").length)}
            spellCheck={false}
          />
        ) : (
          <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-5 border border-subtle">
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isMatch = matchedLines.has(lineNum);
              return (
                <div key={i} className={isMatch ? "bg-red-900/40 -mx-3 px-3" : ""}>
                  <span className="select-none text-slate-600 mr-3 text-[10px]">
                    {String(lineNum).padStart(2, " ")}
                  </span>
                  {line}
                </div>
              );
            })}
          </pre>
        )}

        {/* Scan button */}
        <button
          onClick={scan}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
        >
          {isCustom ? "Scan for secrets" : "Reveal secrets"}
        </button>

        {/* Findings */}
        {matches !== null && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-secondary">
              {matches.length} secret{matches.length !== 1 ? "s" : ""} detected
            </p>
            {matches.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No secrets found.</p>
            ) : (
              matches.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs"
                >
                  <span className="text-red-500 font-bold shrink-0 mt-0.5">!</span>
                  <div>
                    <span className="font-semibold text-red-800">{m.ruleName}</span>
                    <span className="text-slate-400 ml-2">line {m.line}</span>
                    <p className="font-mono text-[10px] text-red-700 mt-0.5">{m.value}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Fix advice */}
        {loc && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs">
            <p className="font-medium text-emerald-800 mb-1">Fix</p>
            <p className="text-emerald-700">{loc.fix}</p>
          </div>
        )}

        {/* Rules legend */}
        {isCustom && (
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
              Rules applied ({SECRET_RULES.length})
            </summary>
            <div className="mt-2 space-y-0.5 pl-2 border-l border-subtle">
              {SECRET_RULES.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <span className="text-secondary font-medium w-40 shrink-0">{r.name}</span>
                  <span className="font-mono text-slate-600 text-[10px] break-all">{r.regex}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </ToolShell>
  );
}
