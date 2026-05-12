"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Stage {
  id: string;
  label: string;
  icon: string;
  attacks: { name: string; description: string; severity: "critical" | "high" | "medium" }[];
  defenses: string[];
}

const STAGES: Stage[] = [
  {
    id: "source",
    label: "Source Code",
    icon: "📝",
    attacks: [
      { name: "Malicious PR merge", severity: "critical", description: "Attacker gets code merged via social engineering, stolen maintainer credentials, or exploiting weak branch protection rules." },
      { name: "Secret committed", severity: "high", description: "Developer accidentally commits API key, password, or private key. Bots scan GitHub continuously." },
    ],
    defenses: ["Require 2 reviewers for protected branches", "Block force-push to main", "Pre-commit hooks with gitleaks", "CODEOWNERS for sensitive paths"],
  },
  {
    id: "build",
    label: "Build",
    icon: "🔨",
    attacks: [
      { name: "Dependency confusion", severity: "critical", description: "Build pulls a malicious public package with higher version than the internal one, running attacker code at install time." },
      { name: "Compromised base image", severity: "critical", description: "Docker base image contains backdoor. Pulled from untrusted registry or tag overwritten (mutable tags)." },
      { name: "Poisoned build cache", severity: "high", description: "Shared build cache is written to by a prior malicious build, poisoning subsequent builds with altered artifacts." },
    ],
    defenses: ["Pin dependency versions (lockfiles)", "Use scoped packages or internal mirrors", "Pin base images by digest (@sha256:...)", "Isolated ephemeral build runners"],
  },
  {
    id: "test",
    label: "Test / SAST",
    icon: "🧪",
    attacks: [
      { name: "Bypassed security gates", severity: "high", description: "SAST/DAST tools configured with --soft-fail or thresholds too permissive — findings are reported but never block the pipeline." },
      { name: "Test environment credential leak", severity: "medium", description: "Test suite requires real credentials; these are stored in CI environment variables and leak via logs or misconfigured masking." },
    ],
    defenses: ["SAST findings at critical/high severity block the build", "Use ephemeral test credentials with minimal scope", "Mask all secret variables; audit CI logs"],
  },
  {
    id: "artifacts",
    label: "Artifacts",
    icon: "📦",
    attacks: [
      { name: "Artifact tampering", severity: "critical", description: "Build artifact (container image, binary, npm package) is modified after build but before signing or distribution." },
      { name: "Unsigned artifacts", severity: "high", description: "No signature verification at deployment time — any artifact matching the expected name/tag is deployed, even if substituted." },
    ],
    defenses: ["Sign artifacts with Cosign or Sigstore", "Verify signatures before deployment (Kyverno, OPA)", "Immutable artifact repositories"],
  },
  {
    id: "deploy",
    label: "Deploy",
    icon: "🚀",
    attacks: [
      { name: "Overprivileged CI/CD credentials", severity: "critical", description: "The deployment service account has cluster-admin or AdministratorAccess. Compromising the pipeline gives full cloud access." },
      { name: "Environment variable injection", severity: "high", description: "Attacker modifies CI/CD environment variable values (API endpoints, feature flags) to redirect traffic or disable security." },
    ],
    defenses: ["Least-privilege deployment role (specific namespaces/resources only)", "Use OIDC federation — no long-lived credentials in CI", "Require approval step for production deploys"],
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50 text-red-800",
  high: "border-l-orange-500 bg-orange-50 text-orange-800",
  medium: "border-l-amber-500 bg-amber-50 text-amber-800",
};

export default function PipelineDAGTool() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [view, setView] = useState<"attacks" | "defenses">("attacks");

  const stage = STAGES.find(s => s.id === selectedStage);

  return (
    <ToolShell title="CI/CD Pipeline Attack Map" description="Click a pipeline stage to see its attack vectors and recommended defenses.">
      <div className="space-y-4">
        <div className="flex items-center gap-0">
          {STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button onClick={() => setSelectedStage(s.id === selectedStage ? null : s.id)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded border text-xs transition-colors ${selectedStage === s.id ? "border-slate-600 bg-slate-800 text-white" : "border-subtle bg-surface-2 text-secondary hover:border-slate-400"}`}>
                <span className="text-base">{s.icon}</span>
                <span className="font-medium leading-tight text-center">{s.label}</span>
              </button>
              {i < STAGES.length - 1 && (
                <div className="text-slate-300 text-xs px-0.5">→</div>
              )}
            </div>
          ))}
        </div>

        {stage && (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {(["attacks", "defenses"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${view === v ? "bg-slate-800 text-white border-slate-800" : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"}`}>
                  {v === "attacks" ? `Attack vectors (${stage.attacks.length})` : `Defenses (${stage.defenses.length})`}
                </button>
              ))}
            </div>

            {view === "attacks" ? (
              <div className="space-y-2">
                {stage.attacks.map((a, i) => (
                  <div key={i} className={`border-l-4 pl-3 py-2 rounded-r text-xs ${SEV_COLOR[a.severity]}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold uppercase text-[10px]">{a.severity}</span>
                      <span className="font-semibold">{a.name}</span>
                    </div>
                    <p>{a.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1.5">
                {stage.defenses.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-secondary">
                    <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!stage && (
          <p className="text-xs text-slate-400 italic text-center py-4">Select a pipeline stage above to explore its security implications.</p>
        )}
      </div>
    </ToolShell>
  );
}
