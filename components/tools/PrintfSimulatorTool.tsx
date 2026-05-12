"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

// ── Format string parser ─────────────────────────────────────────
interface Specifier {
  raw: string;
  spec: string;         // x, s, n, d, u, p, c
  argIndex: number;     // 1-based stack slot (after resolving %n$)
  width?: number;
}

interface ParsedToken {
  kind: "literal" | "specifier";
  text: string;
  specifier?: Specifier;
}

function parseFormatString(fmt: string): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let i = 0;
  let seqArg = 1; // sequential argument counter

  while (i < fmt.length) {
    if (fmt[i] !== "%") {
      let j = i + 1;
      while (j < fmt.length && fmt[j] !== "%") j++;
      tokens.push({ kind: "literal", text: fmt.slice(i, j) });
      i = j;
      continue;
    }

    i++; // consume %
    if (i >= fmt.length || fmt[i] === "%") {
      tokens.push({ kind: "literal", text: "%" });
      if (fmt[i] === "%") i++;
      continue;
    }

    // Try to match %[n$][width]spec
    const rest = fmt.slice(i);
    const directMatch = rest.match(/^(\d+)\$(\d*)([xXsdunpci])/);
    const seqMatch    = rest.match(/^(\d*)([xXsdunpci])/);

    if (directMatch) {
      const argIndex = parseInt(directMatch[1], 10);
      const width    = directMatch[2] ? parseInt(directMatch[2], 10) : undefined;
      const spec     = directMatch[3].toLowerCase();
      const raw      = "%" + directMatch[0];
      tokens.push({
        kind: "specifier",
        text: raw,
        specifier: { raw, spec, argIndex, width },
      });
      i += directMatch[0].length;
    } else if (seqMatch) {
      const width  = seqMatch[1] ? parseInt(seqMatch[1], 10) : undefined;
      const spec   = seqMatch[2].toLowerCase();
      const raw    = "%" + seqMatch[0];
      tokens.push({
        kind: "specifier",
        text: raw,
        specifier: { raw, spec, argIndex: seqArg++, width },
      });
      i += seqMatch[0].length;
    } else {
      // Unknown/unsupported specifier — emit literally
      tokens.push({ kind: "literal", text: "%" + fmt[i] });
      i++;
    }
  }

  return tokens;
}

// ── Stack slots ──────────────────────────────────────────────────
interface StackSlot {
  hex: string;
  label: string;
  string?: string; // if treated as pointer, the string at that address
}

const DEFAULT_SLOTS: StackSlot[] = [
  { hex: "0x41414141", label: "saved eip (main)" },
  { hex: "0x42424242", label: "local var" },
  { hex: "0x08049200", label: "GOT entry" },
  { hex: "0xbffff6d0", label: "stack addr" },
  { hex: "0x70617373", label: `→ "pass"`, string: "pass" },
  { hex: "0x776f7264", label: `→ "word"`, string: "word" },
  { hex: "0x31323300", label: `→ "123"`, string: "123" },
  { hex: "0x00000000", label: "NULL ptr" },
];

// ── Simulation output ────────────────────────────────────────────
interface OutputChunk {
  text: string;
  kind: "literal" | "hex" | "decimal" | "string" | "write" | "error";
  slotIndex?: number; // 1-based
}

interface Warning {
  message: string;
  kind: "critical" | "high" | "info";
}

function simulate(
  tokens: ParsedToken[],
  slots: StackSlot[]
): { chunks: OutputChunk[]; warnings: Warning[]; bytesWritten: number } {
  const chunks: OutputChunk[] = [];
  const warnings: Warning[] = [];
  let bytesWritten = 0;
  const writeTargets: number[] = [];

  for (const tok of tokens) {
    if (tok.kind === "literal") {
      chunks.push({ text: tok.text, kind: "literal" });
      bytesWritten += tok.text.length;
      continue;
    }

    const s = tok.specifier!;
    const slot = slots[s.argIndex - 1];

    if (!slot) {
      chunks.push({ text: `[arg${s.argIndex}: not on stack]`, kind: "error", slotIndex: s.argIndex });
      warnings.push({ message: `%${s.raw} references arg${s.argIndex} which is past the simulated stack frame.`, kind: "high" });
      continue;
    }

    switch (s.spec) {
      case "x": {
        const padded = s.width
          ? slot.hex.replace("0x", "").padStart(s.width, "0")
          : slot.hex.replace("0x", "");
        chunks.push({ text: padded, kind: "hex", slotIndex: s.argIndex });
        bytesWritten += padded.length;
        break;
      }
      case "p": {
        const val = slot.hex;
        chunks.push({ text: val, kind: "hex", slotIndex: s.argIndex });
        bytesWritten += val.length;
        break;
      }
      case "d":
      case "u": {
        const num = parseInt(slot.hex, 16);
        const text = s.width
          ? String(Math.abs(num)).padStart(s.width, "0")
          : String(num >>> 0);
        chunks.push({ text, kind: "decimal", slotIndex: s.argIndex });
        bytesWritten += text.length;
        if (s.width && s.width > 100) {
          warnings.push({ message: `%${s.width}d writes ${s.width} chars — combined with %n this can write an arbitrary byte value to memory.`, kind: "high" });
        }
        break;
      }
      case "s": {
        if (slot.string) {
          chunks.push({ text: slot.string, kind: "string", slotIndex: s.argIndex });
          bytesWritten += slot.string.length;
          warnings.push({ message: `%s at arg${s.argIndex} read the string "${slot.string}" from a pointer on the stack.`, kind: "info" });
        } else {
          chunks.push({ text: `[SIGSEGV: invalid ptr ${slot.hex}]`, kind: "error", slotIndex: s.argIndex });
          warnings.push({ message: `%s at arg${s.argIndex} tried to dereference ${slot.hex} as a string pointer — would crash.`, kind: "critical" });
        }
        break;
      }
      case "n": {
        writeTargets.push(s.argIndex);
        chunks.push({
          text: `[WRITE ${bytesWritten} → *${slot.hex}]`,
          kind: "write",
          slotIndex: s.argIndex,
        });
        warnings.push({
          message: `%n writes the integer ${bytesWritten} (bytes printed so far) to the address ${slot.hex}. Attacker controls this address via the stack.`,
          kind: "critical",
        });
        break;
      }
      case "c": {
        const ch = String.fromCharCode(parseInt(slot.hex, 16) & 0xff);
        chunks.push({ text: ch, kind: "literal", slotIndex: s.argIndex });
        bytesWritten++;
        break;
      }
      default:
        chunks.push({ text: tok.text, kind: "literal" });
    }
  }

  if (writeTargets.length > 0) {
    warnings.unshift({ message: `%n detected — format string write primitive. With a writable pointer on the stack, an attacker can overwrite any memory address (GOT, return address, etc.).`, kind: "critical" });
  }

  return { chunks, warnings, bytesWritten };
}

