"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Mitigation {
  id: string;
  label: string;
  description: string;
  bypassedBy: string;
  weight: number;
}

const MITIGATIONS: Mitigation[] = [
  { id: "aslr", label: "ASLR", description: "Randomizes memory layout — stack, heap, libraries at different addresses each run.", bypassedBy: "Info leak (memory disclosure), brute-force (32-bit systems)", weight: 40 },
  { id: "nx", label: "NX / DEP", description: "Marks stack and heap as non-executable. Prevents shellcode execution.", bypassedBy: "ROP (Return-Oriented Programming) — reuse existing code gadgets", weight: 35 },
  { id: "canary", label: "Stack Canary", description: "Random value on stack before return address. Checked before return.", bypassedBy: "Info leak (read canary value), brute-force (forking servers)", weight: 25 },
  { id: "pie", label: "PIE", description: "Position-Independent Executable. Code loaded at random address (requires ASLR).", bypassedBy: "Partial overwrite, info leak", weight: 15 },
  { id: "relro", label: "RELRO", description: "Makes GOT (Global Offset Table) read-only. Prevents GOT overwrite attacks.", bypassedBy: "None directly — forces attackers to find other targets", weight: 15 },
];

export default function MitigationToggleTool() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["aslr", "nx", "canary", "pie", "relro"]));

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalWeight = MITIGATIONS.reduce((sum, m) => sum + m.weight, 0);
  const enabledWeight = MITIGATIONS.filter((m) => enabled.has(m.id)).reduce((sum, m) => sum + m.weight, 0);
  const score = Math.round((enabledWeight / totalWeight) * 100);

  const getScoreColor = () => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getBarColor = () => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getAttackDifficulty = () => {
    if (score >= 90) return "Extremely difficult — requires multiple chained info leaks + ROP chain + brute-force";
    if (score >= 70) return "Hard — requires info leak + ROP chain";
    if (score >= 40) return "Moderate — ROP chain needed, ASLR may be brute-forceable on 32-bit";
    return "Easy — standard shellcode injection or simple ROP chain works";
  };

  return (
    <ToolShell title="Binary Mitigation Toggle" description="Toggle ASLR, NX, canaries, PIE, and RELRO. See how the attack difficulty score changes.">
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-slate-700">Attack Feasibility Score</p>
            <p className={`text-2xl font-bold ${getScoreColor()}`}>{score}%</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${getBarColor()}`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Higher score = harder to exploit. {100 - score}% of mitigation weight is disabled.</p>
        </div>

        <div className="space-y-2">
          {MITIGATIONS.map((m) => (
            <div key={m.id} className={`p-3 rounded-lg border transition-colors ${enabled.has(m.id) ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(m.id)} className={`w-10 h-5 rounded-full relative transition-colors ${enabled.has(m.id) ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled.has(m.id) ? "left-5" : "left-0.5"}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                  <span className="text-xs text-slate-400">({m.weight} pts)</span>
                </div>
                <span className={`text-xs font-medium ${enabled.has(m.id) ? "text-emerald-600" : "text-red-600"}`}>
                  {enabled.has(m.id) ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{m.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">Bypassed by: {m.bypassedBy}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-slate-800 text-white text-sm">
          <p className="font-medium">Attack Difficulty: {getAttackDifficulty()}</p>
        </div>
      </div>
    </ToolShell>
  );
}
