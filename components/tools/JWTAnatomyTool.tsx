"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sha256(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", data).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export default function JWTAnatomyTool() {
  const [sub, setSub] = useState("123");
  const [name, setName] = useState("Alice");
  const [role, setRole] = useState("user");
  const [secret, setSecret] = useState("my-secret-key");
  const [token, setToken] = useState("");

  const generate = async () => {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = { sub, name, role, iat: now, exp: now + 3600 };
    const h = base64url(JSON.stringify(header));
    const p = base64url(JSON.stringify(payload));
    const data = `${h}.${p}`;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const s = base64url(String.fromCharCode(...Array.from(new Uint8Array(sig))));
    setToken(`${h}.${p}.${s}`);
  };

  const verify = () => {
    const parts = token.split(".");
    if (parts.length !== 3) return "Invalid format — must be header.payload.signature";
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp < now) return `❌ Token expired at ${new Date(exp * 1000).toLocaleString()}. Current time: ${new Date(now * 1000).toLocaleString()}.`;
      return `✅ Token valid. Subject: ${payload.sub}, Name: ${payload.name}, Role: ${payload.role}, Expires: ${new Date(exp * 1000).toLocaleString()}.`;
    } catch {
      return "❌ Cannot decode token. Invalid base64.";
    }
  };

  return (
    <ToolShell title="JWT Anatomy Tool" description="Build a JWT with custom claims and secret. See how signing works with real HMAC-SHA256.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[{ label: "Subject", val: sub, set: setSub }, { label: "Name", val: name, set: setName }, { label: "Role", val: role, set: setRole }, { label: "Secret", val: secret, set: setSecret }].map((f) => (
            <div key={f.label}>
              <label className="block text-xs text-secondary mb-0.5">{f.label}</label>
              <input value={f.val} onChange={(e) => f.set(e.target.value)} className="w-full px-2 py-1.5 border border-subtle rounded text-xs font-mono" />
            </div>
          ))}
        </div>
        <button onClick={generate} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Generate JWT</button>
        {token && (
          <>
            <pre className="p-3 rounded-md text-xs font-mono bg-slate-900 text-green-400 break-all whitespace-pre-wrap">{token}</pre>
            <p className="text-xs text-slate-500">{verify()}</p>
          </>
        )}
      </div>
    </ToolShell>
  );
}
