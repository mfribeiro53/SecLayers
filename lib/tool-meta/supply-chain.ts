import type { ToolMeta } from "./types";

export const supplyChainMeta: Record<string, ToolMeta> = {
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
