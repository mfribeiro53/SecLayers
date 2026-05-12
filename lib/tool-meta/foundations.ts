import type { ToolMeta } from "./types";

export const foundationsMeta: Record<string, ToolMeta> = {
  DfdBuilderTool: {
    summary: "Build a data flow diagram for a system you design, then apply STRIDE to each trust boundary to surface threats.",
    quickStart: [
      "Add at least one external entity, process, and data store",
      "Draw arrows between them to represent data flows",
      "Click a trust boundary to run STRIDE threat analysis",
      "Review the generated threat list and pick mitigations",
    ],
    help: {
      goal: "How to decompose a system into trust zones, model data flows between components, and derive a STRIDE threat list from trust boundary crossings.",
      steps: [
        "Add external entities (users, third-party services) to the canvas",
        "Add internal processes and data stores",
        "Draw data-flow arrows — any arrow crossing a trust boundary is an attack surface",
        "Click a trust boundary to run STRIDE analysis and expand the threat list",
        "Review each threat, assign severity, and mark it mitigated or accepted",
      ],
      lookFor: "Focus on arrows that flow from a lower-trust to a higher-trust zone. Each crossing is a potential spoofing, tampering, or elevation-of-privilege vector. An uncontrolled crossing with no authentication is the highest-priority finding.",
    },
  },
  CryptoPlaygroundTool: {
    summary: "Compare hashing algorithms, experiment with symmetric encryption modes, and see why key size and algorithm choice matter.",
    quickStart: [
      "Type any text and compare MD5, SHA-256, and bcrypt outputs",
      "Switch to Encrypt mode and try AES-ECB vs AES-GCM on repeated text",
      "Notice how ECB leaks patterns — GCM does not",
    ],
    help: {
      goal: "Why algorithm choice matters more than key length, and how AES mode selection can turn secure encryption into an information leak.",
      steps: [
        "Enter any text and compare MD5, SHA-1, SHA-256, and bcrypt side by side",
        "Note the speed difference between bcrypt and SHA-256 — bcrypt is intentionally slow for password storage",
        "Switch to Encrypt mode, select AES-ECB, and enter repeating text like 'AAAA AAAA AAAA AAAA'",
        "Switch to AES-GCM with the same input — the repeating pattern is gone",
        "Flip one bit in a GCM ciphertext and observe the authentication tag failure",
      ],
      lookFor: "ECB mode encrypts identical plaintext blocks to identical ciphertext blocks — any visual pattern in your input survives. GCM produces a random-looking output and detects any tampering via the authentication tag.",
    },
  },
  EncodingSandboxTool: {
    summary: "See how the same string transforms across Base64, URL, HTML, and Unicode encodings — and why context-aware output encoding blocks XSS.",
    quickStart: [
      "Paste a payload like <script>alert(1)</script>",
      "Switch between output contexts (HTML, URL, JS)",
      "Observe which encoding neutralises the payload in each context",
    ],
    help: {
      goal: "Why the same character looks different in HTML, URL, and JavaScript contexts — and why choosing the wrong encoding for the wrong output context leaves an XSS hole.",
      steps: [
        "Paste <script>alert(1)</script> into the input field",
        "Select 'HTML body' as the output context — observe the angle brackets encoded as &lt; and &gt;",
        "Switch to 'URL parameter' — the payload is percent-encoded instead",
        "Switch to 'JavaScript string' — see how backslash-escaping differs from HTML encoding",
        "Try a payload with a null byte or Unicode character and check which contexts handle it safely",
      ],
      lookFor: "No single encoding is safe in every context. An HTML-encoded string is still dangerous inside a JavaScript string literal. Context-switching without re-encoding is the root cause of most real-world XSS vulnerabilities.",
    },
  },
  SdlcTimelineTool: {
    summary: "Walk through the Secure SDLC phases and see which security activities belong at each stage of development.",
    quickStart: [
      "Click each phase to expand its security activities",
      "Toggle 'shift-left' to see how early gates reduce fix cost",
      "Use the cost multiplier to compare phase-to-phase remediation cost",
    ],
    help: {
      goal: "Where security activities fit in the development lifecycle — and why a vulnerability found in production costs 100× more to fix than one caught at design time.",
      steps: [
        "Click each phase (Requirements, Design, Development, Testing, Deployment, Operations) to expand its activities",
        "Enable 'Show fix cost' to see the remediation cost multiplier rise per phase",
        "Identify which activities are shift-left (proactive) vs reactive",
        "Click a specific activity such as threat modeling to see its inputs, outputs, and owners",
      ],
      lookFor: "Security gates at the Requirements and Design phases catch architectural flaws — the most expensive category to fix late. Count how many activities disappear if the Requirements phase is skipped; those gaps show up as production vulnerabilities.",
    },
  },
};
