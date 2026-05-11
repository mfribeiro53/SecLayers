"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const STEPS = [
  { step: 1, title: "Generate PKCE", description: "Client creates code_verifier (random 43-128 chars) and code_challenge = SHA256(code_verifier)." },
  { step: 2, title: "Redirect to Auth Server", description: "Browser redirects to /authorize with client_id, redirect_uri, code_challenge, state, scope." },
  { step: 3, title: "User Authenticates", description: "User logs in and approves requested permissions (scopes)." },
  { step: 4, title: "Authorization Code", description: "Auth server redirects back with ?code=AUTH_CODE_XYZ&state=..." },
  { step: 5, title: "Exchange Code for Tokens", description: "Client POSTs code + code_verifier to /token. Server verifies SHA256(code_verifier) matches code_challenge." },
  { step: 6, title: "Access Token Received", description: "Client receives access_token + refresh_token. Uses access_token to call the resource API." },
];

export default function OAuthFlowAnimatorTool() {
  const [step, setStep] = useState(1);

  return (
    <ToolShell title="OAuth 2.0 Flow Animator" description="Step through the Authorization Code + PKCE flow. The standard for SPAs and mobile apps.">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep(Math.max(1, step - 1))} className="px-3 py-1.5 text-xs rounded bg-slate-100 hover:bg-slate-200">←</button>
          <span className="text-sm font-medium text-slate-700">Step {step}/{STEPS.length}</span>
          <button onClick={() => setStep(Math.min(STEPS.length, step + 1))} className="px-3 py-1.5 text-xs rounded bg-slate-100 hover:bg-slate-200">→</button>
        </div>
        {STEPS.map((s) => (
          <div key={s.step} className={`p-4 rounded-lg border transition-opacity ${s.step === step ? "border-blue-300 bg-blue-50 opacity-100" : "border-slate-200 bg-slate-50 opacity-50"}`}>
            <p className="text-sm font-semibold text-slate-800">{s.step}. {s.title}</p>
            <p className="text-xs text-slate-600 mt-1">{s.description}</p>
          </div>
        ))}
        {step === 6 && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            ✅ Flow complete. The client now has an access token. PKCE ensures that even if the authorization code is intercepted, the attacker cannot exchange it without the code_verifier.
          </div>
        )}
      </div>
    </ToolShell>
  );
}
