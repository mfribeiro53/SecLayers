"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface IntentCase {
  id: string;
  title: string;
  sender: string;
  intent: string;
  data: string;
  vulnerable: boolean;
  explanation: string;
}

const CASES: IntentCase[] = [
  {
    id: "explicit",
    title: "Explicit Intent (Safe)",
    sender: "com.bank.app",
    intent: "Intent { cmp=com.bank.app/.TransferActivity }",
    data: "amount=500&to=acct_789",
    vulnerable: false,
    explanation: "Explicit intents specify the target component by name. Only com.bank.app.TransferActivity can receive this intent. No hijacking possible.",
  },
  {
    id: "implicit_weak",
    title: "Implicit Intent (Vulnerable)",
    sender: "com.bank.app",
    intent: "Intent { act=android.intent.action.VIEW, dat=https://bank.com/transfer }",
    data: "URL: https://bank.com/transfer?to=attacker&amount=10000",
    vulnerable: true,
    explanation: "Implicit intent with no package restriction. Any app that registers for VIEW + bank.com URLs can intercept this. A malicious app registers for the same URL scheme and receives the intent instead.",
  },
  {
    id: "deeplink",
    title: "Deep Link Hijacking",
    sender: "Browser / External App",
    intent: "Intent { dat=bankapp://transfer?to=attacker }",
    data: "bankapp://transfer?to=attacker&amount=5000",
    vulnerable: true,
    explanation: "Attacker sends a deep link to the victim. If the app doesn't validate the link parameters, it processes the transfer as if the user initiated it. Always validate deep link parameters server-side.",
  },
  {
    id: "exported",
    title: "Exported Activity (Vulnerable)",
    sender: "com.malware.app",
    intent: "Intent { cmp=com.bank.app/.AdminActivity }",
    data: "action=delete_all_users",
    vulnerable: true,
    explanation: "An activity with android:exported=true can be launched by any app. If AdminActivity doesn't check calling package, malware can trigger admin functions directly.",
  },
];

export default function IntentRouterTool() {
  const [selectedCase, setSelectedCase] = useState<IntentCase>(CASES[0]);
  const [simulateIntercept, setSimulateIntercept] = useState(false);

  return (
    <ToolShell title="Intent Router Simulator" description="Explore Android intent routing. See how deep links and implicit intents can be hijacked.">
      <div className="space-y-4">
        {/* Case selector */}
        <div className="flex flex-wrap gap-2">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCase(c); setSimulateIntercept(false); }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${selectedCase.id === c.id ? "bg-slate-800 text-white" : "bg-elevated text-secondary hover:bg-strong"}`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Intent flow */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-y-4 gap-x-3 items-start text-sm">
          {/* Sender */}
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
            <p className="font-medium text-blue-800 text-xs">{selectedCase.sender}</p>
            <p className="text-xs text-blue-600 mt-1">Sending intent...</p>
            <pre className="mt-1 p-1.5 rounded text-xs font-mono bg-blue-100 text-blue-700 break-all whitespace-pre-wrap">{selectedCase.intent}</pre>
            <p className="text-xs text-blue-500 mt-1">Data: {selectedCase.data}</p>
          </div>

          {/* Intercept */}
          <div className="flex flex-col items-center justify-center pt-8">
            {simulateIntercept && selectedCase.vulnerable ? (
              <div className="text-center">
                <p className="text-xs text-red-500 mb-1">✋ Intercepted</p>
                <p className="text-xs text-red-400">by malware.app</p>
              </div>
            ) : (
              <p className="text-xs text-slate-300">→</p>
            )}
          </div>

          {/* Receiver */}
          <div className={`p-3 rounded-lg border ${selectedCase.vulnerable && simulateIntercept ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
            <p className={`font-medium text-xs ${selectedCase.vulnerable && simulateIntercept ? "text-red-800" : "text-emerald-800"}`}>
              {selectedCase.vulnerable && simulateIntercept ? "com.malware.app ⚠️" : "com.bank.app ✅"}
            </p>
            <p className="text-xs mt-1">
              {selectedCase.vulnerable && simulateIntercept
                ? "Malicious app received the intent! Attacker can read the data and forward modified parameters to the real app."
                : "Legitimate app received the intent. Data processed securely."}
            </p>
          </div>
        </div>

        {/* Simulate intercept */}
        {selectedCase.vulnerable && (
          <button
            onClick={() => setSimulateIntercept(!simulateIntercept)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${simulateIntercept ? "bg-elevated text-secondary hover:bg-strong" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {simulateIntercept ? "Reset" : "Simulate Malicious Intercept"}
          </button>
        )}

        {/* Explanation */}
        <div className={`p-4 rounded-lg border text-sm ${selectedCase.vulnerable ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
          <p className="font-medium text-xs mb-1">{selectedCase.vulnerable ? "⚠️ Vulnerability" : "✅ Secure Pattern"}</p>
          <p className="text-xs">{selectedCase.explanation}</p>
        </div>

        {/* Best practices */}
        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm">
          <p className="font-medium text-secondary mb-1 text-xs">Intent Security Best Practices</p>
          <ul className="text-xs space-y-1 list-disc list-inside text-secondary">
            <li>Use explicit intents whenever possible — specify the target component</li>
            <li>Set android:exported=false for components that don't need external access</li>
            <li>Validate all deep link parameters — never trust data from external intents</li>
            <li>Use signature-level permissions for inter-app communication</li>
            <li>Implement intent filters with custom permissions for sensitive actions</li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
