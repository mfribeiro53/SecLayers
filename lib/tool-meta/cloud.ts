import type { ToolMeta } from "./types";

export const cloudMeta: Record<string, ToolMeta> = {
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
};
