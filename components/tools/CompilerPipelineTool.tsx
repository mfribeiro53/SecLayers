"use client";
import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

// ── Types ──────────────────────────────────────────────────────────────────────

type ScenarioId = "dead-store" | "asan" | "jit-spray";

interface PipelineStage {
  id: string;
  label: string;
}

interface ScenarioOption {
  id: string;
  label: string;
}

interface ScenarioOutput {
  title: string;
  content: string;
  status: "safe" | "vuln";
  note: string;
  memory: string | null;
  memoryLabel: string | null;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  pipeline: PipelineStage[];
  activeStages: string[];
  source: string;
  controlLabel: string;
  options: ScenarioOption[];
  outputs: Record<string, ScenarioOutput>;
  insight: string;
}

// ── Pipelines ──────────────────────────────────────────────────────────────────

const AOT_PIPELINE: PipelineStage[] = [
  { id: "source",   label: "Source"    },
  { id: "ast",      label: "Parser"    },
  { id: "ir",       label: "IR"        },
  { id: "opt",      label: "Optimizer" },
  { id: "codegen",  label: "Code Gen"  },
  { id: "asm",      label: "Assembler" },
  { id: "link",     label: "Linker"    },
];

const JIT_PIPELINE: PipelineStage[] = [
  { id: "script",   label: "Script"       },
  { id: "bytecode", label: "Bytecode"     },
  { id: "jit",      label: "JIT Compiler" },
  { id: "native",   label: "Native Code"  },
  { id: "exec",     label: "Execute"      },
];

