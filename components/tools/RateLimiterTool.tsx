"use client";

import { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function RateLimiterTool() {
  const [rate, setRate] = useState(5);
  const [capacity, setCapacity] = useState(10);
  const [tokens, setTokens] = useState(capacity);
  const [requests, setRequests] = useState<{ time: number; allowed: boolean }[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTokens(capacity);
  }, [capacity]);

  const start = () => {
    setRequests([]);
    setTokens(capacity);
    setRunning(true);
    let t = capacity;
    let time = 0;
    intervalRef.current = setInterval(() => {
      time++;
      t = Math.min(capacity, t + rate / 10);
      const req = Math.random() < 0.4;
      if (req) {
        const allowed = t >= 1;
        if (allowed) t -= 1;
        setRequests((prev) => [...prev.slice(-50), { time, allowed }]);
      }
      setTokens(t);
      if (time > 100) {
        clearInterval(intervalRef.current!);
        setRunning(false);
      }
    }, 200);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  return (
    <ToolShell title="Token Bucket Simulator" description="Visualize the token bucket algorithm in real time. Requests arrive randomly; tokens refill at a fixed rate.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-secondary mb-0.5">Refill rate (tokens/sec)</label>
            <input type="number" value={rate} onChange={(e) => setRate(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-2 py-1.5 border border-subtle rounded text-xs" />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-0.5">Bucket capacity</label>
            <input type="number" value={capacity} onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-2 py-1.5 border border-subtle rounded text-xs" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={start} disabled={running} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">Start</button>
          <button onClick={stop} className="px-3 py-1.5 bg-elevated text-secondary rounded text-xs font-medium hover:bg-strong">Stop</button>
        </div>
        <div className="p-3 rounded-lg border border-subtle bg-surface-2">
          <p className="text-sm font-medium text-secondary">Tokens: {tokens.toFixed(1)} / {capacity}</p>
          <div className="w-full bg-strong rounded-full h-3 mt-1">
            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${(tokens / capacity) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {requests.map((r, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${r.allowed ? "bg-emerald-400" : "bg-red-400"}`} title={`Request at t=${r.time}: ${r.allowed ? "Allowed" : "Rejected"}`} />
          ))}
        </div>
        <p className="text-xs text-slate-400">Green = allowed, Red = rejected (no tokens available)</p>
      </div>
    </ToolShell>
  );
}
