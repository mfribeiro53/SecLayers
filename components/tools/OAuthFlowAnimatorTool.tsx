"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  const challenge = btoa(
    String.fromCharCode(...Array.from(new Uint8Array(digest)))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { verifier, challenge };
}

function randomHex(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

interface Pkce {
  verifier: string;
  challenge: string;
  state: string;
  authCode: string;
}

function buildSteps(pkce: Pkce | null) {
  const v = pkce?.verifier ?? "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const c = pkce?.challenge ?? "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
  const state = pkce?.state ?? "abc123xyz";
  const code = pkce?.authCode ?? "SplxlOBeZQQYbYS6WxSbIA";

  return [
    {
      step: 1,
      title: "Generate PKCE values",
      description: "Client generates a cryptographically random code_verifier, then computes code_challenge = BASE64URL(SHA-256(code_verifier)).",
      code: `code_verifier  = "${v.slice(0, 20)}…" (${v.length} chars)
code_challenge = "${c.slice(0, 20)}…"
method         = S256`,
    },
    {
      step: 2,
      title: "Redirect to auth server",
      description: "Browser redirects to the /authorize endpoint with code_challenge and state (CSRF protection).",
      code: `GET /authorize?
  response_type=code
  &client_id=my-app
  &redirect_uri=https://app.example/callback
  &scope=openid+profile
  &state=${state}
  &code_challenge=${c.slice(0, 16)}…
  &code_challenge_method=S256`,
    },
    {
      step: 3,
      title: "User authenticates",
      description: "User logs in and grants the requested scopes. Auth server stores the code_challenge alongside the session.",
      code: `# Auth server stores:
session["code_challenge"] = "${c.slice(0, 16)}…"
session["state"]          = "${state}"`,
    },
    {
      step: 4,
      title: "Authorization code returned",
      description: "Auth server redirects back with a short-lived code. The state must match.",
      code: `HTTP 302 → https://app.example/callback?
  code=${code}
  &state=${state}`,
    },
    {
      step: 5,
      title: "Exchange code for tokens",
      description: "Client POSTs the code + original code_verifier. Server recomputes SHA-256 and verifies it matches the stored code_challenge. An intercepted code is worthless without the verifier.",
      code: `POST /token
  grant_type=authorization_code
  &code=${code}
  &redirect_uri=https://app.example/callback
  &client_id=my-app
  &code_verifier=${v.slice(0, 16)}…

# Server checks:
# BASE64URL(SHA-256(code_verifier)) == stored code_challenge?`,
    },
    {
      step: 6,
      title: "Access token received",
      description: "Client receives tokens. The access_token is used for API calls; the refresh_token for silent renewal.",
      code: `{
  "access_token":  "eyJhbGciOiJSUzI1NiJ9…",
  "token_type":    "Bearer",
  "expires_in":    3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA"
}`,
    },
  ];
}

export default function OAuthFlowAnimatorTool() {
  const [step, setStep] = useState(1);
  const [pkce, setPkce] = useState<Pkce | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const { verifier, challenge } = await generatePKCE();
    setPkce({
      verifier,
      challenge,
      state: randomHex(8),
      authCode: randomHex(12),
    });
    setStep(1);
    setGenerating(false);
  };

  const steps = buildSteps(pkce);
  const current = steps[step - 1];

  return (
    <ToolShell
      title="OAuth 2.0 Flow Animator"
      description="Step through the Authorization Code + PKCE flow. Generate real PKCE values computed with SHA-256."
    >
      <div className="space-y-4">
        {/* Generate button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : pkce ? "Re-generate PKCE" : "Generate real PKCE"}
          </button>
          {pkce && (
            <span className="text-[10px] text-emerald-500">
              Real values computed with crypto.subtle.digest
            </span>
          )}
        </div>

        {/* Step navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className="px-3 py-1.5 text-xs rounded bg-elevated hover:bg-strong"
          >
            ←
          </button>
          <span className="text-sm font-medium text-secondary">
            Step {step}/{steps.length}
          </span>
          <button
            onClick={() => setStep(Math.min(steps.length, step + 1))}
            className="px-3 py-1.5 text-xs rounded bg-elevated hover:bg-strong"
          >
            →
          </button>
        </div>

        {/* Step list */}
        {steps.map((s) => (
          <div
            key={s.step}
            onClick={() => setStep(s.step)}
            className={`p-3 rounded-lg border cursor-pointer transition-opacity ${
              s.step === step
                ? "border-blue-300 bg-blue-50 opacity-100"
                : "border-subtle bg-surface-2 opacity-40 hover:opacity-70"
            }`}
          >
            <p className="text-sm font-semibold text-secondary">
              {s.step}. {s.title}
            </p>
            {s.step === step && (
              <>
                <p className="text-xs text-secondary mt-1">{s.description}</p>
                <pre className="mt-2 p-2 bg-slate-900 text-slate-200 text-[10px] font-mono rounded overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {s.code}
                </pre>
              </>
            )}
          </div>
        ))}

        {step === 6 && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            Flow complete. PKCE ensures that even if the authorization code is
            intercepted, the attacker cannot exchange it without the original
            code_verifier — which never leaves the client.
          </div>
        )}
      </div>
    </ToolShell>
  );
}
