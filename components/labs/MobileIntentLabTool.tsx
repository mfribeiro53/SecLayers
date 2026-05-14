"use client";

import { useState } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const AUTH_CODE = "SECLAYER{1nt3nt_h1j4ck_0auth_c0d3}";

const HINTS = [
  "BankApp uses a custom URL scheme bankapp:// for the OAuth redirect URI. Any installed app can register the same scheme.",
  "Install the malicious app — it registers bankapp:// in its manifest. Now two apps claim the same scheme.",
  "Trigger the OAuth flow. When the server redirects to bankapp://oauth/callback?code=..., the OS must choose which app handles it. With your malicious app installed, it wins the race.",
];

const LEGIT_MANIFEST = `<!-- BankApp AndroidManifest.xml -->
<activity android:name=".OAuthCallbackActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="bankapp" android:host="oauth"/>
  </intent-filter>
</activity>`;

const MALICIOUS_MANIFEST = `<!-- MaliciousApp AndroidManifest.xml -->
<activity android:name=".InterceptActivity">
  <intent-filter>
    <!-- Same scheme as BankApp — OS has no way to distinguish -->
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="bankapp" android:host="oauth"/>
  </intent-filter>
</activity>`;

type Phase = "start" | "malicious-installed" | "oauth-triggered" | "hijacked";

export function MobileIntentLabTool() {
  const [phase, setPhase] = useState<Phase>("start");
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  function installMalicious() {
    setPhase("malicious-installed");
  }

  function triggerOAuth() {
    setPhase("oauth-triggered");
    setTimeout(() => {
      setPhase("hijacked");
      setSolved(true);
    }, 1200);
  }

  const installedApps = [
    { name: "BankApp", pkg: "com.example.bankapp", scheme: "bankapp://", icon: "🏦", legit: true },
    ...(phase !== "start"
      ? [{ name: "MaliciousApp", pkg: "com.attacker.steal", scheme: "bankapp://", icon: "☠️", legit: false }]
      : []),
  ];

  return (
    <div className="tool-surface space-y-5">
      {/* Scenario */}
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          BankApp uses <code style={{ color: "#a5b4fc" }}>bankapp://oauth/callback</code> as its
          OAuth redirect URI. You've published a malicious app to the Play Store. Install it and
          steal the OAuth authorization code when the victim logs in.
        </p>
      </div>

      {/* Manifests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-mono mb-2" style={{ color: "#6ee7b7" }}>LEGITIMATE APP</p>
          <pre className="text-xs overflow-x-auto leading-relaxed" style={{ color: "#a5b4fc" }}>
            {LEGIT_MANIFEST}
          </pre>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${phase !== "start" ? "rgba(252,165,165,0.4)" : "var(--border-subtle)"}`,
          }}
        >
          <p className="text-xs font-mono mb-2" style={{ color: "#fca5a5" }}>MALICIOUS APP</p>
          <pre className="text-xs overflow-x-auto leading-relaxed" style={{ color: "#c4b5fd" }}>
            {MALICIOUS_MANIFEST}
          </pre>
        </div>
      </div>

      {/* Device state */}
      <div
        className="p-4 rounded-lg space-y-3"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Installed apps — bankapp:// scheme handlers
        </p>
        <div className="space-y-2">
          {installedApps.map((app) => (
            <div
              key={app.pkg}
              className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                background: "var(--bg-elevated)",
                border: `1px solid ${app.legit ? "var(--border-subtle)" : "rgba(252,165,165,0.3)"}`,
              }}
            >
              <span className="text-lg">{app.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium" style={{ color: app.legit ? "var(--text-primary)" : "#fca5a5" }}>
                  {app.name}
                </div>
                <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{app.pkg}</div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded font-mono"
                style={{
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--border-subtle)",
                  color: "#a5b4fc",
                }}
              >
                {app.scheme}
              </span>
              {!app.legit && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(252,165,165,0.1)", color: "#fca5a5", border: "1px solid rgba(252,165,165,0.3)" }}>
                  conflict
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {phase === "start" && (
            <button
              onClick={installMalicious}
              className="px-3 py-1.5 text-xs rounded font-medium"
              style={{ background: "rgba(252,165,165,0.15)", color: "#fca5a5", border: "1px solid rgba(252,165,165,0.3)" }}
            >
              Install MaliciousApp →
            </button>
          )}
          {phase === "malicious-installed" && (
            <button
              onClick={triggerOAuth}
              className="px-3 py-1.5 text-xs rounded font-medium"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Victim taps "Login with BankID" →
            </button>
          )}
          {phase === "oauth-triggered" && (
            <span className="text-xs px-3 py-1.5" style={{ color: "var(--text-muted)" }}>
              OAuth flow in progress...
            </span>
          )}
        </div>
      </div>

      {/* OAuth flow log */}
      {phase !== "start" && (
        <div
          className="rounded-lg p-4 font-mono text-xs space-y-1"
          style={{ background: "#0a0d18", border: "1px solid var(--border-subtle)" }}
        >
          <div style={{ color: "var(--text-muted)" }}>// OAuth 2.0 flow log</div>
          <div style={{ color: "var(--text-secondary)" }}>
            1. App opens browser → GET https://id.bankid.com/authorize?client_id=bankapp
               &redirect_uri=bankapp%3A%2F%2Foauth%2Fcallback&response_type=code
          </div>
          {(phase === "oauth-triggered" || phase === "hijacked") && (
            <div style={{ color: "var(--text-secondary)" }}>
              2. User authenticates with BankID...
            </div>
          )}
          {phase === "hijacked" && (
            <>
              <div style={{ color: "#fcd34d" }}>
                3. BankID redirects → bankapp://oauth/callback?code={AUTH_CODE}
              </div>
              <div style={{ color: "#fca5a5" }}>
                4. OS resolves scheme — 2 handlers found for bankapp://
              </div>
              <div style={{ color: "#fca5a5" }}>
                4a. MaliciousApp (com.attacker.steal) wins intent resolution
              </div>
              <div style={{ color: "#fca5a5" }}>
                4b. BankApp.OAuthCallbackActivity — never called
              </div>
              <div style={{ color: "#6ee7b7" }}>
                5. MaliciousApp received code: {AUTH_CODE}
              </div>
              <div style={{ color: "#6ee7b7" }}>
                6. Exchanging code for access token at token endpoint...
              </div>
            </>
          )}
        </div>
      )}

      {phase === "hijacked" && (
        <div
          className="p-4 rounded-lg"
          style={{ background: "rgba(252,165,165,0.05)", border: "1px solid rgba(252,165,165,0.3)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "#fca5a5" }}>
            Fix: Use App Links instead of custom schemes
          </p>
          <pre className="text-xs overflow-x-auto leading-relaxed" style={{ color: "#86efac" }}>
{`<!-- Secure: App Links — only one app can own https://bankapp.example.com -->
<intent-filter android:autoVerify="true">
  <data android:scheme="https" android:host="bankapp.example.com"/>
</intent-filter>
<!-- + host https://bankapp.example.com/.well-known/assetlinks.json -->
<!-- Also: always use PKCE — even if code intercepted, unusable without verifier -->`}
          </pre>
        </div>
      )}

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={AUTH_CODE}
          explanation="Custom URL schemes are first-come-first-served on Android — any app can register bankapp:// and intercept OAuth callbacks. The authorization code arrived at MaliciousApp instead of BankApp. Fix: use Android App Links (https:// + assetlinks.json) so only the app that proves domain ownership can handle the callback. Additionally, always use PKCE — so even an intercepted code is useless without the code_verifier that never left the legitimate app."
        />
      )}
    </div>
  );
}
