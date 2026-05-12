import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/ui/AppContext";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopNav } from "@/components/ui/TopNav";
import { GlossaryPanel } from "@/components/ui/GlossaryPanel";

export const metadata: Metadata = {
  title: {
    default: "SecLayers — Application Security, Visually",
    template: "%s | SecLayers",
  },
  description:
    "Interactive AppSec learning across 7 domains: Foundations, Web, API, Mobile, Systems, Cloud, and Supply Chain. 41 chapters with interactive tools, interviews, and CTF labs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
        <AppProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium focus:text-white"
            style={{ background: "var(--accent)" } as React.CSSProperties}
          >
            Skip to main content
          </a>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <TopNav />
              <main id="main-content" className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
          <GlossaryPanel />
        </AppProvider>
      </body>
    </html>
  );
}