// ── Scenario data ──────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  // ── Scenario 1: Dead Store Elimination ───────────────────────────────────────
  {
    id: "dead-store",
    title: "Dead Store Elimination",
    pipeline: AOT_PIPELINE,
    activeStages: ["opt"],
    source:
`void destroy_session(session_t *s) {
    // wipe secret key before freeing
    memset(s->key, 0, 32);
    free(s);
}`,
    controlLabel: "Optimization level",
    options: [
      { id: "-O0", label: "-O0  (debug build)"       },
      { id: "-O2", label: "-O2  (production build)"  },
    ],
    outputs: {
      "-O0": {
        title: "Compiled output at -O0",
        content:
`destroy_session:
    push   rbp
    mov    rbp, rsp
    mov    QWORD [rbp-8], rdi       ; save 's'

    ; ── memset(s->key, 0, 32) ──────────────────
    mov    rax, QWORD [rbp-8]
    lea    rdi, [rax + KEY_OFFSET]
    xor    esi, esi                  ; fill value = 0
    mov    edx, 32                   ; length = 32
    call   memset                    ; ✓ present

    ; ── free(s) ────────────────────────────────
    mov    rdi, QWORD [rbp-8]
    call   free
    pop    rbp
    ret`,
        status: "safe",
        note: "memset is present in the output. Key bytes are zeroed before free().",
        memory: "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00",
        memoryLabel: "s->key in freed memory",
      },
      "-O2": {
        title: "Compiled output at -O2",
        content:
`destroy_session:
    ; ── memset(s->key, 0, 32) ──────────────────
    ;
    ;   [ELIMINATED — dead store]
    ;
    ;   Optimizer reasoning:
    ;     s->key is never read after this point.
    ;     The write has no observable effect on
    ;     program output per the C abstract machine.
    ;     Removing it is legal and produces faster
    ;     code with no semantic change.
    ;
    ; ── free(s) ────────────────────────────────
    jmp    free                      ; tail-call`,
        status: "vuln",
        note: "memset eliminated. Key bytes survive in freed memory and are recoverable via UAF, heap spray, or core dump.",
        memory: "a3 f2 91 0c 4b e7 23 d1 88 5a c0 f4 12 9e 67 b3",
        memoryLabel: "s->key in freed memory (secret NOT erased)",
      },
    },
    insight:
      "The compiler is correct by the C standard — a write with no subsequent read is a dead store and may be removed. Use memset_s() (C11) or OPENSSL_cleanse(), which are contractually non-elision-safe. A volatile cast or compiler memory barrier works today but is not formally guaranteed.",
  },

  // ── Scenario 2: Sanitizer Instrumentation ────────────────────────────────────
  {
    id: "asan",
    title: "Sanitizer Instrumentation",
    pipeline: AOT_PIPELINE,
    activeStages: ["ir"],
    source:
`void read_config(const char *input) {
    char buf[8];
    strncpy(buf, input, 8);
    // off-by-two: buf is 8 bytes (indices 0–7)
    char last = buf[10];
    use_value(last);
}`,
    controlLabel: "Compiler flags",
    options: [
      { id: "plain",  label: "default  (no sanitizer)"    },
      { id: "asan",   label: "-fsanitize=address  (ASan)" },
    ],
    outputs: {
      "plain": {
        title: "Runtime (no sanitizer)",
        content:
`$ ./config_parser <<< "AAAAAAAA"

[no output — program continues normally]

The OOB read at buf[10] succeeds silently.
buf is at rbp-0x10; buf[10] = *(rbp-0x10+10)
= *(rbp+0x06) — inside the saved rbp region.

  buf[0..7]  = 41 41 41 41 41 41 41 41  ('A')
  buf[8]     = 00  (strncpy null-pad)
  buf[9]     = 7f  (saved rbp byte 1)
  buf[10]    = ff  (saved rbp byte 2) ← read here

use_value() receives 0xff — a stale stack byte.
No crash. No diagnostic. Silent memory disclosure.`,
        status: "vuln",
        note: "Silent OOB read. The bug exists and leaks stack data but the program produces no diagnostic and does not crash.",
        memory: null,
        memoryLabel: null,
      },
      "asan": {
        title: "ASan IR instrumentation + runtime report",
        content:
`; Instrumentation injected at the IR stage,
; before code generation, for every load/store:
;
;   %shadow = @__asan_shadow(buf + 10)
;   %poisoned = icmp ne i8 %shadow, 0
;   br i1 %poisoned, %report, %ok
; %report:
;   call @__asan_report_load1(i64 addr)
;   unreachable
; %ok:
;   %last = load i8* (buf + 10)   ; original load

==24719==ERROR: AddressSanitizer: stack-buffer-overflow
READ of size 1 at 0x7ffc2a3b1148 thread T0
    #0 read_config      config.c:5
    #1 main             config.c:12

Address 0x7ffc2a3b1148 is in the stack of T0
  in frame: read_config  config.c:1
    Objects: [32, 40) 'buf'
             ^^ access at offset 42 — overflows by 2`,
        status: "safe",
        note: "ASan injected a shadow-memory check at the IR stage. The check fires at runtime and reports the exact file, line, and overrun size.",
        memory: null,
        memoryLabel: null,
      },
    },
    insight:
      "Sanitizers are injected at the IR stage — before machine code is generated — so they instrument every load and store, regardless of which source construct produced it. The ~2× overhead makes them test-only tools, but they produce zero false positives on exercised paths: if ASan reports it, the bug is real.",
  },

  // ── Scenario 3: JIT Spraying / Constant Blinding ─────────────────────────────
  {
    id: "jit-spray",
    title: "JIT Spraying & Constant Blinding",
    pipeline: JIT_PIPELINE,
    activeStages: ["jit", "native"],
    source:
`// Attacker-controlled JavaScript
// Repeated 10,000× to spray the JIT heap

var a = 0x909090c3 ^ 0x909090c3;
var b = 0x909090c3 ^ 0x909090c3;
var c = 0x909090c3 ^ 0x909090c3;
var d = 0x909090c3 ^ 0x909090c3;

// The ^ 0x... makes this look like
// normal computation — not shellcode.`,
    controlLabel: "JIT engine setting",
    options: [
      { id: "no-blind", label: "constant blinding: OFF" },
      { id: "blind",    label: "constant blinding: ON"  },
    ],
    outputs: {
      "no-blind": {
        title: "JIT-compiled native bytes (blinding OFF)",
        content:
`; Each assignment compiles to:
;
;   XOR eax, 0x909090c3  →  35 c3 90 90 90
;   XOR eax, 0x909090c3  →  35 c3 90 90 90
;   (repeated 10,000×)
;
; Attacker corrupts any indirect branch to land
; at offset +1 into the sprayed region:
;
;   offset +0:  35  →  XOR eax, ...    (full instr)
;   offset +1:  c3  →  RET             ← return gadget
;               90  →  NOP
;               90  →  NOP
;               90  →  NOP
;               35  →  XOR eax, ...
;               c3  →  RET             ← another gadget
;
; JIT pages are already executable (W^X is open
; during compilation). No new executable write
; needed — the JIT compiler did the work.
;
; [EXPLOIT: reliable RET gadgets in spray region]`,
        status: "vuln",
        note: "Large immediates appear verbatim in executable JIT pages. Jumping mid-instruction reinterprets the bytes as a NOP sled + RET chain.",
        memory: null,
        memoryLabel: null,
      },
      "blind": {
        title: "JIT-compiled native bytes (blinding ON)",
        content:
`; Per-session random key generated at startup:
;   key = 0x4a17f23e  (different every run)
;
; Each immediate is masked before emission:
;   plain:   0x909090c3
;   masked:  0x909090c3 ^ 0x4a17f23e = 0xda8762fd
;
; Emitted code pair (XORs cancel at runtime):
;
;   XOR eax, 0xda8762fd  →  35 fd 62 87 da
;   XOR eax, 0x4a17f23e  →  35 3e f2 17 4a
;
; Bytes in executable memory:
;   35 fd 62 87 da 35 3e f2 17 4a 35 fd 62 ...
;
; Jumping to any offset mid-instruction:
;   +1: fd 62 87 da ...  →  random instructions
;   +2: 62 87 da 35 ...  →  random instructions
;
; No predictable NOP sled. No reliable gadgets.
; Key is unknown to the attacker.
;
; [MITIGATED: no exploitable byte sequences]`,
        status: "safe",
        note: "Constant blinding randomises all large immediates with a per-session key. The attacker cannot predict in-memory byte sequences without knowing the key.",
        memory: null,
        memoryLabel: null,
      },
    },
    insight:
      "JIT compilers must write machine code to memory and then execute it — inherently requiring a writable+executable window that violates W^X. Constant blinding is the primary JIT-specific mitigation: immediates are XOR-masked with a random key so attacker-controlled script values produce unpredictable bytes in executable memory.",
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function CompilerPipelineTool() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("dead-store");
  const [selections, setSelections] = useState<Record<ScenarioId, string>>({
    "dead-store": "-O0",
    "asan":       "plain",
    "jit-spray":  "no-blind",
  });

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;
  const selected = selections[scenarioId];
  const output = scenario.outputs[selected];

  function selectOption(optId: string) {
    setSelections((prev) => ({ ...prev, [scenarioId]: optId }));
  }

  return (
    <ToolShell
      title="Compiler Pipeline Explorer"
      description="Three scenarios where the compilation pipeline changes security behaviour."
    >
      <div className="space-y-5">

        {/* ── Scenario tabs ── */}
        <div className="flex gap-2 flex-wrap">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenarioId(s.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${scenarioId === s.id
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                  : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
                }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* ── Pipeline visualization ── */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
            compilation pipeline
          </p>
          <div className="flex items-center flex-wrap gap-y-1">
            {scenario.pipeline.map((stage, i) => {
              const isActive = scenario.activeStages.includes(stage.id);
              return (
                <div key={stage.id} className="flex items-center">
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors
                      ${isActive
                        ? "bg-orange-500/25 text-orange-300 border border-orange-500/50 font-semibold"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                      }`}
                  >
                    {stage.label}
                    {isActive && (
                      <span className="ml-1 text-orange-400">←</span>
                    )}
                  </div>
                  {i < scenario.pipeline.length - 1 && (
                    <span className="text-[var(--text-muted)] mx-1 text-[10px]">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Source + control | Output ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                source
              </p>
              <pre className="text-xs font-mono bg-[#0a0d18] border border-[var(--border-subtle)] rounded-lg p-3 overflow-x-auto leading-relaxed text-[var(--text-secondary)] whitespace-pre">
                {scenario.source}
              </pre>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                {scenario.controlLabel}
              </p>
              <div className="space-y-1.5">
                {scenario.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  const optOutput = scenario.outputs[opt.id];
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectOption(opt.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-mono
                        flex items-center justify-between gap-2 transition-colors
                        ${isSelected
                          ? "bg-[var(--accent-soft)] border border-[var(--accent)]/50 text-[var(--text-primary)]"
                          : "bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                        }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-sans
                          ${optOutput.status === "safe"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                      >
                        {optOutput.status === "safe" ? "safe" : "vuln"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Memory state — only scenario 1 */}
            {output.memory && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  {output.memoryLabel}
                </p>
                <div
                  className={`font-mono text-xs p-3 rounded-lg border leading-relaxed
                    ${output.status === "safe"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : "bg-red-500/10 border-red-500/25 text-red-300"
                    }`}
                >
                  {output.memory}
                </div>
              </div>
            )}
          </div>

          {/* Right column — terminal output */}
          <div className="lg:col-span-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              {output.title}
            </p>
            <pre
              className={`text-xs font-mono rounded-lg p-4 overflow-x-auto overflow-y-auto
                leading-relaxed h-72 whitespace-pre border
                ${output.status === "safe"
                  ? "bg-[#060d0a] border-emerald-900/40 text-[#8ec99b]"
                  : "bg-[#0d0608] border-red-900/40 text-[#c98e8e]"
                }`}
            >
              {output.content}
            </pre>
            <p
              className={`text-xs mt-2 leading-relaxed
                ${output.status === "safe" ? "text-emerald-400/80" : "text-red-400/80"}`}
            >
              {output.note}
            </p>
          </div>
        </div>

        {/* ── Insight callout ── */}
        <div className="p-3 rounded-lg bg-orange-500/8 border border-orange-500/20 text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-orange-300">Key insight: </span>
          {scenario.insight}
        </div>

      </div>
    </ToolShell>
  );
}
