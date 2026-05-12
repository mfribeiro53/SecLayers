"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Step {
  id: string;
  label: string;
  description: string;
  signed: boolean;
  verifiedBy: string;
}

const CHAINS = [
  {
    id: "unsigned",
    label: "No signing",
    steps: [
      { id: "src",    label: "Source commit",    description: "Developer pushes code. No commit signing — anyone who compromises the repo can rewrite history.", signed: false, verifiedBy: "" },
      { id: "build",  label: "Build",            description: "CI builds a Docker image. Image has no cryptographic link back to the source commit.",              signed: false, verifiedBy: "" },
      { id: "push",   label: "Registry push",    description: "Image pushed with a mutable tag (:latest). Tag can be overwritten by anyone with push access.",     signed: false, verifiedBy: "" },
      { id: "deploy", label: "Deploy",           description: "Kubernetes pulls the image by tag. No verification — any image with that tag will be deployed.",     signed: false, verifiedBy: "" },
    ],
  },
  {
    id: "signed",
    label: "With Cosign + SLSA",
    steps: [
      { id: "src",    label: "Source commit",    description: "Developer signs commits with GPG. Branch protection requires signed commits. History is tamper-evident.",                                    signed: true,  verifiedBy: "GitHub branch protection (require signed commits)" },
      { id: "build",  label: "Build + attest",   description: "CI builds image and generates SLSA provenance attestation: builder identity, build inputs (git SHA), build steps. Signed with Cosign.",   signed: true,  verifiedBy: "Cosign + Sigstore transparency log (Rekor)" },
      { id: "push",   label: "Registry push",    description: "Image pushed with immutable digest tag (sha256:...). Cosign signature and SLSA attestation stored alongside the image in the registry.",    signed: true,  verifiedBy: "OCI registry (immutable digest reference)" },
      { id: "deploy", label: "Deploy",           description: "Kyverno policy verifies Cosign signature and SLSA level before allowing pod creation. Unsigned images are rejected.",                        signed: true,  verifiedBy: "Kyverno admission controller" },
    ],
  },
];

export default function ProvenanceChainTool() {
  const [chainIdx, setChainIdx] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const chain = CHAINS[chainIdx];

  return (
    <ToolShell title="Provenance Chain Visualizer" description="Compare a pipeline with no signing vs. one with Cosign and SLSA provenance attestations.">
      <div className="space-y-4">
        <div className="flex gap-1.5">
          {CHAINS.map((c, i) => (
            <button key={c.id} onClick={() => { setChainIdx(i); setHoveredStep(null); }}
              className={`px-3 py-1 text-xs rounded border transition-colors ${chainIdx === i ? "bg-slate-800 text-white border-slate-800" : "bg-surface-2 text-secondary border-subtle hover:border-slate-400"}`}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-0">
          {chain.steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setHoveredStep(step.id === hoveredStep ? null : step.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded border text-xs transition-all ${hoveredStep === step.id ? "border-slate-600 bg-slate-800 text-white" : step.signed ? "border-emerald-300 bg-success-subtle text-success hover:bg-success-muted" : "border-red-300 bg-danger-subtle text-danger hover:bg-danger-muted"}`}>
                <span className="text-base">{step.signed ? "🔏" : "⚠️"}</span>
                <span className="font-medium text-center leading-tight">{step.label}</span>
                <span className={`text-[10px] font-semibold ${hoveredStep === step.id ? "text-slate-300" : step.signed ? "text-success" : "text-danger"}`}>
                  {step.signed ? "SIGNED" : "UNSIGNED"}
                </span>
              </button>
              {i < chain.steps.length - 1 && (
                <div className={`text-xs px-0.5 ${chain.id === "signed" ? "text-emerald-400" : "text-red-300"}`}>→</div>
              )}
            </div>
          ))}
        </div>

        {chain.id === "unsigned" && !hoveredStep && (
          <div className="p-2 bg-danger-subtle border border-danger-subtle rounded text-xs text-danger">
            No step in this pipeline has cryptographic verification. An attacker who compromises any stage can substitute malicious artifacts without detection.
          </div>
        )}
        {chain.id === "signed" && !hoveredStep && (
          <div className="p-2 bg-success-subtle border border-success-subtle rounded text-xs text-success">
            Every stage is verified. The full chain from source commit to running pod is cryptographically attested. Tampering at any point breaks the chain and blocks deployment.
          </div>
        )}

        {hoveredStep && (() => {
          const step = chain.steps.find(s => s.id === hoveredStep)!;
          return (
            <div className={`p-3 border rounded text-xs space-y-1.5 ${step.signed ? "border-success-subtle bg-success-subtle" : "border-danger-subtle bg-danger-subtle"}`}>
              <p className="font-semibold text-secondary">{step.label}</p>
              <p className={step.signed ? "text-secondary" : "text-danger"}>{step.description}</p>
              {step.signed && step.verifiedBy && (
                <p className="text-success"><span className="font-medium">Verified by:</span> {step.verifiedBy}</p>
              )}
            </div>
          );
        })()}
      </div>
    </ToolShell>
  );
}
