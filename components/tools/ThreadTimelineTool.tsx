"use client";

import { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function ThreadTimelineTool() {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<{ thread: string; time: number; action: string; color: string }[]>([]);
  const [result, setResult] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setEvents([]);
    setResult("");
    setRunning(true);
    let time = 0;
    intervalRef.current = setInterval(() => {
      time++;
      if (time === 1) {
        setEvents(prev => [...prev, { thread: "A", time, action: "Check: if file exists → YES", color: "bg-blue-100 text-blue-700" }]);
      }
      if (time === 2) {
        setEvents(prev => [...prev, { thread: "B", time, action: "Delete file", color: "bg-amber-100 text-amber-700" }]);
      }
      if (time === 3) {
        setEvents(prev => [...prev, { thread: "B", time, action: "Create new file (symlink → /etc/passwd)", color: "bg-red-100 text-red-700" }]);
      }
      if (time === 4) {
        setEvents(prev => [...prev, { thread: "A", time, action: "Open & write to file (follows symlink!)", color: "bg-red-100 text-red-700" }]);
      }
      if (time === 5) {
        setEvents(prev => [...prev, { thread: "A", time, action: "💥 /etc/passwd overwritten!", color: "bg-red-200 text-red-800 font-bold" }]);
        setResult("TOCTOU exploited: Thread A checked the file exists at t=1, but Thread B replaced it with a symlink before Thread A wrote to it at t=4. The write went to /etc/passwd instead of the intended file.");
        clearInterval(intervalRef.current!);
        setRunning(false);
      }
    }, 800);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <ToolShell title="Race Condition Timeline" description="Watch a TOCTOU (Time-of-Check Time-of-Use) race condition unfold between two threads.">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={start} disabled={running} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">Start Race</button>
          <button onClick={stop} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200">Stop</button>
        </div>

        <div className="space-y-1">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 font-mono w-8">t={e.time}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium w-8 text-center ${e.thread === "A" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"}`}>{e.thread}</span>
              <span className={`px-2 py-0.5 rounded ${e.color}`}>{e.action}</span>
            </div>
          ))}
          {events.length === 0 && <p className="text-xs text-slate-400 italic">Click "Start Race" to begin.</p>}
        </div>

        {result && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            <p className="font-medium">⚠️ TOCTOU Exploited</p>
            <p className="text-xs mt-1">{result}</p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-1">Time-of-Check Time-of-Use (TOCTOU)</p>
          <p className="text-xs">
            The vulnerability: a resource's state is checked (e.g., "does this file exist? is it safe?"),
            then later used ("open and write to this file"). Between the check and the use,
            another thread or process changes the resource. The application operates on stale assumptions.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Defenses: use atomic operations (open + check in one syscall with O_NOFOLLOW | O_EXCL),
            file locking, or compare file attributes before and after opening.
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
