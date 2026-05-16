import type { ToolMeta } from "./types";

export const systemsMeta: Record<string, ToolMeta> = {
  StackFrameTool: {
    summary: "Inspect a C function's stack frame in real time: see local variables, the saved frame pointer, and the return address laid out in memory.",
    quickStart: [
      "Call a function and expand the stack frame that appears",
      "Hover each region to see its offset from the frame pointer",
      "Identify the return address — this is what a stack overflow overwrites",
    ],
    help: {
      goal: "The memory layout of a C stack frame — where local variables, the saved frame pointer, and the return address live relative to each other — and why the return address is the primary overflow target.",
      steps: [
        "Call a function and expand the new stack frame in the visualizer",
        "Hover each memory region to read its byte offset relative to the frame pointer (rbp)",
        "Identify the return address — it sits just above the saved frame pointer",
        "Note the buffer on the stack and which direction it grows when written",
      ],
      lookFor: "Stack frames grow toward lower addresses. Buffers fill from low to high. A write past the end of a buffer overwrites the canary first, then the saved frame pointer, then the return address — in that exact order. The return address is the attacker's target because it controls where execution jumps on function return.",
    },
  },
  OverflowAnimatorTool: {
    summary: "Overflow a stack buffer byte by byte and watch the return address get overwritten. Enable a stack canary and see the runtime detect the corruption before the function returns.",
    quickStart: [
      "Set the input length to exactly buffer_size to fill the buffer",
      "Increase length by 1 past the canary — see the canary change color",
      "Increase further to reach the return address — observe the overwrite",
    ],
    help: {
      goal: "How a stack buffer overflow overwrites adjacent memory byte by byte — through the canary, the saved frame pointer, to the return address — and how a stack canary detects corruption before the function returns.",
      steps: [
        "Set input length to exactly buffer_size — the buffer fills, nothing else changes",
        "Increase by enough to reach the canary position — watch the canary value change color",
        "Continue increasing — see the saved rbp corrupted, then the return address overwritten",
        "Enable the stack canary — the runtime checks it on function return and aborts before jumping",
      ],
      lookFor: "The canary detects corruption at return time — it does not prevent the overflow itself. An attacker who can leak the canary value first can overwrite it with the original value, bypassing detection entirely. This is why canaries are combined with ASLR.",
    },
  },
  PrintfSimulatorTool: {
    summary: "Pass a format string as user input and observe %x leaking stack values and %n writing to arbitrary memory. See why format-string arguments must never be user-controlled.",
    quickStart: [
      "Enter %x.%x.%x as input and watch stack values leak in the output",
      "Use %08x to read the canary value from the stack",
      "Try a %n write and see the target memory location change",
    ],
    help: {
      goal: "How format string vulnerabilities let user-controlled input read from and write to arbitrary memory — and why the format argument to printf must never be a user-controlled string.",
      steps: [
        "Enter %x.%x.%x as input and observe stack values leaked in hexadecimal",
        "Use %08x repeatedly to walk the stack and locate the canary or a return address",
        "Try %s — it dereferences a stack pointer as a string address; a wrong address crashes",
        "Use %n to write the character-count integer to the address currently on the argument stack",
      ],
      lookFor: "%x reads 4 bytes from the varargs stack frame without consuming a real argument. %s dereferences a stack pointer as a C string — useful for leaking strings but will crash on a bad pointer. %n is the write primitive that makes format string bugs exploitable for code execution.",
    },
  },
  HeapVisualizerTool: {
    summary: "Allocate and free heap chunks, trigger a use-after-free, and redirect a function pointer. Watch tcache bin recycling make freed memory reachable again.",
    quickStart: [
      "Allocate two chunks, then free the first",
      "Allocate a same-sized chunk — observe it reuse the freed slot",
      "Trigger a use-after-free by accessing the original pointer after reallocation",
    ],
    help: {
      goal: "How the heap allocator recycles freed memory, how a use-after-free creates a dangling pointer into recycled memory, and how an attacker uses that to overwrite a function pointer.",
      steps: [
        "Allocate chunk A and chunk B of the same size",
        "Free chunk A — it enters the tcache freelist",
        "Allocate chunk C of the same size — observe it reuses chunk A's slot",
        "Access the original pointer to A (now pointing at C's data) — this is the use-after-free",
        "Write a function pointer address into A and call it — observe execution redirection",
      ],
      lookFor: "The tcache returns the most recently freed same-size chunk first. A use-after-free is only exploitable if the attacker controls what gets allocated into the recycled slot. Double-free corrupts the freelist metadata and can cause the same slot to be allocated twice.",
    },
  },
  MitigationToggleTool: {
    summary: "Toggle ASLR, NX/DEP, stack canaries, PIE, and RELRO independently and see which exploit techniques each mitigation defeats — and which combinations close all known primitive gaps.",
    quickStart: [
      "Disable all mitigations and run a ret2shellcode exploit",
      "Enable NX — shellcode fails, switch to ret2libc",
      "Enable ASLR + PIE — observe the libc address become unpredictable",
    ],
    help: {
      goal: "Which modern binary exploit mitigations each attack technique depends on being absent — and why a full mitigation stack forces attackers to chain multiple primitives before achieving code execution.",
      steps: [
        "Disable all mitigations and run ret2shellcode — it succeeds because NX is off and addresses are fixed",
        "Enable NX — shellcode on the stack is non-executable; switch to ret2libc",
        "Enable ASLR + PIE — the libc base is now random; you need an info-leak primitive first",
        "Enable the stack canary — stack overflow is detected at return; a ROP chain must avoid corrupting it",
        "Enable full RELRO — the GOT is read-only; GOT overwrite technique fails",
      ],
      lookFor: "No single mitigation is sufficient. A real exploit chains: an info-leak to defeat ASLR, a write primitive to overwrite a return address or function pointer, and return-oriented programming gadgets to bypass NX. The full mitigation stack requires all four techniques to be combined simultaneously.",
    },
  },
  CodeAuditWorkflowTool: {
    summary: "Select a vulnerable target (C, Python, or Node.js), run tools from each category (SAST, binary analysis, dynamic, fuzzing), and see a coverage matrix showing what each tool found — and missed.",
    quickStart: [
      "Pick one of the three target programs",
      "Click tools from different categories to run them and read their output",
      "Run at least 3 tools, then click 'View Coverage Report'",
      "Study the coverage matrix — notice that no single tool finds everything",
    ],
    help: {
      goal: "Why a real security audit combines static analysis, binary analysis, dynamic instrumentation, and fuzzing — each technique has blind spots that the others cover.",
      steps: [
        "Select the C target first — it has the full range of applicable tools including binary analysis and fuzzing",
        "Run Semgrep and note what it finds; then run checksec to see the missing protections",
        "Run AFL++ and ASan to see how dynamic tools confirm the same bug with concrete crash evidence",
        "Switch to the Python or Node.js target and run checksec — observe it reports 'not applicable'",
        "Compare coverage matrices across targets to understand why tool selection depends on the technology stack",
      ],
      lookFor: "A tool that finds 0 aspects is not broken — it may simply not be applicable to this target. The Python target exposes that binary analysis tools don't apply to interpreted languages. The coverage matrix shows the complementary nature of all four categories: static analysis finds the code pattern; dynamic tools confirm it's exploitable; fuzzing finds it without knowing where to look.",
    },
  },
  ThreadTimelineTool: {
    summary: "Run two threads concurrently on a shared variable and trigger a TOCTOU race condition. Add a mutex and watch the data race disappear from the timeline.",
    quickStart: [
      "Start both threads without synchronization — spot the interleaved writes",
      "Identify the check-then-act window in the timeline",
      "Enable the mutex and rerun — the critical section is now atomic",
    ],
    help: {
      goal: "How two threads interleaving around a check-then-act sequence creates a race window — and how a mutex makes the critical section atomic, eliminating the race.",
      steps: [
        "Start both threads with no synchronization and pause the timeline to find an interleaving where both read the same value",
        "Identify the check (read balance) and the act (write balance) — the race window is the time between them",
        "Slow one thread artificially to make the race occur reliably",
        "Enable the mutex and rerun — one thread blocks at the lock boundary until the other releases it",
      ],
      lookFor: "The race window is the time between reading a value and acting on it. Any thread switch in that window corrupts state. A mutex ensures the read and write together are atomic from all other threads' perspective — the window collapses to zero.",
    },
  },
};
