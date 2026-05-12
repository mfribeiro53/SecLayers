"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Record {
  id: number;
  owner: string;
  type: string;
  data: string;
}

const DATABASE: Record[] = [
  { id: 1001, owner: "alice", type: "Bank Account", data: "Balance: $12,450.00 | Account #****4521" },
  { id: 1002, owner: "alice", type: "Email", data: "From: hr@company.com | Subject: Salary Review" },
  { id: 1003, owner: "bob", type: "Bank Account", data: "Balance: $3,200.00 | Account #****7832" },
  { id: 1004, owner: "bob", type: "Health Record", data: "Patient: Bob | Diagnosis: Confidential" },
  { id: 1005, owner: "admin", type: "Admin Dashboard", data: "Flag: CTF{idor_found_2024}" },
  { id: 1006, owner: "alice", type: "Order", data: "Order #ORD-901 | Items: Laptop ($1,299.99)" },
  { id: 1007, owner: "bob", type: "Order", data: "Order #ORD-902 | Items: Mouse ($49.99)" },
  { id: 1008, owner: "admin", type: "User Database", data: "All user records — PII, passwords, roles" },
];

type Role = "alice" | "bob" | "admin" | "anonymous";

export default function IdorExplorerTool() {
  const [role, setRole] = useState<Role>("alice");
  const [recordId, setRecordId] = useState("1001");
  const [hasAuthCheck, setHasAuthCheck] = useState(false);
  const [result, setResult] = useState<{ record: Record | null; message: string } | null>(null);

  const lookup = () => {
    const id = parseInt(recordId, 10);
    if (isNaN(id)) {
      setResult({ record: null, message: "Invalid ID — must be a number." });
      return;
    }

    const record = DATABASE.find((r) => r.id === id);

    if (!record) {
      setResult({ record: null, message: "No record found with that ID." });
      return;
    }

    // Authorization check
    if (hasAuthCheck && role !== "admin") {
      if (record.owner !== role) {
        setResult({
          record: null,
          message: `Access denied. Record ${id} belongs to "${record.owner}" — your role is "${role}". Authorization check blocked the access.`,
        });
        return;
      }
    }

    // Anonymous can't access anything
    if (role === "anonymous") {
      setResult({
        record: null,
        message: "Anonymous users cannot access any records. Please log in.",
      });
      return;
    }

    setResult({
      record,
      message: hasAuthCheck
        ? `Access granted. You are "${role}" and this record belongs to "${record.owner}". Authorization passed.`
        : `⚠️ NO authorization check! You are "${role}" but the server didn't verify ownership. You accessed a record belonging to "${record.owner}". This is IDOR.`,
    });
  };

  return (
    <ToolShell
      title="IDOR Explorer"
      description="Switch roles, request different record IDs, and see what leaks when authorization checks are missing."
    >
      <div className="space-y-5">
        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Your Role
          </label>
          <div className="flex flex-wrap gap-1 bg-elevated p-1 rounded-lg w-fit">
            {(["alice", "bob", "admin", "anonymous"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setResult(null);
                }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors capitalize ${
                  role === r
                    ? "bg-surface-2 text-secondary shadow-sm"
                    : "text-slate-500 hover:text-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Records reference */}
        <div className="p-3 rounded-lg bg-surface-2 border border-subtle text-xs">
          <p className="font-medium text-secondary mb-1">Known Record IDs:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {DATABASE.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRecordId(String(r.id));
                  setResult(null);
                }}
                className={`text-left px-2 py-1 rounded hover:bg-strong transition-colors ${
                  String(r.id) === recordId ? "bg-info-muted text-info" : "text-secondary"
                }`}
              >
                <span className="font-mono">{r.id}</span>{" "}
                <span className="text-slate-400">({r.owner})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Request */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              Record ID
            </label>
            <input
              type="text"
              value={recordId}
              onChange={(e) => {
                setRecordId(e.target.value);
                setResult(null);
              }}
              className="w-32 px-3 py-2 border border-subtle rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={lookup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            GET /api/records/{recordId || "..."}
          </button>
        </div>

        {/* Auth toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAuthCheck}
            onChange={(e) => {
              setHasAuthCheck(e.target.checked);
              setResult(null);
            }}
            className="rounded border-subtle text-info focus:ring-blue-500"
          />
          <span className="text-sm text-secondary">
            Enable Ownership Check (server verifies record belongs to your role)
          </span>
        </label>

        {/* Result */}
        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.message.includes("⚠️")
                ? "bg-danger-subtle border-danger-subtle"
                : result.record
                ? "bg-success-subtle border-success-subtle"
                : "bg-surface-2 border-subtle"
            }`}
          >
            {result.record ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-secondary">
                    {result.record.type}
                  </p>
                  <span className="text-xs text-slate-400">ID: {result.record.id}</span>
                </div>
                <p className="text-sm text-secondary">{result.record.data}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Owner: {result.record.owner}
                </p>
              </div>
            ) : (
              <p className="text-sm text-secondary">{result.message}</p>
            )}
            <p
              className={`text-xs mt-2 pt-2 border-t ${
                result.message.includes("⚠️")
                  ? "border-danger-subtle text-danger"
                  : result.record
                  ? "border-success-subtle text-success"
                  : "border-subtle text-slate-500"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
