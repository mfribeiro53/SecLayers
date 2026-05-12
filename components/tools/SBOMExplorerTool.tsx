"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";
import { semverClean, semverLt } from "@/lib/semver-utils";

// ── CVE database ────────────────────────────────────────────────
interface CveEntry {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedBelow: string;
}

const CVE_DB: Record<string, CveEntry[]> = {
  express:           [{ id: "CVE-2022-24999", severity: "high",     description: "qs prototype pollution via query string parsing allows DoS or property injection.",                                affectedBelow: "4.18.2" }],
  lodash:            [{ id: "CVE-2021-23337", severity: "high",     description: "Command injection via _.template when user-controlled input is used as a template.",                             affectedBelow: "4.17.21" },
                      { id: "CVE-2020-28500", severity: "medium",   description: "Regular expression denial of service (ReDoS) in toNumber, trim, and trimEnd.",                                   affectedBelow: "4.17.21" }],
  jsonwebtoken:      [{ id: "CVE-2022-23529", severity: "high",     description: "Insecure key retrieval can allow a malicious key object to cause arbitrary code execution.",                     affectedBelow: "9.0.0" }],
  axios:             [{ id: "CVE-2021-3749",  severity: "high",     description: "ReDoS via inefficient regular expression in request option handling.",                                           affectedBelow: "0.21.2" },
                      { id: "CVE-2023-45857", severity: "medium",   description: "Sensitive headers leaked in cross-origin requests when credentials are set.",                                    affectedBelow: "1.6.0" }],
  "follow-redirects":[{ id: "CVE-2022-0536",  severity: "medium",   description: "HTTP Authorization header forwarded to redirect target, leaking credentials.",                                   affectedBelow: "1.14.8" }],
  minimist:          [{ id: "CVE-2021-44906", severity: "critical",  description: "Prototype pollution via __proto__ or constructor keys in parsed arguments.",                                    affectedBelow: "1.2.6" }],
  "node-fetch":      [{ id: "CVE-2022-0235",  severity: "high",     description: "Sensitive information exposed via redirect to untrusted URL.",                                                   affectedBelow: "3.1.1" }],
  moment:            [{ id: "CVE-2022-24785", severity: "high",     description: "Path traversal vulnerability in locale file loading.",                                                           affectedBelow: "2.29.2" },
                      { id: "CVE-2022-31129", severity: "high",     description: "ReDoS via specially crafted date string in parsing.",                                                            affectedBelow: "2.29.4" }],
  semver:            [{ id: "CVE-2022-25883", severity: "high",     description: "ReDoS via untrusted version string in range validation.",                                                        affectedBelow: "7.5.2" }],
  "ws":              [{ id: "CVE-2021-32640", severity: "medium",   description: "ReDoS in HTTP header parsing.",                                                                                  affectedBelow: "7.4.6" }],
  "ejs":             [{ id: "CVE-2022-29078", severity: "critical",  description: "Server-side template injection via prototype pollution in render options.",                                     affectedBelow: "3.1.7" }],
  "mysql2":          [{ id: "CVE-2021-32304", severity: "high",     description: "Denial of service via malformed packet.",                                                                        affectedBelow: "2.3.4" }],
};

// ── Existing SBOM data ───────────────────────────────────────────
interface Component {
  name: string;
  version: string;
  license: string;
  direct: boolean;
  vulns: { id: string; severity: "critical" | "high" | "medium" | "low"; description: string; fixedIn: string | null }[];
}

