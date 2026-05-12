import type { ToolMeta } from "./types";

export const webMeta: Record<string, ToolMeta> = {
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
};
