"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

export default function SsrfVisualizerTool() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const checkUrl = () => {
    if (!url.trim()) return;
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      const scheme = parsed.protocol.replace(":", "");

      const blockedSchemes = ["file", "gopher", "dict", "ftp"];
      const privateRanges = [
        { prefix: "127.", label: "localhost" },
        { prefix: "10.", label: "private network (10.0.0.0/8)" },
        { prefix: "172.16.", label: "private network (172.16.0.0/12)" },
        { prefix: "192.168.", label: "private network (192.168.0.0/16)" },
        { prefix: "169.254.", label: "cloud metadata endpoint" },
        { prefix: "0.0.0.0", label: "non-routable" },
      ];

      if (blockedSchemes.includes(scheme)) {
        setResult(`❌ BLOCKED: ${scheme}:// scheme is dangerous. Attackers use it to read local files or interact with internal services.`);
        return;
      }

      for (const range of privateRanges) {
        if (hostname.startsWith(range.prefix)) {
          setResult(`❌ BLOCKED: ${hostname} is ${range.label}. If the server is cloud-hosted, this could expose metadata credentials or internal services.`);
          return;
        }
      }

      if (hostname === "localhost" || hostname === "metadata.google.internal") {
        setResult(`❌ BLOCKED: ${hostname} resolves to internal services. SSRF attackers target this to access cloud metadata or local services.`);
        return;
      }

      setResult(`✅ Allowed: ${url} appears to be a public URL. But remember — allow-lists are stronger than block-lists. Validate that this URL is from an expected domain.`);
    } catch {
      setResult("Invalid URL format. Enter a full URL like https://example.com.");
    }
  };

  const targets = [
    { label: "AWS Metadata", url: "http://169.254.169.254/latest/meta-data/" },
    { label: "Local Redis", url: "http://localhost:6379/" },
    { label: "Local file", url: "file:///etc/passwd" },
    { label: "Internal API", url: "http://10.0.0.5/admin" },
    { label: "Public site", url: "https://api.github.com" },
  ];

  return (
    <ToolShell title="SSRF Visualizer" description="Enter a URL and see whether it would be allowed or blocked by SSRF defenses.">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target URL</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkUrl()} placeholder="http://169.254.169.254/latest/meta-data/" className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={checkUrl} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Check URL</button>
          {targets.map((t) => (
            <button key={t.label} onClick={() => { setUrl(t.url); setResult(null); }} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200">{t.label}</button>
          ))}
        </div>
        {result && (
          <div className={`p-4 rounded-lg border text-sm ${result.startsWith("✅") ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {result}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
