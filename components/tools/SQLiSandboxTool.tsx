"use client";

import { useState, useEffect, useCallback } from "react";
import { ToolShell } from "@/components/ui/ToolShell";
import type initSqlJs from "sql.js";

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;
type Database = initSqlJs.Database;
type QueryResult = initSqlJs.QueryExecResult;
type SqlRow = ReturnType<initSqlJs.Statement["getAsObject"]>;

const SCENARIOS = [
  {
    label: "Normal login — alice",
    username: "alice",
    explanation: "Regular user login. The query is well-formed.",
  },
  {
    label: "Auth bypass — admin' --",
    username: "admin' --",
    explanation:
      "The single quote closes the string. -- comments out the password check. Logged in as admin.",
  },
  {
    label: "Always true — ' OR '1'='1",
    username: "' OR '1'='1",
    explanation:
      "1=1 is always true. Returns ALL users — often logs in as the first one (usually admin).",
  },
  {
    label: "UNION attack — ' UNION SELECT 1,2,3 --",
    username: "' UNION SELECT 1,2,3 --",
    explanation:
      "UNION appends attacker-controlled results. The numbers 1,2,3 help identify which columns appear in output.",
  },
  {
    label: "DROP TABLE — '; DROP TABLE users; --",
    username: "'; DROP TABLE users; --",
    explanation:
      "Statement terminator ; allows a second statement. If the DB supports multi-statement queries, this deletes the users table.",
  },
];

function initDatabase(SQL: SqlJs): Database {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      password TEXT,
      role TEXT
    )
  `);
  db.run(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY,
      name TEXT,
      price REAL
    )
  `);
  db.run(`
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      product_id INTEGER,
      quantity INTEGER
    )
  `);

  db.run(
    "INSERT INTO users VALUES (1, 'admin', 'secret123', 'admin')"
  );
  db.run(
    "INSERT INTO users VALUES (2, 'alice', 'password1', 'user')"
  );
  db.run(
    "INSERT INTO users VALUES (3, 'bob', 'letmein', 'user')"
  );
  db.run(
    "INSERT INTO products VALUES (1, 'Laptop', 1299.99)"
  );
  db.run(
    "INSERT INTO products VALUES (2, 'Mouse', 49.99)"
  );
  db.run(
    "INSERT INTO orders VALUES (1, 2, 1, 1)"
  );

  return db;
}

function buildVulnerableQuery(username: string, password: string): string {
  return `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`;
}

function buildSafeQuery(_username: string, _password: string): string {
  return `SELECT id, username, role FROM users WHERE username = ? AND password = ?`;
}

export default function SQLiSandboxTool() {
  const [SQL, setSQL] = useState<SqlJs | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [constructedQuery, setConstructedQuery] = useState("");
  const [results, setResults] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenarioLabel, setScenarioLabel] = useState<string>("Custom");
  const [mode, setMode] = useState<"vulnerable" | "safe">("vulnerable");

  // Initialize sql.js
  useEffect(() => {
    let cancelled = false;
    import("sql.js")
      .then((mod) => mod.default)
      .then((initSqlJs) =>
        initSqlJs({
          locateFile: (file: string) => `/${file}`,
        })
      )
      .then((SQL) => {
        if (!cancelled) setSQL(SQL);
      })
      .catch((err) => {
        if (!cancelled) setError(`Failed to load SQL engine: ${err.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Create or reset database
  const resetDb = useCallback(() => {
    if (!SQL) return;
    if (db) db.close();
    const newDb = initDatabase(SQL);
    setDb(newDb);
    setResults(null);
    setError(null);
    setConstructedQuery("");
  }, [SQL, db]);

  useEffect(() => {
    if (SQL && !db) {
      const newDb = initDatabase(SQL);
      setDb(newDb);
    }
  }, [SQL, db]);

  // Run query
  const runQuery = useCallback(() => {
    if (!db || !SQL) return;

    const query =
      mode === "vulnerable"
        ? buildVulnerableQuery(username, password)
        : buildSafeQuery(username, password);

    setConstructedQuery(query);
    setError(null);

    try {
      if (mode === "vulnerable") {
        const result = db.exec(query);
        if (result.length > 0) {
          setResults(result[0]);
        } else {
          setResults({ columns: [], values: [] });
        }
      } else {
        // Safe mode: use prepared statement
        const stmt = db.prepare(
          "SELECT id, username, role FROM users WHERE username = ? AND password = ?"
        );
        stmt.bind([username, password]);
        const rows: SqlRow[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        if (rows.length > 0) {
          setResults({
            columns: ["id", "username", "role"],
            values: rows.map((r) => [r.id, r.username, r.role]),
          });
        } else {
          setResults({ columns: [], values: [] });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults(null);
    }
  }, [db, username, password, mode, SQL]);

  // Apply scenario
  const applyScenario = (scenario: (typeof SCENARIOS)[number]) => {
    setUsername(scenario.username);
    setPassword("anything");
    setScenarioLabel(scenario.label);
    setResults(null);
    setError(null);
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") runQuery();
  };

  return (
    <ToolShell
      title="SQL Injection Sandbox"
      description="Type a username and password. See how string concatenation enables injection — and how parameterized queries stop it."
    >
      <div className="space-y-6">
        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Mode:</span>
          <button
            onClick={() => setMode("vulnerable")}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === "vulnerable"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Vulnerable (String Concat)
          </button>
          <button
            onClick={() => setMode("safe")}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              mode === "safe"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Safe (Parameterized)
          </button>
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setScenarioLabel("Custom");
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. alice"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setScenarioLabel("Custom");
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. letmein"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={runQuery}
            disabled={!db}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run Query
          </button>
          <button
            onClick={resetDb}
            disabled={!SQL}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-200 transition-colors"
          >
            Reset Database
          </button>
        </div>

        {/* Scenarios */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">
            Try these scenarios:
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.label}
                onClick={() => applyScenario(s)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  scenarioLabel === s.label
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {scenarioLabel !== "Custom" && (
            <p className="mt-2 text-xs text-slate-500 italic">
              {
                SCENARIOS.find((s) => s.label === scenarioLabel)
                  ?.explanation
              }
            </p>
          )}
        </div>

        {/* Constructed query */}
        {constructedQuery && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Constructed SQL
            </p>
            <pre
              className={`p-3 rounded-md text-xs font-mono overflow-x-auto whitespace-pre-wrap ${
                mode === "vulnerable"
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {constructedQuery}
            </pre>
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Results ({results.values.length} row
              {results.values.length !== 1 ? "s" : ""})
            </p>
            {results.values.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {results.columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.values.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }
                      >
                        {row.map((val, j) => (
                          <td
                            key={j}
                            className="px-3 py-1.5 text-slate-700 border-b border-slate-100 font-mono text-xs"
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No rows returned.</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm font-mono">
            <p className="font-medium text-amber-900 mb-1">Database Error</p>
            {error}
          </div>
        )}

        {/* Loading state */}
        {!SQL && !error && (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            Loading SQL engine (WASM)...
          </div>
        )}
      </div>
    </ToolShell>
  );
}