// ── Presets ──────────────────────────────────────────────────────
const PRESETS = [
  { label: "%x leak",    value: "%x %x %x %x" },
  { label: "%s crash",   value: "%s %s %s %s" },
  { label: "%n write",   value: "%x%x%n" },
  { label: "direct %7$x", value: "%7$x" },
  { label: "%100d%n",    value: "AAAA%100d%n" },
];

const CHUNK_STYLE: Record<string, string> = {
  literal:  "text-slate-200",
  hex:      "text-green-400",
  decimal:  "text-cyan-400",
  string:   "text-yellow-400",
  write:    "text-red-400 font-bold",
  error:    "text-red-500 italic",
};

const WARN_STYLE: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50 text-red-800",
  high:     "border-l-orange-500 bg-orange-50 text-orange-800",
  info:     "border-l-blue-500 bg-blue-50 text-blue-800",
};

export default function PrintfSimulatorTool() {
  const [format, setFormat] = useState("%x %x %x %x");
  const [slots, setSlots] = useState<StackSlot[]>(DEFAULT_SLOTS);

  const tokens = parseFormatString(format);
  const { chunks, warnings } = simulate(tokens, slots);

  const specifiers = tokens.filter((t) => t.kind === "specifier");

  return (
    <ToolShell
      title="Printf Format String Simulator"
      description="Each %specifier is parsed and mapped to a numbered stack slot. See exactly what printf() reads (or writes) based on your format string."
    >
      <div className="space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setFormat(p.value)}
              className="px-2.5 py-1 text-[10px] rounded border border-subtle bg-surface-2 text-secondary hover:border-slate-400 font-mono transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Format string input */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">
            Format string (user-controlled input to{" "}
            <code className="font-mono">printf(input)</code>)
          </label>
          <input
            type="text"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border border-subtle rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            spellCheck={false}
          />
        </div>

        {/* Parsed specifiers + slot mapping */}
        {specifiers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-secondary mb-1">
              Specifier → stack slot mapping
            </p>
            <div className="flex flex-wrap gap-1.5">
              {specifiers.map((tok, i) => {
                const s = tok.specifier!;
                const slot = slots[s.argIndex - 1];
                return (
                  <div
                    key={i}
                    className="px-2 py-1 rounded bg-elevated border border-subtle text-[10px] font-mono"
                  >
                    <span className="text-blue-400">{tok.text}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-slate-400">
                      arg{s.argIndex} = {slot?.hex ?? "out of range"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stack slots */}
        <div>
          <p className="text-xs font-medium text-secondary mb-1">
            Stack (click hex to edit)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {slots.map((slot, i) => {
              const isUsed = specifiers.some((t) => t.specifier?.argIndex === i + 1);
              return (
                <div
                  key={i}
                  className={`px-2 py-1.5 rounded border text-[10px] font-mono ${
                    isUsed ? "border-blue-500/50 bg-blue-950/30" : "border-subtle bg-surface-2"
                  }`}
                >
                  <span className="text-slate-500 mr-1">arg{i + 1}</span>
                  <input
                    value={slot.hex}
                    onChange={(e) => {
                      const next = [...slots];
                      next[i] = { ...slot, hex: e.target.value };
                      setSlots(next);
                    }}
                    className="bg-transparent text-green-400 w-24 focus:outline-none"
                  />
                  <div className="text-slate-600 truncate">{slot.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Output */}
        <div>
          <p className="text-xs font-medium text-secondary mb-1">printf() output</p>
          <pre className="p-3 rounded bg-slate-900 text-xs font-mono overflow-x-auto min-h-[2.5rem] leading-relaxed whitespace-pre-wrap">
            {chunks.map((c, i) => (
              <span key={i} className={CHUNK_STYLE[c.kind]}>
                {c.text}
              </span>
            ))}
          </pre>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`border-l-4 pl-3 py-1.5 rounded-r text-xs ${WARN_STYLE[w.kind]}`}
              >
                {w.message}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] font-mono pt-1 border-t border-subtle">
          <span className="text-green-400">%x = hex stack read</span>
          <span className="text-yellow-400">%s = string ptr deref</span>
          <span className="text-cyan-400">%d = decimal</span>
          <span className="text-red-400">%n = memory write</span>
          <span className="text-blue-400">%n$ = direct arg</span>
        </div>
      </div>
    </ToolShell>
  );
}
