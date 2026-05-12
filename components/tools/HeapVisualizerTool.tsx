"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface HeapChunk {
  id: number;
  size: number;
  status: "allocated" | "freed" | "dangling";
  data: string;
  addr: string;
}

function randomAddr(): string {
  return "0x" + Array.from({ length: 8 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
}

export default function HeapVisualizerTool() {
  const [chunks, setChunks] = useState<HeapChunk[]>([
    { id: 1, size: 32, status: "allocated", data: "User session data...", addr: randomAddr() },
    { id: 2, size: 64, status: "allocated", data: "File buffer contents", addr: randomAddr() },
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const nextId = Math.max(0, ...chunks.map(c => c.id)) + 1;

  const allocate = () => {
    setChunks(prev => [...prev, { id: nextId, size: 32, status: "allocated", data: "New allocation", addr: randomAddr() }]);
    setMessage(`Allocated chunk ${nextId} (32 bytes).`);
  };

  const freeChunk = (id: number) => {
    setChunks(prev => prev.map(c => c.id === id ? { ...c, status: "freed" as const, data: "(freed memory)" } : c));
    setMessage(`Freed chunk ${id}. Memory returned to allocator — but pointer may still exist (dangling).`);
  };

  const useAfterFree = (id: number) => {
    const chunk = chunks.find(c => c.id === id);
    if (!chunk || chunk.status !== "freed") {
      setMessage("Select a freed chunk first.");
      return;
    }
    setChunks(prev => prev.map(c => c.id === id ? { ...c, status: "dangling" as const, data: "⚠ DETECTED: stale data read from freed chunk" } : c));
    setMessage(`Use-After-Free detected! Chunk ${id} was freed but a dangling pointer still references it. Reading stale data: "${chunk.data}"`);
  };

  const reallocate = (id: number) => {
    const freed = chunks.find(c => c.id === id && c.status === "freed");
    if (!freed) { setMessage("Select a freed chunk to reallocate."); return; }
    setChunks(prev => prev.map(c => c.id === id ? { ...c, status: "allocated", data: "ATTACKER CONTROLLED DATA", addr: freed.addr } : c));
    setMessage(`Chunk ${id} reallocated with attacker-controlled data. If a dangling pointer exists, it now points to attacker data.`);
  };

  return (
    <ToolShell title="Heap Allocator Visualizer" description="Allocate, free, and reallocate heap chunks. See use-after-free and double-free in action.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={allocate} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Allocate (32B)</button>
          <button
            onClick={() => {
              if (selectedId) {
                freeChunk(selectedId);
                setSelectedId(null);
              }
            }}
            disabled={!selectedId}
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 disabled:opacity-40"
          >
            Free Selected
          </button>
          <button onClick={() => { if (selectedId) useAfterFree(selectedId); }} disabled={!selectedId} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-40">Use-After-Free</button>
          <button onClick={() => { if (selectedId) reallocate(selectedId); }} disabled={!selectedId} className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-40">Reallocate</button>
        </div>

        <div className="border border-subtle rounded-lg overflow-hidden font-mono text-xs">
          {chunks.map((chunk) => {
            const bgColor =
              chunk.status === "allocated" ? "bg-success-subtle" :
              chunk.status === "freed" ? "bg-warning-subtle" :
              "bg-danger-subtle";
            const borderColor =
              chunk.status === "allocated" ? "border-success-subtle" :
              chunk.status === "freed" ? "border-warning-subtle" :
              "border-danger-subtle";
            return (
              <button
                key={chunk.id}
                onClick={() => setSelectedId(selectedId === chunk.id ? null : chunk.id)}
                className={`w-full text-left px-3 py-2.5 border-b ${borderColor} ${bgColor} ${selectedId === chunk.id ? "ring-2 ring-blue-400" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 mr-2">{chunk.addr}</span>
                    <span className={`font-semibold ${chunk.status === "allocated" ? "text-success" : chunk.status === "freed" ? "text-warning" : "text-danger"}`}>
                      Chunk {chunk.id} ({chunk.size}B) — {chunk.status}
                    </span>
                  </div>
                  {selectedId === chunk.id && <span className="text-info text-[10px]">SELECTED</span>}
                </div>
                <p className="mt-0.5 text-slate-500">{chunk.data}</p>
              </button>
            );
          })}
        </div>

        {message && (
          <div className={`p-3 rounded-lg border text-xs font-mono ${message.includes("⚠") || message.includes("detected") ? "bg-danger-subtle border-danger-subtle text-danger" : "bg-surface-2 border-subtle text-secondary"}`}>{message}</div>
        )}

        <div className="p-4 rounded-lg bg-surface-2 border border-subtle text-sm text-secondary">
          <p className="font-medium text-secondary mb-1">Heap Vulnerabilities</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li><strong>Use-After-Free:</strong> Accessing memory after it's freed. The freed chunk may be reallocated with attacker data.</li>
            <li><strong>Double-Free:</strong> Freeing a chunk twice. Corrupts the allocator's free list — can lead to arbitrary write.</li>
            <li><strong>Heap Overflow:</strong> Writing past a heap buffer into adjacent chunk metadata.</li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
