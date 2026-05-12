import type { ToolMeta } from "./types";

export const apiMeta: Record<string, ToolMeta> = {
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
};
