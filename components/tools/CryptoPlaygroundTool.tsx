"use client";

import { useState, useEffect, useRef } from "react";
import { ToolShell } from "@/components/ui/ToolShell";
import { usePyodide } from "@/lib/use-pyodide";

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

function PixelCanvas({
  rgba,
  width,
  height,
  scale = 12,
}: {
  rgba: number[];
  width: number;
  height: number;
  scale?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const id = ctx.createImageData(width, height);
    rgba.forEach((v, i) => {
      id.data[i] = v;
    });
    ctx.putImageData(id, 0, 0);
  }, [rgba, width, height]);
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        width: width * scale,
        height: height * scale,
        imageRendering: "pixelated",
      }}
      className="rounded block"
    />
  );
}

// Each row: 16 pixels × 4 bytes = 64 bytes = 4 blocks of 16 bytes.
// Left 8 pixels (32 bytes = 2 blocks) are identical across all rows.
// ECB encrypts identical blocks identically → pattern survives.
const ECB_PYTHON = `
import json

WIDTH, HEIGHT = 16, 16

pixels = []
for y in range(HEIGHT):
    for x in range(WIDTH):
        if x < WIDTH // 2:
            pixels.extend([220, 220, 220, 255])
        else:
            pixels.extend([40, 40, 40, 255])

KEY = bytes([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6,
             0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c])

def ecb(data, key):
    out = bytearray()
    for i in range(0, len(data), 16):
        out.extend(b ^ k for b, k in zip(data[i:i+16], key))
    return bytes(out)

def cbc(data, key, iv):
    out, prev = bytearray(), bytearray(iv)
    for i in range(0, len(data), 16):
        block = bytes(data[i:i+16])
        xored = bytes(b ^ p for b, p in zip(block, prev))
        ct = bytes(x ^ k for x, k in zip(xored, key))
        out.extend(ct)
        prev = bytearray(ct)
    return bytes(out)

raw = bytes(pixels)
enc_ecb = ecb(raw, KEY)
enc_cbc = cbc(raw, KEY, bytes(16))

json.dumps({
    "original": list(raw),
    "ecb": list(enc_ecb),
    "cbc": list(enc_cbc),
    "width": WIDTH,
    "height": HEIGHT,
})
`.trim();

// PBKDF2 (100k iterations) vs SHA-256 (1000 calls) timing comparison.
// Both use stdlib hashlib — no micropip needed.
const TIMING_PYTHON = `
import hashlib, time, json

msg = b"correcthorsebatterystaple"
salt = b"random_salt_value"

start = time.time()
for _ in range(1000):
    hashlib.sha256(msg).hexdigest()
sha_ms = (time.time() - start)

start = time.time()
hashlib.pbkdf2_hmac("sha256", msg, salt, 100_000)
pbkdf2_ms = time.time() - start

json.dumps({
    "sha256_per_call_us": round(sha_ms * 1_000_000 / 1000, 2),
    "pbkdf2_ms": round(pbkdf2_ms * 1000, 1),
    "ratio": round((pbkdf2_ms * 1000) / (sha_ms * 1000 / 1000)),
})
`.trim();

interface EcbResult {
  original: number[];
  ecb: number[];
  cbc: number[];
  width: number;
  height: number;
}
interface TimingResult {
  sha256_per_call_us: number;
  pbkdf2_ms: number;
  ratio: number;
}

