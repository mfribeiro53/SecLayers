"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

const HANDSHAKE_STEPS = [
  { step: 1, title: "ClientHello", client: "Client sends: supported TLS versions, cipher suites, random number", server: "" },
  { step: 2, title: "ServerHello", client: "", server: "Server responds: chosen TLS version, chosen cipher suite, random number, session ID" },
  { step: 3, title: "Certificate", client: "", server: "Server sends its certificate chain. Client validates: issuer, expiry, domain match." },
  { step: 4, title: "Certificate Pinning Check", client: "Client checks: does the server's certificate (or public key) match the pinned value?", server: "" },
  { step: 5, title: "Key Exchange", client: "Client and server establish shared secret via ECDHE (Elliptic Curve Diffie-Hellman Ephemeral)", server: "" },
  { step: 6, title: "Finished", client: "Both sides send MAC of handshake. If they match, connection is secure.", server: "" },
];

export default function TLSVisualizerTool() {
  const [step, setStep] = useState(1);
  const [pinningEnabled, setPinningEnabled] = useState(true);
  const [mitmActive, setMitmActive] = useState(false);

  const current = HANDSHAKE_STEPS[step - 1];
  const pinningFailed = step === 4 && !pinningEnabled && mitmActive;

  return (
    <ToolShell title="TLS Handshake Visualizer" description="Step through the TLS 1.3 handshake. Toggle certificate pinning and MITM to see the effect.">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(Math.max(1, step - 1))} className="px-2 py-1 text-xs rounded bg-elevated hover:bg-strong">←</button>
            <span className="text-sm font-medium text-secondary">Step {step}/6</span>
            <button onClick={() => setStep(Math.min(6, step + 1))} className="px-2 py-1 text-xs rounded bg-elevated hover:bg-strong">→</button>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={pinningEnabled} onChange={(e) => setPinningEnabled(e.target.checked)} className="rounded" />
            <span className="text-secondary">Cert Pinning</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={mitmActive} onChange={(e) => setMitmActive(e.target.checked)} className="rounded" />
            <span className="text-red-500">MITM Proxy</span>
          </label>
        </div>

        {/* Handshake visualization */}
        <div className="grid grid-cols-[auto_1fr_auto] gap-y-2 gap-x-3 items-start text-xs">
          <div className="text-slate-400 font-medium text-right">Client</div>
          <div />
          <div className="text-slate-400 font-medium">Server</div>
          {HANDSHAKE_STEPS.map((s) => (
            <div key={s.step} className="contents">
              <div className={`p-2 rounded-lg border text-right ${s.step === step ? "border-blue-300 bg-info-subtle" : "border-transparent bg-transparent"}`}>
                {s.client && <span className={s.step === step ? "text-secondary" : "text-slate-400"}>{s.client}</span>}
              </div>
              <div className="flex items-center justify-center">
                {s.client && s.server ? "⇄" : s.client ? "→" : "←"}
              </div>
              <div className={`p-2 rounded-lg border ${s.step === step ? "border-blue-300 bg-info-subtle" : "border-transparent bg-transparent"}`}>
                {s.server && <span className={s.step === step ? "text-secondary" : "text-slate-400"}>{s.server}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Current step detail */}
        <div className="p-4 rounded-lg border border-info-subtle bg-info-subtle">
          <p className="text-sm font-semibold text-info">Step {step}: {current.title}</p>
          <p className="text-xs text-info mt-1">{current.client || current.server}</p>
        </div>

        {/* Pinning / MITM result */}
        {step >= 4 && mitmActive && (
          <div className={`p-4 rounded-lg border ${pinningEnabled ? "bg-success-subtle border-success-subtle" : "bg-danger-subtle border-danger-subtle"}`}>
            <p className="text-sm font-semibold">{pinningEnabled ? "✅ Connection secure" : "❌ MITM attack successful"}</p>
            <p className="text-xs mt-1">
              {pinningEnabled
                ? "Certificate pinning detected the MITM proxy's fake certificate doesn't match the pinned value. Connection terminated."
                : "Without certificate pinning, the app trusts the MITM proxy's certificate (signed by a system CA). The attacker can decrypt all traffic."}
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm text-secondary">
          <p className="font-medium text-secondary mb-1">Mobile TLS Best Practices</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Use certificate pinning for all backend connections</li>
            <li>Pin the public key (not the cert) to survive cert rotation</li>
            <li>Use TLS 1.3 — forward secrecy by default</li>
            <li>Never disable TLS verification (even in development)</li>
            <li>Use Network Security Config (Android) / App Transport Security (iOS)</li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
