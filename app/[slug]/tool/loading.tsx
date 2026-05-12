export default function ToolLoading() {
  return (
    <div className="px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full animate-pulse">
      {/* Tool intro header */}
      <div className="h-24 rounded-xl mb-6" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }} />
      {/* Tool shell */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        <div className="h-14" style={{ background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border-subtle)" }} />
        <div className="p-5 space-y-4" style={{ background: "var(--bg-surface)" }}>
          <div className="h-8 rounded-lg w-48" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-40 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-24 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    </div>
  );
}