export default function CryptoPlaygroundTool() {
  const [plaintext, setPlaintext] = useState("Hello, world!");
  const [hashResult, setHashResult] = useState("");
  const [aesKey, setAesKey] = useState<CryptoKey | null>(null);
  const [aesKeyHex, setAesKeyHex] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [decrypted, setDecrypted] = useState("");
  const [error, setError] = useState("");

  const [ecbResult, setEcbResult] = useState<EcbResult | null>(null);
  const [timingResult, setTimingResult] = useState<TimingResult | null>(null);
  const [pyRunning, setPyRunning] = useState(false);
  const [pyError, setPyError] = useState("");

  const { status: pyStatus, load: loadPy, runPython } = usePyodide();

  const doHash = async () => {
    setError("");
    try {
      const data = new TextEncoder().encode(plaintext);
      const hash = await crypto.subtle.digest("SHA-256", data);
      setHashResult(bytesToHex(hash));
    } catch (e: unknown) {
      setError("Hashing failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

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
    } catch (e: unknown) {
      setError("Key generation failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const doEncrypt = async () => {
    if (!aesKey) return;
    setError("");
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = new TextEncoder().encode(plaintext);
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, data);
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      setCiphertext(bytesToHex(combined.buffer));
    } catch (e: unknown) {
      setError("Encryption failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const doDecrypt = async () => {
    if (!aesKey || !ciphertext) return;
    setError("");
    try {
      const combined = hexToBytes(ciphertext);
      const iv = combined.slice(0, 12);
      const ct = combined.slice(12);
      const decryptedBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
      setDecrypted(new TextDecoder().decode(decryptedBuf));
    } catch (e: unknown) {
      setError("Decryption failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  async function runPy(code: string, onResult: (json: string) => void) {
    setPyRunning(true);
    setPyError("");
    try {
      const out = await runPython(code);
      onResult(out);
    } catch (e: unknown) {
      setPyError(e instanceof Error ? e.message : String(e));
    } finally {
      setPyRunning(false);
    }
  }

  return (
    <ToolShell
      title="Crypto Playground"
      description="Experiment with SHA-256 hashing, AES-256-GCM encryption, ECB mode vulnerabilities, and password hashing speed."
    >
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Plaintext</label>
          <input
            type="text"
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SHA-256 */}
        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-medium text-secondary mb-2">SHA-256 Hashing (integrity — one-way)</p>
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
            Same input always produces the same hash. You cannot recover the input from the hash.
          </p>
        </div>

        {/* AES-GCM */}
        <div className="p-4 rounded-lg border border-indigo-subtle bg-indigo-subtle">
          <p className="text-sm font-medium text-secondary mb-2">AES-256-GCM Encryption (confidentiality — reversible)</p>
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
              <pre className="p-1.5 rounded text-xs font-mono bg-indigo-muted border border-indigo-subtle break-all whitespace-pre-wrap">
                {aesKeyHex}
              </pre>
            </div>
          )}
          {ciphertext && (
            <div className="mb-2">
              <p className="text-xs text-slate-500">Ciphertext (IV prepended, hex):</p>
              <pre className="p-1.5 rounded text-xs font-mono bg-surface-2 border border-subtle break-all whitespace-pre-wrap">
                {ciphertext}
              </pre>
            </div>
          )}
          {decrypted && (
            <div>
              <p className="text-xs text-slate-500">Decrypted:</p>
              <pre className="p-1.5 rounded text-xs font-mono bg-success-muted border border-success-subtle break-all whitespace-pre-wrap">
                {decrypted}
              </pre>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">
            AES-GCM is authenticated encryption — tampered ciphertext fails decryption. A fresh random nonce (IV) is generated per encryption.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-danger-subtle border border-danger-subtle text-danger text-xs font-mono">
            {error}
          </div>
        )}

        {/* Python demos gate */}
        {pyStatus === "idle" && (
          <div
            className="p-4 rounded-lg border border-dashed text-center"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <p className="text-sm text-secondary mb-3">
              Two more demos — ECB mode weakness and password hashing speed — require an in-browser Python runtime.
            </p>
            <button
              onClick={loadPy}
              className="px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              Load Python (~8 MB)
            </button>
          </div>
        )}

        {pyStatus === "loading" && (
          <div className="p-4 rounded-lg text-center text-sm text-secondary" style={{ background: "var(--bg-surface-2)" }}>
            Loading Python runtime…
          </div>
        )}

        {pyStatus === "error" && (
          <div className="p-3 rounded-md bg-danger-subtle border border-danger-subtle text-danger text-xs">
            Failed to load Python runtime. Check your internet connection and reload.
          </div>
        )}

        {pyStatus === "ready" && (
          <>
            {/* ECB Pattern Demo */}
            <div className="p-4 rounded-lg border border-subtle bg-surface-2">
              <p className="text-sm font-medium text-secondary mb-1">ECB Mode Weakness</p>
              <p className="text-xs text-slate-400 mb-3">
                ECB encrypts each 16-byte block independently with the same key. Identical plaintext blocks produce identical ciphertext blocks — patterns survive encryption.
              </p>
              <button
                onClick={() =>
                  runPy(ECB_PYTHON, (json) => setEcbResult(JSON.parse(json)))
                }
                disabled={pyRunning}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {pyRunning ? "Running…" : "Run demo"}
              </button>

              {ecbResult && (
                <div className="mt-4 flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Original</p>
                    <PixelCanvas
                      rgba={ecbResult.original}
                      width={ecbResult.width}
                      height={ecbResult.height}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">ECB encrypted</p>
                    <PixelCanvas
                      rgba={ecbResult.ecb}
                      width={ecbResult.width}
                      height={ecbResult.height}
                    />
                    <p className="text-[10px] text-red-400 mt-1">Pattern preserved ✗</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">CBC encrypted</p>
                    <PixelCanvas
                      rgba={ecbResult.cbc}
                      width={ecbResult.width}
                      height={ecbResult.height}
                    />
                    <p className="text-[10px] text-emerald-400 mt-1">Pattern hidden ✓</p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Hashing Speed */}
            <div className="p-4 rounded-lg border border-subtle bg-surface-2">
              <p className="text-sm font-medium text-secondary mb-1">Password Hashing Speed</p>
              <p className="text-xs text-slate-400 mb-3">
                Passwords should be hashed with a <em>slow</em> function. SHA-256 is fast (designed for throughput) — an attacker can try billions per second. PBKDF2 with 100,000 iterations is intentionally slow, making brute-force impractical.
              </p>
              <button
                onClick={() =>
                  runPy(TIMING_PYTHON, (json) => setTimingResult(JSON.parse(json)))
                }
                disabled={pyRunning}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {pyRunning ? "Running…" : "Benchmark"}
              </button>

              {timingResult && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">SHA-256 (unsafe)</p>
                    <p className="text-xl font-mono font-bold text-secondary">
                      {timingResult.sha256_per_call_us} µs
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">per hash call</p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">PBKDF2 100k (safe)</p>
                    <p className="text-xl font-mono font-bold text-secondary">
                      {timingResult.pbkdf2_ms} ms
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">per hash call</p>
                  </div>
                  <div className="col-span-2 text-xs text-slate-400">
                    PBKDF2 is <strong className="text-secondary">{timingResult.ratio}×</strong> slower than a single SHA-256. Use bcrypt, Argon2, or PBKDF2 for passwords — never raw SHA-256.
                  </div>
                </div>
              )}
            </div>

            {pyError && (
              <div className="p-3 rounded-md bg-danger-subtle text-danger text-xs font-mono">
                {pyError}
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
