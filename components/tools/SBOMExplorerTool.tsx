"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Vuln {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  fixedIn: string | null;
}

interface Component {
  name: string;
  version: string;
  license: string;
  direct: boolean;
  vulns: Vuln[];
}

const COMPONENTS: Component[] = [
  {
    name: "express",
    version: "4.17.1",
    license: "MIT",
    direct: true,
    vulns: [
      { id: "CVE-2022-24999", severity: "high", description: "qs prototype pollution via query string parsing allows DoS or property injection.", fixedIn: "4.18.2" },
    ],
  },
  {
    name: "lodash",
    version: "4.17.15",
    license: "MIT",
    direct: true,
    vulns: [
      { id: "CVE-2021-23337", severity: "high", description: "Command injection via template function when user-controlled input reaches _.template.", fixedIn: "4.17.21" },
      { id: "CVE-2020-28500", severity: "medium", description: "Regular expression denial of service (ReDoS) in toNumber, trim, and trimEnd.", fixedIn: "4.17.21" },
    ],
  },
  {
    name: "jsonwebtoken",
    version: "8.5.1",
    license: "MIT",
    direct: true,
    vulns: [
      { id: "CVE-2022-23529", severity: "high", description: "Insecure implementation of key retrieval allows a malicious key object to lead to arbitrary code execution.", fixedIn: "9.0.0" },
    ],
  },
  {
    name: "axios",
    version: "0.21.1",
    license: "MIT",
    direct: true,
    vulns: [
      { id: "CVE-2021-3749", severity: "high", description: "Inefficient regular expression causes ReDoS when untrusted data reaches certain request options.", fixedIn: "0.21.2" },
    ],
  },
  {
    name: "follow-redirects",
    version: "1.14.1",
    license: "MIT",
    direct: false,
    vulns: [
      { id: "CVE-2022-0536", severity: "medium", description: "Exposure of sensitive information: HTTP authorization header forwarded to redirect target.", fixedIn: "1.14.8" },
    ],
  },
  {
    name: "chalk",
    version: "4.1.2",
    license: "MIT",
    direct: false,
    vulns: [],
  },
  {
    name: "dotenv",
    version: "10.0.0",
    license: "BSD-2-Clause",
    direct: true,
    vulns: [],
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  low: "bg-blue-100 text-blue-700 border-blue-300",
};

const SEV_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

export default function SBOMExplorerTool() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "vulns">("all");

  const shown = filter === "vulns" ? COMPONENTS.filter(c => c.vulns.length > 0) : COMPONENTS;
  const selectedComp = COMPONENTS.find(c => c.name === selected);
  const totalVulns = COMPONENTS.reduce((n, c) => n + c.vulns.length, 0);
  const criticalHigh = COMPONENTS.reduce((n, c) => n + c.vulns.filter(v => v.severity === "critical" || v.severity === "high").length, 0);

  return (
    <ToolShell title="SBOM & CVE Explorer" description="Browse a software bill of materials and triage vulnerability findings by severity.">
      <div className="space-y-4">
        <div className="flex gap-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-100 rounded">
            <span className="font-semibold">{COMPONENTS.length}</span> components
          </div>
          <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded text-orange-700">
            <span className="font-semibold">{totalVulns}</span> vulnerabilities
          </div>
          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded text-red-700">
            <span className="font-semibold">{criticalHigh}</span> critical/high
          </div>
        </div>

        <div className="flex gap-1.5">
          {(["all", "vulns"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {f === "all" ? "All components" : "Vulnerable only"}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {shown.map(comp => (
            <button key={comp.name} onClick={() => setSelected(comp.name === selected ? null : comp.name)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded border text-xs transition-colors ${selected === comp.name ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <span className="font-mono font-semibold text-slate-900 flex-1">{comp.name}</span>
              <span className="text-slate-400">v{comp.version}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${comp.direct ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                {comp.direct ? "direct" : "transitive"}
              </span>
              {comp.vulns.length > 0 ? (
                <div className="flex gap-1">
                  {comp.vulns.map(v => (
                    <span key={v.id} className={`w-2 h-2 rounded-full ${SEV_DOT[v.severity]}`} title={v.severity} />
                  ))}
                </div>
              ) : (
                <span className="text-emerald-500 text-[10px]">clean</span>
              )}
            </button>
          ))}
        </div>

        {selectedComp && (
          <div className="border border-slate-200 rounded p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-slate-900">{selectedComp.name}</span>
              <span className="text-slate-400">v{selectedComp.version}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{selectedComp.license}</span>
            </div>

            {selectedComp.vulns.length === 0 ? (
              <p className="text-xs text-emerald-700">No known vulnerabilities.</p>
            ) : (
              <div className="space-y-2">
                {selectedComp.vulns.map(v => (
                  <div key={v.id} className={`border rounded p-2 text-xs ${SEV_COLOR[v.severity]}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold uppercase text-[10px]">{v.severity}</span>
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
      </div>
    </ToolShell>
  );
}
