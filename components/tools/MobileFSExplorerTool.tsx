"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  content?: string;
  risk: "safe" | "warning" | "danger";
  riskNote: string;
}

function riskClasses(risk: string): string {
  if (risk === "danger") return "bg-red-100 text-red-700";
  if (risk === "warning") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

const FILE_SYSTEM: Record<string, FileEntry[]> = {
  "/": [
    { name: "data", path: "/data", type: "dir", risk: "safe", riskNote: "Standard app data directory" },
    { name: "sdcard", path: "/sdcard", type: "dir", risk: "warning", riskNote: "External storage — readable by any app" },
  ],
  "/data": [
    { name: "shared_prefs", path: "/data/shared_prefs", type: "dir", risk: "warning", riskNote: "SharedPreferences can be world-readable if misconfigured" },
    { name: "databases", path: "/data/databases", type: "dir", risk: "warning", riskNote: "SQLite DBs — check for plaintext sensitive data" },
    { name: "files", path: "/data/files", type: "dir", risk: "safe", riskNote: "Internal storage — private to app on non-rooted devices" },
  ],
  "/data/shared_prefs": [
    { name: "app_prefs.xml", path: "/data/shared_prefs/app_prefs.xml", type: "file", risk: "danger", riskNote: "Contains API key and auth token in plaintext", content: '<?xml version="1.0"?>\n<map>\n  <string name="api_key">sk_live_abc123def456</string>\n  <string name="auth_token">eyJhbGciOiJIUzI1NiJ9...</string>\n  <string name="user_email">admin@example.com</string>\n  <boolean name="is_admin" value="true"/>\n</map>' },
    { name: "user_prefs.xml", path: "/data/shared_prefs/user_prefs.xml", type: "file", risk: "warning", riskNote: "Contains PII in plaintext", content: '<?xml version="1.0"?>\n<map>\n  <string name="name">Alice Johnson</string>\n  <string name="ssn">123-45-6789</string>\n  <string name="dob">1990-05-15</string>\n</map>' },
  ],
  "/data/databases": [
    { name: "app.db", path: "/data/databases/app.db", type: "file", risk: "danger", riskNote: "SQLite DB with unencrypted credentials table", content: "TABLE users:\nid | username | password\n1  | admin    | SuperSecret123!\n2  | alice    | password1\n\nTABLE sessions:\ntoken | expires\neyJ... | 2026-06-01\n\nNo encryption at rest." },
  ],
  "/data/files": [
    { name: "profile.json", path: "/data/files/profile.json", type: "file", risk: "warning", riskNote: "JSON with PII — internal storage but accessible via backup", content: '{"name":"Alice","email":"alice@example.com","phone":"+1-555-0100"}' },
  ],
  "/sdcard": [
    { name: "backups", path: "/sdcard/backups", type: "dir", risk: "danger", riskNote: "Backups on external storage — accessible to any app with READ_EXTERNAL_STORAGE" },
    { name: "logs", path: "/sdcard/logs", type: "dir", risk: "danger", riskNote: "Debug logs on external storage — may contain session tokens" },
  ],
  "/sdcard/backups": [
    { name: "app_backup.db", path: "/sdcard/backups/app_backup.db", type: "file", risk: "danger", riskNote: "Full database backup on external storage — world-readable", content: "Full app database backup including user credentials, session tokens, and PII. Exposed to any app with storage permission." },
  ],
  "/sdcard/logs": [
    { name: "debug.log", path: "/sdcard/logs/debug.log", type: "file", risk: "danger", riskNote: "Debug logs with session tokens and request bodies", content: "[DEBUG] POST /api/login body: {\"user\":\"admin\",\"pass\":\"secret\"}\n[DEBUG] Response: {\"token\":\"eyJhbGciOi...\"}\n[DEBUG] GET /api/user/1 response: {\"ssn\":\"123-45-6789\"}" },
  ],
};

export default function MobileFSExplorerTool() {
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  const entries = FILE_SYSTEM[currentPath] || [];
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <ToolShell title="Mobile File System Explorer" description="Browse a simulated Android file system. See what sensitive data apps store in plaintext.">
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <button onClick={() => { setCurrentPath("/"); setSelectedFile(null); }} className="text-blue-500 hover:text-blue-700">/</button>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-slate-400">/</span>
              <button
                onClick={() => {
                  setCurrentPath("/" + pathParts.slice(0, i + 1).join("/"));
                  setSelectedFile(null);
                }}
                className="text-blue-500 hover:text-blue-700"
              >
                {part}
              </button>
            </span>
          ))}
        </div>

        {/* File listing */}
        <div className="border border-subtle rounded-lg overflow-hidden">
          {entries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => {
                if (entry.type === "dir") {
                  setCurrentPath(entry.path);
                  setSelectedFile(null);
                } else {
                  setSelectedFile(entry);
                }
              }}
              className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-subtle hover:bg-surface-2 transition-colors ${selectedFile?.path === entry.path ? "bg-blue-50" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span>{entry.type === "dir" ? "📁" : "📄"}</span>
                <span className="text-sm text-secondary">{entry.name}</span>
              </div>
              <span className={"text-xs px-2 py-0.5 rounded " + riskClasses(entry.risk)}>
                {entry.risk}
              </span>
            </button>
          ))}
          {entries.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Empty directory</p>
          )}
        </div>

        {/* File preview */}
        {selectedFile && (
          <div className="p-4 rounded-lg border border-subtle bg-surface-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-secondary">{selectedFile.name}</p>
              <span className={"text-xs px-2 py-0.5 rounded " + riskClasses(selectedFile.risk)}>
                {selectedFile.risk}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{selectedFile.riskNote}</p>
            {selectedFile.content && (
              <pre className="p-3 rounded text-xs font-mono bg-slate-900 text-green-400 overflow-x-auto max-h-48 whitespace-pre-wrap">{selectedFile.content}</pre>
            )}
          </div>
        )}

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <p className="font-medium mb-1">Insecure Storage Patterns Found:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>API keys and auth tokens in SharedPreferences (plaintext XML)</li>
            <li>Unencrypted SQLite database with credentials</li>
            <li>PII (SSN, DOB) stored without encryption</li>
            <li>Debug logs on external storage with session tokens</li>
            <li>Database backup on world-readable external storage</li>
          </ul>
        </div>
      </div>
    </ToolShell>
  );
}
