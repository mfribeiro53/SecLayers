"use client";

import { useState, useRef, useEffect } from "react";
import { HintPanel, SolvedBanner } from "./_shared";

const FLAG = "SECLAYER{d3f4ultP@ss_pl41ntext}";

const HINTS = [
  "You have root ADB access. Start by listing the app's data directory: ls /data/data/com.banklite.app/",
  "SharedPreferences are stored in a subdirectory called shared_prefs/. List its contents.",
  "cat the XML file you find — SharedPreferences are stored as plain XML with no encryption.",
];

const FS: Record<string, string[]> = {
  "/data/data/com.banklite.app": ["shared_prefs/", "databases/", "cache/", "files/"],
  "/data/data/com.banklite.app/shared_prefs": ["user_prefs.xml", "app_config.xml"],
  "/data/data/com.banklite.app/databases": ["transactions.db", "session.db"],
  "/data/data/com.banklite.app/cache": ["img_cache/"],
  "/data/data/com.banklite.app/files": ["debug.log"],
};

const FILE_CONTENTS: Record<string, { content: string; isFlag: boolean }> = {
  "/data/data/com.banklite.app/shared_prefs/user_prefs.xml": {
    isFlag: true,
    content: `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="username">alice@banklite.com</string>
    <string name="password">${FLAG}</string>
    <boolean name="remember_me" value="true" />
    <string name="last_login">2026-05-10T09:34:22Z</string>
</map>`,
  },
  "/data/data/com.banklite.app/shared_prefs/app_config.xml": {
    isFlag: false,
    content: `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>
<map>
    <string name="api_url">https://api.banklite.com/v2</string>
    <boolean name="debug_mode" value="false" />
    <string name="theme">dark</string>
</map>`,
  },
  "/data/data/com.banklite.app/databases/transactions.db": {
    isFlag: false,
    content: `Error: binary file — use sqlite3 to open.
  $ sqlite3 transactions.db
  sqlite> .tables
  transactions  accounts
  sqlite> SELECT * FROM accounts LIMIT 1;
  1|alice|****|2026-01-01`,
  },
  "/data/data/com.banklite.app/files/debug.log": {
    isFlag: false,
    content: `2026-05-10 09:34:21 [DEBUG] MainActivity: onCreate
2026-05-10 09:34:22 [DEBUG] AuthManager: login attempt for alice@banklite.com
2026-05-10 09:34:22 [INFO]  AuthManager: login successful
2026-05-10 09:34:22 [DEBUG] PrefsManager: saved credentials to SharedPreferences`,
  },
};

function resolvePath(cwd: string, arg: string): string {
  if (arg.startsWith("/")) return arg.replace(/\/+$/, "");
  return (cwd + "/" + arg).replace(/\/+$/, "");
}

function runCommand(
  input: string,
  cwd: string,
  inShell: boolean,
): { output: string; newCwd: string; newInShell: boolean; solved: boolean } {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0];
  let solved = false;

  if (!inShell) {
    if (cmd === "adb" && parts[1] === "devices") {
      return { output: "List of devices attached\nemulator-5554\tdevice (rooted)", newCwd: cwd, newInShell: false, solved };
    }
    if (cmd === "adb" && parts[1] === "shell") {
      return { output: "root@emulator-5554:/ #", newCwd: "/", newInShell: true, solved };
    }
    if (cmd === "adb") {
      return { output: `adb: unknown command '${parts[1]}'`, newCwd: cwd, newInShell: false, solved };
    }
    return { output: `${cmd}: command not found (run 'adb shell' first)`, newCwd: cwd, newInShell: false, solved };
  }

  if (cmd === "exit") {
    return { output: "", newCwd: "/", newInShell: false, solved };
  }

  if (cmd === "ls") {
    const target = parts[1] ? resolvePath(cwd, parts[1]) : cwd;
    const entries = FS[target];
    if (entries) return { output: entries.join("  "), newCwd: cwd, newInShell: true, solved };
    return { output: `ls: cannot access '${target}': No such file or directory`, newCwd: cwd, newInShell: true, solved };
  }

  if (cmd === "cd") {
    const target = parts[1] ? resolvePath(cwd, parts[1]) : "/";
    if (FS[target]) return { output: "", newCwd: target, newInShell: true, solved };
    return { output: `cd: ${target}: No such file or directory`, newCwd: cwd, newInShell: true, solved };
  }

  if (cmd === "cat") {
    if (!parts[1]) return { output: "cat: missing operand", newCwd: cwd, newInShell: true, solved };
    const target = resolvePath(cwd, parts[1]);
    const file = FILE_CONTENTS[target];
    if (file) {
      solved = file.isFlag;
      return { output: file.content, newCwd: cwd, newInShell: true, solved };
    }
    return { output: `cat: ${parts[1]}: No such file or directory`, newCwd: cwd, newInShell: true, solved };
  }

  if (cmd === "pwd") return { output: cwd, newCwd: cwd, newInShell: true, solved };

  if (cmd === "whoami") return { output: "root", newCwd: cwd, newInShell: true, solved };

  if (cmd === "clear") return { output: "\x1Bclear", newCwd: cwd, newInShell: true, solved };

  return { output: `${cmd}: not found`, newCwd: cwd, newInShell: true, solved };
}

