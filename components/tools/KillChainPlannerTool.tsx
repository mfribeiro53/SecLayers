"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

// ── Types ────────────────────────────────────────────────────────────────────

interface Technique {
  id: string;
  label: string;
  mitreId: string;
  description: string;
  chapterSlug?: string;
}

interface KillChainStage {
  name: string;
  icon: string;
  description: string;
  techniques: [Technique, Technique, Technique];
}

interface Mitigation {
  id: string;
  label: string;
  description: string;
  counters: string[]; // technique IDs this mitigation stops
}

interface Scenario {
  id: string;
  title: string;
  icon: string;
  stack: string;
  description: string;
  stages: KillChainStage[];
  mitigations: Mitigation[];
}

// ── Scenario Data ─────────────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  // ── A: Fintech Web App ──────────────────────────────────────────────────────
  {
    id: "webapp",
    title: "Fintech Web App",
    icon: "🏦",
    stack: "React SPA · Node.js API · PostgreSQL · AWS",
    description: "A customer-facing banking application with a REST API and cloud-hosted database.",
    mitigations: [
      {
        id: "a-param",
        label: "Parameterized queries",
        description: "All DB queries use prepared statements. SQLi payloads are treated as literal strings.",
        counters: ["a-weapon-sqli", "a-exploit-sqli", "a-install-crack", "a-action-exfil"],
      },
      {
        id: "a-bcrypt",
        label: "bcrypt password hashing",
        description: "Passwords stored with bcrypt (cost 12). Rainbow tables and fast-hash cracking are useless.",
        counters: ["a-install-crack"],
      },
      {
        id: "a-mfa",
        label: "MFA on privileged accounts",
        description: "Stolen password alone is insufficient — admin login requires a TOTP second factor.",
        counters: ["a-install-login", "a-c2-session", "a-action-idor"],
      },
      {
        id: "a-ssrf",
        label: "Outbound URL allow-list",
        description: "Image proxy restricted to an approved domain list. 169.254.x.x addresses are rejected.",
        counters: ["a-weapon-ssrf", "a-exploit-ssrf", "a-install-aws", "a-c2-aws", "a-action-rds"],
      },
      {
        id: "a-gitscan",
        label: "CI secret scanning",
        description: "Pre-commit hooks and CI blocks commits containing AWS keys or .env secrets.",
        counters: ["a-recon-github"],
      },
    ],
    stages: [
      {
        name: "Reconnaissance",
        icon: "🔍",
        description: "Gather information about the target without touching the application.",
        techniques: [
          { id: "a-recon-ct", label: "CT log subdomain enum", mitreId: "T1596.003", description: "Query crt.sh — find api.bank.com, admin.bank.com, and staging.bank.com from certificate transparency records." },
          { id: "a-recon-github", label: "GitHub secret scanning", mitreId: "T1593.003", description: "Search GitHub for the company name — a stale branch contains AWS_SECRET_KEY in a committed .env file.", chapterSlug: "secrets" },
          { id: "a-recon-linkedin", label: "LinkedIn org mapping", mitreId: "T1591.004", description: "Map the engineering team. The auth lead's open-source projects reveal the exact ORM and Node.js version in use." },
        ],
      },
      {
        name: "Weaponization",
        icon: "⚗️",
        description: "Build the attack tool matched to the discovered target.",
        techniques: [
          { id: "a-weapon-sqli", label: "UNION-based SQLi payload", mitreId: "T1190", description: "Craft: ' UNION SELECT email,password_hash,NULL FROM users-- tested against a local mock of the same ORM version.", chapterSlug: "sql-injection" },
          { id: "a-weapon-phish", label: "Phishing site clone", mitreId: "T1566.001", description: "Mirror the production login page at bank-secure-login.com. Set up a credential-capture webhook.", chapterSlug: "auth-sessions" },
          { id: "a-weapon-ssrf", label: "SSRF metadata payload", mitreId: "T1552.005", description: "Identify an image-proxy endpoint. Craft URL: http://169.254.169.254/latest/meta-data/iam/security-credentials/", chapterSlug: "ssrf" },
        ],
      },
      {
        name: "Delivery",
        icon: "📨",
        description: "Transmit the weapon to the target environment.",
        techniques: [
          { id: "a-deliver-sqli", label: "Submit via login form", mitreId: "T1190", description: "Enter the crafted payload in the username field. The app concatenates it directly into a SQL query." },
          { id: "a-deliver-phish", label: "Spear-phish auth team lead", mitreId: "T1566.001", description: "Personalised email referencing their recent GitHub commit. 'Security advisory — please review.' Links to clone site." },
          { id: "a-deliver-ssrf", label: "SSRF via profile image URL", mitreId: "T1190", description: "Use the 'import picture from URL' feature. Submit the metadata endpoint address as the image source." },
        ],
      },
      {
        name: "Exploitation",
        icon: "💥",
        description: "The weapon triggers a vulnerability — access or data obtained.",
        techniques: [
          { id: "a-exploit-sqli", label: "Dump users table", mitreId: "T1190", description: "UNION SELECT returns 2M rows with email + MD5 password hashes in the HTTP response body.", chapterSlug: "sql-injection" },
          { id: "a-exploit-creds", label: "Capture plaintext credentials", mitreId: "T1078.001", description: "Auth team lead submits credentials on the clone site. Username and plaintext password captured in the webhook.", chapterSlug: "auth-sessions" },
          { id: "a-exploit-ssrf", label: "Read IAM keys from metadata", mitreId: "T1552.005", description: "SSRF response contains AccessKeyId + SecretAccessKey — temporary credentials for the EC2 instance role.", chapterSlug: "ssrf" },
        ],
      },
      {
        name: "Installation",
        icon: "🔩",
        description: "Establish persistence — access must survive a session ending.",
        techniques: [
          { id: "a-install-crack", label: "Crack MD5 hashes offline", mitreId: "T1110.002", description: "hashcat + rockyou.txt — 600k passwords cracked in 4 minutes. Admin password: 'Admin2019!'.", chapterSlug: "cryptography" },
          { id: "a-install-login", label: "Log into admin panel", mitreId: "T1078.001", description: "Production admin login succeeds. No MFA enforced. Create a backdoor admin account for durable access.", chapterSlug: "auth-sessions" },
          { id: "a-install-aws", label: "Configure AWS CLI with stolen IAM creds", mitreId: "T1078.004", description: "aws configure with stolen keys. Create a persistent IAM user before the 6-hour temp token expires.", chapterSlug: "iam" },
        ],
      },
      {
        name: "Command & Control",
        icon: "📡",
        description: "Establish a communication channel back to attacker infrastructure.",
        techniques: [
          { id: "a-c2-direct", label: "Direct admin panel access", mitreId: "T1078.001", description: "No external C2 needed. Admin web session provides full access. All activity blends with legitimate traffic." },
          { id: "a-c2-session", label: "Web session as C2 channel", mitreId: "T1071.001", description: "Authenticated session — all activity appears as a legitimate user in application logs.", chapterSlug: "logging-monitoring" },
          { id: "a-c2-aws", label: "AWS APIs as command channel", mitreId: "T1071.004", description: "All AWS CLI calls use official endpoints over HTTPS/443 — indistinguishable from authorized cloud management.", chapterSlug: "logging-monitoring" },
        ],
      },
      {
        name: "Actions on Objectives",
        icon: "🎯",
        description: "Execute the ultimate goal of the operation.",
        techniques: [
          { id: "a-action-exfil", label: "Exfiltrate via admin SQL console", mitreId: "T1005", description: "Admin panel includes a query interface. SELECT * FROM customers exports 2M records to CSV.", chapterSlug: "sql-injection" },
          { id: "a-action-idor", label: "IDOR customer enumeration", mitreId: "T1078.001", description: "Admin session — iterate /api/users/1 through /api/users/2000000. Full account details for every user.", chapterSlug: "idor" },
          { id: "a-action-rds", label: "RDS cross-account snapshot", mitreId: "T1537", description: "Create RDS snapshot, share with attacker's AWS account, restore to attacker environment — full DB copy.", chapterSlug: "cloud-storage" },
        ],
      },
    ],
  },
  // ── B: Android Banking App ──────────────────────────────────────────────────
  {
    id: "mobile",
    title: "Android Banking App",
    icon: "📱",
    stack: "React Native · REST API · Biometric auth · Play Store",
    description: "A banking app distributed via the Play Store with biometric authentication and certificate pinning.",
    mitigations: [
      {
        id: "b-pinning",
        label: "Cert pinning + anti-tampering",
        description: "Cert pinning verified at runtime with integrity checks. Modified APKs fail on launch.",
        counters: ["b-weapon-tamper", "b-exploit-intercept", "b-install-token", "b-c2-token", "b-action-balance"],
      },
      {
        id: "b-hwbiometric",
        label: "Hardware-backed biometric auth",
        description: "Authentication keys stored in Android StrongBox. Cannot be accessed or bypassed by userspace code.",
        counters: ["b-weapon-biometric", "b-exploit-biometric", "b-install-frida", "b-action-transfer"],
      },
      {
        id: "b-nosecrets",
        label: "No hardcoded secrets in APKs",
        description: "API keys provisioned at runtime from a secure server — never embedded in client builds.",
        counters: ["b-recon-storage", "b-weapon-storage", "b-exploit-api", "b-install-apikey", "b-c2-direct", "b-action-pii"],
      },
      {
        id: "b-tokenexpiry",
        label: "Short-lived access tokens (15 min)",
        description: "Bearer tokens expire after 15 minutes. Captured tokens are useless after the window closes.",
        counters: ["b-install-token", "b-c2-token", "b-action-balance"],
      },
      {
        id: "b-obfuscation",
        label: "Code obfuscation + root detection",
        description: "ProGuard obfuscation + runtime emulator/root detection raises reverse engineering cost significantly.",
        counters: ["b-recon-apk", "b-recon-jadx"],
      },
    ],
    stages: [
      {
        name: "Reconnaissance",
        icon: "🔍",
        description: "Analyse the application before deciding on an attack vector.",
        techniques: [
          { id: "b-recon-apk", label: "APK download + apktool", mitreId: "T1587.001", description: "Pull the APK from the Play Store. Decompile with apktool to recover smali code and resource files.", chapterSlug: "mobile-reversing" },
          { id: "b-recon-jadx", label: "JADX decompilation", mitreId: "T1587.001", description: "Decompile with JADX to near-Java source. Find the API base URL, auth endpoints, and cert pinning implementation.", chapterSlug: "mobile-reversing" },
          { id: "b-recon-storage", label: "Static string extraction", mitreId: "T1552.001", description: "Run 'strings' against the APK resources — find a hardcoded API key in strings.xml granting backend access.", chapterSlug: "mobile-storage" },
        ],
      },
      {
        name: "Weaponization",
        icon: "⚗️",
        description: "Build a custom tool to exploit the discovered weakness.",
        techniques: [
          { id: "b-weapon-tamper", label: "APK repackaging (pin disable)", mitreId: "T1406", description: "Patch the certificate pinning check in smali. Re-sign the APK and sideload — traffic is now interceptable.", chapterSlug: "mobile-reversing" },
          { id: "b-weapon-biometric", label: "Frida biometric bypass script", mitreId: "T1626.001", description: "Write a Frida script that hooks the biometric auth method and unconditionally returns AUTH_SUCCESS.", chapterSlug: "mobile-biometrics" },
          { id: "b-weapon-storage", label: "Extract hardcoded API key", mitreId: "T1409", description: "API key found in strings.xml grants privileged service account access to the backend — no user auth needed.", chapterSlug: "mobile-storage" },
        ],
      },
      {
        name: "Delivery",
        icon: "📨",
        description: "Position the attack against a real device or API.",
        techniques: [
          { id: "b-deliver-mitm", label: "MITM on sideloaded APK", mitreId: "T1557", description: "Sideload the modified APK on a test device. Route traffic through Burp Suite — pinning is now disabled.", chapterSlug: "mobile-tls" },
          { id: "b-deliver-frida", label: "Deploy Frida hook at runtime", mitreId: "T1422", description: "Attach Frida to the running app process. Biometric hook activates — no APK modification needed on rooted device.", chapterSlug: "mobile-biometrics" },
          { id: "b-deliver-apikey", label: "Direct API call with extracted key", mitreId: "T1552.001", description: "The hardcoded key requires no device. Make API calls directly from an attacker machine.", chapterSlug: "mobile-storage" },
        ],
      },
      {
        name: "Exploitation",
        icon: "💥",
        description: "Gain unauthorised access or data using the delivered weapon.",
        techniques: [
          { id: "b-exploit-intercept", label: "Intercept bearer tokens", mitreId: "T1557", description: "Pinning disabled — Burp intercepts auth responses containing bearer tokens for real user sessions.", chapterSlug: "mobile-tls" },
          { id: "b-exploit-biometric", label: "Auth without valid biometric", mitreId: "T1626.001", description: "Frida hook returns AUTH_SUCCESS. Full account access without a valid enrolled fingerprint.", chapterSlug: "mobile-biometrics" },
          { id: "b-exploit-api", label: "Direct API access via service key", mitreId: "T1552.001", description: "Hardcoded key authenticates as a privileged service account. No user authentication required.", chapterSlug: "mobile-storage" },
        ],
      },
      {
        name: "Installation",
        icon: "🔩",
        description: "Ensure access persists beyond the current session.",
        techniques: [
          { id: "b-install-token", label: "Store intercepted bearer tokens", mitreId: "T1539", description: "Captured long-lived bearer tokens stored locally. Re-use allows repeated access without re-authentication." },
          { id: "b-install-frida", label: "Embed Frida gadget in APK", mitreId: "T1398", description: "Repackage with embedded Frida gadget — biometric bypass is now permanent without a tethered PC.", chapterSlug: "mobile-reversing" },
          { id: "b-install-apikey", label: "Key persists in all installs", mitreId: "T1552.001", description: "The hardcoded key exists in every installed version across millions of devices. No persistence step needed.", chapterSlug: "mobile-storage" },
        ],
      },
      {
        name: "Command & Control",
        icon: "📡",
        description: "Maintain ongoing access to the target environment.",
        techniques: [
          { id: "b-c2-token", label: "Bearer token reuse", mitreId: "T1078", description: "Captured tokens re-used in standard API calls. All traffic appears as legitimate app requests.", chapterSlug: "logging-monitoring" },
          { id: "b-c2-gadget", label: "Frida gadget on localhost", mitreId: "T1422", description: "Embedded gadget accepts commands on localhost:27042. Requires ongoing physical device access." },
          { id: "b-c2-direct", label: "Direct API calls with service key", mitreId: "T1071.001", description: "Hardcoded key used directly — all calls appear as legitimate service-to-service traffic.", chapterSlug: "logging-monitoring" },
        ],
      },
      {
        name: "Actions on Objectives",
        icon: "🎯",
        description: "Execute the final goal of the operation.",
        techniques: [
          { id: "b-action-balance", label: "Enumerate account balances", mitreId: "T1005", description: "Captured tokens used to call /api/account/balance for each user. Full financial exposure mapped.", chapterSlug: "idor" },
          { id: "b-action-transfer", label: "Initiate unauthorised transfers", mitreId: "T1657", description: "Biometric bypass allows authorising fund transfers on behalf of any authenticated user.", chapterSlug: "mobile-biometrics" },
          { id: "b-action-pii", label: "Mass PII exfiltration via service key", mitreId: "T1005", description: "Service-level key has read access to all user records — full name, account numbers, and SSNs extracted.", chapterSlug: "mobile-storage" },
        ],
      },
    ],
  },
  // ── C: Cloud Infrastructure ─────────────────────────────────────────────────
  {
    id: "cloud",
    title: "Cloud Infrastructure",
    icon: "☁️",
    stack: "AWS · IAM · EC2 · S3 · RDS",
    description: "An AWS environment with multiple services, IAM roles, and EC2-hosted applications.",
    mitigations: [
      {
        id: "c-s3block",
        label: "S3 Block Public Access",
        description: "AWS Block Public Access enabled on all buckets. Unauthenticated reads are refused.",
        counters: ["c-recon-s3", "c-weapon-s3", "c-exploit-s3", "c-install-rds", "c-action-dump"],
      },
      {
        id: "c-leastpriv",
        label: "IAM least privilege",
        description: "EC2 role restricted to required permissions only. iam:PassRole and lambda:CreateFunction removed.",
        counters: ["c-weapon-iam", "c-exploit-iam", "c-install-adminiam", "c-c2-iamuser", "c-action-ransom"],
      },
      {
        id: "c-imdsv2",
        label: "IMDSv2 (session-oriented metadata)",
        description: "EC2 metadata service requires session tokens. SSRF attacks using simple GET requests are blocked.",
        counters: ["c-recon-meta", "c-weapon-iam", "c-exploit-iam"],
      },
      {
        id: "c-secretsmgr",
        label: "AWS Secrets Manager for all creds",
        description: "No credentials in .env files or S3. All secrets fetched at runtime via IAM-authenticated Secrets Manager.",
        counters: ["c-exploit-s3", "c-install-rds", "c-install-devsecret", "c-c2-rds", "c-action-dump"],
      },
      {
        id: "c-sshkeys",
        label: "SSH key auth, passwords disabled",
        description: "Password authentication disabled on all EC2 instances. Brute force produces 'Permission denied (publickey)'.",
        counters: ["c-recon-shodan", "c-weapon-ssh", "c-exploit-dev", "c-install-devsecret", "c-c2-dev", "c-action-pivot"],
      },
    ],
    stages: [
      {
        name: "Reconnaissance",
        icon: "🔍",
        description: "Enumerate publicly visible cloud assets and attack surface.",
        techniques: [
          { id: "c-recon-s3", label: "Public S3 bucket enumeration", mitreId: "T1530", description: "Run s3scanner against the company domain — find company-backups.s3.amazonaws.com with public-read ACL.", chapterSlug: "cloud-storage" },
          { id: "c-recon-meta", label: "SSRF → EC2 metadata probe", mitreId: "T1552.005", description: "A web app on EC2 has an SSRF flaw. Send a request to 169.254.169.254 to retrieve instance role credentials.", chapterSlug: "ssrf" },
          { id: "c-recon-shodan", label: "Shodan cloud asset scan", mitreId: "T1596.005", description: "Query Shodan for the company ASN — find development EC2 instances with port 22 open and password auth enabled." },
        ],
      },
      {
        name: "Weaponization",
        icon: "⚗️",
        description: "Prepare the attack tools for the discovered cloud misconfigurations.",
        techniques: [
          { id: "c-weapon-s3", label: "S3 exfiltration script", mitreId: "T1530", description: "Write: aws s3 sync s3://company-backups ./loot — the bucket has public-read. 40GB of DB backups available.", chapterSlug: "cloud-storage" },
          { id: "c-weapon-iam", label: "IAM privilege escalation via Lambda", mitreId: "T1078.004", description: "Run Pacu — EC2 role has iam:PassRole + lambda:CreateFunction. Full privilege escalation path confirmed.", chapterSlug: "iam" },
          { id: "c-weapon-ssh", label: "SSH credential brute force", mitreId: "T1110.001", description: "Target the dev EC2 with Hydra — try common username/password combinations against port 22." },
        ],
      },
      {
        name: "Delivery",
        icon: "📨",
        description: "Execute the access vector against the target.",
        techniques: [
          { id: "c-deliver-s3", label: "Unauthenticated S3 HTTP access", mitreId: "T1530", description: "No delivery step needed — public-read bucket is accessible via unauthenticated HTTP GET from anywhere.", chapterSlug: "cloud-storage" },
          { id: "c-deliver-ssrf", label: "Trigger SSRF in web application", mitreId: "T1190", description: "Submit SSRF payload via a vulnerable URL parameter in the web app. Metadata endpoint responds.", chapterSlug: "ssrf" },
          { id: "c-deliver-ssh", label: "SSH brute force to dev instance", mitreId: "T1110.001", description: "Hydra cracks 'ubuntu'/'password' on the dev EC2 in three seconds. Shell obtained." },
        ],
      },
      {
        name: "Exploitation",
        icon: "💥",
        description: "Use the gained access to escalate or extract sensitive data.",
        techniques: [
          { id: "c-exploit-s3", label: "Download all S3 objects", mitreId: "T1530", description: "aws s3 sync completes — 40GB including DB backups and a .env file with production RDS credentials.", chapterSlug: "cloud-storage" },
          { id: "c-exploit-iam", label: "Escalate IAM privileges via Lambda", mitreId: "T1078.004", description: "Create Lambda with AdministratorAccess role. Invoke it — now have full AWS admin access.", chapterSlug: "iam" },
          { id: "c-exploit-dev", label: "Find prod DB creds in dev .env", mitreId: "T1078.001", description: "Dev .env contains production DATABASE_URL with plaintext credentials. RDS accessible from dev VPC.", chapterSlug: "secrets" },
        ],
      },
      {
        name: "Installation",
        icon: "🔩",
        description: "Establish durable access to the cloud environment.",
        techniques: [
          { id: "c-install-rds", label: "Extract RDS creds from S3 .env", mitreId: "T1552.001", description: ".env file contains: DATABASE_URL=postgresql://prod-db.rds.amazonaws.com with plaintext password.", chapterSlug: "secrets" },
          { id: "c-install-adminiam", label: "Create persistent admin IAM user", mitreId: "T1136.003", description: "aws iam create-user --user-name support-bot. Attach AdministratorAccess. Generate API keys for persistence.", chapterSlug: "iam" },
          { id: "c-install-devsecret", label: "Use dev secrets for prod access", mitreId: "T1552.001", description: "Dev .env contains prod credentials. The dev VPC has a security group rule allowing RDS access.", chapterSlug: "secrets" },
        ],
      },
      {
        name: "Command & Control",
        icon: "📡",
        description: "Maintain an ongoing command channel into the environment.",
        techniques: [
          { id: "c-c2-rds", label: "Direct RDS connection (port 5432)", mitreId: "T1071.002", description: "Connect directly to PostgreSQL with extracted credentials. All queries appear as application DB traffic.", chapterSlug: "logging-monitoring" },
          { id: "c-c2-iamuser", label: "Persistent IAM user API calls", mitreId: "T1078.004", description: "Created IAM user persists indefinitely. All AWS API calls use legitimate endpoints. Blends with cloud ops.", chapterSlug: "logging-monitoring" },
          { id: "c-c2-dev", label: "Dev SSH as pivot point", mitreId: "T1021.004", description: "Dev SSH access maintained as a persistent foothold for ongoing prod access via dev-to-prod trust." },
        ],
      },
      {
        name: "Actions on Objectives",
        icon: "🎯",
        description: "Execute the final goal against production data.",
        techniques: [
          { id: "c-action-dump", label: "Full production DB dump", mitreId: "T1005", description: "pg_dump against prod RDS — complete database exfiltration including all customer PII.", chapterSlug: "cloud-storage" },
          { id: "c-action-ransom", label: "Ransomware via admin IAM", mitreId: "T1486", description: "AdminAccess allows encrypting all S3 objects and deleting RDS snapshots. Ransom note deployed.", chapterSlug: "iam" },
          { id: "c-action-pivot", label: "Pivot to all production services", mitreId: "T1021", description: "Cluster admin + RDS creds provides access to every database, Lambda, and ECS service in the account.", chapterSlug: "k8s-rbac" },
        ],
      },
    ],
  },
  // ── D: CI/CD Pipeline ────────────────────────────────────────────────────────
  {
    id: "cicd",
    title: "CI/CD Pipeline",
    icon: "🔄",
    stack: "GitHub Actions · npm registry · Docker Hub · Kubernetes",
    description: "A software delivery pipeline deploying containerised workloads to a Kubernetes cluster.",
    mitigations: [
      {
        id: "d-scope",
        label: "Internal npm package scoping",
        description: "All internal packages use @company/ scope. The public registry cannot shadow a scoped name.",
        counters: ["d-recon-npm", "d-weapon-dep", "d-exploit-dep", "d-install-creds", "d-c2-aws", "d-action-prod"],
      },
      {
        id: "d-digest",
        label: "Docker image digest pinning",
        description: "All FROM directives and docker pull use @sha256 digest. Tags cannot be silently replaced.",
        counters: ["d-weapon-docker", "d-exploit-docker", "d-install-shell", "d-c2-shell", "d-action-supply"],
      },
      {
        id: "d-ghperms",
        label: "Minimal GitHub Actions permissions",
        description: "GITHUB_TOKEN has no secret access from forks. Sensitive secrets scoped to protected branches only.",
        counters: ["d-recon-secrets", "d-weapon-token", "d-exploit-k8s", "d-install-k8s", "d-c2-k8s", "d-action-k8s"],
      },
      {
        id: "d-oidc",
        label: "OIDC short-lived cloud credentials",
        description: "Pipeline uses OIDC federation — no static AWS keys stored as GitHub secrets. Nothing to exfiltrate.",
        counters: ["d-install-creds", "d-c2-aws", "d-action-prod"],
      },
      {
        id: "d-sbom",
        label: "SBOM + dependency integrity checks",
        description: "package-lock.json integrity hashes verified in CI. New dependencies require explicit approval.",
        counters: ["d-weapon-dep", "d-exploit-dep"],
      },
    ],
    stages: [
      {
        name: "Reconnaissance",
        icon: "🔍",
        description: "Map the pipeline and find a vector before touching production.",
        techniques: [
          { id: "d-recon-npm", label: "Internal package name enumeration", mitreId: "T1195.001", description: "Find that 'company-utils' is referenced in package.json but not published to public npm — dependency confusion target.", chapterSlug: "dep-confusion" },
          { id: "d-recon-workflow", label: "GitHub Actions workflow analysis", mitreId: "T1592.002", description: "Read .github/workflows — pipeline pulls docker.io/company/app:latest without digest pinning.", chapterSlug: "cicd" },
          { id: "d-recon-secrets", label: "GitHub Actions secret exposure", mitreId: "T1552.001", description: "A PR from a fork triggers a workflow that accidentally echoes ${{ secrets.PROD_DEPLOY_KEY }} in a debug step.", chapterSlug: "secrets" },
        ],
      },
      {
        name: "Weaponization",
        icon: "⚗️",
        description: "Build a malicious artifact matched to the discovered pipeline gap.",
        techniques: [
          { id: "d-weapon-dep", label: "Publish malicious npm package", mitreId: "T1195.001", description: "Publish 'company-utils@99.0.0' to public npm with a postinstall script that exfiltrates all env vars.", chapterSlug: "dep-confusion" },
          { id: "d-weapon-docker", label: "Push poisoned Docker image", mitreId: "T1204.003", description: "Build docker.io/company/app:latest with a reverse shell injected into the container entrypoint.", chapterSlug: "containers" },
          { id: "d-weapon-token", label: "Use leaked Kubernetes service token", mitreId: "T1552.001", description: "The echoed secret is a K8s service account token with cluster-admin RBAC binding.", chapterSlug: "k8s-rbac" },
        ],
      },
      {
        name: "Delivery",
        icon: "📨",
        description: "The pipeline consumes the malicious artifact.",
        techniques: [
          { id: "d-deliver-dep", label: "npm install pulls malicious package", mitreId: "T1195.001", description: "Developer runs npm install. Resolver prefers the higher-versioned public package over the internal one.", chapterSlug: "dep-confusion" },
          { id: "d-deliver-docker", label: "CI pipeline pulls poisoned image", mitreId: "T1195.003", description: "Pipeline runs docker pull without digest — it fetches the attacker's image tagged as :latest.", chapterSlug: "containers" },
          { id: "d-deliver-k8s", label: "kubectl apply with leaked token", mitreId: "T1552.001", description: "Leaked token used from attacker machine: kubectl --token=<token> apply -f malicious-pod.yaml.", chapterSlug: "k8s-rbac" },
        ],
      },
      {
        name: "Exploitation",
        icon: "💥",
        description: "The malicious artifact executes in the pipeline or cluster.",
        techniques: [
          { id: "d-exploit-dep", label: "Postinstall script runs in CI", mitreId: "T1059.007", description: "Malicious postinstall exfiltrates all env vars — CI runner holds PROD_AWS_ACCESS_KEY_ID, DATABASE_URL.", chapterSlug: "dep-confusion" },
          { id: "d-exploit-docker", label: "Poisoned container deployed to prod", mitreId: "T1204.003", description: "Attacker's image runs in a production pod. Reverse shell connects back to C2 on port 443.", chapterSlug: "containers" },
          { id: "d-exploit-k8s", label: "Cluster admin via leaked token", mitreId: "T1613", description: "kubectl get secrets --all-namespaces reveals every K8s secret including DB passwords and API keys.", chapterSlug: "k8s-rbac" },
        ],
      },
      {
        name: "Installation",
        icon: "🔩",
        description: "Establish persistent access beyond the initial foothold.",
        techniques: [
          { id: "d-install-creds", label: "Use exfiltrated CI AWS credentials", mitreId: "T1078.004", description: "AWS keys from CI env vars give direct EC2 and RDS access to the production environment.", chapterSlug: "cicd" },
          { id: "d-install-shell", label: "Persistent reverse shell in container", mitreId: "T1059.004", description: "Shell persists as long as the poisoned container runs. Pod restart policy ensures it survives restarts.", chapterSlug: "containers" },
          { id: "d-install-k8s", label: "Create backdoor K8s service account", mitreId: "T1136.003", description: "kubectl create serviceaccount attacker. Bind ClusterAdmin — persists even after the leaked token is revoked.", chapterSlug: "k8s-rbac" },
        ],
      },
      {
        name: "Command & Control",
        icon: "📡",
        description: "Maintain an ongoing channel into the infrastructure.",
        techniques: [
          { id: "d-c2-aws", label: "AWS API calls via CI credentials", mitreId: "T1071.004", description: "Exfiltrated CI AWS keys used for all commands — legitimate AWS endpoints over HTTPS/443.", chapterSlug: "logging-monitoring" },
          { id: "d-c2-shell", label: "Reverse shell tunnelled over HTTPS/443", mitreId: "T1071.001", description: "Reverse shell over port 443 matches expected HTTPS egress from production pods — hard to distinguish.", chapterSlug: "logging-monitoring" },
          { id: "d-c2-k8s", label: "Kubernetes API as command channel", mitreId: "T1071.004", description: "kubectl via the K8s API server over TLS. All traffic uses legitimate cluster endpoints.", chapterSlug: "k8s-rbac" },
        ],
      },
      {
        name: "Actions on Objectives",
        icon: "🎯",
        description: "Execute the ultimate goal of the operation.",
        techniques: [
          { id: "d-action-prod", label: "Access production database via CI creds", mitreId: "T1005", description: "RDS credentials from CI env — full read/write access to production database.", chapterSlug: "cicd" },
          { id: "d-action-supply", label: "Inject backdoor into all future builds", mitreId: "T1195.002", description: "Modify source in the build pipeline — every artifact built from now on contains the backdoor.", chapterSlug: "cicd" },
          { id: "d-action-k8s", label: "Lateral movement across all namespaces", mitreId: "T1021", description: "Cluster admin role — exec into pods, read all secrets, access every service across all namespaces.", chapterSlug: "k8s-rbac" },
        ],
      },
    ],
  },
];

