"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{tru5t_4ll_c3rts_m1tm}";

const HINTS = [
  "The app's TrustManager has an empty checkServerTrusted() — it accepts any certificate, including an attacker's self-signed one. Enable the MitM proxy to intercept traffic.",
  "With the proxy active, trigger a login. The app sends credentials over 'encrypted' TLS — but since it trusts your certificate, you're the server from its perspective.",
  "Intercept the login request and read the Authorization header. That's the auth token the app thinks it sent securely to the bank.",
];

const VULN_CODE = `// Android — broken TrustManager
val trustAll = arrayOf<TrustManager>(object : X509TrustManager {
    override fun checkClientTrusted(chain: Array<X509Certificate>?, authType: String?) {}
    override fun checkServerTrusted(chain: Array<X509Certificate>?, authType: String?) {}
    // ↑ empty — accepts ANY certificate, including attacker's
    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
})
val sc = SSLContext.getInstance("TLS")
sc.init(null, trustAll, SecureRandom())
HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory())`;

type Step = "idle" | "proxy-on" | "login" | "intercepted";

interface RequestLine {
  text: string;
  highlight?: "red" | "green" | "yellow" | "muted";
}

function buildRequest(proxyOn: boolean): RequestLine[] {
  if (!proxyOn) {
    return [
      { text: "POST /api/v1/auth/login HTTP/1.1", highlight: "green" },
      { text: "Host: api.cryptobank.com" },
      { text: "Content-Type: application/json" },
      { text: "Authorization: Bearer sk_live_9xKm2p..." },
      { text: "" },
      { text: '{"username":"alice","action":"login"}' },
    ];
  }
  return [
    { text: "POST /api/v1/auth/login HTTP/1.1", highlight: "red" },
    { text: "Host: api.cryptobank.com" },
    { text: "Content-Type: application/json" },
    { text: `Authorization: Bearer ${FLAG}`, highlight: "yellow" },
    { text: "" },
    { text: '{"username":"alice","action":"login"}' },
    { text: "" },
    { text: "// ↑ Full token visible — MitM proxy decrypted 'TLS' traffic", highlight: "red" },
  ];
}

export function MobileTLSLabTool() {
  const [step, setStep] = useState<Step>("idle");
  const [proxyOn, setProxyOn] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function toggleProxy() {
    const next = !proxyOn;
    setProxyOn(next);
    setStep(next ? "proxy-on" : "idle");
  }

  function triggerLogin() {
    setStep("intercepted");
    if (proxyOn) setSolved(true);
  }

  const request = buildRequest(proxyOn && step === "intercepted");
  const showRequest = step === "intercepted";

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          CryptoBank's Android app disables certificate validation with a{" "}
          <code style={{ color: "#a5b4fc" }}>trustAllCerts</code> TrustManager. You're on the
          same Wi-Fi as the victim. Intercept their auth token.
        </p>
      </div>

      {/* Vulnerable code */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-2" style={{ color: "var(--text-muted)" }}>VULNERABLE CODE</p>
        <pre className="text-xs overflow-x-auto leading-relaxed" style={{ color: "#c4b5fd" }}>
          {VULN_CODE}
        </pre>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Proxy control */}
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Attacker — MitM Proxy
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleProxy}
              className="px-3 py-1.5 text-xs rounded font-medium transition-colors"
              style={{
                background: proxyOn ? "rgba(52,211,153,0.15)" : "var(--bg-elevated)",
                border: `1px solid ${proxyOn ? "rgba(52,211,153,0.4)" : "var(--border-subtle)"}`,
                color: proxyOn ? "#6ee7b7" : "var(--text-secondary)",
              }}
            >
              {proxyOn ? "● Proxy running" : "○ Start proxy"}
            </button>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {proxyOn
              ? "mitmproxy listening on :8080 — self-signed cert presented to clients."
              : "Proxy is off. App traffic goes directly to the real server."}
          </p>
          {proxyOn && (
            <div
              className="text-xs font-mono p-2 rounded space-y-0.5"
              style={{ background: "#0a0d18", color: "#6ee7b7" }}
            >
              <div>Proxy: 192.168.1.99:8080</div>
              <div style={{ color: "#fca5a5" }}>Cert: *.mitm.local (self-signed)</div>
              <div>Waiting for connections...</div>
            </div>
          )}
        </div>

        {/* App control */}
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Victim — CryptoBank App
          </p>
          <div
            className="text-xs p-3 rounded"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ color: "var(--text-muted)" }}>Wi-Fi: CoffeeShop_Guest</div>
            <div className="mt-1" style={{ color: "var(--text-secondary)" }}>
              {proxyOn ? (
                <span style={{ color: "#fca5a5" }}>Routed through attacker proxy</span>
              ) : (
                <span>Connected directly</span>
              )}
            </div>
          </div>
          <button
            onClick={triggerLogin}
            className="px-3 py-1.5 text-xs rounded font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Victim logs into app →
          </button>
        </div>
      </div>

      {/* Intercepted request */}
      {showRequest && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: `1px solid ${proxyOn ? "#fca5a5" : "var(--border-subtle)"}` }}
        >
          <div
            className="px-4 py-2 flex items-center gap-3 text-xs font-mono"
            style={{
              background: "var(--bg-elevated)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ color: proxyOn ? "#fca5a5" : "#6ee7b7" }}>
              {proxyOn ? "⚡ INTERCEPTED" : "✓ SECURE"}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {proxyOn ? "mitmproxy — decrypted request" : "TLS direct to api.cryptobank.com"}
            </span>
          </div>
          <div className="p-4 font-mono text-xs space-y-0.5" style={{ background: "#0a0d18" }}>
            {request.map((line, i) => (
              <div
                key={i}
                style={{
                  color:
                    line.highlight === "red"
                      ? "#fca5a5"
                      : line.highlight === "green"
                      ? "#6ee7b7"
                      : line.highlight === "yellow"
                      ? "#fcd34d"
                      : line.highlight === "muted"
                      ? "var(--text-muted)"
                      : "var(--text-secondary)",
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "intercepted" && !proxyOn && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Proxy was off — the request went directly to the real server. Enable the proxy first.
        </p>
      )}

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The app's empty checkServerTrusted() accepted the attacker's self-signed certificate as if it were the real bank's certificate. The 'encrypted' TLS channel was established with the attacker's proxy instead of the bank. Every byte — including the Bearer token — was visible in plaintext to the attacker. The fix: remove trustAllCerts entirely and add certificate pinning for the bank's API domain."
        />
      )}
    </div>
  );
}