type Line = { text: string; kind: "input" | "output" | "prompt" };

export function MobileStorageLabTool() {
  const [lines, setLines] = useState<Line[]>([
    { text: "# Rooted Android emulator — ADB session", kind: "output" },
    { text: "# Objective: find plaintext credentials stored by com.banklite.app", kind: "output" },
    { text: "", kind: "output" },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/");
  const [inShell, setInShell] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function prompt() {
    if (!inShell) return "$ ";
    return `root@emulator:${cwd} # `;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const result = runCommand(input, cwd, inShell);
    const newLines: Line[] = [
      ...lines,
      { text: prompt() + input, kind: "input" },
    ];

    if (result.output === "\x1Bclear") {
      setLines([]);
    } else if (result.output) {
      newLines.push({ text: result.output, kind: "output" });
      setLines(newLines);
    } else {
      setLines(newLines);
    }

    setCwd(result.newCwd);
    setInShell(result.newInShell);
    if (result.solved && !solved) setSolved(true);
    setInput("");
  }

  return (
    <div className="tool-surface space-y-5">
      <div
        className="p-4 rounded-lg"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>SCENARIO</p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          You have physical access to a rooted Android device running{" "}
          <code style={{ color: "#a5b4fc" }}>com.banklite.app</code>. The app stores user
          credentials locally. Use the ADB shell to locate and read them.
        </p>
      </div>

      {/* Terminal */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--border-subtle)" }}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          className="flex items-center gap-1.5 px-4 py-2"
          style={{ background: "#1a1d2e", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            adb — attacker@kali
          </span>
        </div>
        <div
          className="p-4 font-mono text-xs space-y-0.5 overflow-y-auto"
          style={{ background: "#0a0d18", minHeight: "220px", maxHeight: "320px" }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className="whitespace-pre-wrap break-all leading-relaxed"
              style={{
                color:
                  line.kind === "input"
                    ? "#a5b4fc"
                    : line.text.includes(FLAG)
                    ? "#6ee7b7"
                    : "var(--text-secondary)",
              }}
            >
              {line.text}
            </div>
          ))}
          <form onSubmit={submit} className="flex items-center gap-1">
            <span style={{ color: "#a5b4fc" }}>{prompt()}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono text-xs"
              style={{ color: "#e2e8f0" }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>
          <div ref={bottomRef} />
        </div>
      </div>

      <HintPanel
        hints={HINTS}
        hintsUsed={hintsUsed}
        onReveal={() => setHintsUsed((h) => Math.min(h + 1, HINTS.length))}
      />

      {solved && (
        <SolvedBanner
          flag={FLAG}
          explanation="The app stored the user's plaintext password in SharedPreferences — an unencrypted XML file on internal storage. On a rooted device, any process (or physical attacker with ADB access) can read it. The fix: never store passwords; use short-lived tokens instead, and store those in EncryptedSharedPreferences backed by the Android Keystore."
        />
      )}
    </div>
  );
}
