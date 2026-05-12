"use client";

import { useState, useEffect } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function CryptoPlaygroundTool() {
  const [plaintext, setPlaintext] = useState("Hello, world!");
  const [hashResult, setHashResult] = useState("");
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [aesKeyHex, setAesKeyHex] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [decrypted, setDecrypted] = useState("");
  const [error, setError] = useState("");

  // Hash with SHA-256
  const doHash = async () => {
    setError("");
    try {
      const data = new TextEncoder().encode(plaintext);
      const hash = await crypto.subtle.digest("SHA-256", data);
      setHashResult(bytesToHex(hash));
    } catch (e: any) {
      setError("Hashing failed: " + e.message);
    }
  };

  // Generate AES-GCM key
  const generateKey = async () => {
    setError("");
    try {
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      setAesKey(key);
      const exported = await crypto.subtle.exportKey("raw", key);
      setAesKeyHex(bytesToHex(exported));
    } catch (e: any) {
      setError("Key generation failed: " + e.message);
    }
  };

  // Encrypt with AES-GCM
  const doEncrypt = async () => {
    if (!aesKey) return;
    setError("");
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(plaintext);
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        data
      );
      // Prepend IV to ciphertext
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      setCiphertext(bytesToHex(combined.buffer));
    } catch (e: any) {
      setError("Encryption failed: " + e.message);
    }
  };

  // Decrypt
  const doDecrypt = async () => {
    if (!aesKey || !ciphertext) return;
    setError("");
    try {
      const combined = hexToBytes(ciphertext);
      const iv = combined.slice(0, 12);
      const ct = combined.slice(12);
      const decryptedBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        ct
      );
      setDecrypted(new TextDecoder().decode(decryptedBuf));
    } catch (e: any) {
      setError("Decryption failed: " + e.message);
    }
  };

  return (
    <ToolShell
      title="Crypto Playground"
      description="Experiment with SHA-256 hashing and AES-256-GCM encryption using the Web Crypto API."
    >
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Plaintext
          </label>
          <input
            type="text"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SHA-256 */}
        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-medium text-secondary mb-2">
            SHA-256 Hashing (integrity — one-way)
          </p>
          <button
            onClick={doHash}
            className="px-3 py-1.5 bg-slate-700 text-white rounded-md text-xs font-medium hover:bg-slate-600 mb-2"
          >
            Hash
          </button>
          {hashResult && (
            <pre className="p-2 rounded text-xs font-mono bg-surface-2 border border-subtle break-all whitespace-pre-wrap">
              {hashResult}
            </pre>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Same input always produces the same hash. You cannot recover the
            input from the hash.
          </p>
        </div>

        {/* AES-GCM */}
        <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50">
          <p className="text-sm font-medium text-secondary mb-2">
            AES-256-GCM Encryption (confidentiality — reversible)
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={generateKey}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-500"
            >
              Generate Key
            </button>
            {aesKey && (
              <>
                <button
                  onClick={doEncrypt}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-500"
                >
                  Encrypt
                </button>
                <button
                  onClick={doDecrypt}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-500"
                >
                  Decrypt
                </button>
              </>
            )}
          </div>
          {aesKeyHex && (
            <div className="mb-2">
              <p className="text-xs text-slate-500">Key (hex):</p>
              <pre className="p-1.5 rounded text-xs font-mono bg-indigo-100 border border-indigo-200 break-all whitespace-pre-wrap">
                {aesKeyHex}
              </pre>
            </div>
          )}
          {ciphertext && (
            <div className="mb-2">
              <p className="text-xs text-slate-500">
                Ciphertext (IV prepended, hex):
              </p>
              <pre className="p-1.5 rounded text-xs font-mono bg-surface-2 border border-subtle break-all whitespace-pre-wrap">
                {ciphertext}
              </pre>
            </div>
          )}
          {decrypted && (
            <div>
              <p className="text-xs text-slate-500">Decrypted:</p>
              <pre className="p-1.5 rounded text-xs font-mono bg-emerald-100 border border-emerald-200 break-all whitespace-pre-wrap">
                {decrypted}
              </pre>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">
            AES-GCM is authenticated encryption — tampered ciphertext fails
            decryption. A fresh random nonce (IV) is generated per encryption.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
            {error}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
