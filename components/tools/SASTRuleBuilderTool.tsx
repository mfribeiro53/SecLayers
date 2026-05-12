"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface RuleMatch {
  line: number;
  snippet: string;
  reason: string;
}

interface Example {
  id: string;
  label: string;
  language: string;
  code: string;
  ruleId: string;
  ruleName: string;
  pattern: string;
  patternDescription: string;
  regex: string;
  findingReason: string;
  toolCategory: "SAST" | "SCA" | "DAST" | "Secret";
}

const EXAMPLES: Example[] = [
  {
    id: "sqli",
    label: "SQL injection",
    language: "Python",
    toolCategory: "SAST",
    ruleId: "python.sqli.string-concat",
    ruleName: "SQL query built with string concatenation",
    pattern: `"SELECT..." + var`,
    patternDescription: `Flags lines where a SQL string literal is joined to a variable via +. A production SAST tool also traces data flow from request parameters.`,
    regex: `SELECT.*["']\\s*\\+`,
    findingReason: "String concatenation into SQL query. If the appended variable is user-controlled an attacker can inject arbitrary SQL (e.g., ' OR 1=1 --).",
    code: `from flask import request
import sqlite3

def get_user(username):
    conn = sqlite3.connect("app.db")
    cur = conn.cursor()
    # UNSAFE: direct string concatenation
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    cur.execute(query)
    return cur.fetchone()

def safe_get_user(username):
    conn = sqlite3.connect("app.db")
    cur = conn.cursor()
    # SAFE: parameterized query
    cur.execute("SELECT * FROM users WHERE name = ?", (username,))
    return cur.fetchone()`,
  },
  {
    id: "hardcoded",
    label: "Hardcoded secret",
    language: "JavaScript",
    toolCategory: "Secret",
    ruleId: "js.secrets.hardcoded-api-key",
    ruleName: "Hardcoded API key or password",
    pattern: `(KEY|SECRET|PASSWORD|TOKEN) = "..."`,
    patternDescription: `Matches variable declarations with credential-suggesting names assigned a string literal of 6+ characters.`,
    regex: `(?:const|let|var)\\s+\\w*(?:KEY|SECRET|PASSWORD|TOKEN)\\w*\\s*=\\s*["'][^"']{6,}`,
    findingReason: "Credential variable assigned a hardcoded string. Committed secrets are scraped by bots within seconds — rotate and move to an environment variable or secrets manager.",
    code: `const express = require("express");
const app = express();

// UNSAFE: hardcoded credentials
const STRIPE_SECRET_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc";
const DB_PASSWORD = "SuperSecret123!";

app.get("/charge", async (req, res) => {
  const stripe = require("stripe")(STRIPE_SECRET_KEY);
  await stripe.charges.create({ amount: req.body.amount });
  res.json({ ok: true });
});`,
  },
  {
    id: "xss",
    label: "DOM XSS",
    language: "JavaScript",
    toolCategory: "SAST",
    ruleId: "js.xss.innerhtml-sink",
    ruleName: "innerHTML assigned from user input",
    pattern: `element.innerHTML = ...`,
    patternDescription: `Flags all innerHTML assignments. A SAST tool then checks if the right-hand side is tainted by a DOM source (location.hash, URL params, etc.).`,
    regex: `\\.innerHTML\\s*=`,
    findingReason: "innerHTML is an HTML-parsing sink. Any attacker-controlled value on the right-hand side executes as code. Use textContent, or sanitize with DOMPurify before assigning.",
    code: `// Vulnerable: URL fragment written directly to DOM
const hash = location.hash.slice(1);
document.getElementById("welcome").innerHTML = "Hello, " + hash;
// Attack: navigate to /#<img src=x onerror=alert(document.cookie)>

// Safe: use textContent instead of innerHTML
const hash2 = location.hash.slice(1);
document.getElementById("welcome").textContent = "Hello, " + hash2;
// textContent treats value as plain text — no HTML parsing`,
  },
  {
    id: "sca",
    label: "CVE in dependency",
    language: "JSON",
    toolCategory: "SCA",
    ruleId: "npm.lodash.CVE-2021-23337",
    ruleName: "Vulnerable lodash version",
    pattern: `"lodash": "<4.17.21"`,
    patternDescription: `SCA tools compare declared dependency versions against a CVE database (NVD, OSV, Snyk) and flag versions within the affected range.`,
    regex: `"lodash"\\s*:\\s*"\\^?4\\.17\\.(?:20|1[0-9]|[0-9])"`,
    findingReason: "lodash <4.17.21 is affected by CVE-2021-23337 (command injection via _.template) and CVE-2020-28500 (ReDoS). Upgrade to >=4.17.21.",
    code: `{
  "name": "my-app",
  "dependencies": {
    "lodash": "^4.17.15",
    "express": "^4.17.1"
  }
}

// lodash 4.17.15 is vulnerable to:
// CVE-2021-23337 (HIGH): Command injection via _.template
// CVE-2020-28500 (MEDIUM): ReDoS in toNumber/trim
// Fixed in: 4.17.21`,
  },
];

const CUSTOM_DEFAULT = `// Paste any code here, then enter a regex below and click Scan.
function example() {
  const secret = "hardcoded_value_123";
  eval(userInput);
}`;

