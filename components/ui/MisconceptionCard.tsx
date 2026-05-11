interface MisconceptionCardProps {
  myth: string;
  reality: string;
}

export function MisconceptionCard({ myth, reality }: MisconceptionCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--border-subtle)]">
        <div className="p-5">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "#f87171" }}
          >
            Myth
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {myth}
          </p>
        </div>
        <div className="p-5">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-2"
            style={{ color: "#34d399" }}
          >
            Reality
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {reality}
          </p>
        </div>
      </div>
    </div>
  );
}
