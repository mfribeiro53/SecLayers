"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function PrintfSimulatorTool() {
  const [format, setFormat] = useState("%x %x %x %x");
  const [mode, setMode] = useState<"read" | "write" | "crash">("read");

  // Simulate stack values (what printf would read)
  const stackValues = ["0x41414141", "0x42424242", "0xFFFF0020", "0x08049200", "0xsecret1", "0xsecret2"];
  const secretData = "password123";

  const simulatePrintf = () => {
    if (!format.trim()) return "No format string provided.";
    
    const hasN = format.includes("%n");
    const hasS = format.includes("%s");
    const hasX = format.includes("%x");
    const hasManySpecifiers = (format.match(/%[xnsd]/g) || []).length > 3;

    if (mode === "crash") {
      return `Segmentation fault (core dumped)\n\nFormat string "%s" attempted to dereference an invalid pointer.\nThe program tried to read from address 0x41414141 as a string — this address is not mapped.`;
    }

    if (mode === "write" && hasN) {
      return `⚠️ %n detected! This writes the number of bytes written so far to the corresponding argument.\n\nIf the attacker controls the format string and the corresponding argument is a pointer they control, they can write arbitrary values to arbitrary memory addresses.\n\nExample: "...%n" writes 3 (3 chars before %n) to the address pointed to by the next stack value.`;
    }

    if (mode === "read") {
      if (hasS) {
        let result = "Stack read via %s:\n";
        stackValues.forEach((v, i) => {
          if (v.startsWith("0xsecret")) result += `  %s → "${secretData}" (leaked from stack position ${i})\n`;
          else result += `  %s → crash (attempted to read string at ${v})\n`;
        });
        return result;
      }
      if (hasX) {
        let result = "Stack read via %x:\n";
        stackValues.forEach((v, i) => result += `  arg ${i+1}: ${v}\n`);
        return result;
      }
      return `Format string: "${format}"\nResult: ${format}`;
    }

    return "Select a mode to simulate.";
  };

  return (
    <ToolShell title="Printf Format String Simulator" description="Experiment with format string vulnerabilities. Use %x to read stack, %s to read strings, %n to write memory.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Format String</label>
          <input
            type="text"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            placeholder="%x %x %x"
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {(["read", "write", "crash"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize ${mode === m ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>{m}</button>
          ))}
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-1">Stack values (simulated):</p>
          <div className="flex flex-wrap gap-1">
            {stackValues.map((v, i) => (
              <span key={i} className="px-2 py-0.5 text-xs font-mono bg-slate-100 rounded">{v}</span>
            ))}
          </div>
        </div>

        <pre className="p-3 rounded-md text-xs font-mono bg-slate-900 text-green-400 overflow-x-auto whitespace-pre-wrap min-h-[60px]">{simulatePrintf()}</pre>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">Format String Attack Vectors</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li><code>%x</code> — Read 4 bytes from the stack (hex)</li>
            <li><code>%s</code> — Read a string from a pointer on the stack</li>
            <li><code>%n</code> — Write the number of bytes printed so far to an address on the stack</li>
            <li><code>%7$x</code> — Read the n-th argument directly (bypass stack depth)</li>
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            The vulnerability: <code>printf(userInput)</code> instead of <code>printf("%s", userInput)</code>.
            The user controls the format string → can read and write arbitrary memory.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
