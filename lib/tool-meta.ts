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

  // Act III — Mobile Security
  MobileFSExplorerTool: {
    summary: "Browse a simulated Android/iOS filesystem and discover insecure data storage: cleartext credentials, unprotected SQLite databases, and world-readable shared preferences.",
    quickStart: [
      "Navigate to /data/data/com.example.app/ and open the files directory",
      "Find the SQLite database and inspect its unencrypted contents",
      "Check SharedPreferences XML for stored passwords or tokens",
    ],
  },
  TLSVisualizerTool: {
    summary: "Step through a TLS 1.3 handshake frame by frame, then observe what certificate pinning absence enables — a man-in-the-middle reads the 'encrypted' traffic.",
    quickStart: [
      "Click through each handshake message and read the annotation",
      "Disable certificate validation and intercept the session",
      "Enable cert pinning and see the intercepted certificate rejected",
    ],
  },
  APKExplorerTool: {
    summary: "Inspect a decompiled APK: read the AndroidManifest for exported activities, find hardcoded API keys in resources, and spot debug flags left in a release build.",
    quickStart: [
      "Open AndroidManifest.xml and look for exported='true' without permissions",
      "Search strings.xml and BuildConfig for hardcoded secrets",
      "Check the debuggable and allowBackup flags — both should be false in release",
    ],
  },
  AuthBypassTreeTool: {
    summary: "Walk an attack decision tree against biometric authentication. See where local bypass, template substitution, and fallback PIN attacks each break the security guarantee.",
    quickStart: [
      "Start at the root and follow the biometric enrollment path",
      "Branch to 'attacker has physical device access' and explore bypass options",
      "Compare strongBox-backed vs software-only key storage outcomes",
    ],
  },
  IntentRouterTool: {
    summary: "Route Android Intents between apps and watch how unprotected exported components and deep-link handlers enable intent hijacking and cross-app data theft.",
    quickStart: [
      "Send an implicit Intent and observe which apps can handle it",
      "Target an exported Activity without a permission guard — it accepts the call",
      "Add a custom permission to the export and repeat — unauthorized callers are blocked",
    ],
  },

  // Act IV — Systems / Native
  StackFrameTool: {
    summary: "Inspect a C function's stack frame in real time: see local variables, the saved frame pointer, and the return address laid out in memory.",
    quickStart: [
      "Call a function and expand the stack frame that appears",
      "Hover each region to see its offset from the frame pointer",
      "Identify the return address — this is what a stack overflow overwrites",
    ],
  },
  OverflowAnimatorTool: {
    summary: "Overflow a stack buffer byte by byte and watch the return address get overwritten. Enable a stack canary and see the runtime detect the corruption before the function returns.",
    quickStart: [
      "Set the input length to exactly buffer_size to fill the buffer",
      "Increase length by 1 past the canary — see the canary change color",
      "Increase further to reach the return address — observe the overwrite",
    ],
  },
  PrintfSimulatorTool: {
    summary: "Pass a format string as user input and observe %x leaking stack values and %n writing to arbitrary memory. See why format-string arguments must never be user-controlled.",
    quickStart: [
      "Enter %x.%x.%x as input and watch stack values leak in the output",
      "Use %08x to read the canary value from the stack",
      "Try a %n write and see the target memory location change",
    ],
  },
  HeapVisualizerTool: {
    summary: "Allocate and free heap chunks, trigger a use-after-free, and redirect a function pointer. Watch tcache bin recycling make freed memory reachable again.",
    quickStart: [
      "Allocate two chunks, then free the first",
      "Allocate a same-sized chunk — observe it reuse the freed slot",
      "Trigger a use-after-free by accessing the original pointer after reallocation",
    ],
  },
  MitigationToggleTool: {
    summary: "Toggle ASLR, NX/DEP, stack canaries, PIE, and RELRO independently and see which exploit techniques each mitigation defeats — and which combinations close all known primitive gaps.",
    quickStart: [
      "Disable all mitigations and run a ret2shellcode exploit",
      "Enable NX — shellcode fails, switch to ret2libc",
      "Enable ASLR + PIE — observe the libc address become unpredictable",
    ],
  },
  ThreadTimelineTool: {
    summary: "Run two threads concurrently on a shared variable and trigger a TOCTOU race condition. Add a mutex and watch the data race disappear from the timeline.",
    quickStart: [
      "Start both threads without synchronization — spot the interleaved writes",
      "Identify the check-then-act window in the timeline",
      "Enable the mutex and rerun — the critical section is now atomic",
    ],
  },

  // Act V — Cloud & Infrastructure
  IAMPolicySimulatorTool: {
    summary: "Write an IAM policy JSON, then simulate API calls against it to see Allow or Deny outcomes — without touching a real AWS account or incurring any cost.",
    quickStart: [
      "Start with AdministratorAccess and observe every action is allowed",
      "Replace with a least-privilege policy scoped to s3:GetObject on one bucket",
      "Simulate s3:DeleteObject — confirm it is denied",
    ],
  },
  BucketACLTool: {
    summary: "Configure S3 bucket ACLs and bucket policies, then simulate public and cross-account requests to see exactly what data is exposed and to whom.",
    quickStart: [
      "Set the ACL to public-read and request the bucket as an anonymous user",
      "Add a bucket policy that restricts access to a specific IAM role",
      "Simulate a cross-account request and observe whether it is allowed",
    ],
  },
  DockerfileLinterTool: {
    summary: "Paste a Dockerfile and receive instant security findings: running as root, secrets in ENV/ARG, COPY vs ADD risks, and an image vulnerability score for the base layer.",
    quickStart: [
      "Paste the sample Dockerfile — observe the USER root finding",
      "Add a non-root USER directive and watch the finding resolve",
      "Add a secret in an ARG layer and see it flagged as persistent in the image history",
    ],
  },
  K8sRBACBuilderTool: {
    summary: "Build a Kubernetes Role and RoleBinding, then run simulated kubectl auth can-i checks to verify which service accounts can perform which actions in which namespaces.",
    quickStart: [
      "Create a Role with get and list on pods in the default namespace",
      "Bind it to a service account and verify access with can-i",
      "Add create pods — then test whether the account can exec into a pod",
    ],
  },
  SecretSprawlTool: {
    summary: "Trace a secret from plaintext in source code through environment variables, CI logs, container image layers, and runtime env — find every place it leaks along the path.",
    quickStart: [
      "Start with a hardcoded API key in application code",
      "Follow the pipeline: source → Docker build → CI log → running container",
      "Enable each defence (secret manager, masked log, runtime injection) to block each leak",
    ],
  },
  TerraformScannerTool: {
    summary: "Scan Terraform HCL for common misconfigurations: public S3 buckets, overly permissive security groups, unencrypted RDS instances, and missing CloudTrail logging.",
    quickStart: [
      "Load the example HCL with a public S3 bucket — observe the critical finding",
      "Set acl = 'private' and rerun — the finding clears",
      "Find the security group with 0.0.0.0/0 ingress and scope it to a CIDR",
    ],
  },
  LogInjectorTool: {
    summary: "Inject CRLF sequences and control characters into a log line and watch how syslog parsers are confused or spoofed. Enable structured logging to see the injection neutralized.",
    quickStart: [
      "Enter a payload with \\r\\n to inject a fake log entry below your line",
      "Observe how the second log line appears to come from a different source",
      "Switch to JSON structured logging — the newline is escaped and injection fails",
    ],
  },

  // Act VI — Supply Chain
  DepResolverTool: {
    summary: "Simulate npm dependency resolution and see how a dependency confusion attack installs a higher-versioned malicious public package over your internal one at install time.",
    quickStart: [
      "Select the 'Normal resolution' scenario — internal package wins",
      "Switch to 'Dependency confusion' — observe the malicious v9.9.9 take precedence",
      "Select 'Scoped package' — see why @company/utils is safe from confusion",
    ],
  },
  SBOMExplorerTool: {
    summary: "Browse a software bill of materials, inspect CVE details for each vulnerable dependency, and practice triage: fix, defer, or risk-accept based on severity and reachability.",
    quickStart: [
      "Filter to 'Vulnerable only' to focus the list",
      "Click a critical CVE to see its CVSS score and fix version",
      "Identify a medium CVE with no fix — decide between risk-accept and compensating control",
    ],
  },
  PipelineDAGTool: {
    summary: "Click through each stage of a CI/CD pipeline DAG and see which attack surfaces exist — from source code manipulation to artifact tampering to over-privileged deploy roles.",
    quickStart: [
      "Click the Source stage and review its attack vectors",
      "Examine the Build stage — note the dependency confusion and poisoned base image risks",
      "Check the Deploy stage and identify what a compromised role could do",
    ],
  },
  ProvenanceChainTool: {
    summary: "Compare a signed artifact chain (Cosign + SLSA provenance) with an unsigned one. Each step's attestation binds the binary back to the source commit and build identity.",
    quickStart: [
      "Select 'No signing' — observe every step is unverified",
      "Switch to 'With Cosign + SLSA' — all steps have attestations",
      "Click any step to read what its attestation proves and what it still cannot prove",
    ],
  },
  SASTRuleBuilderTool: {
    summary: "Examine how SAST rules detect SQL injection, hardcoded secrets, and DOM XSS. See pattern-matching hit the call site — and taint analysis trace data flow across function boundaries.",
    quickStart: [
      "Select the SQL Injection example and run the scanner",
      "Observe the matched lines highlighted in the code view",
      "Switch to DOM XSS — note that taint flows across the helper function boundary",
    ],
  },
};
