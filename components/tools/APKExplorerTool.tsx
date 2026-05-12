"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface ApkComponent {
  name: string;
  path: string;
  description: string;
  riskNote?: string;
}

const APK_STRUCTURE: ApkComponent[] = [
  { name: "AndroidManifest.xml", path: "/", description: "App configuration: permissions, components, SDK versions. Binary XML — must decode with AAPT or apktool.", riskNote: "Check for: debuggable=true, allowBackup=true, exported components, excessive permissions" },
  { name: "classes.dex", path: "/", description: "Compiled Java/Kotlin bytecode. Can be decompiled to source code with jadx or CFR.", riskNote: "Decompilation reveals: hardcoded keys, API endpoints, encryption logic, auth bypass code" },
  { name: "resources.arsc", path: "/", description: "Compiled resources (strings, layouts, colors). Contains all string values.", riskNote: "Check strings.xml inside for: API keys, OAuth client secrets, internal URLs, debug flags" },
  { name: "META-INF/", path: "/META-INF/", description: "APK signature files: MANIFEST.MF, CERT.SF, CERT.RSA. Verifies APK integrity.", riskNote: "V1 (JAR) signing is weak. Use V2/V3 (APK Signature Scheme) for stronger integrity" },
  { name: "res/", path: "/res/", description: "App resources: layouts, drawables, raw files. Check for embedded certificates and test data.", riskNote: "Look for: .p12/.pfx certificate files in res/raw/, test credentials in XML configs" },
  { name: "lib/", path: "/lib/", description: "Native libraries (.so files) for different CPU architectures.", riskNote: "Native code may contain: embedded secrets, custom crypto, vulnerable C/C++ code (buffer overflows)" },
  { name: "assets/", path: "/assets/", description: "Raw asset files bundled with the app. Often contains config files and embedded data.", riskNote: "Common findings: hardcoded AWS credentials, Firebase configs with secrets, SQLite databases" },
];

const VULNERABLE_FINDINGS = [
  { finding: "debuggable=true in AndroidManifest.xml", severity: "High", impact: "Any developer tool can attach a debugger and inspect runtime state" },
  { finding: "Hardcoded API key in strings.xml", severity: "Critical", impact: "sk_live_abc123 found in decompiled resources — full API access" },
  { finding: "Exportable ContentProvider without permissions", severity: "High", impact: "Any app on the device can query this provider and read app data" },
  { finding: "Certificate file in res/raw/cert.p12", severity: "Critical", impact: "Client certificate for mutual TLS — attacker can impersonate the app" },
  { finding: "allowBackup=true (default)", severity: "Medium", impact: "App data can be extracted via adb backup, even on non-rooted devices" },
  { finding: "V1 (JAR) signing only — no APK Signature Scheme v2/v3", severity: "Medium", impact: "APK can be modified and re-signed without detection" },
];

export default function APKExplorerTool() {
  const [selected, setSelected] = useState<ApkComponent>(APK_STRUCTURE[0]);
  const [showFindings, setShowFindings] = useState(false);

  return (
    <ToolShell title="APK Structure Explorer" description="Explore the structure of an Android APK. See what reversible engineering reveals about app security.">
      <div className="space-y-4">
        {/* APK tree */}
        <div className="border border-subtle rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-800 text-white text-sm font-mono">
            📦 app-release.apk
          </div>
          {APK_STRUCTURE.map((comp) => (
            <button
              key={comp.name}
              onClick={() => setSelected(comp)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 border-b border-subtle hover:bg-surface-2 transition-colors text-sm ${
                selected.name === comp.name ? "bg-info-subtle border-l-2 border-l-blue-500" : ""
              }`}
            >
              <span>📄</span>
              <span className="text-secondary font-mono text-xs">{comp.name}</span>
            </button>
          ))}
        </div>

        {/* Component detail */}
        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-semibold text-secondary">{selected.name}</p>
          <p className="text-xs text-secondary mt-1">{selected.description}</p>
          {selected.riskNote && (
            <div className="mt-2 p-2 rounded bg-warning-subtle border border-warning-subtle text-xs text-warning">
              ⚠️ {selected.riskNote}
            </div>
          )}
        </div>

        {/* Findings */}
        <button
          onClick={() => setShowFindings(!showFindings)}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
        >
          {showFindings ? "Hide" : "Show"} Security Findings ({VULNERABLE_FINDINGS.length})
        </button>

        {showFindings && (
          <div className="space-y-2">
            {VULNERABLE_FINDINGS.map((f, i) => (
              <div key={i} className="p-3 rounded-lg border border-danger-subtle bg-danger-subtle">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-danger">{f.finding}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-danger-muted text-danger font-bold">{f.severity}</span>
                </div>
                <p className="text-xs text-danger mt-1">{f.impact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
