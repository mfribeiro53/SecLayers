"use client";

import { useState, useCallback, useRef } from "react";

interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide(opts: { indexURL: string }): Promise<PyodideInterface>;
  }
}

export type PyodideStatus = "idle" | "loading" | "ready" | "error";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

export function usePyodide() {
  const [status, setStatus] = useState<PyodideStatus>("idle");
  const pyRef = useRef<PyodideInterface | null>(null);

  const load = useCallback(async () => {
    if (pyRef.current || status === "loading") return;
    setStatus("loading");
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = PYODIDE_CDN + "pyodide.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Pyodide script"));
          document.head.appendChild(s);
        });
      }
      pyRef.current = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [status]);

  const runPython = useCallback(async (code: string): Promise<string> => {
    if (!pyRef.current) throw new Error("Pyodide not ready");
    const result = await pyRef.current.runPythonAsync(code);
    return result == null ? "" : String(result);
  }, []);

  return { status, load, runPython };
}