const COMPONENTS: Component[] = [
  { name: "express",          version: "4.17.1", license: "MIT",         direct: true,  vulns: [{ id: "CVE-2022-24999", severity: "high",   description: "qs prototype pollution via query string parsing allows DoS or property injection.",                         fixedIn: "4.18.2" }] },
  { name: "lodash",           version: "4.17.15",license: "MIT",         direct: true,  vulns: [{ id: "CVE-2021-23337", severity: "high",   description: "Command injection via template function when user-controlled input reaches _.template.",                   fixedIn: "4.17.21" },
                                                                                                  { id: "CVE-2020-28500", severity: "medium", description: "Regular expression denial of service (ReDoS) in toNumber, trim, and trimEnd.",                           fixedIn: "4.17.21" }] },
  { name: "jsonwebtoken",     version: "8.5.1",  license: "MIT",         direct: true,  vulns: [{ id: "CVE-2022-23529", severity: "high",   description: "Insecure implementation of key retrieval allows a malicious key object to lead to arbitrary code execution.", fixedIn: "9.0.0" }] },
  { name: "axios",            version: "0.21.1", license: "MIT",         direct: true,  vulns: [{ id: "CVE-2021-3749",  severity: "high",   description: "Inefficient regular expression causes ReDoS when untrusted data reaches certain request options.",          fixedIn: "0.21.2" }] },
  { name: "follow-redirects", version: "1.14.1", license: "MIT",         direct: false, vulns: [{ id: "CVE-2022-0536",  severity: "medium", description: "Exposure of sensitive information: HTTP authorization header forwarded to redirect target.",                fixedIn: "1.14.8" }] },
  { name: "chalk",            version: "4.1.2",  license: "MIT",         direct: false, vulns: [] },
  { name: "dotenv",           version: "10.0.0", license: "BSD-2-Clause",direct: true,  vulns: [] },
];

const SEV_COLOR: Record<string, string> = {
  critical: "bg-danger-muted text-danger border-red-300",
  high:     "bg-orange-subtle text-orange border-orange-300",
  medium:   "bg-warning-muted text-warning border-amber-300",
  low:      "bg-info-muted text-info border-blue-300",
};

const SEV_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-500",
  low:      "bg-blue-500",
};

// ── package.json scan ────────────────────────────────────────────
interface ScanResult {
  name: string;
  version: string;
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  affectedBelow: string;
}

const EXAMPLE_PKG = `{
  "name": "my-app",
  "dependencies": {
    "express": "^4.17.1",
    "lodash": "^4.17.15",
    "axios": "^0.21.1",
    "moment": "^2.29.1",
    "minimist": "^1.2.5",
    "dotenv": "^10.0.0"
  }
}`;

function scanPackageJson(text: string): ScanResult[] | string {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return "Invalid JSON — paste a valid package.json";
  }
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return "Expected a JSON object";
  }
  const pkg = json as Record<string, unknown>;
  const combined: Record<string, string> = {};
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const deps = pkg[field];
    if (deps && typeof deps === "object" && !Array.isArray(deps)) {
      Object.assign(combined, deps);
    }
  }
  const packages = Object.entries(combined).filter(([, v]) => typeof v === "string");
  if (packages.length === 0) return "No dependency fields found";

  return packages.flatMap(([name, version]) => {
    const cves = CVE_DB[name];
    if (!cves) return [];
    return cves
      .filter((cve) => semverLt(version as string, cve.affectedBelow))
      .map((cve) => ({ name, version: version as string, ...cve }));
  });
}

