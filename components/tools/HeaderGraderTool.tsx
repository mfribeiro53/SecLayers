"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface HeaderResult {
  header: string;
  value: string;
  grade: "A" | "B" | "C" | "D" | "F";
  note: string;
}

function gradeHeaders(headers: string): HeaderResult[] {
  const lines = headers.trim().split("\n").filter(Boolean);
  const parsed: Record<string, string> = {};
  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) parsed[key.trim().toLowerCase()] = rest.join(":").trim();
  }

  const results: HeaderResult[] = [];

  // CSP
  const csp = parsed["content-security-policy"];
  results.push({
    header: "Content-Security-Policy",
    value: csp || "Missing",
    grade: csp
      ? csp.includes("unsafe-inline") || csp.includes("unsafe-eval")
        ? "C"
        : "A"
      : "F",
    note: csp
      ? csp.includes("unsafe-inline") || csp.includes("unsafe-eval")
        ? "Present but uses 'unsafe-inline' or 'unsafe-eval' — weakens protection"
        : "Present and strict — excellent"
      : "Missing — critical. Add a CSP to prevent XSS exploitation",
  });

  // HSTS
  const hsts = parsed["strict-transport-security"];
  const hasHsts = !!hsts;
  const hstsGood = hasHsts && hsts.includes("max-age=") && hsts.includes("includeSubDomains");
  results.push({
    header: "Strict-Transport-Security",
    value: hsts || "Missing",
    grade: hstsGood ? "A" : hasHsts ? "C" : "F",
    note: hstsGood
      ? "Present with max-age and includeSubDomains — excellent"
      : hasHsts
      ? "Present but missing max-age or includeSubDomains"
      : "Missing — users can be downgraded to HTTP",
  });

  // X-Content-Type-Options
  const xcto = parsed["x-content-type-options"];
  results.push({
    header: "X-Content-Type-Options",
    value: xcto || "Missing",
    grade: xcto === "nosniff" ? "A" : "F",
    note: xcto === "nosniff"
      ? "nosniff — MIME sniffing disabled"
      : "Missing — browser may incorrectly interpret file types",
  });

  // X-Frame-Options
  const xfo = parsed["x-frame-options"];
  results.push({
    header: "X-Frame-Options",
    value: xfo || "Missing",
    grade: xfo === "DENY" || xfo === "SAMEORIGIN" ? "A" : "F",
    note: xfo === "DENY" || xfo === "SAMEORIGIN"
      ? `${xfo} — clickjacking protection active`
      : "Missing — site can be framed by attackers (clickjacking)",
  });

  // Referrer-Policy
  const rp = parsed["referrer-policy"];
  results.push({
    header: "Referrer-Policy",
    value: rp || "Missing",
    grade: rp && !rp.includes("unsafe-url") ? "A" : rp ? "C" : "B",
    note: rp
      ? rp.includes("unsafe-url")
        ? "Present but uses unsafe-url — leaks full URLs"
        : "Present — good privacy control"
      : "Missing — consider adding strict-origin-when-cross-origin",
  });

  const grades = results.map((r) => r.grade);
  const aCount = grades.filter((g) => g === "A").length;
  const fCount = grades.filter((g) => g === "F").length;
  const overall = aCount === 5 ? "A+" : fCount === 0 ? "B" : fCount <= 2 ? "D" : "F";

  results.push({
    header: "— Overall Grade —",
    value: overall,
    grade: overall as "A",
    note: `${aCount}/5 A's, ${fCount} F's. ${
      overall === "A+" ? "All headers present and correctly configured." :
      "Improve F-grade headers first."
    }`,
  });

  return results;
}

const SAMPLE_GOOD = `Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin`;

const SAMPLE_BAD = `Server: Apache/2.4.1
X-Powered-By: PHP/5.3.2`;

const GRADE_COLORS: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

export default function HeaderGraderTool() {
  const [headers, setHeaders] = useState("");
  const [results, setResults] = useState<HeaderResult[] | null>(null);

  return (
    <ToolShell title="HTTP Header Grader" description="Paste HTTP response headers and get a security grade for each.">
      <div className="space-y-4">
        <div className="flex gap-2 mb-2">
          <button onClick={() => setHeaders(SAMPLE_GOOD)} className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Load Good</button>
          <button onClick={() => setHeaders(SAMPLE_BAD)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">Load Bad</button>
        </div>
        <textarea value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder="Paste HTTP response headers..." className="w-full h-32 px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => setResults(gradeHeaders(headers))} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Grade Headers</button>
        {results && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border ${r.header.includes("Overall") ? "bg-slate-800 text-white border-slate-700" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-slate-700">{r.header}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${r.header.includes("Overall") ? "bg-white text-slate-800" : GRADE_COLORS[r.grade]}`}>{r.value.length > 60 ? r.grade : r.value}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{r.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
