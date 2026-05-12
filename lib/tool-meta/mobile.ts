import type { ToolMeta } from "./types";

export const mobileMeta: Record<string, ToolMeta> = {
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
};