export default function SBOMExplorerTool() {
  const [tab, setTab] = useState<"sbom" | "scan">("sbom");

  // SBOM tab state
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "vulns">("all");

  // Scan tab state
  const [pkgText, setPkgText] = useState(EXAMPLE_PKG);
  const [scanResults, setScanResults] = useState<ScanResult[] | string | null>(null);

  const shown =
    filter === "vulns" ? COMPONENTS.filter((c) => c.vulns.length > 0) : COMPONENTS;
  const selectedComp = COMPONENTS.find((c) => c.name === selected);
  const totalVulns = COMPONENTS.reduce((n, c) => n + c.vulns.length, 0);
  const criticalHigh = COMPONENTS.reduce(
    (n, c) =>
      n + c.vulns.filter((v) => v.severity === "critical" || v.severity === "high").length,
    0
  );

  const handleScan = () => {
    setScanResults(scanPackageJson(pkgText));
  };

  return (
    <ToolShell
      title="SBOM & CVE Explorer"
      description="Browse a software bill of materials, or paste a package.json to check for known vulnerabilities."
    >
      <div className="space-y-4">
        {/* Top tabs */}
        <div className="flex gap-1.5">
          {(["sbom", "scan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                tab === t
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
              }`}
            >
              {t === "sbom" ? "Example SBOM" : "Scan package.json"}
            </button>
          ))}
        </div>

        {/* ── SBOM tab ── */}
        {tab === "sbom" && (
          <>
            <div className="flex gap-3 text-xs">
              <div className="px-3 py-1.5 bg-elevated rounded">
                <span className="font-semibold">{COMPONENTS.length}</span> components
              </div>
              <div className="px-3 py-1.5 bg-orange-subtle border border-orange-subtle rounded text-orange">
                <span className="font-semibold">{totalVulns}</span> vulnerabilities
              </div>
              <div className="px-3 py-1.5 bg-danger-subtle border border-danger-subtle rounded text-danger">
                <span className="font-semibold">{criticalHigh}</span> critical/high
              </div>
            </div>

            <div className="flex gap-1.5">
              {(["all", "vulns"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    filter === f
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"
                  }`}
                >
                  {f === "all" ? "All components" : "Vulnerable only"}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              {shown.map((comp) => (
                <button
                  key={comp.name}
                  onClick={() =>
                    setSelected(comp.name === selected ? null : comp.name)
                  }
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded border text-xs transition-colors ${
                    selected === comp.name
                      ? "border-slate-400 bg-surface-2"
                      : "border-subtle bg-surface-2 hover:border-slate-400"
                  }`}
                >
                  <span className="font-mono font-semibold text-primary flex-1">
                    {comp.name}
                  </span>
                  <span className="text-slate-400">v{comp.version}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      comp.direct
                        ? "bg-info-muted text-info"
                        : "bg-elevated text-slate-500"
                    }`}
                  >
                    {comp.direct ? "direct" : "transitive"}
                  </span>
                  {comp.vulns.length > 0 ? (
                    <div className="flex gap-1">
                      {comp.vulns.map((v) => (
                        <span
                          key={v.id}
                          className={`w-2 h-2 rounded-full ${SEV_DOT[v.severity]}`}
                          title={v.severity}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-500 text-[10px]">clean</span>
                  )}
                </button>
              ))}
            </div>

            {selectedComp && (
              <div className="border border-subtle rounded p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-primary">
                    {selectedComp.name}
                  </span>
                  <span className="text-slate-400">v{selectedComp.version}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{selectedComp.license}</span>
                </div>
                {selectedComp.vulns.length === 0 ? (
                  <p className="text-xs text-success">No known vulnerabilities.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedComp.vulns.map((v) => (
                      <div
                        key={v.id}
                        className={`border rounded p-2 text-xs ${SEV_COLOR[v.severity]}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold uppercase text-[10px]">
                            {v.severity}
                          </span>
                          <span className="font-mono text-[10px]">{v.id}</span>
                        </div>
                        <p>{v.description}</p>
                        {v.fixedIn && (
                          <p className="mt-1 font-medium">Fix: upgrade to v{v.fixedIn}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Scan tab ── */}
        {tab === "scan" && (
          <>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                package.json
              </label>
              <textarea
                value={pkgText}
                onChange={(e) => {
                  setPkgText(e.target.value);
                  setScanResults(null);
                }}
                className="w-full p-3 bg-slate-900 text-slate-200 text-xs font-mono leading-5 rounded border border-subtle resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={14}
                spellCheck={false}
              />
            </div>

            <button
              onClick={handleScan}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
            >
              Check vulnerabilities
            </button>

            {scanResults !== null && (
              <>
                {typeof scanResults === "string" ? (
                  <p className="text-xs text-amber-500">{scanResults}</p>
                ) : scanResults.length === 0 ? (
                  <p className="text-xs text-emerald-500">
                    No known vulnerabilities found in {Object.keys(CVE_DB).length}-entry database.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-secondary">
                      {scanResults.length} vulnerability{scanResults.length !== 1 ? " findings" : " finding"}
                    </p>
                    {scanResults.map((r, i) => (
                      <div
                        key={i}
                        className={`border rounded p-2 text-xs ${SEV_COLOR[r.severity]}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold uppercase text-[10px]">
                            {r.severity}
                          </span>
                          <span className="font-mono text-[10px]">{r.id}</span>
                          <span className="font-mono text-[10px] opacity-70">
                            {r.name}@{semverClean(r.version)}
                          </span>
                        </div>
                        <p>{r.description}</p>
                        <p className="mt-1 font-medium">
                          Fix: upgrade to &gt;={r.affectedBelow}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-[10px] text-slate-600">
              Checks {Object.keys(CVE_DB).length} packages against a built-in CVE snapshot. Uses semver comparison — versions below the fixed version trigger a finding.
            </p>
          </>
        )}
      </div>
    </ToolShell>
  );
}
