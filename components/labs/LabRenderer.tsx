"use client";

import { SQLiLabTool } from "./SQLiLabTool";
import { XSSLabTool } from "./XSSLabTool";
import { CSRFLabTool } from "./CSRFLabTool";
import { IDORLabTool } from "./IDORLabTool";
import { BrokenAPILabTool } from "./BrokenAPILabTool";
import { GraphQLIntrospectionLabTool } from "./GraphQLIntrospectionLabTool";
import { MobileStorageLabTool } from "./MobileStorageLabTool";
import { MobileTLSLabTool } from "./MobileTLSLabTool";
import { MobileIntentLabTool } from "./MobileIntentLabTool";

const LAB_COMPONENTS: Record<string, React.ComponentType> = {
  "sqli-login-bypass": SQLiLabTool,
  "xss-cookie-theft": XSSLabTool,
  "csrf-email-change": CSRFLabTool,
  "idor-user-profile": IDORLabTool,
  "broken-api-auth": BrokenAPILabTool,
  "graphql-introspection": GraphQLIntrospectionLabTool,
  "mobile-storage-plaintext": MobileStorageLabTool,
  "mobile-tls-mitm": MobileTLSLabTool,
  "mobile-intent-hijack": MobileIntentLabTool,
};

export function LabRenderer({ slug }: { slug: string }) {
  const Component = LAB_COMPONENTS[slug];
  if (!Component) {
    return (
      <div
        className="p-6 rounded-xl text-center text-sm"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        Lab component not found for &quot;{slug}&quot;.
      </div>
    );
  }
  return <Component />;
}
