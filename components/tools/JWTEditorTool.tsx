"use client";

import { useState, useCallback } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function base64UrlToBytes(str: string): ArrayBuffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
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

async function hmacSign(header: Record<string, unknown>, payload: Record<string, unknown>, secret: string): Promise<string> {
  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const s = base64UrlEncode(String.fromCharCode(...Array.from(new Uint8Array(sig))));
  return `${h}.${p}.${s}`;
}

async function hmacVerify(token: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, sig] = parts;
  const data = `${h}.${p}`;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = base64UrlToBytes(sig);
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

const SAMPLE_SECRET = "your-256-bit-secret";

// A real HMAC-SHA256 signed sample token (signed with SAMPLE_SECRET above)
// header: {"alg":"HS256","typ":"JWT"} payload: {"sub":"123","name":"Alice","role":"user","iat":1715100000,"exp":1715186400}
const SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWxpY2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTcxNTEwMDAwMCwiZXhwIjoxNzE1MTg2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const EXPLOITS = [
  {
    label: "Alg: none",
    modify: (parsed: JwtParts): string => buildJWT({ ...parsed.header, alg: "none" }, parsed.payload, ""),
    explanation: "Sets algorithm to 'none' — signature is empty. Buggy servers that accept this are tricked into skipping verification entirely.",
  },
  {
    label: "Role → admin",
    modify: (parsed: JwtParts): string => buildJWT(parsed.header, { ...parsed.payload, role: "admin" }, parsed.signature),
    explanation: "Escalates role to admin while keeping the original signature. The server MUST re-verify the signature after decoding — if it doesn't, this bypasses authorization.",
  },
  {
    label: "Remove expiry",
    modify: (parsed: JwtParts): string => {
      const payload = { ...parsed.payload };
      delete payload.exp;
      return buildJWT(parsed.header, payload, parsed.signature);
    },
    explanation: "Removes 'exp' claim. Without expiry, the token is valid forever. A stolen token becomes permanently usable.",
  },
  {
    label: "Sub → 456",
    modify: (parsed: JwtParts): string => buildJWT(parsed.header, { ...parsed.payload, sub: "456" }, parsed.signature),
    explanation: "Changes the subject to impersonate user 456. Only works if the server skips signature verification.",
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
  const [secret, setSecret] = useState(SAMPLE_SECRET);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; msg: string } | null>(null);
  const [signing, setSigning] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleTokenChange = (newToken: string) => {
    setToken(newToken);
    const p = parseJWT(newToken);
    setParsed(p);
    setVerifyResult(null);
    if (!p) setMessage("Invalid JWT format. Must be header.payload.signature");
    else setMessage("");
  };

  const applyExploit = (exploit: (typeof EXPLOITS)[number]) => {
    if (!parsed) return;
    const newToken = exploit.modify(parsed);
    handleTokenChange(newToken);
    setMessage(exploit.explanation);
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
      handleTokenChange(buildJWT(newHeader, newPayload, parsed.signature));
      setEditMode("view");
      setMessage("Saved. Signature unchanged — verify to check if it still matches.");
    } catch {
      setMessage("Invalid JSON. Fix syntax errors before saving.");
    }
  };

  const signToken = useCallback(async () => {
    if (!parsed || !secret) return;
    setSigning(true);
    try {
      const signed = await hmacSign(parsed.header, parsed.payload, secret);
      handleTokenChange(signed);
      setMessage(`✅ Re-signed with your secret. The signature now matches the current header + payload.`);
    } catch (e) {
      setMessage(`Signing failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSigning(false);
    }
  }, [parsed, secret]);

  const verify = useCallback(async () => {
    if (!parsed || !secret) return;
    setVerifying(true);
    try {
      const alg = parsed.header.alg;
      if (alg === "none") {
        setVerifyResult({ valid: false, msg: "Algorithm is 'none' — no signature to verify. A server accepting this is critically vulnerable." });
        return;
      }
      if (alg !== "HS256") {
        setVerifyResult({ valid: false, msg: `Algorithm '${alg}' is not HS256. This tool only verifies HMAC-SHA256 signatures.` });
        return;
      }
      const valid = await hmacVerify(token, secret);
      if (valid) {
        setVerifyResult({ valid: true, msg: `✅ Signature is VALID. The token was signed with this secret and the payload has not been tampered with.` });
      } else {
        setVerifyResult({ valid: false, msg: `❌ Signature is INVALID. Either the secret is wrong, or the header/payload was modified after signing. The server should reject this token.` });
      }
    } catch (e) {
      setVerifyResult({ valid: false, msg: `Verification error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setVerifying(false);
    }
  }, [token, parsed, secret]);

  return (
    <ToolShell
      title="JWT Editor & Session Fixation Demo"
      description="Decode, modify, sign, and verify JWTs with real HMAC-SHA256. See session fixation attacks and defenses."
    >
      <div className="space-y-5">
        {/* JWT input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">JWT Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!parsed && (
          <div className="p-3 rounded-md bg-warning-subtle border border-warning-subtle text-warning text-sm">
            {message || "Paste a JWT token to decode."}
          </div>
        )}

        {parsed && (
          <>
            {/* Decoded parts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-subtle bg-surface-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-danger">HEADER</p>
                  <button onClick={() => enterEditMode("edit-header")} className="text-xs text-info hover:text-info">Edit</button>
                </div>
                <pre className="text-xs font-mono text-secondary whitespace-pre-wrap break-all">
                  {base64UrlDecode(parsed.raw.header)}
                </pre>
              </div>
              <div className="p-3 rounded-lg border border-subtle bg-purple-subtle">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-purple">PAYLOAD</p>
                  <button onClick={() => enterEditMode("edit-payload")} className="text-xs text-info hover:text-info">Edit</button>
                </div>
                <pre className="text-xs font-mono text-secondary whitespace-pre-wrap break-all">
                  {base64UrlDecode(parsed.raw.payload)}
                </pre>
              </div>
              <div className="p-3 rounded-lg border border-subtle bg-info-subtle">
                <p className="text-xs font-semibold text-info mb-1">SIGNATURE</p>
                <pre className="text-xs font-mono text-slate-500 whitespace-pre-wrap break-all">
                  {parsed.signature ? parsed.signature.substring(0, 32) + "..." : "(empty — alg:none)"}
                </pre>
                <p className="text-xs text-slate-400 mt-1">
                  {parsed.header.alg === "HS256" ? "HMAC-SHA256" : String(parsed.header.alg || "unknown")}
                </p>
              </div>
            </div>

            {/* Edit inline */}
            {editMode !== "view" && (
              <div className="p-4 rounded-lg border border-info-subtle bg-info-subtle">
                <p className="text-sm font-medium text-info mb-2">
                  Editing {editMode === "edit-payload" ? "Payload" : "Header"}
                </p>
                <textarea
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-subtle rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700">Save</button>
                  <button onClick={() => setEditMode("view")} className="px-3 py-1.5 bg-elevated text-secondary rounded-md text-xs font-medium hover:bg-strong">Cancel</button>
                </div>
              </div>
            )}

            {/* Exploit buttons */}
            <div>
              <p className="text-sm font-medium text-secondary mb-2">Try these modifications:</p>
              <div className="flex flex-wrap gap-2">
                {EXPLOITS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => applyExploit(ex)}
                    className="px-3 py-1.5 text-xs rounded-md font-medium bg-elevated text-secondary hover:bg-strong transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sign & Verify — real HMAC-SHA256 */}
            <div className="p-4 rounded-lg border border-subtle bg-surface-2">
              <p className="text-sm font-medium text-secondary mb-3">Sign & Verify (real HMAC-SHA256)</p>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end mb-3">
                <div className="flex-1">
                  <label className="block text-xs text-secondary mb-1">Signing Secret</label>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => { setSecret(e.target.value); setVerifyResult(null); }}
                    placeholder="your-256-bit-secret"
                    className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={verify}
                    disabled={verifying || !secret}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verifying ? "Verifying…" : "Verify"}
                  </button>
                  <button
                    onClick={signToken}
                    disabled={signing || !secret}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {signing ? "Signing…" : "Re-sign"}
                  </button>
                </div>
              </div>
              {verifyResult && (
                <div className={`p-3 rounded-md text-xs ${verifyResult.valid ? "bg-success-subtle border border-success-subtle text-success" : "bg-danger-subtle border border-danger-subtle text-danger"}`}>
                  {verifyResult.msg}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Try: apply an exploit above → Verify (signature breaks) → Re-sign (creates a new valid token with tampered claims).
                This shows why servers must <em>always</em> verify signatures before trusting any claims.
              </p>
            </div>
          </>
        )}

        {message && (
          <div className="p-3 rounded-md bg-warning-subtle border border-warning-subtle text-warning text-xs">
            {message}
          </div>
        )}

        {/* Session Fixation */}
        <div className="mt-6 pt-6 border-t border-subtle">
          <p className="text-sm font-medium text-secondary mb-2">Session Fixation Attack</p>
          <div className="p-4 rounded-lg border border-danger-subtle bg-danger-subtle">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-danger">
                Step {fixationStep + 1} of {SESSION_FIXATION_STEPS.slice(0, 5).length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setFixationStep(Math.max(0, fixationStep - 1))} className="px-2 py-1 text-xs rounded bg-danger-muted text-danger hover:bg-danger-muted">←</button>
                <button onClick={() => setFixationStep(Math.min(SESSION_FIXATION_STEPS.length - 1, fixationStep + 1))} className="px-2 py-1 text-xs rounded bg-danger-muted text-danger hover:bg-danger-muted">→</button>
              </div>
            </div>
            <p className="text-sm text-danger whitespace-pre-line">{SESSION_FIXATION_STEPS[fixationStep]}</p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
