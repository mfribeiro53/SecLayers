"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Activity {
  id: string;
  label: string;
  phase: string;
  description: string;
}

const ACTIVITIES: Activity[] = [
  { id: "sec-reqs", label: "Security Requirements", phase: "requirements", description: "Define authentication, authorization, encryption, and compliance needs." },
  { id: "abuse-cases", label: "Abuse Cases", phase: "requirements", description: "Document how the feature could be misused." },
  { id: "threat-model", label: "Threat Modeling", phase: "design", description: "STRIDE analysis on the feature's DFD." },
  { id: "arch-review", label: "Architecture Review", phase: "design", description: "Review design for security patterns and least privilege." },
  { id: "sast", label: "SAST Scanning", phase: "development", description: "Static analysis for vulnerability patterns in source code." },
  { id: "sca", label: "SCA / Dependency Check", phase: "development", description: "Scan dependencies for known CVEs." },
  { id: "secret-scan", label: "Secret Scanning", phase: "development", description: "Detect hardcoded secrets before they reach the repo." },
  { id: "code-review", label: "Security Code Review", phase: "development", description: "PR review with security checklist." },
  { id: "dast", label: "DAST Scanning", phase: "testing", description: "Dynamic scanning of running application for vulnerabilities." },
  { id: "pen-test", label: "Penetration Testing", phase: "testing", description: "Manual testing for business logic flaws." },
  { id: "fuzz", label: "Fuzzing", phase: "testing", description: "Send malformed input to find crashes and unexpected behavior." },
  { id: "iac-scan", label: "IaC Scanning", phase: "deployment", description: "Scan Terraform/CloudFormation for misconfigurations." },
  { id: "container-scan", label: "Container Scanning", phase: "deployment", description: "Scan container images for vulnerabilities." },
  { id: "hardening", label: "Hardening", phase: "deployment", description: "Remove defaults, apply least-privilege IAM roles." },
  { id: "logging", label: "Logging & Monitoring", phase: "operations", description: "Ship security logs to SIEM, configure alerts." },
  { id: "ir", label: "Incident Response Plan", phase: "operations", description: "Documented process for security incidents." },
];

const PHASES = [
  { id: "requirements", label: "1. Requirements", color: "bg-elevated border-subtle" },
  { id: "design", label: "2. Design", color: "bg-info-subtle border-info-subtle" },
  { id: "development", label: "3. Development", color: "bg-violet-subtle border-violet-subtle" },
  { id: "testing", label: "4. Testing", color: "bg-warning-subtle border-warning-subtle" },
  { id: "deployment", label: "5. Deployment", color: "bg-success-subtle border-success-subtle" },
  { id: "operations", label: "6. Operations", color: "bg-rose-subtle border-rose-subtle" },
];

export default function SdlcTimelineTool() {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [draggedActivity, setDraggedActivity] = useState<string | null>(null);

  const handleDragStart = (activityId: string) => {
    setDraggedActivity(activityId);
  };

  const handleDrop = (phaseId: string) => {
    if (draggedActivity) {
      setPlaced((prev) => ({ ...prev, [draggedActivity]: phaseId }));
    }
    setDraggedActivity(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getActivityById = (id: string) => ACTIVITIES.find((a) => a.id === id);

  // Calculate coverage per phase
  const phaseCoverage = PHASES.map((p) => {
    const phaseActivities = ACTIVITIES.filter((a) => a.phase === p.id);
    const placedHere = phaseActivities.filter((a) => placed[a.id] === p.id).length;
    return { ...p, total: phaseActivities.length, placed: placedHere };
  });

  const totalPlaced = Object.keys(placed).length;
  const totalActivities = ACTIVITIES.length;

  return (
    <ToolShell
      title="SDLC Timeline"
      description="Drag security activities into the correct SDLC phase. See where your security coverage lives."
    >
      <div className="space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-secondary">Coverage</span>
            <span className="text-slate-400">
              {totalPlaced}/{totalActivities} activities placed
            </span>
          </div>
          <div className="w-full bg-strong rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(totalPlaced / totalActivities) * 100}%` }}
            />
          </div>
        </div>

        {/* Phase drop zones */}
        <div className="space-y-3">
          {phaseCoverage.map((phase) => (
            <div
              key={phase.id}
              onDrop={() => handleDrop(phase.id)}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-4 min-h-[60px] transition-colors ${
                draggedActivity ? "border-blue-400 bg-info-subtle/30" : phase.color
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-semibold text-secondary">
                  {phase.label}
                </p>
                <span className="text-xs text-slate-400">
                  {phase.placed}/{phase.total}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.filter((a) => placed[a.id] === phase.id).map(
                  (a) => (
                    <span
                      key={a.id}
                      className="px-2 py-1 text-xs rounded bg-surface-2 border border-subtle text-secondary shadow-sm"
                    >
                      {a.label}
                    </span>
                  )
                )}
                {ACTIVITIES.filter((a) => a.phase === phase.id && placed[a.id] !== phase.id).length > 0 && (
                  <span className="text-xs text-slate-400 italic">
                    Drop activities here
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activity palette */}
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Activities to place (drag to a phase):
          </p>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.filter((a) => !placed[a.id] || placed[a.id] !== a.phase).map((a) => (
              <span
                key={a.id}
                draggable
                onDragStart={() => handleDragStart(a.id)}
                className={`px-2.5 py-1.5 text-xs rounded-md font-medium cursor-grab active:cursor-grabbing border transition-colors hover:shadow-sm ${
                  draggedActivity === a.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-surface-2 border-subtle text-secondary hover:border-blue-400"
                }`}
                title={a.description}
              >
                {a.label}
              </span>
            ))}
          </div>
        </div>

        {/* Correct answers reveal */}
        {totalPlaced === totalActivities && (
          <div className="p-4 rounded-lg bg-success-subtle border border-success-subtle text-sm text-success">
            <p className="font-medium mb-1">
              🎉 All activities placed! Here's the correct mapping:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs mt-2">
              <li>
                <strong>Requirements:</strong> Security Requirements, Abuse
                Cases
              </li>
              <li>
                <strong>Design:</strong> Threat Modeling, Architecture Review
              </li>
              <li>
                <strong>Development:</strong> SAST, SCA, Secret Scanning, Code
                Review
              </li>
              <li>
                <strong>Testing:</strong> DAST, Penetration Testing, Fuzzing
              </li>
              <li>
                <strong>Deployment:</strong> IaC Scanning, Container Scanning,
                Hardening
              </li>
              <li>
                <strong>Operations:</strong> Logging & Monitoring, Incident
                Response
              </li>
            </ul>
            <p className="mt-2 text-xs">
              The shift-left principle: activities in earlier phases{" "}
              <strong>prevent</strong> vulnerabilities; activities in later
              phases <strong>detect</strong> them. Prevention is always cheaper.
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm text-secondary">
          <p className="font-medium text-secondary mb-1">Shift-Left Principle</p>
          <p>
            A vulnerability caught in <strong>Requirements</strong> costs ~$1 to
            fix. The same vulnerability caught in <strong>Operations</strong>{" "}
            costs ~$100,000+. Every security activity moved earlier in the
            timeline saves money and reduces risk.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
