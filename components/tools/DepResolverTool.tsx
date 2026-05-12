"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Package {
  name: string;
  version: string;
  registry: "public" | "internal";
  description: string;
  malicious?: boolean;
}

const SCENARIOS: {
  id: string; label: string; description: string;
  packages: Package[];
  internalVersion: string; publicVersion: string | null; resolvedFrom: "internal" | "public";
}[] = [
  {
    id: "normal",
    label: "Normal resolution",
    description: "Package exists in both internal and public registry. No attack.",
    packages: [
      { name: "company-utils", version: "2.1.0", registry: "internal", description: "Shared utility library — internal" },
      { name: "lodash", version: "4.17.21", registry: "public", description: "General utility library — npm" },
    ],
    internalVersion: "2.1.0",
    publicVersion: null as string | null,
    resolvedFrom: "internal" as "internal" | "public",
  },
  {
    id: "confusion",
    label: "Dependency confusion",
    description: "Attacker publishes a higher-versioned malicious package on npm with the same name as the internal package.",
    packages: [
      { name: "company-utils", version: "9.9.9", registry: "public", description: "⚠ Malicious package on npm — higher version wins!", malicious: true },
      { name: "company-utils", version: "2.1.0", registry: "internal", description: "Legitimate internal library" },
    ],
    internalVersion: "2.1.0",
    publicVersion: "9.9.9",
    resolvedFrom: "public",
  },
  {
    id: "scoped",
    label: "Scoped package (safe)",
    description: "Using a scoped package (@company/utils) prevents confusion because npm scopes are reserved per org.",
    packages: [
      { name: "@company/utils", version: "2.1.0", registry: "internal", description: "Scoped package — namespace controlled by organization" },
    ],
    internalVersion: "2.1.0",
    publicVersion: null,
    resolvedFrom: "internal",
  },
];

export default function DepResolverTool() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [resolved, setResolved] = useState(false);
  const scenario = SCENARIOS[scenarioIdx];

  const switchScenario = (i: number) => { setScenarioIdx(i); setResolved(false); };

  return (
    <ToolShell title="Dependency Resolver" description="Simulate how package managers resolve dependencies and how confusion attacks exploit version precedence.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s, i) => (
            <button key={s.id} onClick={() => switchScenario(i)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${scenarioIdx === i ? "bg-slate-800 text-white border-slate-800" : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"}`}>
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 italic">{scenario.description}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-secondary">Packages seen by the resolver:</p>
          {scenario.packages.map((pkg, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded border text-xs ${pkg.malicious ? "border-red-300 bg-danger-subtle" : "border-subtle bg-surface-2"}`}>
              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${pkg.registry === "internal" ? "bg-blue-500" : pkg.malicious ? "bg-red-500" : "bg-green-500"}`} />
              <div className="flex-1 min-w-0">
                <span className="font-mono font-bold text-primary">{pkg.name}</span>
                <span className="ml-2 text-slate-500">v{pkg.version}</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${pkg.registry === "internal" ? "bg-info-muted text-info" : "bg-elevated text-secondary"}`}>
                  {pkg.registry === "internal" ? "internal registry" : "npm (public)"}
                </span>
                <p className="mt-1 text-slate-500">{pkg.description}</p>
              </div>
              <span className="font-mono text-[10px] text-slate-400">v{pkg.version}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setResolved(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
          Resolve dependency
        </button>

        {resolved && (
          <div className={`p-3 rounded border text-xs ${scenario.resolvedFrom === "public" && scenario.id === "confusion" ? "border-red-400 bg-danger-subtle" : "border-emerald-300 bg-success-subtle"}`}>
            <p className="font-semibold mb-1">
              {scenario.resolvedFrom === "public" && scenario.id === "confusion"
                ? "ATTACK SUCCEEDED — malicious package installed"
                : "Resolved safely"}
            </p>
            <p className="text-secondary">
              {scenario.id === "confusion"
                ? `npm prefers the highest version number regardless of registry. v${scenario.publicVersion} > v${scenario.internalVersion}, so the public (malicious) package wins. At install time, the attacker's code runs.`
                : scenario.id === "scoped"
                ? "Scoped packages (@company/utils) require the scope to be registered. The attacker cannot publish to @company without organization approval — no confusion is possible."
                : `No public package with this name exists. Internal v${scenario.internalVersion} installed normally.`}
            </p>

            {scenario.id === "confusion" && (
              <div className="mt-2 pt-2 border-t border-danger-subtle">
                <p className="font-semibold text-danger mb-1">Common attack payloads:</p>
                <ul className="list-disc list-inside space-y-0.5 text-danger">
                  <li>Exfiltrate environment variables (credentials, tokens) at install time</li>
                  <li>Drop a reverse shell during npm install via postinstall script</li>
                  <li>Replace build artifacts with backdoored versions</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
