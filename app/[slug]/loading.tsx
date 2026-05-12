export default function ChapterLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8 animate-pulse">
      {/* Header bar */}
      <div className="h-32 rounded-2xl mb-8" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }} />
      {/* Content lines */}
      <div className="space-y-3 mb-8">
        {[100, 90, 95, 80, 85].map((w, i) => (
          <div key={i} className="h-4 rounded" style={{ width: `${w}%`, background: "var(--bg-elevated)" }} />
        ))}
      </div>
      <div className="h-48 rounded-xl mb-8" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }} />
      <div className="space-y-3">
        {[75, 90, 60].map((w, i) => (
          <div key={i} className="h-4 rounded" style={{ width: `${w}%`, background: "var(--bg-elevated)" }} />
        ))}
      </div>
    </div>
  );
}
