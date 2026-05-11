export interface ToolMeta {
  summary: string;
  quickStart: string[];
}

export const TOOL_META: Record<string, ToolMeta> = {
  DfdBuilderTool: {
    summary: "Build a data flow diagram for a system you design, then apply STRIDE to each trust boundary to surface threats.",
    quickStart: [
      "Add at least one external entity, process, and data store",
      "Draw arrows between them to represent data flows",
      "Click a trust boundary to run STRIDE threat analysis",
      "Review the generated threat list and pick mitigations",
    ],
  },
  CryptoPlaygroundTool: {
    summary: "Compare hashing algorithms, experiment with symmetric encryption modes, and see why key size and algorithm choice matter.",
    quickStart: [
      "Type any text and compare MD5, SHA-256, and bcrypt outputs",
      "Switch to Encrypt mode and try AES-ECB vs AES-GCM on repeated text",
      "Notice how ECB leaks patterns — GCM does not",
    ],
  },
  EncodingSandboxTool: {
    summary: "See how the same string transforms across Base64, URL, HTML, and Unicode encodings — and why context-aware output encoding blocks XSS.",
    quickStart: [
      "Paste a payload like <script>alert(1)</script>",
      "Switch between output contexts (HTML, URL, JS)",
      "Observe which encoding neutralises the payload in each context",
    ],
  },
  SdlcTimelineTool: {
    summary: "Walk through the Secure SDLC phases and see which security activities belong at each stage of development.",
    quickStart: [
      "Click each phase to expand its security activities",
      "Toggle 'shift-left' to see how early gates reduce fix cost",
      "Use the cost multiplier to compare phase-to-phase remediation cost",
    ],
  },
  SQLiSandboxTool: {
    summary: "Run live SQL injection attacks against a vulnerable login form, then flip to parameterized queries and watch them fail safely.",
    quickStart: [
      "Enter ' OR '1'='1 as the username and observe the bypass",
      "Try a UNION attack to extract hidden data",
      "Toggle 'Safe mode' and repeat — parameterized queries block every payload",
    ],
  },
  DOMXSSVisualizerTool: {
    summary: "Trace how user-controlled data flows through DOM sinks. See which sinks are dangerous and which context-switches sanitize the input.",
    quickStart: [
      "Type a payload into the source field",
      "Select different DOM sinks (innerHTML, textContent, href…)",
      "Watch the live execution trace to see where execution escapes",
    ],
  },
  CsrfSimulatorTool: {
    summary: "Simulate a cross-site request forgery attack, then add a CSRF token or SameSite cookie and watch the forged request get rejected.",
    quickStart: [
      "Load the victim site and perform a legitimate action",
      "Open the attacker site — it auto-submits a forged form",
      "Enable CSRF token protection and repeat the attack",
    ],
  },
  JWTEditorTool: {
    summary: "Decode, tamper, and re-sign JWTs. Try the alg:none attack and the RS256→HS256 confusion attack to understand why algorithm whitelisting matters.",
    quickStart: [
      "Paste any JWT to decode its header and payload",
      "Change a claim (e.g. role: admin) and re-sign",
      "Try switching alg to 'none' — does the server accept it?",
    ],
  },
  IdorExplorerTool: {
    summary: "Browse an API that uses sequential integer IDs. Exploit IDOR to access other users' data, then add authorization checks to block it.",
    quickStart: [
      "Log in as user #1 and view your profile at /api/users/1",
      "Manually change the ID to /api/users/2 — you should be blocked",
      "Disable authorization and repeat to see the vulnerability",
    ],
  },
  SsrfVisualizerTool: {
    summary: "Craft SSRF payloads that reach internal services, the cloud metadata endpoint, and localhost — then apply allow-list controls.",
    quickStart: [
      "Enter http://169.254.169.254/latest/meta-data/ as the fetch URL",
      "Observe which internal targets are reachable",
      "Enable the allow-list and watch external-only traffic pass while internal gets blocked",
    ],
  },
  HeaderGraderTool: {
    summary: "Paste any HTTP response header block and get a security grade with per-header explanations and remediation suggestions.",
    quickStart: [
      "Paste headers from a real site (copy from browser DevTools → Network tab)",
      "Check which required headers are missing",
      "Add headers one by one and watch the grade improve",
    ],
  },
  CSPSandboxTool: {
    summary: "Build a Content Security Policy directive by directive, then fire inline scripts and eval() to see what your policy blocks.",
    quickStart: [
      "Start with an empty policy — all inline scripts run",
      "Add default-src 'self' and reload",
      "Try adding a nonce to allow one specific inline script",
    ],
  },
  DefensiveCodeLabTool: {
    summary: "Review vulnerable code snippets and apply defensive patterns: parameterize, validate, authorize, encode. Each fix is immediately verified.",
    quickStart: [
      "Read the vulnerable snippet and identify the pattern it violates",
      "Apply the correct fix from the dropdown",
      "Run the verification — all test cases must pass before you advance",
    ],
  },
  OAuthFlowAnimatorTool: {
    summary: "Step through the OAuth 2.0 Authorization Code + PKCE flow frame by frame, with annotations explaining each token exchange.",
    quickStart: [
      "Click 'Start' to begin the flow as a client application",
      "Advance step by step and read the annotation for each message",
      "Enable 'Show attack' to see what PKCE prevents",
    ],
  },
  GraphQLExplorerTool: {
    summary: "Run introspection queries against a mock API, batch queries to bypass rate limits, and toggle field-level authorization.",
    quickStart: [
      "Send the introspection query — observe the full schema leaking",
      "Disable introspection and retry",
      "Try a batched mutation to bypass the per-request rate limit",
    ],
  },
  JWTAnatomyTool: {
    summary: "Dissect a JWT byte by byte. Understand the three parts, the base64url encoding, and what the signature actually protects.",
    quickStart: [
      "Paste a JWT from a real app or use the provided sample",
      "Hover over each character to see which field it belongs to",
      "Modify one byte of the signature and verify the token is now invalid",
    ],
  },
  RateLimiterTool: {
    summary: "Compare fixed window, sliding window, and token bucket algorithms under burst traffic — and watch which ones overflow at boundary conditions.",
    quickStart: [
      "Set the limit to 10 req/10 s and select Fixed Window",
      "Send a burst of 10 requests at 9 s, then 10 more at 11 s",
      "Switch to Sliding Window and repeat — the boundary burst is absorbed",
    ],
  },
  ApiDiffTool: {
    summary: "Compare two API versions side by side and see which fields were removed or changed — the fields deprecated APIs still expose to attackers.",
    quickStart: [
      "Load the v1 and v2 specs",
      "Inspect removed fields in v2 — check if v1 is still live",
      "Toggle 'Sensitive field highlight' to see which removed fields are high-risk",
    ],
  },
};
