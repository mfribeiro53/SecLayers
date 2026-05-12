export interface ToolHelp {
  goal: string;
  steps: string[];
  lookFor?: string;
}

export interface ToolMeta {
  summary: string;
  quickStart: string[];
  help?: ToolHelp;
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
  SQLiSandboxTool: {
    summary: "Run live SQL injection attacks against a vulnerable login form, then flip to parameterized queries and watch them fail safely.",
    quickStart: [
      "Enter ' OR '1'='1 as the username — the leading ' closes the SQL string, letting you inject logic after it",
      "Try a UNION attack to extract hidden data",
      "Toggle 'Safe mode' and repeat — parameterized queries block every payload",
    ],
    help: {
      goal: "How SQL injection works mechanically — string concatenation giving user input control over query structure — and why parameterization is the only reliable fix.",
      steps: [
        "Type alice as the username to observe a normal, well-formed query",
        "Type ' OR '1'='1 — the leading quote closes the string; logic after it executes",
        "Try ' UNION SELECT 1,2,3 -- to append attacker-controlled rows to the result set",
        "Try '; DROP TABLE users; -- to test multi-statement execution",
        "Switch to Safe mode and repeat every payload — they are all treated as literal string values",
      ],
      lookFor: "In vulnerable mode the highlighted orange text shows exactly where your input lands inside the query. In safe mode the query structure is fixed at compile time — user input can never change the SQL grammar.",
    },
  },
  DOMXSSVisualizerTool: {
    summary: "Trace how user-controlled data flows through DOM sinks. See which sinks are dangerous and which context-switches sanitize the input.",
    quickStart: [
      "Type a payload into the source field",
      "Select different DOM sinks (innerHTML, textContent, href…)",
      "Watch the live execution trace to see where execution escapes",
    ],
    help: {
      goal: "How XSS travels from a user-controlled data source through JavaScript to a DOM sink — and why sanitization must happen at the sink, not at the source.",
      steps: [
        "Enter <img src=x onerror=alert(1)> in the source field",
        "Select innerHTML as the sink — the payload executes",
        "Switch to textContent — the same payload renders as literal text, not HTML",
        "Try a javascript:alert(1) payload in the href sink",
        "Enable DOMPurify sanitization and confirm each dangerous sink is now safe",
      ],
      lookFor: "The dangerous sinks are innerHTML, outerHTML, document.write, eval, and href/src attributes. textContent and setAttribute used in safe contexts do not parse HTML — they neutralize most payloads without a separate sanitizer.",
    },
  },
  CsrfSimulatorTool: {
    summary: "Simulate a cross-site request forgery attack, then add a CSRF token or SameSite cookie and watch the forged request get rejected.",
    quickStart: [
      "Load the victim site and perform a legitimate action",
      "Open the attacker site — it auto-submits a forged form",
      "Enable CSRF token protection and repeat the attack",
    ],
    help: {
      goal: "Why session cookies alone cannot prevent cross-site request forgery — and how CSRF tokens and SameSite cookies each break the attack at a different layer.",
      steps: [
        "Perform a legitimate fund transfer on the victim site — note the session cookie is set",
        "Navigate to the attacker page — it auto-submits a form to the victim site",
        "Observe the forged request succeeds because the browser attaches the session cookie automatically",
        "Enable CSRF token validation — the forged request lacks the token and is rejected",
        "Switch protection to SameSite=Strict cookies instead — repeat the attack from a cross-origin context",
      ],
      lookFor: "CSRF works because the browser automatically attaches cookies to cross-origin requests. The CSRF token proves the request originated from a page the server rendered. SameSite=Strict prevents the cookie being sent cross-site entirely — a different layer of the same defence.",
    },
  },
  JWTEditorTool: {
    summary: "Decode, tamper, and re-sign JWTs. Try the alg:none attack and the RS256→HS256 confusion attack to understand why algorithm whitelisting matters.",
    quickStart: [
      "Paste any JWT to decode its header and payload",
      "Change a claim (e.g. role: admin) and re-sign",
      "Try switching alg to 'none' — does the server accept it?",
    ],
    help: {
      goal: "How JWTs are structured, why the alg field is attacker-controlled and dangerous, and how the alg:none and RS256→HS256 algorithm confusion attacks bypass signature verification.",
      steps: [
        "Paste any JWT and read the decoded header and payload claims",
        "Change the role claim to admin and re-sign with the current algorithm",
        "Switch alg to none in the header and remove the signature — submit and observe whether the server accepts it",
        "For the RS256→HS256 confusion attack: keep the RS256 token but re-sign using the server's public key as the HMAC secret",
      ],
      lookFor: "An alg:none token carries no signature at all — any library that trusts the header's alg field will accept it. For RS256→HS256 confusion, the server's public key becomes the HMAC secret. Public keys are not secret, so any attacker can forge valid signatures.",
    },
  },
  IdorExplorerTool: {
    summary: "Browse an API that uses sequential integer IDs. Exploit IDOR to access other users' data, then add authorization checks to block it.",
    quickStart: [
      "Log in as user #1 and view your profile at /api/users/1",
      "Manually change the ID to /api/users/2 — you should be blocked",
      "Disable authorization and repeat to see the vulnerability",
    ],
    help: {
      goal: "Why sequential integer resource IDs create an access-control vulnerability — and how server-side authorization checks, not ID obscurity, are the correct fix.",
      steps: [
        "Log in as user #2 and fetch /api/users/2 — your own profile is returned",
        "Change the path to /api/users/1 — you can read the admin's profile (IDOR)",
        "Enable server-side authorization checks and repeat — the cross-user request is rejected with 403",
        "Try an ID that does not exist and observe the difference between a 403 and a 404 response",
      ],
      lookFor: "The vulnerability is not the sequential ID — it is the missing ownership check. Switching to UUIDs hides the IDs but does not fix the underlying authorization gap. An attacker can discover UUIDs through other API calls.",
    },
  },
  SsrfVisualizerTool: {
    summary: "Craft SSRF payloads that reach internal services, the cloud metadata endpoint, and localhost — then apply allow-list controls.",
    quickStart: [
      "Enter http://169.254.169.254/latest/meta-data/ as the fetch URL",
      "Observe which internal targets are reachable",
      "Enable the allow-list and watch external-only traffic pass while internal gets blocked",
    ],
    help: {
      goal: "How an SSRF payload reaches services that are unreachable from the internet — internal APIs, cloud metadata endpoints, and localhost — and why allow-listing is safer than deny-listing.",
      steps: [
        "Enter http://169.254.169.254/latest/meta-data/ — observe the AWS metadata returned",
        "Try http://localhost:6379 (Redis) and http://internal-api/admin",
        "Enable the deny list and attempt bypass with http://127.0.0.1, http://[::1], and a decimal IP",
        "Switch to the allow list — only approved external domains pass; all others are blocked regardless of representation",
      ],
      lookFor: "Deny lists are bypassable via alternative IP representations: decimal notation, IPv6 shorthand, DNS rebinding, and redirects. An allow list of specific external domains is the only robust control because it requires explicit opt-in rather than blocking known bad values.",
    },
  },
  HeaderGraderTool: {
    summary: "Paste any HTTP response header block and get a security grade with per-header explanations and remediation suggestions.",
    quickStart: [
      "Paste headers from a real site (copy from browser DevTools → Network tab)",
      "Check which required headers are missing",
      "Add headers one by one and watch the grade improve",
    ],
    help: {
      goal: "Which HTTP response headers are security-relevant, what each one defends against, and how their absence degrades a site's security posture.",
      steps: [
        "Open browser DevTools → Network tab, click any request, and copy the response headers",
        "Paste the headers into the grader and review the failing checks",
        "Add Strict-Transport-Security with a long max-age and includeSubDomains",
        "Add Content-Security-Policy: default-src 'self' and X-Frame-Options: DENY",
        "Add X-Content-Type-Options: nosniff and Referrer-Policy: strict-origin-when-cross-origin",
      ],
      lookFor: "Missing HSTS means a first-visit HTTP-to-HTTPS downgrade is still possible. Missing X-Frame-Options or CSP frame-ancestors allows clickjacking. Missing X-Content-Type-Options enables MIME-type sniffing attacks in older browsers.",
    },
  },
  CSPSandboxTool: {
    summary: "Build a Content Security Policy directive by directive, then fire inline scripts and eval() to see what your policy blocks.",
    quickStart: [
      "Start with an empty policy — all inline scripts run",
      "Add default-src 'self' and reload",
      "Try adding a nonce to allow one specific inline script",
    ],
    help: {
      goal: "How CSP directives compose, why inline scripts are blocked by default, and how nonces allow specific inline scripts without opening the policy to all inline code.",
      steps: [
        "Start with no policy — all scripts including inline ones run freely",
        "Add default-src 'self' — external CDN scripts and inline scripts are both blocked",
        "Add a specific CDN domain to script-src to restore that dependency",
        "Generate a nonce, add it to one inline script tag, and add nonce-{value} to script-src",
        "Try adding unsafe-inline and observe it defeats nonce protection entirely",
      ],
      lookFor: "unsafe-inline in script-src defeats the primary XSS defence CSP provides. A nonce rotates per response and binds permission to one specific script block — not to all inline scripts. Report-only mode lets you audit a policy in production before enforcing it.",
    },
  },
  DefensiveCodeLabTool: {
    summary: "Review vulnerable code snippets and apply defensive patterns: parameterize, validate, authorize, encode. Each fix is immediately verified.",
    quickStart: [
      "Read the vulnerable snippet and identify the pattern it violates",
      "Apply the correct fix from the dropdown",
      "Run the verification — all test cases must pass before you advance",
    ],
    help: {
      goal: "How to recognize vulnerable code patterns and apply the correct defensive technique: parameterization for injection, output encoding for XSS, ownership checks for IDOR, and token validation for CSRF.",
      steps: [
        "Read the vulnerable snippet and identify which OWASP Top 10 category it belongs to",
        "Select the fix option — wrong fixes are rejected with an explanation of why they are insufficient",
        "Run verification — all test cases including edge cases and bypass attempts must pass",
        "Advance to the next pattern — each introduces a different vulnerability class",
      ],
      lookFor: "Pay attention to where in the data flow the fix is applied. Sanitizing on input is insufficient — you need encoding at the point of output for the specific sink context. A fix that works for HTML body output is unsafe inside a JavaScript string literal.",
    },
  },
  OAuthFlowAnimatorTool: {
    summary: "Step through the OAuth 2.0 Authorization Code + PKCE flow frame by frame, with annotations explaining each token exchange.",
    quickStart: [
      "Click 'Start' to begin the flow as a client application",
      "Advance step by step and read the annotation for each message",
      "Enable 'Show attack' to see what PKCE prevents",
    ],
    help: {
      goal: "The full OAuth 2.0 Authorization Code + PKCE flow — why each message exists, what each token grants, and how PKCE prevents authorization code interception attacks.",
      steps: [
        "Click Start and follow the client → authorization server → resource server message path",
        "Read the annotation on the authorization code step — it is single-use and short-lived",
        "Enable 'Show PKCE' and trace the code verifier and challenge through the flow",
        "Enable 'Show attack' — watch an intercepted authorization code fail to exchange without the verifier",
      ],
      lookFor: "Without PKCE, a stolen authorization code can be exchanged for tokens by any client. PKCE ties the code exchange to the original challenge — only the client that initiated the flow holds the verifier and can complete it.",
    },
  },
  GraphQLExplorerTool: {
    summary: "Run introspection queries against a mock API, batch queries to bypass rate limits, and toggle field-level authorization.",
    quickStart: [
      "Send the introspection query — observe the full schema leaking",
      "Disable introspection and retry",
      "Try a batched mutation to bypass the per-request rate limit",
    ],
    help: {
      goal: "How GraphQL's introspection system exposes the full schema to attackers, how query batching bypasses per-request rate limits, and why field-level authorization must be enforced at the resolver.",
      steps: [
        "Send the introspection query — observe the full type system and all field names returned",
        "Disable introspection and retry — the schema is now hidden from enumeration",
        "Build a batched mutation payload with 20 operations in one HTTP call",
        "Enable per-operation rate limiting and confirm the batch is throttled",
        "Toggle off field authorization on a sensitive field and fetch it as an unauthorized user",
      ],
      lookFor: "Introspection makes reconnaissance trivial — attackers get your full schema for free. Batching means traditional rate limits measured in requests per minute do not constrain query volume. Authorization must be checked at the resolver level, not at the transport layer.",
    },
  },
  JWTAnatomyTool: {
    summary: "Dissect a JWT byte by byte. Understand the three parts, the base64url encoding, and what the signature actually protects.",
    quickStart: [
      "Paste a JWT from a real app or use the provided sample",
      "Hover over each character to see which field it belongs to",
      "Modify one byte of the signature and verify the token is now invalid",
    ],
    help: {
      goal: "The three-part JWT structure, how base64url encoding works, what the signature covers, and why modifying any byte of the payload invalidates the signature.",
      steps: [
        "Paste a JWT and identify the three dot-separated sections: header, payload, signature",
        "Hover over individual characters to see which claim field they map to",
        "Manually decode the payload: strip padding, base64url-decode, then JSON parse",
        "Change one character in the payload section and observe the signature verification fail",
      ],
      lookFor: "The signature covers the base64url-encoded header + '.' + base64url-encoded payload. Changing even one character in either section invalidates it. The signature does not prevent reading the payload — JWTs are signed, not encrypted by default.",
    },
  },
  RateLimiterTool: {
    summary: "Compare fixed window, sliding window, and token bucket algorithms under burst traffic — and watch which ones overflow at boundary conditions.",
    quickStart: [
      "Set the limit to 10 req/10 s and select Fixed Window",
      "Send a burst of 10 requests at 9 s, then 10 more at 11 s",
      "Switch to Sliding Window and repeat — the boundary burst is absorbed",
    ],
    help: {
      goal: "How fixed window, sliding window, and token bucket algorithms behave differently under burst traffic — and specifically why fixed windows can be doubled at window boundaries.",
      steps: [
        "Set 10 requests per 10 seconds, select Fixed Window",
        "Fire 10 requests at second 9 and 10 more at second 11 — all 20 pass because they straddle the window boundary",
        "Switch to Sliding Window and repeat — the rolling count catches the burst",
        "Switch to Token Bucket with a burst cap of 5 — the burst is capped regardless of timing",
        "Compare the timeline graphs across all three algorithms",
      ],
      lookFor: "The fixed-window boundary attack: send exactly the limit at the end of window N and again at the start of window N+1 — you get 2× the limit in a very short period. Sliding window tracks a rolling count; token bucket caps instantaneous bursts independently of window alignment.",
    },
  },
  ApiDiffTool: {
    summary: "Compare two API versions side by side and see which fields were removed or changed — the fields deprecated APIs still expose to attackers.",
    quickStart: [
      "Load the v1 and v2 specs",
      "Inspect removed fields in v2 — check if v1 is still live",
      "Toggle 'Sensitive field highlight' to see which removed fields are high-risk",
    ],
    help: {
      goal: "How API versioning creates a permanent attack surface — fields removed from v2 may still be served by a running v1 endpoint, and developers often forget both are live simultaneously.",
      steps: [
        "Load a v1 and v2 API spec and review the diff",
        "Identify fields present in v1 but removed from v2",
        "Enable 'Sensitive field highlight' to flag removed fields that carry PII or auth context",
        "Simulate a request to the v1 endpoint for a removed sensitive field — it still responds",
      ],
      lookFor: "The most dangerous scenario is a field removed from the documented schema but still returned by the live v1 API. Attackers diff public API changelogs and version histories to find exactly these opportunities.",
    },
  },
  MobileFSExplorerTool: {
    summary: "Browse a simulated Android/iOS filesystem and discover insecure data storage: cleartext credentials, unprotected SQLite databases, and world-readable shared preferences.",
    quickStart: [
      "Navigate to /data/data/com.example.app/ and open the files directory",
      "Find the SQLite database and inspect its unencrypted contents",
      "Check SharedPreferences XML for stored passwords or tokens",
    ],
    help: {
      goal: "Where Android and iOS applications store sensitive data, which directories are world-readable or backed up to the cloud, and how insecure storage choices expose credentials at rest.",
      steps: [
        "Navigate to /data/data/com.example.app/ on the simulated Android filesystem",
        "Open the databases/ directory — find the SQLite file and inspect its unencrypted tables",
        "Open shared_prefs/ — read the XML for stored auth tokens or passwords",
        "Switch to the iOS simulation and check NSDocumentsDirectory for data that should not be backed up",
      ],
      lookFor: "Shared Preferences and the Documents directory are included in automatic backups on both platforms. Any plaintext credential stored there is readable by anyone with access to a backup — no root or jailbreak required.",
    },
  },
  TLSVisualizerTool: {
    summary: "Step through a TLS 1.3 handshake frame by frame, then observe what certificate pinning absence enables — a man-in-the-middle reads the 'encrypted' traffic.",
    quickStart: [
      "Click through each handshake message and read the annotation",
      "Disable certificate validation and intercept the session",
      "Enable cert pinning and see the intercepted certificate rejected",
    ],
    help: {
      goal: "What happens in a TLS 1.3 handshake — key exchange, certificate validation, and session key derivation — and why accepting any CA-signed certificate enables interception.",
      steps: [
        "Step through each handshake message and read the annotation explaining its purpose",
        "Disable certificate validation and insert a proxy — the handshake completes with the proxy's cert",
        "Enable certificate pinning — the app rejects the proxy cert even though it is CA-signed and otherwise valid",
        "Note what pinning still cannot protect against: a compromised CA or an MDM-installed trust anchor",
      ],
      lookFor: "TLS validates that the certificate is signed by a trusted CA — not that it belongs to the specific server you expect. Certificate pinning narrows trust to a known public key. The remaining attack surface is the device trust store and MDM-deployed certificates.",
    },
  },
  APKExplorerTool: {
    summary: "Inspect a decompiled APK: read the AndroidManifest for exported activities, find hardcoded API keys in resources, and spot debug flags left in a release build.",
    quickStart: [
      "Open AndroidManifest.xml and look for exported='true' without permissions",
      "Search strings.xml and BuildConfig for hardcoded secrets",
      "Check the debuggable and allowBackup flags — both should be false in release",
    ],
    help: {
      goal: "How to inspect a decompiled Android application for the most common security mistakes: exported components without permission guards, hardcoded secrets in resources, and release builds with debug flags enabled.",
      steps: [
        "Open AndroidManifest.xml and search for android:exported='true'",
        "Identify exported activities, services, and receivers that lack a permission attribute",
        "Open res/values/strings.xml and BuildConfig.java — scan for API keys and passwords",
        "Check android:debuggable and android:allowBackup in the application tag — both should be false",
      ],
      lookFor: "Exported components without a signature-level permission can be launched by any installed app — no user interaction required. allowBackup='true' means adb backup extracts the entire private data directory without root access.",
    },
  },
  AuthBypassTreeTool: {
    summary: "Walk an attack decision tree against biometric authentication. See where local bypass, template substitution, and fallback PIN attacks each break the security guarantee.",
    quickStart: [
      "Start at the root and follow the biometric enrollment path",
      "Branch to 'attacker has physical device access' and explore bypass options",
      "Compare strongBox-backed vs software-only key storage outcomes",
    ],
    help: {
      goal: "The layers of biometric authentication security — device unlock, biometric enrollment, key storage hardware, and fallback authentication — and which layer each known attack targets.",
      steps: [
        "Start at the root node and follow the enrollment path to understand the normal flow",
        "Branch to 'attacker has physical device access' and explore the available bypass options",
        "Follow the 'force fallback to PIN' branch and see what an attacker gains by triggering it",
        "Compare StrongBox-backed key storage vs software-only Keystore — which survives OS compromise?",
      ],
      lookFor: "StrongBox keys live in a dedicated security chip and cannot be extracted even on a rooted device. Software-only Keystore keys can be dumped if the OS is compromised. Fallback to PIN undermines biometric guarantees unless the PIN itself is strong and not guessable.",
    },
  },
  IntentRouterTool: {
    summary: "Route Android Intents between apps and watch how unprotected exported components and deep-link handlers enable intent hijacking and cross-app data theft.",
    quickStart: [
      "Send an implicit Intent and observe which apps can handle it",
      "Target an exported Activity without a permission guard — it accepts the call",
      "Add a custom permission to the export and repeat — unauthorized callers are blocked",
    ],
    help: {
      goal: "How Android's Intent system routes messages between components — and how implicit intents, exported components without guards, and deep-link handlers create attack surfaces for other installed apps.",
      steps: [
        "Send an implicit Intent with a VIEW action and observe which apps resolve it",
        "Send an explicit Intent directly to an exported Activity without a permission — it accepts the call",
        "Add android:permission to the export declaration and repeat — unauthorized callers are now blocked",
        "Register a deep-link URI handler and send a crafted URI containing a token from a third-party app",
      ],
      lookFor: "Implicit intents are resolved at runtime — any installed app that matches the Intent filter can handle them, including malicious ones. Deep-link URIs are especially risky because they often carry auth tokens or session data that any matching handler can read.",
    },
  },
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
  IAMPolicySimulatorTool: {
    summary: "Write an IAM policy JSON, then simulate API calls against it to see Allow or Deny outcomes — without touching a real AWS account or incurring any cost.",
    quickStart: [
      "Start with AdministratorAccess and observe every action is allowed",
      "Replace with a least-privilege policy scoped to s3:GetObject on one bucket",
      "Simulate s3:DeleteObject — confirm it is denied",
    ],
    help: {
      goal: "How IAM policy evaluation works — Allow vs Deny precedence, resource ARN matching, condition keys — and how to construct a least-privilege policy that grants exactly the required permissions.",
      steps: [
        "Load AdministratorAccess and simulate any action — everything is allowed",
        "Replace with a least-privilege policy: s3:GetObject on arn:aws:s3:::my-bucket/*",
        "Simulate s3:PutObject — denied because PutObject is not listed",
        "Simulate s3:GetObject on a different bucket ARN — denied because the resource scope does not match",
        "Add an explicit Deny statement and verify it overrides the Allow even in the same policy",
      ],
      lookFor: "An explicit Deny always overrides Allow. IAM defaults to deny — anything not explicitly allowed is denied. Resource ARN wildcards are the most common source of over-permissioned policies: arn:aws:s3:::* grants access to every bucket in the account.",
    },
  },
  BucketACLTool: {
    summary: "Configure S3 bucket ACLs and bucket policies, then simulate public and cross-account requests to see exactly what data is exposed and to whom.",
    quickStart: [
      "Set the ACL to public-read and request the bucket as an anonymous user",
      "Add a bucket policy that restricts access to a specific IAM role",
      "Simulate a cross-account request and observe whether it is allowed",
    ],
    help: {
      goal: "How S3 access control layers — ACLs, bucket policies, and Block Public Access settings — interact, and how a misconfigured combination exposes data to anonymous or cross-account requests.",
      steps: [
        "Set ACL to public-read and simulate an anonymous GET — it succeeds",
        "Add a bucket policy restricting access to a specific IAM role — simulate anonymous GET again",
        "Enable Block Public Access at the account level — observe it overrides both ACL and bucket policy for public traffic",
        "Simulate a cross-account request from a different AWS account ID and check whether it is allowed",
      ],
      lookFor: "Block Public Access is the account-level override that supersedes ACL and bucket policy settings for public access. Many data exposure incidents result from Block Public Access being disabled — not from the ACL itself being set intentionally.",
    },
  },
  DockerfileLinterTool: {
    summary: "Paste a Dockerfile and receive instant security findings: running as root, secrets in ENV/ARG, COPY vs ADD risks, and an image vulnerability score for the base layer.",
    quickStart: [
      "Paste the sample Dockerfile — observe the USER root finding",
      "Add a non-root USER directive and watch the finding resolve",
      "Add a secret in an ARG layer and see it flagged as persistent in the image history",
    ],
    help: {
      goal: "Which Dockerfile patterns create security vulnerabilities in the resulting image — running as root, leaking secrets into image layers, and using bloated base images with unnecessary attack surface.",
      steps: [
        "Paste the sample Dockerfile and review the USER root finding",
        "Add USER nonroot after the package install step and watch the finding resolve",
        "Add ARG API_KEY and observe it flagged — ARG values are visible in docker history",
        "Replace ADD with COPY and review why ADD's auto-extraction feature creates a risk",
        "Switch the FROM base to a distroless or Alpine image and compare the CVE count",
      ],
      lookFor: "ARG secrets are baked into the image layer history even if the argument is not referenced at runtime. docker history --no-trunc shows every build command — your secret is permanently visible in any copy of the image. Use BuildKit --secret or a secrets manager instead.",
    },
  },
  K8sRBACBuilderTool: {
    summary: "Build a Kubernetes Role and RoleBinding, then run simulated kubectl auth can-i checks to verify which service accounts can perform which actions in which namespaces.",
    quickStart: [
      "Create a Role with get and list on pods in the default namespace",
      "Bind it to a service account and verify access with can-i",
      "Add create pods — then test whether the account can exec into a pod",
    ],
    help: {
      goal: "How Kubernetes RBAC Roles and ClusterRoles define permissions, how RoleBindings attach them to subjects, and how small permission mistakes lead to privilege escalation.",
      steps: [
        "Create a Role with get and list on pods — bind it to a service account",
        "Simulate kubectl auth can-i list pods as that service account — it is allowed",
        "Add create to the verbs list — then test whether the account can exec into a running pod",
        "Promote the Role to a ClusterRole and test the namespace-scoped vs cluster-scoped access difference",
      ],
      lookFor: "create pods is effectively a privilege escalation path — any workload that can create pods can mount host paths, use hostNetwork, or request privileged containers. Wildcard verbs ('*') and resources ('*') are the most common misconfiguration and grant effectively root on the node.",
    },
  },
  SecretSprawlTool: {
    summary: "Trace a secret from plaintext in source code through environment variables, CI logs, container image layers, and runtime env — find every place it leaks along the path.",
    quickStart: [
      "Start with a hardcoded API key in application code",
      "Follow the pipeline: source → Docker build → CI log → running container",
      "Enable each defence (secret manager, masked log, runtime injection) to block each leak",
    ],
    help: {
      goal: "Every place a secret leaks as it travels from source code through a CI/CD pipeline into a running container — and which control at each stage blocks which leak.",
      steps: [
        "Start with a hardcoded API key in source code — no controls enabled",
        "Follow it through git history, Docker build args, CI environment variables, and container runtime env",
        "Enable 'Git secret scanning' — the commit is blocked at the source stage",
        "Enable 'BuildKit secrets' — the secret does not appear in any image layer",
        "Enable 'Masked CI logs' — the value is redacted in build output even if printed",
      ],
      lookFor: "Each pipeline stage introduces a new copy of the secret. Even after rotation, old commits still contain the original value. Pre-commit hooks and CI scanning catch different things — a value only in memory at runtime is not caught by static scanning.",
    },
  },
  TerraformScannerTool: {
    summary: "Scan Terraform HCL for common misconfigurations: public S3 buckets, overly permissive security groups, unencrypted RDS instances, and missing CloudTrail logging.",
    quickStart: [
      "Load the example HCL with a public S3 bucket — observe the critical finding",
      "Set acl = 'private' and rerun — the finding clears",
      "Find the security group with 0.0.0.0/0 ingress and scope it to a CIDR",
    ],
    help: {
      goal: "Which common Terraform misconfigurations expose AWS infrastructure to unauthorized access — public S3 buckets, overly broad security groups, unencrypted databases, and disabled audit logging.",
      steps: [
        "Load the sample HCL — observe the critical public S3 finding and the 0.0.0.0/0 ingress warning",
        "Set acl = 'private' and enable block_public_access — the S3 finding clears",
        "Scope the security group ingress CIDR to a specific IP range",
        "Enable aws_cloudtrail and set storage_encrypted = true on the RDS resource",
      ],
      lookFor: "0.0.0.0/0 ingress on port 22 or 3389 is the most commonly exploited IaC misconfiguration. Unencrypted RDS means a snapshot restore exposes all data without requiring the encryption key. CloudTrail disabled means no audit log exists to detect a breach.",
    },
  },
  LogInjectorTool: {
    summary: "Inject CRLF sequences and control characters into a log line and watch how syslog parsers are confused or spoofed. Enable structured logging to see the injection neutralized.",
    quickStart: [
      "Enter a payload with \\r\\n to inject a fake log entry below your line",
      "Observe how the second log line appears to come from a different source",
      "Switch to JSON structured logging — the newline is escaped and injection fails",
    ],
    help: {
      goal: "How CRLF injection lets an attacker forge log entries, and why structured logging eliminates the attack by treating the newline character as a field value rather than a record separator.",
      steps: [
        "Enter a payload containing \\r\\n — observe a second log line appearing to come from a different IP",
        "Try \\u0000 (null byte) — check which parsers truncate the line at that point",
        "Try ANSI escape codes to manipulate terminal rendering of the log",
        "Switch to JSON structured logging — the newline is escaped and the entire payload becomes one JSON field value",
      ],
      lookFor: "Text-based log formats trust the newline character to be an inert record separator. Structured formats treat every character as data. Any SIEM or log aggregator that parses newline-delimited text logs is vulnerable to CRLF injection from user-controlled fields.",
    },
  },
  DepResolverTool: {
    summary: "Simulate npm dependency resolution and see how a dependency confusion attack installs a higher-versioned malicious public package over your internal one at install time.",
    quickStart: [
      "Select the 'Normal resolution' scenario — internal package wins",
      "Switch to 'Dependency confusion' — observe the malicious v9.9.9 take precedence",
      "Select 'Scoped package' — see why @company/utils is safe from confusion",
    ],
    help: {
      goal: "How npm's version resolution algorithm creates a dependency confusion attack surface — public packages with a higher version number silently win over private internal ones at install time.",
      steps: [
        "Select 'Normal resolution' — the internal package at v1.2.3 is installed correctly",
        "Switch to 'Dependency confusion' — a public package published at v9.9.9 takes precedence over the internal one",
        "Select 'Scoped package' (@company/utils) — scoped package names cannot be shadowed by public packages",
        "Enable 'Private registry enforcement' in npm config — all installs check the internal registry first",
      ],
      lookFor: "npm resolves the highest available version regardless of which registry it came from. An attacker who discovers your internal package name and publishes a public package with the same name at a higher version wins automatically — no user interaction needed.",
    },
  },
  SBOMExplorerTool: {
    summary: "Browse a software bill of materials, inspect CVE details for each vulnerable dependency, and practice triage: fix, defer, or risk-accept based on severity and reachability.",
    quickStart: [
      "Filter to 'Vulnerable only' to focus the list",
      "Click a critical CVE to see its CVSS score and fix version",
      "Identify a medium CVE with no fix — decide between risk-accept and compensating control",
    ],
    help: {
      goal: "How to read a software bill of materials, interpret CVSS scores, assess reachability, and make structured triage decisions — fix, defer, or risk-accept.",
      steps: [
        "Filter to 'Critical and High' to prioritize the most urgent findings",
        "Click a critical CVE and read the CVSS vector for attack complexity and required access level",
        "Find a high-severity CVE with a fix version and identify the upgrade path",
        "Find a medium CVE with no available fix — compare risk-accept vs compensating control options",
      ],
      lookFor: "CVSS base score ignores your environment. A critical CVE in a library called from an unauthenticated hot path is far more urgent than the same CVE in a dev-only dependency that never ships to production. Reachability analysis is the key differentiator.",
    },
  },
  PipelineDAGTool: {
    summary: "Click through each stage of a CI/CD pipeline DAG and see which attack surfaces exist — from source code manipulation to artifact tampering to over-privileged deploy roles.",
    quickStart: [
      "Click the Source stage and review its attack vectors",
      "Examine the Build stage — note the dependency confusion and poisoned base image risks",
      "Check the Deploy stage and identify what a compromised role could do",
    ],
    help: {
      goal: "The attack surfaces at each stage of a CI/CD pipeline — from source commit through build, test, artifact storage, and deployment — and which controls belong at each node.",
      steps: [
        "Click the Source stage — review branch protection, signed commits, and CODEOWNERS as controls",
        "Click the Build stage — identify dependency confusion and poisoned base image as the main risks",
        "Click the Artifact stage — check for signing and provenance attestation",
        "Click the Deploy stage — see what a compromised deploy role or cluster admin binding could do",
      ],
      lookFor: "The build agent is the most valuable target — it has simultaneous read access to source code, credentials, and artifact storage. Ephemeral build environments and least-privilege deploy roles significantly reduce the blast radius if the build pipeline is compromised.",
    },
  },
  ProvenanceChainTool: {
    summary: "Compare a signed artifact chain (Cosign + SLSA provenance) with an unsigned one. Each step's attestation binds the binary back to the source commit and build identity.",
    quickStart: [
      "Select 'No signing' — observe every step is unverified",
      "Switch to 'With Cosign + SLSA' — all steps have attestations",
      "Click any step to read what its attestation proves and what it still cannot prove",
    ],
    help: {
      goal: "How signed build provenance chains a deployed artifact back to a specific source commit and authenticated build identity — and what remains unverifiable even with full signing.",
      steps: [
        "Select 'No signing' — every step is unverified; any artifact could have been substituted",
        "Switch to 'With Cosign + SLSA' — each step has a cryptographic attestation",
        "Click a step attestation and read what it proves: builder identity, source ref, and build inputs",
        "Note what attestations still cannot prove: that the source code itself contains no malicious logic",
      ],
      lookFor: "Provenance proves the build was reproducible and the artifact matches the source commit. It does not prove the source is benign. Combining provenance with SAST scanning and dependency analysis closes the remaining gap between 'built correctly' and 'built safely'.",
    },
  },
  SASTRuleBuilderTool: {
    summary: "Examine how SAST rules detect SQL injection, hardcoded secrets, and DOM XSS. See pattern-matching hit the call site — and taint analysis trace data flow across function boundaries.",
    quickStart: [
      "Select the SQL Injection example and run the scanner",
      "Observe the matched lines highlighted in the code view",
      "Switch to DOM XSS — note that taint flows across the helper function boundary",
    ],
    help: {
      goal: "How static analysis rules work — pattern matching for known-bad API calls vs taint analysis tracing data from user-controlled sources to dangerous sinks across function boundaries.",
      steps: [
        "Select the SQL Injection example and run the scanner",
        "Observe the highlighted sink (db.query) — the source (req.params) is user-controlled",
        "Enable taint analysis — the flow is traced through a helper function that the pattern matcher misses",
        "Switch to Hardcoded Secrets — see the regex pattern detecting high-entropy strings and known key prefixes",
        "Add a sanitizer function to the taint rule and verify the finding clears",
      ],
      lookFor: "Pure pattern matching misses data that flows through helper functions or is reassigned to a new variable. Taint analysis follows the data across function boundaries — it catches indirect flows but runs slower and produces more false positives. The two approaches are complementary.",
    },
  },
};
