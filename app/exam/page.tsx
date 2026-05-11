"use client";

import { useState } from "react";
import Link from "next/link";

interface Question {
  id: number;
  chapter: string;
  chapterTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { id: 1, chapter: "sql-injection", chapterTitle: "SQL Injection", question: "What is the primary defense against SQL injection?", options: ["Input validation", "Parameterized queries", "Web Application Firewall", "Stored procedures"], correctIndex: 1, explanation: "Parameterized queries (prepared statements) are the primary defense. They separate SQL structure from data values — user input is always treated as data, never as SQL syntax." },
  { id: 2, chapter: "xss", chapterTitle: "XSS", question: "Which DOM property should you use instead of innerHTML to safely insert user text?", options: ["innerText", "textContent", "outerHTML", "insertAdjacentHTML"], correctIndex: 1, explanation: "textContent sets plain text and never parses HTML. innerHTML parses HTML and executes any <script> tags in the input." },
  { id: 3, chapter: "csrf", chapterTitle: "CSRF", question: "Which SameSite cookie value blocks CSRF on POST requests while preserving normal link navigation?", options: ["None", "Strict", "Lax", "Secure"], correctIndex: 2, explanation: "SameSite=Lax sends cookies on top-level GET navigations but not on cross-site POST requests. This blocks CSRF while maintaining normal UX." },
  { id: 4, chapter: "cryptography", chapterTitle: "Cryptography", question: "Which hashing algorithm should be used for password storage?", options: ["SHA-256", "MD5", "bcrypt", "AES-256"], correctIndex: 2, explanation: "bcrypt (or Argon2, scrypt) is designed for password hashing — deliberately slow and with built-in salting. SHA-256 is too fast for password storage." },
  { id: 5, chapter: "threat-modeling", chapterTitle: "Threat Modeling", question: "What does STRIDE stand for?", options: ["Secure, Test, Review, Implement, Deploy, Evaluate", "Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege", "Scan, Test, Respond, Investigate, Detect, Eradicate", "Security, Trust, Reliability, Integrity, Durability, Efficiency"], correctIndex: 1, explanation: "STRIDE is Microsoft's threat classification framework: Spoofing, Tampering, Repudiation, Info Disclosure, Denial of Service, Elevation of Privilege." },
  { id: 6, chapter: "auth-sessions", chapterTitle: "Auth & Sessions", question: "How do you prevent session fixation attacks?", options: ["Use longer session IDs", "Regenerate the session ID on login", "Store sessions in a database", "Use HTTPS"], correctIndex: 1, explanation: "Regenerating the session ID on login invalidates any session ID the attacker may have previously obtained. Always regenerate on login and privilege changes." },
  { id: 7, chapter: "idor", chapterTitle: "IDOR", question: "What HTTP status code should you return when a user requests a resource they're not authorized to access?", options: ["403 Forbidden", "404 Not Found", "401 Unauthorized", "500 Internal Server Error"], correctIndex: 1, explanation: "Return 404 (Not Found) regardless of whether the ID exists but is unauthorized. Returning 403 confirms the resource exists, enabling ID enumeration." },
  { id: 8, chapter: "ssrf", chapterTitle: "SSRF", question: "What IP address does the AWS metadata endpoint use?", options: ["127.0.0.1", "10.0.0.1", "169.254.169.254", "192.168.1.1"], correctIndex: 2, explanation: "169.254.169.254 is the link-local address for cloud metadata services on AWS, GCP, and Azure. Accessible only from within the instance." },
  { id: 9, chapter: "input-validation", chapterTitle: "Input Validation", question: "Which validation strategy is more robust against novel attacks?", options: ["Block-lists", "Allow-lists", "Signature-based detection", "Length limits"], correctIndex: 1, explanation: "Allow-lists define valid input patterns and reject everything else. Block-lists are always incomplete — attackers find new encodings and bypasses." },
  { id: 10, chapter: "secure-sdlc", chapterTitle: "Secure SDLC", question: "What does 'shift-left' mean in the context of security?", options: ["Moving security to the operations team", "Moving security earlier in the development lifecycle", "Shifting responsibility to developers only", "Running security tools on the left side of the network"], correctIndex: 1, explanation: "Shift-left means integrating security earlier in the SDLC — requirements and design phases. A vulnerability caught in design costs dramatically less to fix than one caught in production." },
  { id: 11, chapter: "csp", chapterTitle: "Content Security Policy", question: "Which CSP directive should you NEVER use in production script-src?", options: ["'self'", "nonce-...", "'unsafe-inline'", "https://cdn.example.com"], correctIndex: 2, explanation: "'unsafe-inline' allows all inline <script> tags, defeating CSP's primary purpose. Use nonces or hashes for legitimate inline scripts instead." },
  { id: 12, chapter: "jwt", chapterTitle: "JWT Deep Dive", question: "What happens if a server accepts JWT tokens with alg: 'none'?", options: ["The token uses no algorithm — it's encrypted differently", "The token is accepted without any signature verification", "The server rejects the token automatically", "The token expires immediately"], correctIndex: 1, explanation: "alg: 'none' means no signature. If the server doesn't whitelist algorithms, an attacker can strip the signature and the unsigned token is accepted as valid." },
  { id: 13, chapter: "api-auth", chapterTitle: "API Authentication", question: "What does PKCE prevent in OAuth 2.0?", options: ["Token expiration", "Authorization code interception", "Password brute-force", "Session fixation"], correctIndex: 1, explanation: "PKCE (Proof Key for Code Exchange) prevents authorization code interception. Even if the code is stolen, the attacker cannot exchange it without the code_verifier." },
  { id: 14, chapter: "graphql", chapterTitle: "GraphQL Security", question: "What GraphQL feature lets attackers discover hidden fields and mutations?", options: ["Fragments", "Introspection", "Aliases", "Directives"], correctIndex: 1, explanation: "Introspection allows querying the schema to discover all types, fields, and mutations. Should be disabled in production." },
  { id: 15, chapter: "defensive-patterns", chapterTitle: "Defensive Patterns", question: "Which defensive pattern prevents IDOR vulnerabilities?", options: ["Parameterize every query", "Encode at output", "Authorize every access", "Validate at the boundary"], correctIndex: 2, explanation: "Authorize Every Access — verify the requester owns or is authorized to access every resource. This is the pattern that directly prevents IDOR." },
  { id: 16, chapter: "rate-limiting", chapterTitle: "Rate Limiting", question: "Which rate limiting algorithm allows bursts up to a maximum capacity?", options: ["Fixed window", "Sliding window", "Token bucket", "Leaky bucket"], correctIndex: 2, explanation: "Token bucket allows bursts up to the bucket capacity. Leaky bucket enforces a strict constant rate. Fixed window has boundary problems." },
  { id: 17, chapter: "sql-injection", chapterTitle: "SQL Injection", question: "What type of SQL injection uses UNION SELECT to append attacker results?", options: ["Blind SQLi", "Error-based SQLi", "Union-based SQLi", "Out-of-band SQLi"], correctIndex: 2, explanation: "Union-based SQLi uses UNION SELECT to append attacker-controlled query results to the legitimate output, displaying them on the page." },
  { id: 18, chapter: "xss", chapterTitle: "XSS", question: "Which type of XSS never reaches the server?", options: ["Reflected XSS", "Stored XSS", "DOM-based XSS", "Blind XSS"], correctIndex: 2, explanation: "DOM-based XSS happens entirely in the browser. The payload is in the URL fragment or another client-side source and is written to the DOM via unsafe JavaScript." },
  { id: 19, chapter: "csrf", chapterTitle: "CSRF", question: "What prevents an attacker from including a valid anti-CSRF token in a forged form?", options: ["HTTPS encryption", "Same-Origin Policy", "Content-Type validation", "CORS headers"], correctIndex: 1, explanation: "Same-Origin Policy prevents evil.com from reading bank.com's page to extract the anti-CSRF token. The attacker can submit a form to bank.com but cannot include a valid token." },
  { id: 20, chapter: "cryptography", chapterTitle: "Cryptography", question: "What happens if you reuse a nonce in AES-GCM with the same key?", options: ["Nothing — nonces are optional", "The encryption is slightly weaker", "It leaks the XOR of the two plaintexts", "The ciphertext becomes longer"], correctIndex: 2, explanation: "Nonce reuse in AES-GCM is catastrophic — it leaks the XOR of two plaintexts and may allow recovery of the authentication key, enabling message forgery." },
  { id: 21, chapter: "threat-modeling", chapterTitle: "Threat Modeling", question: "In a data flow diagram, where do threats live?", options: ["In data stores", "At external entities", "At trust boundaries", "In processes"], correctIndex: 2, explanation: "Trust boundaries are where threats live. Every time data crosses a trust boundary, you apply STRIDE: is the data spoofed, tampered, disclosed?" },
  { id: 22, chapter: "ssrf", chapterTitle: "SSRF", question: "What is the strongest defense against SSRF?", options: ["Block private IPs", "Allow-list of permitted URLs", "Use HTTPS only", "Validate response size"], correctIndex: 1, explanation: "An allow-list of permitted URLs is the strongest defense. Block-lists of IP ranges can be bypassed via DNS rebinding and alternative representations." },
  { id: 23, chapter: "security-headers", chapterTitle: "HTTP Security Headers", question: "Which header forces browsers to use HTTPS?", options: ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security", "X-Content-Type-Options"], correctIndex: 2, explanation: "HSTS (Strict-Transport-Security) tells browsers to only connect via HTTPS for a specified duration. Prevents SSL stripping attacks." },
  { id: 24, chapter: "defensive-patterns", chapterTitle: "Defensive Patterns", question: "Why should you return 404 instead of 403 for unauthorized resource access?", options: ["403 is deprecated", "404 prevents enumeration of valid IDs", "403 reveals stack traces", "404 is faster"], correctIndex: 1, explanation: "Returning 404 for unauthorized resources prevents attackers from distinguishing 'ID doesn't exist' from 'ID exists but you can't access it' — blocking ID enumeration." },
  { id: 25, chapter: "jwt", chapterTitle: "JWT Deep Dive", question: "Are JWT payloads encrypted?", options: ["Yes, always", "Only with RS256", "No, they are base64url-encoded (not encrypted)", "Only if the secret is long enough"], correctIndex: 2, explanation: "JWT payloads are base64url-encoded — trivially decoded. They are signed (integrity), not encrypted (confidentiality). Never put secrets in the payload." },
  { id: 26, chapter: "graphql", chapterTitle: "GraphQL", question: "How can attackers bypass rate limiting in GraphQL?", options: ["Using WebSockets", "Batching multiple queries in one request", "Using fragments", "Changing the HTTP method"], correctIndex: 1, explanation: "Batching (aliased queries) sends multiple operations in one HTTP request, bypassing REST-style rate limiting. Count each aliased query individually." },
  { id: 27, chapter: "api-versioning", chapterTitle: "API Versioning", question: "What is the security risk of keeping deprecated API versions live?", options: ["Increased server costs", "Old versions may expose data the current version hides", "Version numbers are predictable", "Deprecated versions use more bandwidth"], correctIndex: 1, explanation: "Deprecated API versions often expose sensitive fields that were intentionally removed in newer versions. Attackers specifically target old versions because security attention has moved on." },
  { id: 28, chapter: "auth-sessions", chapterTitle: "Auth & Sessions", question: "What is the minimum entropy recommended for session IDs?", options: ["32 bits", "64 bits", "128 bits", "256 bits"], correctIndex: 2, explanation: "At least 128 bits of entropy from a CSPRNG (crypto.randomBytes). This makes brute-force guessing computationally infeasible." },
  { id: 29, chapter: "cryptography", chapterTitle: "Cryptography", question: "Which AES mode reveals patterns in the encrypted data?", options: ["GCM", "CBC", "ECB", "CTR"], correctIndex: 2, explanation: "ECB (Electronic Codebook) encrypts each block independently — identical plaintext blocks produce identical ciphertext blocks, revealing data structure." },
  { id: 30, chapter: "xss", chapterTitle: "XSS", question: "What does HttpOnly flag on cookies prevent?", options: ["Cookies being sent over HTTP", "JavaScript reading the cookie", "Cross-site cookie access", "Cookie expiration"], correctIndex: 1, explanation: "HttpOnly prevents JavaScript from reading the cookie via document.cookie. This mitigates cookie theft via XSS, though the attacker can still make authenticated requests." },
  { id: 31, chapter: "input-validation", chapterTitle: "Input Validation", question: "Where should input validation happen?", options: ["Client-side only", "Server-side only", "Both client-side (UX) and server-side (security)", "In the database"], correctIndex: 2, explanation: "Client-side validation for UX, server-side validation for security. An attacker can bypass client-side validation trivially — server-side validation is the security control." },
  { id: 32, chapter: "secure-sdlc", chapterTitle: "Secure SDLC", question: "Which phase should SAST scanning run in?", options: ["Design", "Development", "Testing", "Operations"], correctIndex: 1, explanation: "SAST runs during development — in CI/CD on every push. It catches vulnerability patterns before they reach testing or production." },
  { id: 33, chapter: "idor", chapterTitle: "IDOR", question: "Do UUIDs prevent IDOR?", options: ["Yes, they prevent enumeration completely", "No, they prevent guessing but don't replace authorization checks", "Yes, if they're version 4", "Only when combined with HTTPS"], correctIndex: 1, explanation: "UUIDs prevent sequential ID guessing but don't prevent access if an ID is leaked. Authorization checks are always required regardless of the ID format." },
  { id: 34, chapter: "rate-limiting", chapterTitle: "Rate Limiting", question: "What problem does a sliding window solve compared to a fixed window?", options: ["Memory usage", "Double-burst at window boundaries", "Token generation speed", "Request queuing"], correctIndex: 1, explanation: "Fixed window resets at boundaries — 100 requests at 0:59 + 100 at 1:00 = 200 in 2 seconds. Sliding window counts requests in the last N seconds, eliminating boundary abuse." },
  { id: 35, chapter: "api-auth", chapterTitle: "API Auth", question: "Which OAuth grant type should NEVER be used (deprecated by OAuth 2.1)?", options: ["Authorization Code", "Client Credentials", "Implicit Grant", "Device Code"], correctIndex: 2, explanation: "The implicit grant returns tokens directly in the URL fragment without PKCE or client authentication. Deprecated in OAuth 2.1 in favor of Authorization Code + PKCE." },
  { id: 36, chapter: "csp", chapterTitle: "CSP", question: "What does 'object-src none' block?", options: ["Images", "CSS files", "Plugin content (Flash, ActiveX)", "JavaScript"], correctIndex: 2, explanation: "object-src 'none' blocks <object>, <embed>, and <applet> elements. These are legacy plugin vectors that can bypass other CSP restrictions." },
  { id: 37, chapter: "sql-injection", chapterTitle: "SQL Injection", question: "What is second-order SQL injection?", options: ["SQLi using two queries", "A payload stored safely but executed later from a different code path", "SQLi using UNION SELECT twice", "SQLi that requires two different parameters"], correctIndex: 1, explanation: "Second-order SQLi stores the payload safely (parameterized INSERT) but it executes later when retrieved and used unsafely (string concatenation in a SELECT)." },
  { id: 38, chapter: "security-headers", chapterTitle: "Security Headers", question: "Which header prevents MIME type sniffing?", options: ["Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"], correctIndex: 1, explanation: "X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing the response. The browser must respect the declared Content-Type header." },
  { id: 39, chapter: "csrf", chapterTitle: "CSRF", question: "Why should state-changing operations never use GET?", options: ["GET is slower", "GET can be triggered by an <img> tag — trivial CSRF", "GET doesn't support cookies", "GET is not encrypted"], correctIndex: 1, explanation: "A simple <img src='...'> tag triggers a GET request with cookies attached — no form, no JavaScript, no user interaction beyond viewing the page." },
  { id: 40, chapter: "secure-sdlc", chapterTitle: "Secure SDLC", question: "What's the approximate cost multiplier of fixing a vulnerability in production vs design?", options: ["2x", "10x", "100x", "10,000x"], correctIndex: 3, explanation: "Fixing a vulnerability in design costs ~$10. The same vulnerability in production can cost $100,000+ — a 10,000x multiplier when accounting for incident response, legal, and reputation." },
];

const card: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
};

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  const start = () => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setSubmitted(false);
  };

  const answer = (questionId: number, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const next = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion((c) => c + 1);
    }
  };
  const prev = () => {
    if (currentQuestion > 0) setCurrentQuestion((c) => c - 1);
  };
  const submit = () => setSubmitted(true);

  const score = submitted
    ? shuffledQuestions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;
  const q = shuffledQuestions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
      <header
        className="rounded-2xl p-7 lg:p-9 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-strong)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
          }}
        />
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "#a5b4fc" }}
        >
          Assessment
        </p>
        <h1
          className="mt-2 text-3xl lg:text-4xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Exam
        </h1>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          {QUESTIONS.length} questions across{" "}
          {new Set(QUESTIONS.map((q) => q.chapter)).size} Phase 1 chapters
        </p>
      </header>

      <div className="mt-8">
        {!started ? (
          <div
            className="p-8 rounded-xl text-center space-y-5"
            style={card}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              Questions are randomly shuffled. You can navigate freely and
              change answers before submitting.
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Start Exam
            </button>
          </div>
        ) : submitted ? (
          <div className="space-y-6">
            <div
              className="p-8 rounded-xl text-center"
              style={card}
            >
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {score} / {shuffledQuestions.length}
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {score >= 32
                  ? "Excellent — strong AppSec fundamentals."
                  : score >= 24
                    ? "Good work. Review the chapters for topics you missed."
                    : "Keep studying. Review the chapters and try again."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={start}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    background: "var(--accent)",
                    color: "white",
                  }}
                >
                  Retake
                </button>
                <Link
                  href="/"
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ← Back to chapters
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              {shuffledQuestions.map((q) => {
                const isCorrect = answers[q.id] === q.correctIndex;
                const accent = isCorrect ? "#34d399" : "#f87171";
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-lg text-sm"
                    style={{
                      background: "var(--bg-surface)",
                      borderLeft: `3px solid ${accent}`,
                      border: "1px solid var(--border-subtle)",
                      borderLeftWidth: "3px",
                      borderLeftColor: accent,
                    }}
                  >
                    <p style={{ color: "var(--text-primary)" }}>
                      {isCorrect ? "✓" : "✗"} {q.question}
                    </p>
                    {!isCorrect && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Correct: {q.options[q.correctIndex]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          q && (
            <div className="space-y-5">
              {/* Progress */}
              <div
                className="flex items-center justify-between text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <span>
                  Question {currentQuestion + 1} of{" "}
                  {shuffledQuestions.length}
                </span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%`,
                    background: "var(--accent)",
                  }}
                />
              </div>

              {/* Question */}
              <div className="p-6 rounded-xl" style={card}>
                <p
                  className="text-[11px] uppercase tracking-widest font-bold mb-2"
                  style={{ color: "#a5b4fc" }}
                >
                  {q.chapterTitle}
                </p>
                <p
                  className="text-lg font-medium leading-relaxed"
                  style={{ color: "var(--text-primary)" }}
                >
                  {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => answer(q.id, i)}
                      className="w-full text-left p-4 rounded-lg transition-colors"
                      style={{
                        background: selected
                          ? "var(--accent-soft)"
                          : "var(--bg-surface)",
                        color: selected
                          ? "#a5b4fc"
                          : "var(--text-secondary)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border-subtle)"}`,
                      }}
                    >
                      <span
                        className="font-mono text-xs mr-2"
                        style={{
                          color: selected ? "#a5b4fc" : "var(--text-muted)",
                        }}
                      >
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Nav */}
              <div className="flex justify-between">
                <button
                  onClick={prev}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  ← Previous
                </button>
                {currentQuestion < shuffledQuestions.length - 1 ? (
                  <button
                    onClick={next}
                    className="px-4 py-2 text-sm rounded-md font-medium"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    className="px-4 py-2 text-sm rounded-md font-medium"
                    style={{ background: "#10b981", color: "white" }}
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
