"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

function parseJWT(token: string): JwtParts | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = { header: parts[0], payload: parts[1], signature: parts[2] };
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload, signature: parts[2], raw };
  } catch {
    return null;
  }
}

function buildJWT(header: Record<string, unknown>, payload: Record<string, unknown>, signature: string): string {
  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(payload));
  return `${h}.${p}.${signature}`;
}

const SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWxpY2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxNTEwMDAwMCwiZXhwIjoxNzE1MTg2NDAwfQ.placeholder_signature";

const EXPLOITS = [
  {
    label: "Alg: none (no signature)",
    modify: (parsed: JwtParts): string => {
      const header = { ...parsed.header, alg: "none" };
      return buildJWT(header, parsed.payload, "");
    },
    explanation:
      "Change algorithm to 'none'. If the server accepts this, the token is accepted without any signature verification. Always whitelist allowed algorithms.",
  },
  {
    label: "Role escalation",
    modify: (parsed: JwtParts): string => {
      const payload = { ...parsed.payload, role: "admin" };
      return buildJWT(parsed.header, payload, parsed.signature);
    },
    explanation:
      "Change 'role' from 'user' to 'admin'. This only works if you have the signing key — but demonstrates why JWTs should be verified server-side and why roles should be checked from a trusted source, not the token.",
  },
  {
    label: "Remove expiry",
    modify: (parsed: JwtParts): string => {
      const payload = { ...parsed.payload };
      delete payload.exp;
      return buildJWT(parsed.header, payload, parsed.signature);
    },
    explanation:
      "Remove the 'exp' claim. Without expiry, a stolen token remains valid indefinitely. Always set short-lived tokens (15-60 min).",
  },
  {
    label: "Sub claim swap",
    modify: (parsed: JwtParts): string => {
      const payload = { ...parsed.payload, sub: "456" };
      return buildJWT(parsed.header, payload, parsed.signature);
    },
    explanation:
      "Change the 'sub' (subject) claim to impersonate another user. This highlights why JWTs must always be signature-verified — the server should reject tokens where signature doesn't match.",
  },
];

const SESSION_FIXATION_STEPS = [
  "1. Attacker visits the site and receives session cookie: session=EVIL123",
  "2. Attacker sends victim a link: https://app.example.com/login?sessionid=EVIL123",
  "3. Victim clicks the link, logs in with their credentials",
  "4. Server associates session EVIL123 with the victim's authenticated identity",
  "5. Attacker uses session EVIL123 and is now authenticated as the victim",
  "",
  "✅ Defense: Regenerate the session ID on login.",
  "   Old session is invalidated; new session ID is issued.",
  "   Attacker's EVIL123 is now an anonymous/unauthenticated session.",
];

export default function JWTEditorTool() {
  const [token, setToken] = useState(SAMPLE_TOKEN);
  const [parsed, setParsed] = useState<JwtParts | null>(() => parseJWT(SAMPLE_TOKEN));
  const [editMode, setEditMode] = useState<"view" | "edit-payload" | "edit-header">("view");
  const [editJson, setEditJson] = useState("");
  const [fixationStep, setFixationStep] = useState(0);
  const [message, setMessage] = useState("");

  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    const p = parseJWT(newToken);
    setParsed(p);
    if (!p) setMessage("Invalid JWT format. Must be header.payload.signature");
    else setMessage("");
  };

  const applyExploit = (exploit: (typeof EXPLOITS)[number]) => {
    if (!parsed) return;
    const newToken = exploit.modify(parsed);
    handleTokenChange(newToken);
    setMessage(`Applied: ${exploit.explanation}`);
  };

  const enterEditMode = (mode: "edit-payload" | "edit-header") => {
    if (!parsed) return;
    const data = mode === "edit-payload" ? parsed.payload : parsed.header;
    setEditJson(JSON.stringify(data, null, 2));
    setEditMode(mode);
  };

  const saveEdit = () => {
    if (!parsed) return;
    try {
      const newData = JSON.parse(editJson);
      const newHeader = editMode === "edit-header" ? newData : { ...parsed.header };
      const newPayload = editMode === "edit-payload" ? newData : { ...parsed.payload };
      const newToken = buildJWT(newHeader, newPayload, parsed.signature);
      handleTokenChange(newToken);
      setEditMode("view");
      setMessage("Token updated. Note: signature is unchanged — server will reject if it verifies signatures.");
    } catch {
      setMessage("Invalid JSON. Fix syntax errors before saving.");
    }
  };

  return (
    <ToolShell
      title="JWT Editor & Session Fixation Demo"
      description="Decode, modify, and understand JWTs. See session fixation attacks and defenses."
    >
      <div className="space-y-5">
        {/* JWT input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            JWT Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!parsed && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            {message || "Paste a JWT token to decode."}
          </div>
        )}

        {parsed && (
          <>
            {/* Decoded parts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Header */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-red-600">HEADER</p>
                  <button
                    onClick={() => enterEditMode("edit-header")}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">
                  {base64UrlDecode(parsed.raw.header)}
                </pre>
              </div>
              {/* Payload */}
              <div className="p-3 rounded-lg border border-slate-200 bg-purple-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-purple-600">PAYLOAD</p>
                  <button
                    onClick={() => enterEditMode("edit-payload")}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">
                  {base64UrlDecode(parsed.raw.payload)}
                </pre>
              </div>
              {/* Signature */}
              <div className="p-3 rounded-lg border border-slate-200 bg-blue-50">
                <p className="text-xs font-semibold text-blue-600 mb-1">SIGNATURE</p>
                <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap break-all">
                  {parsed.signature.substring(0, 32)}...
                </pre>
                <p className="text-xs text-slate-400 mt-1">
                  {parsed.header.alg === "HS256" ? "HMAC-SHA256" : String(parsed.header.alg || "unknown")}
                </p>
              </div>
            </div>

            {/* Edit modal-inline */}
            {editMode !== "view" && (
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Editing {editMode === "edit-payload" ? "Payload" : "Header"}
                </p>
                <textarea
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditMode("view")}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Exploits */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">
                Try these modifications:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPLOITS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => applyExploit(ex)}
                    className="px-3 py-1.5 text-xs rounded-md font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {message && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            {message}
          </div>
        )}

        {/* Session Fixation */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Session Fixation Attack
          </p>
          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-red-800">
                Step {fixationStep + 1} of {SESSION_FIXATION_STEPS.slice(0, 7).filter(s => s && !s.startsWith("✅")).length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setFixationStep(Math.max(0, fixationStep - 1))}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  ←
                </button>
                <button
                  onClick={() => setFixationStep(Math.min(SESSION_FIXATION_STEPS.length - 1, fixationStep + 1))}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  →
                </button>
              </div>
            </div>
            <p className="text-sm text-red-700 whitespace-pre-line">
              {SESSION_FIXATION_STEPS[fixationStep]}
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
