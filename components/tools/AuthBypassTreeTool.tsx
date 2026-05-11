"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface TreeNode {
  id: string;
  question: string;
  yes?: string;
  no?: string;
  result?: "secure" | "vulnerable";
}

const TREE: Record<string, TreeNode> = {
  start: {
    id: "start",
    question: "Is biometric authentication (fingerprint/face) enabled?",
    yes: "os_version",
    no: "no_biometric",
  },
  os_version: {
    id: "os_version",
    question: "Is the device running Android 9+ (API 28+) with BiometricPrompt or iOS 11+ with LocalAuthentication?",
    yes: "fallback",
    no: "old_api",
  },
  fallback: {
    id: "fallback",
    question: "Does the app allow fallback to device PIN/pattern/password after failed biometric?",
    yes: "weak_fallback",
    no: "crypto_bound",
  },
  crypto_bound: {
    id: "crypto_bound",
    question: "Is the biometric authentication cryptographically bound to a key (Android Keystore / iOS Secure Enclave)?",
    yes: "secure",
    no: "bypassable",
  },
  weak_fallback: {
    id: "weak_fallback",
    question: "Is there a limit on PIN/pattern attempts before requiring biometric again?",
    yes: "secure",
    no: "brute_pin",
  },
  old_api: {
    id: "old_api",
    question: "Is the app using the deprecated FingerprintManager API (Android < 9)?",
    yes: "old_api_vuln",
    no: "secure",
  },
};

const RESULTS: Record<string, { label: string; text: string; color: string }> = {
  secure: {
    label: "✅ Secure",
    text: "Biometric authentication is properly implemented with crypto binding and no weak fallback. The biometric is bound to a key in secure hardware — bypass requires physical access and the user's biometric.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  no_biometric: {
    label: "⚠️ No Biometric",
    text: "The app doesn't use biometric authentication. While not a vulnerability, biometrics provide phishing-resistant authentication that passwords alone cannot. Consider adding biometric support for sensitive operations.",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
  old_api_vuln: {
    label: "❌ Vulnerable",
    text: "FingerprintManager API (deprecated) does not enforce a secure lock screen — a device with no lock screen but enrolled fingerprints will authenticate any finger. Attackers can also bypass via root access to the fingerprint sensor driver.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  bypassable: {
    label: "❌ Vulnerable",
    text: "Without cryptographic binding, the biometric result is just a boolean flag. An attacker with root access can hook the method and return 'true' — bypassing biometric entirely. Always bind authentication to a Keystore/Enclave key operation.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  brute_pin: {
    label: "❌ Vulnerable",
    text: "Unlimited PIN attempts after biometric failure means an attacker can brute-force the device PIN (typically 4-6 digits) while the owner is unconscious. Limit fallback attempts to 3-5 before requiring biometric again or locking the app.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
};

export default function AuthBypassTreeTool() {
  const [currentNode, setCurrentNode] = useState("start");
  const [path, setPath] = useState<string[]>(["start"]);

  const node = TREE[currentNode];
  const result = node.result ? RESULTS[node.result] : null;

  const answer = (answer: "yes" | "no") => {
    const next = answer === "yes" ? node.yes : node.no;
    if (next) {
      setCurrentNode(next);
      setPath((p) => [...p, next]);
    }
  };

  return (
    <ToolShell title="Biometric Auth Bypass Decision Tree" description="Walk through the decision points that determine whether biometric authentication is secure.">
      <div className="space-y-4">
        {/* Path breadcrumb */}
        <div className="flex flex-wrap gap-1 text-xs">
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300">→</span>}
              <button onClick={() => { setCurrentNode(p); setPath(path.slice(0, i + 1)); }} className={`px-2 py-0.5 rounded ${p === currentNode ? "bg-blue-100 text-blue-700 font-medium" : "text-slate-400 hover:text-slate-600"}`}>
                {TREE[p]?.id || "start"}
              </button>
            </span>
          ))}
        </div>

        {/* Current question */}
        {!result && (
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm font-medium text-blue-800 mb-3">{node.question}</p>
            <div className="flex gap-2">
              {node.yes && (
                <button onClick={() => answer("yes")} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">Yes</button>
              )}
              {node.no && (
                <button onClick={() => answer("no")} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">No</button>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${result.color}`}>
            <p className="text-sm font-semibold">{result.label}</p>
            <p className="text-xs mt-1">{result.text}</p>
            <button onClick={() => { setCurrentNode("start"); setPath(["start"]); }} className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">Restart</button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
