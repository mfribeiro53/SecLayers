"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

type EncodeContext = "html" | "attr" | "js" | "css" | "url";

interface ContextInfo {
  label: string;
  example: string;
  description: string;
}

const CONTEXTS: Record<EncodeContext, ContextInfo> = {
  html: {
    label: "HTML Body",
    example: "<div>DATA</div>",
    description:
      "Encodes: < → &lt;, > → &gt;, & → &amp;, \" → &quot;, ' → &#039;. Use textContent in the DOM.",
  },
  attr: {
    label: "HTML Attribute",
    example: '<input value="DATA">',
    description:
      "Same as HTML, plus always quote attributes. Never write unquoted attributes with user data.",
  },
  js: {
    label: "JavaScript String",
    example: "var x = 'DATA'",
    description:
      "Escape: ' → \\x27, \\ → \\\\, newline → \\n. Use JSON.stringify() for safe JS embedding.",
  },
  css: {
    label: "CSS",
    example: "body { color: DATA }",
    description:
      "CSS encoding is complex. Avoid inserting user data into CSS. Use CSS custom properties with safe values instead.",
  },
  url: {
    label: "URL Parameter",
    example: "/search?q=DATA",
    description:
      "Use encodeURIComponent(). Validates protocol — rejects javascript: URLs.",
  },
};

function encodeForContext(input: string, context: EncodeContext): string {
  switch (context) {
    case "html":
    case "attr":
      return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    case "js":
      return input
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\x27")
        .replace(/"/g, "\\x22")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    case "css":
      // Simplified CSS encoding — in practice, avoid user data in CSS
      return input.replace(/[<>"'&]/g, "");
    case "url":
      return encodeURIComponent(input);
  }
}

const DANGEROUS_INPUTS = [
  {
    label: "Script tag",
    input: '<script>alert(1)</script>',
    explanation: "Classic XSS probe. Neutralized in all contexts.",
  },
  {
    label: "Img onerror",
    input: '<img src=x onerror=alert(1)>',
    explanation: "No script tag needed. HTML/attr encoding stops it.",
  },
  {
    label: "Attribute break",
    input: '" onclick="alert(1)',
    explanation:
      "Breaks out of an HTML attribute. Quoting + encoding stops it.",
  },
  {
    label: "JS string break",
    input: "'; alert(1); //",
    explanation: "Breaks out of a JavaScript string. JS encoding stops it.",
  },
  {
    label: "SQL probe",
    input: "' OR '1'='1",
    explanation:
      "SQL probe string. URL encoding makes it safe for URLs. For SQL, use parameterized queries instead.",
  },
];

export default function EncodingSandboxTool() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState<EncodeContext>("html");
  const [scenarioLabel, setScenarioLabel] = useState("");

  const encoded = input ? encodeForContext(input, context) : "";

  return (
    <ToolShell
      title="Output Encoding Sandbox"
      description="Type input and see how it's safely encoded for different output contexts."
    >
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Untrusted Input
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setScenarioLabel("");
            }}
            placeholder='Try: <script>alert(1)</script>'
            className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dangerous inputs */}
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Try these dangerous inputs:
          </p>
          <div className="flex flex-wrap gap-2">
            {DANGEROUS_INPUTS.map((d) => (
              <button
                key={d.label}
                onClick={() => {
                  setInput(d.input);
                  setScenarioLabel(d.label);
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  scenarioLabel === d.label
                    ? "bg-slate-800 text-white"
                    : "bg-elevated text-secondary hover:bg-strong"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {scenarioLabel && (
            <p className="mt-2 text-xs text-slate-500 italic">
              {
                DANGEROUS_INPUTS.find((d) => d.label === scenarioLabel)
                  ?.explanation
              }
            </p>
          )}
        </div>

        {/* Context selector */}
        <div>
          <p className="text-sm font-medium text-secondary mb-2">
            Output Context:
          </p>
          <div className="flex flex-wrap gap-1 bg-elevated p-1 rounded-lg w-fit">
            {(Object.keys(CONTEXTS) as EncodeContext[]).map((ctx) => (
              <button
                key={ctx}
                onClick={() => setContext(ctx)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  context === ctx
                    ? "bg-surface-2 text-secondary shadow-sm"
                    : "text-slate-500 hover:text-secondary"
                }`}
              >
                {CONTEXTS[ctx].label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{CONTEXTS[context].description}</p>
        </div>

        {/* Raw vs Encoded comparison */}
        {input && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">
                ⚠️ Raw (Dangerous)
              </p>
              <pre className="p-3 rounded-md text-xs font-mono bg-red-50 text-red-800 border border-red-200 overflow-x-auto whitespace-pre-wrap">
                {input}
              </pre>
              <p className="text-xs text-slate-400 mt-1">
                If inserted directly into {CONTEXTS[context].label}, this could
                execute.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">
                ✅ Encoded (Safe)
              </p>
              <pre className="p-3 rounded-md text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 overflow-x-auto whitespace-pre-wrap">
                {encoded}
              </pre>
              <p className="text-xs text-slate-400 mt-1">
                Safe for {CONTEXTS[context].label} context. Characters that
                could break the context are neutralized.
              </p>
            </div>
          </div>
        )}

        {/* Context example */}
        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm">
          <p className="font-medium text-secondary mb-1">Usage Example</p>
          <code className="text-xs text-secondary break-all">
            {CONTEXTS[context].example.replace("DATA", encoded || "(encoded input)")}
          </code>
        </div>
      </div>
    </ToolShell>
  );
}
