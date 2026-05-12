"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function OverflowAnimatorTool() {
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);

  const bufferSize = 8;
  const chars = input.split("");
  const overflowChars = chars.slice(bufferSize);

  const memoryLayout = () => {
    const cells: { addr: string; label: string; value: string; overflow: boolean; type: string }[] = [];
    // Return address (above buffer in stack — higher addresses)
    cells.push({ addr: "0x28", label: "Return Addr (high)", value: "0x08049200", overflow: overflowChars.length >= 5, type: "ret" });
    cells.push({ addr: "0x24", label: "Return Addr (low)", value: "0x08049200", overflow: overflowChars.length >= 4, type: "ret" });
    cells.push({ addr: "0x20", label: "Saved EBP (high)", value: "0xFFFF0020", overflow: overflowChars.length >= 3, type: "ebp" });
    cells.push({ addr: "0x1C", label: "Saved EBP (low)", value: "0xFFFF0020", overflow: overflowChars.length >= 2, type: "ebp" });
    // Buffer (8 bytes)
    for (let i = bufferSize - 1; i >= 0; i--) {
      const addr = 0x14 + i;
      const val = chars[i] || "\\x00";
      cells.push({ addr: `0x${addr.toString(16).toUpperCase().padStart(2, "0")}`, label: `buf[${i}]`, value: val, overflow: false, type: "buf" });
    }
    return cells;
  };

  const cells = memoryLayout();
  const hasOverflow = overflowChars.length > 0;

  return (
    <ToolShell title="Buffer Overflow Animator" description="Type characters into an 8-byte buffer. Watch what happens when you write past the end.">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-secondary mb-1">Input string (buffer size: {bufferSize} bytes)</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type more than 8 characters..."
            className="w-full px-3 py-2 border border-subtle rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">
            Characters written: {chars.length} / {bufferSize} {hasOverflow ? `(${overflowChars.length} overflow)` : ""}
          </p>
        </div>

        {/* Memory visualization */}
        <div className="border border-subtle rounded-lg overflow-hidden font-mono text-xs">
          <div className="px-3 py-2 bg-slate-800 text-slate-400 text-[10px]">Memory (higher addresses ↑)</div>
          {cells.map((cell) => (
            <div
              key={cell.addr}
              className={`px-3 py-1.5 flex items-center gap-3 border-b border-subtle ${
                cell.overflow ? "bg-danger-muted animate-pulse" :
                cell.type === "ret" ? "bg-danger-subtle" :
                cell.type === "ebp" ? "bg-warning-subtle" :
                "bg-surface-2"
              }`}
            >
              <span className="text-slate-400 w-12">{cell.addr}</span>
              <span className="text-slate-500 w-32">{cell.label}</span>
              <span className={`font-bold ${cell.overflow ? "text-danger" : cell.type === "ret" ? "text-red-400" : cell.type === "ebp" ? "text-warning" : "text-secondary"}`}>
                {cell.overflow ? `0x${cell.value.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")} ('${cell.value}')` : cell.value}
              </span>
              {cell.overflow && <span className="text-red-500 text-[10px]">CORRUPTED</span>}
            </div>
          ))}
        </div>

        {hasOverflow && (
          <div className="p-4 rounded-lg bg-danger-subtle border border-danger-subtle text-sm text-danger">
            <p className="font-medium">⚠️ Buffer Overflow in Progress</p>
            <p className="text-xs mt-1">
              {overflowChars.length < 2
                ? "You've started overwriting the saved EBP. The function will return to a corrupted stack frame."
                : overflowChars.length < 4
                ? "Saved EBP and the start of the return address are overwritten. The program will crash or jump to an invalid address."
                : "The return address is fully controlled. When the function returns, execution jumps to 0x" +
                  overflowChars.slice(0, 4).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("").toUpperCase() +
                  ". An attacker can redirect execution anywhere."}
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm text-secondary">
          <p className="font-medium text-secondary mb-1">How It Works</p>
          <p className="text-xs">
            The buffer <code>buf[8]</code> is allocated on the stack. Immediately above it
            (at higher addresses) are the saved EBP and return address. Writing past
            <code> buf[7]</code> overwrites these values. When the function executes <code>ret</code>,
            the CPU jumps to whatever address is now in the return address slot — which the attacker controls.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
