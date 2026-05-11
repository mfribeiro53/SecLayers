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
  matches: RuleMatch[];
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
    pattern: `query = "SELECT ... " + user_input`,
    patternDescription: "Detects string concatenation where the left operand looks like a SQL keyword pattern and the right operand comes from a request parameter.",
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
    matches: [
      { line: 7, snippet: `query = "SELECT * FROM users WHERE name = '" + username + "'"`, reason: "String concatenation into SQL query. If username = \"' OR 1=1 --\" all rows are returned." },
    ],
  },
  {
    id: "hardcoded",
    label: "Hardcoded secret",
    language: "JavaScript",
    toolCategory: "Secret",
    ruleId: "js.secrets.hardcoded-api-key",
    ruleName: "Hardcoded API key or password",
    pattern: `const (API_KEY|SECRET|PASSWORD|TOKEN) = "[A-Za-z0-9+/]{20,}"`,
    patternDescription: "Regex pattern matches variable names suggesting credential storage with a high-entropy string value.",
    code: `const express = require("express");
const app = express();

// UNSAFE: hardcoded credentials
const STRIPE_SECRET_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc";
const DB_PASSWORD = "SuperSecret123!";

app.get("/charge", async (req, res) => {
  // Any developer with repo access — or anyone who finds this in git history
  // — now has full Stripe account access
  const stripe = require("stripe")(STRIPE_SECRET_KEY);
  await stripe.charges.create({ amount: req.body.amount });
  res.json({ ok: true });
});`,
    matches: [
      { line: 5, snippet: `const STRIPE_SECRET_KEY = "sk_live_4eC39HqLyjWDarjtT1zdp7dc";`, reason: "sk_live_ prefix indicates a Stripe live secret key. Committed keys are scraped by bots within seconds." },
      { line: 6, snippet: `const DB_PASSWORD = "SuperSecret123!";`, reason: "Variable named PASSWORD with a string value. Should come from environment variable or secrets manager." },
    ],
  },
  {
    id: "xss",
    label: "DOM XSS",
    language: "JavaScript",
    toolCategory: "SAST",
    ruleId: "js.xss.innerhtml-from-location",
    ruleName: "innerHTML set from user-controlled source",
    pattern: `element.innerHTML = ... location.hash / location.search / document.URL`,
    patternDescription: "Tracks data flow from DOM sources (location.hash, location.search, document.URL) to sinks (innerHTML, document.write, eval).",
    code: `// Vulnerable: URL fragment written directly to DOM
const hash = location.hash.slice(1);
document.getElementById("welcome").innerHTML = "Hello, " + hash;
// Attack: navigate to /#<img src=x onerror=alert(document.cookie)>

// Safe: use textContent instead of innerHTML
const hash2 = location.hash.slice(1);
document.getElementById("welcome").textContent = "Hello, " + hash2;
// textContent treats value as plain text — no HTML parsing`,
    matches: [
      { line: 3, snippet: `document.getElementById("welcome").innerHTML = "Hello, " + hash;`, reason: "Data flows from location.hash (attacker-controlled) to innerHTML (HTML parser sink). Any HTML in the fragment is executed as code." },
    ],
  },
  {
    id: "sca",
    label: "CVE in dependency",
    language: "JSON",
    toolCategory: "SCA",
    ruleId: "npm.lodash.CVE-2021-23337",
    ruleName: "Vulnerable lodash version",
    pattern: `"lodash": "<4.17.21"`,
    patternDescription: "SCA tools compare declared dependency versions against a CVE database (NVD, OSV, Snyk) and flag versions within the affected range.",
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
    matches: [
      { line: 4, snippet: `"lodash": "^4.17.15"`, reason: "lodash 4.17.15 matches CVE-2021-23337 (command injection) and CVE-2020-28500 (ReDoS). Upgrade to ^4.17.21." },
    ],
  },
];

export default function SASTRuleBuilderTool() {
  const [idx, setIdx] = useState(0);
  const [scanned, setScanned] = useState(false);
  const example = EXAMPLES[idx];

  const switchExample = (i: number) => { setIdx(i); setScanned(false); };

  const toolColors: Record<string, string> = {
    SAST:   "bg-blue-100 text-blue-700",
    SCA:    "bg-purple-100 text-purple-700",
    DAST:   "bg-amber-100 text-amber-700",
    Secret: "bg-red-100 text-red-700",
  };

  return (
    <ToolShell title="SAST Rule Explorer" description="See how static analysis tools detect vulnerabilities through pattern matching and data-flow analysis.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e, i) => (
            <button key={e.id} onClick={() => switchExample(i)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${idx === i ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${toolColors[example.toolCategory]}`}>{example.toolCategory}</span>
          <span className="font-mono text-slate-500">{example.ruleId}</span>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
          <p className="font-semibold text-slate-700 mb-0.5">Pattern: <span className="font-mono text-slate-500">{example.pattern}</span></p>
          <p className="text-slate-500">{example.patternDescription}</p>
        </div>

        <div className="relative">
          <pre className="p-3 bg-slate-900 text-slate-200 text-xs rounded overflow-x-auto leading-relaxed">
            {example.code.split("\n").map((line, i) => {
              const lineNum = i + 1;
              const isMatch = scanned && example.matches.some(m => m.line === lineNum);
              return (
                <div key={i} className={`${isMatch ? "bg-red-900/40 -mx-3 px-3" : ""}`}>
                  <span className="select-none text-slate-600 mr-3 text-[10px]">{String(lineNum).padStart(2, " ")}</span>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>

        <button onClick={() => setScanned(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
          Run scanner
        </button>

        {scanned && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">{example.matches.length} finding{example.matches.length !== 1 ? "s" : ""}</p>
            {example.matches.map((m, i) => (
              <div key={i} className="border-l-4 border-l-red-500 pl-3 py-1.5 bg-red-50 rounded-r text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-red-700 uppercase text-[10px]">Finding</span>
                  <span className="text-slate-500">line {m.line}</span>
                </div>
                <p className="font-mono text-[10px] text-slate-600 mb-1 truncate">{m.snippet}</p>
                <p className="text-red-700">{m.reason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