const toolColors: Record<string, string> = {
  SAST:   "bg-info-muted text-info",
  SCA:    "bg-purple-subtle text-purple",
  Secret: "bg-danger-muted text-danger",
  DAST:   "bg-warning-muted text-warning",
};

function scanCode(code: string, regexStr: string, reason: string): RuleMatch[] | string {
  let re: RegExp;
  try {
    re = new RegExp(regexStr, "i");
  } catch {
    return `Invalid regex: "${regexStr}"`;
  }
  return code.split("\n").flatMap((line, i) =>
    re.test(line) ? [{ line: i + 1, snippet: line.trim(), reason }] : []
  );
}

export default function SASTRuleBuilderTool() {
  const [idx, setIdx] = useState<number | "custom">(0);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [customPattern, setCustomPattern] = useState("");
  const [matches, setMatches] = useState<RuleMatch[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const isCustom = idx === "custom";
  const example = isCustom ? null : EXAMPLES[idx as number];

  const switchTab = (i: number | "custom") => {
    setIdx(i);
    setCode(i === "custom" ? CUSTOM_DEFAULT : EXAMPLES[i as number].code);
    setMatches(null);
    setScanError(null);
    setEditing(false);
  };

  const handleScan = () => {
    const regexStr = isCustom ? customPattern : example!.regex;
    if (!regexStr.trim()) {
      setScanError("Enter a regex pattern.");
      return;
    }
    const reason = isCustom
      ? "Matched your custom pattern."
      : example!.findingReason;
    const result = scanCode(code, regexStr, reason);
    if (typeof result === "string") {
      setScanError(result);
      setMatches(null);
    } else {
      setScanError(null);
      setMatches(result);
      setEditing(false);
    }
  };

  const matchedLines = new Set(matches?.map((m) => m.line) ?? []);
  const lines = code.split("\n");

  return (
    <ToolShell
      title="SAST Rule Explorer"
      description="See how static analysis tools detect vulnerabilities through pattern matching. Edit the code and run the scanner."
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.id}
              onClick={() => switchTab(i)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                idx === i
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
              }`}
            >
              {e.label}
            </button>
          ))}
          <button
            onClick={() => switchTab("custom")}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              isCustom
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Rule metadata */}
        {example && (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${toolColors[example.toolCategory]}`}>
                {example.toolCategory}
              </span>
              <span className="font-mono text-slate-500">{example.ruleId}</span>
            </div>
            <div className="p-2 bg-surface-2 border border-subtle rounded text-xs space-y-0.5">
              <p className="font-semibold text-secondary">
                Pattern:{" "}
                <span className="font-mono text-slate-400">{example.pattern}</span>
              </p>
              <p className="text-slate-500">{example.patternDescription}</p>
              <p className="font-mono text-[10px] text-slate-600">
                regex:{" "}
                <span className="text-slate-400">{example.regex}</span>
              </p>
            </div>
          </>
        )}

        {/* Custom pattern input */}
        {isCustom && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              Regex pattern
            </label>
            <input
              type="text"
              value={customPattern}
              onChange={(e) => {
                setCustomPattern(e.target.value);
                setScanError(null);
                setMatches(null);
              }}
              placeholder={`eval\\s*\\(`}
              className="w-full px-2 py-1.5 border border-subtle rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Case-insensitive. Each line is tested independently.
            </p>
          </div>
        )}

        {/* Code area */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-secondary">
              {isCustom ? "Code" : example!.language}
            </span>
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              {editing ? "Done editing" : "Edit"}
            </button>
          </div>

          {editing ? (
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setMatches(null);
              }}
              className="w-full p-3 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={Math.max(8, lines.length)}
              spellCheck={false}
            />
          ) : (
            <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-5 border border-subtle">
              {lines.map((line, i) => {
                const lineNum = i + 1;
                const isMatch = matchedLines.has(lineNum);
                return (
                  <div
                    key={i}
                    className={isMatch ? "bg-red-900/40 -mx-3 px-3" : ""}
                  >
                    <span className="select-none text-slate-600 mr-3 text-[10px]">
                      {String(lineNum).padStart(2, " ")}
                    </span>
                    {line}
                  </div>
                );
              })}
            </pre>
          )}
        </div>

        {/* Scan button */}
        <button
          onClick={handleScan}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
        >
          Run scanner
        </button>

        {/* Error */}
        {scanError && (
          <p className="text-xs text-amber-500">{scanError}</p>
        )}

        {/* Findings */}
        {matches !== null && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-secondary">
              {matches.length} finding{matches.length !== 1 ? "s" : ""}
            </p>
            {matches.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No matches found.</p>
            ) : (
              matches.map((m, i) => (
                <div
                  key={i}
                  className="border-l-4 border-l-red-500 pl-3 py-1.5 bg-danger-subtle rounded-r text-xs"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-danger uppercase text-[10px]">
                      Finding
                    </span>
                    <span className="text-slate-500">line {m.line}</span>
                  </div>
                  <p className="font-mono text-[10px] text-secondary mb-1 truncate">
                    {m.snippet}
                  </p>
                  <p className="text-danger">{m.reason}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
