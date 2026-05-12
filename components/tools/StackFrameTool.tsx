"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface StackFrame {
  id: number;
  name: string;
  locals: string[];
  savedEbp: string;
  returnAddr: string;
}

export default function StackFrameTool() {
  const [frames, setFrames] = useState<StackFrame[]>([
    { id: 1, name: "main()", locals: ["argc=1", "argv=0x..."], savedEbp: "0xFFFF0000", returnAddr: "0x08049000 (_start)" },
    { id: 2, name: "vuln_func()", locals: ["buf[16]", "authenticated=0"], savedEbp: "0xFFFF0010", returnAddr: "0x08049120 (main+42)" },
  ]);
  const [overflow, setOverflow] = useState(false);

  const nextId = frames.length + 1;

  const push = () => {
    setFrames((prev) => [
      ...prev,
      {
        id: nextId,
        name: `func_${nextId}()`,
        locals: ["local_var"],
        savedEbp: "0xFFFF0020",
        returnAddr: `0x08049${String(120 + nextId * 4)}`,
      },
    ]);
    setOverflow(false);
  };

  const pop = () => {
    if (frames.length <= 1) return;
    setFrames((prev) => prev.slice(0, -1));
    setOverflow(false);
  };

  const triggerOverflow = () => {
    setOverflow(true);
  };

  return (
    <ToolShell title="Stack Frame Visualizer" description="Push and pop stack frames. See how local variables, saved EBP, and return addresses are laid out in memory.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={push} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Push Frame</button>
          <button onClick={pop} disabled={frames.length <= 1} className="px-3 py-1.5 bg-elevated text-secondary rounded text-xs font-medium hover:bg-strong disabled:opacity-40">Pop Frame</button>
          <button onClick={triggerOverflow} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700">Simulate Overflow</button>
        </div>

        <div className="border border-subtle rounded-lg overflow-hidden font-mono text-xs">
          <div className="px-3 py-2 bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">Stack (grows downward ↓)</div>
          {[...frames].reverse().map((frame) => (
            <div key={frame.id} className="border-t border-subtle">
              <div className="px-3 py-2 bg-slate-700 text-white text-[11px] font-semibold flex justify-between">
                <span>{frame.name}</span>
                <span className="text-slate-400 font-normal">frame {frame.id}</span>
              </div>
              <div className={`px-3 py-1.5 bg-danger-subtle border-b border-danger-subtle ${overflow ? "animate-pulse" : ""}`}>
                <span className="text-danger">Return Address:</span>{" "}
                <span className={overflow ? "text-danger line-through" : "text-secondary"}>
                  {overflow && frame.id === frames.length ? "0x41414141 (AAAA)" : frame.returnAddr}
                </span>
                {overflow && frame.id === frames.length && (
                  <span className="ml-2 text-red-500 font-bold">⚠ OVERWRITTEN</span>
                )}
              </div>
              <div className="px-3 py-1.5 bg-warning-subtle border-b border-warning-subtle">
                <span className="text-warning">Saved EBP:</span>{" "}
                <span className="text-secondary">{frame.savedEbp}</span>
              </div>
              {frame.locals.map((local, i) => (
                <div key={i} className="px-3 py-1.5 bg-surface-2 border-b border-subtle">
                  <span className="text-slate-400">local:</span>{" "}
                  <span className={overflow && frame.id === frames.length && local.includes("buf") ? "text-danger" : "text-secondary"}>
                    {local}
                  </span>
                  {overflow && frame.id === frames.length && local.includes("buf") && (
                    <span className="ml-2 text-red-500">← overflow source</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {overflow && (
          <div className="p-4 rounded-lg bg-danger-subtle border border-danger-subtle text-sm text-danger">
            <p className="font-medium">Buffer Overflow Exploited</p>
            <p className="text-xs mt-1">
              The local buffer <code>buf[16]</code> was filled past its 16-byte boundary.
              Excess data overwrote the saved EBP and return address.
              When <code>vuln_func()</code> returns, execution jumps to <code>0x41414141</code> —
              an address controlled by the attacker.
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm">
          <p className="font-medium text-secondary mb-1">Stack Frame Layout (per function call)</p>
          <ol className="text-xs text-secondary list-decimal list-inside space-y-0.5">
            <li>Function arguments (pushed by caller)</li>
            <li>Return address (where to jump after function returns)</li>
            <li>Saved EBP (caller's base pointer)</li>
            <li>Local variables (buffers, integers, pointers)</li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">
            Local variables are adjacent to the return address.
            Overflow a local buffer → overwrite the return address → hijack execution.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
