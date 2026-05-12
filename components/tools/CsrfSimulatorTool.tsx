"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

type SameSiteValue = "none" | "lax" | "strict";

const SCENARIOS = [
  {
    label: "Transfer money",
    method: "POST",
    endpoint: "/api/transfer",
    params: "to=attacker&amount=5000",
    victimAction: "Alice visits evil.com — a hidden form submits",
  },
  {
    label: "Change email",
    method: "POST",
    endpoint: "/api/change-email",
    params: "email=attacker@evil.com",
    victimAction: "Alice clicks a link — a form auto-submits",
  },
  {
    label: "Delete account",
    method: "POST",
    endpoint: "/api/delete-account",
    params: "confirm=true",
    victimAction: "Alice views a forum post with an embedded form",
  },
];

export default function CsrfSimulatorTool() {
  const [sameSite, setSameSite] = useState<SameSiteValue>("none");
  const [hasToken, setHasToken] = useState(false);
  const [hasOriginCheck, setHasOriginCheck] = useState(false);
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [requestResult, setRequestResult] = useState<string | null>(null);

  // Simulate whether CSRF succeeds based on defenses
  function simulateRequest() {
    let blocked = false;
    let reason = "";

    // Anti-CSRF token check
    if (hasToken) {
      blocked = true;
      reason = "Anti-CSRF token missing from request. Server rejected the action.";
    }

    // Origin/Referer check
    if (!blocked && hasOriginCheck) {
      blocked = true;
      reason = `Origin header shows "https://evil.com" — not allowed. Server rejected the request.`;
    }

    // SameSite cookie check
    if (!blocked) {
      if (sameSite === "strict") {
        blocked = true;
        reason =
          "SameSite=Strict — cookies are not sent on ANY cross-site request, including POST. Request arrived without session cookie. Action blocked.";
      } else if (sameSite === "lax") {
        if (scenario.method === "POST") {
          blocked = true;
          reason =
            "SameSite=Lax — cookies are NOT sent on cross-site POST requests. The attacker's form submits via POST — browser refuses to attach cookies. Action blocked.";
        } else {
          reason =
            "SameSite=Lax allows GET on top-level navigation. If this were a GET-based CSRF (which is bad practice anyway), it might succeed. Use POST for state changes.";
        }
      } else {
        blocked = false;
        reason =
          "SameSite=None — cookies are sent on ALL cross-site requests. The attacker's forged request arrives with your session cookie. The bank sees a valid, authenticated request.";
      }
    }

    // Check for specific defense bypass scenarios
    if (!blocked) {
      reason +=
        "\n\n⚠️ The forged request succeeded. The server processed the action as if you intended it. This is CSRF.";
    } else {
      reason +=
        "\n\n✅ The forged request was blocked. The CSRF defense prevented the unauthorized action.";
    }

    setRequestResult(reason);
  }

  return (
    <ToolShell
      title="CSRF Simulator"
      description="Configure defenses and see whether a forged cross-site request succeeds. Toggle SameSite, anti-CSRF tokens, and origin checks."
    >
      <div className="space-y-5">
        {/* Scenario */}
        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-medium text-secondary mb-2">
            Attack Scenario
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setScenario(s);
                  setRequestResult(null);
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  scenario.label === s.label
                    ? "bg-slate-800 text-white"
                    : "bg-surface-2 border border-subtle text-secondary hover:bg-elevated"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-secondary space-y-1">
            <p>
              <strong>Method:</strong> {scenario.method}{" "}
              <strong className="ml-3">Endpoint:</strong>{" "}
              <code className="text-xs bg-strong px-1 rounded">
                {scenario.endpoint}
              </code>
            </p>
            <p>
              <strong>Parameters:</strong>{" "}
              <code className="text-xs bg-strong px-1 rounded">
                {scenario.params}
              </code>
            </p>
            <p className="text-slate-500 text-xs mt-1 italic">
              {scenario.victimAction}
            </p>
          </div>
        </div>

        {/* Victim & Attacker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Victim's browser */}
          <div className="p-4 rounded-lg border border-info-subtle bg-info-subtle">
            <p className="text-sm font-semibold text-info mb-2">
              Alice's Browser
            </p>
            <p className="text-xs text-info">
              Logged into bank.com
            </p>
            <p className="text-xs text-info mt-1 font-mono">
              Cookie: session=abc123; SameSite={sameSite}
            </p>
            <div className="mt-3 pt-3 border-t border-info-subtle text-xs text-info">
              <p>Visiting: evil.com</p>
              <p className="font-mono mt-1 text-info">
                &lt;form action=&quot;https://bank.com{scenario.endpoint}&quot; method=&quot;{scenario.method}&quot;&gt;
              </p>
              <p className="font-mono text-info">
                &lt;input name=&quot;...&quot; value=&quot;...&quot; /&gt;
              </p>
              <p className="font-mono text-info">&lt;/form&gt;</p>
            </div>
          </div>

          {/* Attacker's site */}
          <div className="p-4 rounded-lg border border-danger-subtle bg-danger-subtle">
            <p className="text-sm font-semibold text-danger mb-2">
              Attacker's Site (evil.com)
            </p>
            <div className="text-xs text-danger space-y-1">
              <p>Hidden form auto-submits to bank.com</p>
              <p className="mt-1">
                {hasToken
                  ? "❌ Cannot include anti-CSRF token — blocked by Same-Origin Policy"
                  : "✅ No anti-CSRF token needed"}
              </p>
              <p>
                {hasOriginCheck
                  ? "❌ Origin header will reveal evil.com"
                  : "✅ No origin check in place"}
              </p>
              <p>
                {sameSite === "none"
                  ? "✅ Cookies will be attached"
                  : sameSite === "lax"
                  ? "⚠️ Cookies attached only on GET"
                  : "❌ Cookies never attached"}
              </p>
            </div>
          </div>
        </div>

        {/* Defenses panel */}
        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-medium text-secondary mb-3">
            CSRF Defenses (toggle to see effect)
          </p>
          <div className="space-y-3">
            {/* SameSite */}
            <div>
              <label className="text-xs font-medium text-secondary block mb-1">
                SameSite Cookie Policy
              </label>
              <div className="flex gap-1 bg-elevated p-1 rounded-lg w-fit">
                {(["none", "lax", "strict"] as SameSiteValue[]).map(
                  (val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setSameSite(val);
                        setRequestResult(null);
                      }}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors capitalize ${
                        sameSite === val
                          ? "bg-surface-2 text-secondary shadow-sm"
                          : "text-slate-500 hover:text-secondary"
                      }`}
                    >
                      {val}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Anti-CSRF token */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasToken}
                onChange={(e) => {
                  setHasToken(e.target.checked);
                  setRequestResult(null);
                }}
                className="rounded border-subtle text-info focus:ring-blue-500"
              />
              <span className="text-sm text-secondary">
                Anti-CSRF Token (server validates token in form)
              </span>
            </label>

            {/* Origin check */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasOriginCheck}
                onChange={(e) => {
                  setHasOriginCheck(e.target.checked);
                  setRequestResult(null);
                }}
                className="rounded border-subtle text-info focus:ring-blue-500"
              />
              <span className="text-sm text-secondary">
                Origin / Referer Validation (server checks request origin)
              </span>
            </label>
          </div>

          <button
            onClick={simulateRequest}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Simulate CSRF Attack
          </button>
        </div>

        {/* Result */}
        {requestResult && (
          <div
            className={`p-4 rounded-lg border text-sm ${
              requestResult.includes("succeeded")
                ? "bg-danger-subtle border-danger-subtle text-danger"
                : "bg-success-subtle border-success-subtle text-success"
            }`}
          >
            <p className="font-medium mb-1">
              {requestResult.includes("succeeded")
                ? "❌ CSRF Attack Succeeded"
                : "✅ CSRF Attack Blocked"}
            </p>
            <p className="whitespace-pre-line text-xs">{requestResult}</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
