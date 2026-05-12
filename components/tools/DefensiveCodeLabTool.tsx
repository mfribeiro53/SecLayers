"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

interface Snippet {
  id: number;
  title: string;
  vulnerableCode: string;
  safeCode: string;
  explanation: string;
  vulnerability: string;
}

const SNIPPETS: Snippet[] = [
  {
    id: 1,
    title: "SQL Query Construction",
    vulnerability: "SQL Injection",
    vulnerableCode: `// ❌ String concatenation
String query = "SELECT * FROM users WHERE username = '" + username + "'";
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery(query);`,
    safeCode: `// ✅ Parameterized query
String query = "SELECT * FROM users WHERE username = ?";
PreparedStatement stmt = conn.prepareStatement(query);
stmt.setString(1, username);
ResultSet rs = stmt.executeQuery();`,
    explanation: "String concatenation puts user input directly into SQL syntax. Parameterized queries treat input as data, never as code. Even if username contains ' OR '1'='1, it's searched as a literal string.",
  },
  {
    id: 2,
    title: "DOM Output",
    vulnerability: "XSS",
    vulnerableCode: `// ❌ innerHTML with user data
element.innerHTML = "<h1>Welcome, " + username + "</h1>";`,
    safeCode: `// ✅ textContent sets text, never parses HTML
element.textContent = "Welcome, " + username;`,
    explanation: "innerHTML parses user input as HTML — any <script> tag executes. textContent sets plain text — the literal characters <script> appear on screen but never execute.",
  },
  {
    id: 3,
    title: "Resource Access",
    vulnerability: "IDOR",
    vulnerableCode: `// ❌ No ownership check
const order = await db.orders.findById(req.params.id);
res.json(order);`,
    safeCode: `// ✅ Ownership check
const order = await db.orders.findOne({
  where: { id: req.params.id, userId: req.user.id }
});
if (!order) return res.status(404).json({ error: "Not found" });
res.json(order);`,
    explanation: "Without ownership check, user A can access user B's order by changing the ID. The safe version verifies the order belongs to the authenticated user. Returns 404 to prevent ID enumeration.",
  },
  {
    id: 4,
    title: "Error Handling",
    vulnerability: "Information Leakage",
    vulnerableCode: `// ❌ Leaks internal details
try {
  processPayment(req.body);
} catch (err) {
  res.status(500).json({ error: err.message });
}`,
    safeCode: `// ✅ Safe error response
try {
  processPayment(req.body);
} catch (err) {
  console.error("Payment failed:", err);
  res.status(500).json({ error: "Payment processing failed" });
}`,
    explanation: "Raw error messages can leak stack traces, database schema, and internal paths. The safe version logs the full error server-side but returns a generic message to the client.",
  },
  {
    id: 5,
    title: "Input Handling",
    vulnerability: "Injection",
    vulnerableCode: `// ❌ No validation, no encoding
app.get('/search', (req, res) => {
  const html = '<h1>Results for: ' + req.query.q + '</h1>';
  res.send(html);
});`,
    safeCode: `// ✅ Validation + encoding
app.get('/search', (req, res) => {
  const q = String(req.query.q || '').slice(0, 100);
  const safe = encodeURIComponent(q);
  const html = '<h1>Results for: ' + safe + '</h1>';
  // Better: use a template engine with auto-escaping
  res.send(html);
});`,
    explanation: "The vulnerable version echoes user input directly into HTML (XSS) with no length limit (DoS). The safe version validates length, URL-encodes, and should use a template engine for HTML encoding.",
  },
  {
    id: 6,
    title: "URL Fetching",
    vulnerability: "SSRF",
    vulnerableCode: `// ❌ Fetches any URL from user input
const response = await fetch(req.body.url);
const data = await response.text();
res.json({ preview: data });`,
    safeCode: `// ✅ Validates URL against allow-list
const ALLOWED = ['https://api.example.com'];
const url = new URL(req.body.url);
if (!ALLOWED.some(a => url.origin === a)) {
  return res.status(400).json({ error: "URL not allowed" });
}
// Also: validate resolved IP is not internal
const response = await fetch(url);
res.json({ preview: await response.text() });`,
    explanation: "Without URL validation, an attacker can make the server fetch internal services (cloud metadata, admin panels). The safe version uses an allow-list and should also validate the resolved IP address.",
  },
];

export default function DefensiveCodeLabTool() {
  const [currentSnippet, setCurrentSnippet] = useState(0);
  const [showFix, setShowFix] = useState(false);

  const snippet = SNIPPETS[currentSnippet];

  return (
    <ToolShell title="Defensive Code Lab" description="Compare vulnerable and safe code patterns. Learn to spot and fix common security flaws.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SNIPPETS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCurrentSnippet(i); setShowFix(false); }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${i === currentSnippet ? "bg-slate-800 text-white" : "bg-elevated text-secondary hover:bg-strong"}`}
            >
              {s.title}
            </button>
          ))}
        </div>

        <div className="p-4 rounded-lg border border-subtle bg-surface-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-secondary">{snippet.title}</p>
            <span className="px-2 py-0.5 text-xs rounded bg-danger-muted text-danger font-medium">{snippet.vulnerability}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-danger mb-1">Vulnerable</p>
              <pre className="p-3 rounded-md text-xs font-mono bg-danger-subtle text-danger border border-danger-subtle overflow-x-auto whitespace-pre-wrap">{snippet.vulnerableCode}</pre>
            </div>
            <div>
              <p className="text-xs font-medium text-success mb-1">Safe Pattern</p>
              <pre className="p-3 rounded-md text-xs font-mono bg-success-subtle text-success border border-success-subtle overflow-x-auto whitespace-pre-wrap">{snippet.safeCode}</pre>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-subtle">
            <p className="text-xs text-slate-500">{snippet.explanation}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setCurrentSnippet(Math.max(0, currentSnippet - 1))} disabled={currentSnippet === 0} className="px-3 py-1.5 text-xs rounded bg-elevated text-secondary hover:bg-strong disabled:opacity-40">← Previous</button>
          <button onClick={() => setCurrentSnippet(Math.min(SNIPPETS.length - 1, currentSnippet + 1))} disabled={currentSnippet === SNIPPETS.length - 1} className="px-3 py-1.5 text-xs rounded bg-elevated text-secondary hover:bg-strong disabled:opacity-40">Next →</button>
        </div>
      </div>
    </ToolShell>
  );
}