// ── Stage names (for progress bar display) ───────────────────────────────────

const STAGE_NAMES = [
  "Recon", "Weaponize", "Deliver", "Exploit", "Install", "C2", "Objectives",
];

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = "select" | "plan" | "results";

export default function KillChainPlannerTool() {
  const [phase, setPhase] = useState<Phase>("select");
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [activeDefenses, setActiveDefenses] = useState<Set<string>>(new Set());

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  function selectScenario(id: string) {
    setScenarioId(id);
    setCurrentStage(0);
    setSelections({});
    setActiveDefenses(new Set());
    setPhase("plan");
  }

  function chooseTechnique(techniqueId: string) {
    setSelections((prev) => ({ ...prev, [currentStage]: techniqueId }));
  }

  function advance() {
    if (currentStage < 6) {
      setCurrentStage((s) => s + 1);
    } else {
      setPhase("results");
    }
  }

  function toggleDefense(id: string) {
    setActiveDefenses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function restart() {
    setPhase("select");
    setScenarioId(null);
    setCurrentStage(0);
    setSelections({});
    setActiveDefenses(new Set());
  }

  // How many stages are blocked by active defenses?
  const blockedStages = scenario
    ? scenario.stages.reduce<Set<number>>((acc, stage, idx) => {
        const chosenId = selections[idx];
        if (!chosenId) return acc;
        const blocked = scenario.mitigations.some(
          (m) => activeDefenses.has(m.id) && m.counters.includes(chosenId)
        );
        if (blocked) acc.add(idx);
        return acc;
      }, new Set())
    : new Set<number>();

  return (
    <ToolShell
      title="Kill Chain Planner"
      description="Choose a target scenario, select an attack technique at each kill chain stage, then toggle defensive controls to see which links break."
    >
      <div className="tool-surface space-y-6">

        {/* ── Phase: Scenario selection ── */}
        {phase === "select" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Select a target environment to plan an attack against.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectScenario(s.id)}
                  className="text-left p-4 rounded-xl border transition-all hover:brightness-110"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {s.title}
                      </div>
                      <div className="text-[11px] mt-0.5 mb-1.5" style={{ color: "#f59e0b" }}>
                        {s.stack}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {s.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Phase: Kill chain walkthrough ── */}
        {phase === "plan" && scenario && (
          <div className="space-y-5">
            {/* Stage progress */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STAGE_NAMES.map((name, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-colors"
                    style={
                      i === currentStage
                        ? { background: "rgba(245,158,11,0.2)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.5)" }
                        : selections[i]
                        ? { background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }
                        : { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
                    }
                  >
                    {selections[i] ? "✓ " : ""}{i + 1}. {name}
                  </div>
                  {i < 6 && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>›</span>}
                </div>
              ))}
            </div>

            {/* Current stage card */}
            <div
              className="rounded-xl p-4 border"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{scenario.stages[currentStage].icon}</span>
                <span className="font-bold" style={{ color: "#f59e0b" }}>
                  Stage {currentStage + 1} — {scenario.stages[currentStage].name}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {scenario.stages[currentStage].description}
              </p>
            </div>

            {/* Technique options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Choose a technique
              </p>
              {scenario.stages[currentStage].techniques.map((tech) => {
                const selected = selections[currentStage] === tech.id;
                return (
                  <button
                    key={tech.id}
                    onClick={() => chooseTechnique(tech.id)}
                    className="w-full text-left p-3.5 rounded-xl border transition-all"
                    style={
                      selected
                        ? { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.5)", color: "var(--text-primary)" }
                        : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-sm" style={{ color: selected ? "#f59e0b" : "var(--text-primary)" }}>
                        {selected && "✓ "}{tech.label}
                      </div>
                      <span
                        className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                      >
                        {tech.mitreId}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">{tech.description}</p>
                    {tech.chapterSlug && (
                      <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>
                        → See chapter: {tech.chapterSlug.replace(/-/g, " ")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={restart}
                className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
              >
                ← Change scenario
              </button>
              <button
                onClick={advance}
                disabled={!selections[currentStage]}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  selections[currentStage]
                    ? { background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.5)", color: "#f59e0b" }
                    : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }
                }
              >
                {currentStage < 6 ? "Next Stage →" : "See Results →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: Results ── */}
        {phase === "results" && scenario && (
          <div className="space-y-6">
            {/* Summary header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                  {scenario.icon} Attack Chain — {scenario.title}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {blockedStages.size > 0
                    ? `${blockedStages.size} of 7 stages blocked by active defenses`
                    : "No defenses active — all 7 stages succeed"}
                </p>
              </div>
              <div
                className="px-3 py-1.5 rounded-xl text-sm font-bold"
                style={
                  blockedStages.size >= 7
                    ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }
                    : blockedStages.size >= 3
                    ? { background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24" }
                    : { background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171" }
                }
              >
                {blockedStages.size >= 7 ? "Chain Broken ✓" : blockedStages.size >= 3 ? "Partially Defended" : "Chain Intact"}
              </div>
            </div>

            {/* Chain visualization */}
            <div className="space-y-2">
              {scenario.stages.map((stage, idx) => {
                const chosenId = selections[idx];
                const chosenTech = stage.techniques.find((t) => t.id === chosenId);
                const isBlocked = blockedStages.has(idx);
                const blockingMitigation = isBlocked
                  ? scenario.mitigations.find((m) => activeDefenses.has(m.id) && m.counters.includes(chosenId ?? ""))
                  : null;
                return (
                  <div key={idx}>
                    <div
                      className="p-3 rounded-xl border"
                      style={
                        isBlocked
                          ? { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)" }
                          : { background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }
                      }
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{isBlocked ? "🛡️" : stage.icon}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isBlocked ? "#34d399" : "#f59e0b" }}>
                              {idx + 1}. {stage.name}
                            </span>
                            {chosenTech && (
                              <div className="text-xs mt-0.5" style={{ color: isBlocked ? "#34d399" : "var(--text-secondary)" }}>
                                {isBlocked && "BLOCKED — "}
                                {chosenTech.label}
                                {isBlocked && blockingMitigation && (
                                  <span style={{ color: "var(--text-muted)" }}> (by {blockingMitigation.label})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {chosenTech && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                          >
                            {chosenTech.mitreId}
                          </span>
                        )}
                      </div>
                    </div>
                    {idx < 6 && (
                      <div className="flex justify-center py-0.5">
                        <span style={{ color: isBlocked ? "#34d399" : "rgba(245,158,11,0.5)", fontSize: 14 }}>
                          {isBlocked ? "✕" : "↓"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mitigation toggles */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Toggle defenses
              </p>
              <div className="space-y-2">
                {scenario.mitigations.map((m) => {
                  const active = activeDefenses.has(m.id);
                  const breaksCount = m.counters.filter((c) =>
                    Object.values(selections).includes(c)
                  ).length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleDefense(m.id)}
                      className="w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all"
                      style={
                        active
                          ? { background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.35)" }
                          : { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }
                      }
                    >
                      {/* Toggle indicator */}
                      <div
                        className="mt-0.5 w-8 h-4 rounded-full shrink-0 relative transition-colors"
                        style={{ background: active ? "rgba(52,211,153,0.6)" : "var(--border-strong)" }}
                      >
                        <div
                          className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                          style={{ background: active ? "#34d399" : "var(--text-muted)", left: active ? "17px" : "2px" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold" style={{ color: active ? "#34d399" : "var(--text-primary)" }}>
                            {m.label}
                          </span>
                          {breaksCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                              breaks {breaksCount} stage{breaksCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{m.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chapter cross-references */}
            {(() => {
              const slugs = new Set<string>();
              Object.values(selections).forEach((techId) => {
                scenario.stages.forEach((stage) => {
                  const tech = stage.techniques.find((t) => t.id === techId);
                  if (tech?.chapterSlug) slugs.add(tech.chapterSlug);
                });
              });
              if (slugs.size === 0) return null;
              return (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Related SecLayer chapters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(slugs).map((slug) => (
                      <a
                        key={slug}
                        href={`/${slug}`}
                        className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}
                      >
                        {slug.replace(/-/g, " ")} →
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Reset */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setPhase("plan"); setCurrentStage(0); setSelections({}); setActiveDefenses(new Set()); }}
                className="text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}
              >
                Replay this scenario
              </button>
              <button
                onClick={restart}
                className="text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Try another scenario
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
