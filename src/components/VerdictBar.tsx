const SEGMENT_ORDER = [
  { key: "Shortlist", label: "Shortlist", colorVar: "--accent" },
  { key: "Hold for Review", label: "Hold for Review", colorVar: "--warning" },
  { key: "Do Not Advance", label: "Do not advance", colorVar: "--muted" },
  { key: "Flagged for Review (Gate)", label: "Flagged (gate)", colorVar: "--danger" },
] as const;

export function VerdictBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-surface">
        {total === 0 ? (
          <div className="h-full w-full rounded-full bg-surface-hover" />
        ) : (
          SEGMENT_ORDER.filter((s) => (counts[s.key] ?? 0) > 0).map((s) => {
            const count = counts[s.key] ?? 0;
            const pct = (count / total) * 100;
            return (
              <div
                key={s.key}
                title={`${s.label}: ${count}`}
                style={{ width: `${pct}%`, backgroundColor: `var(${s.colorVar})` }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            );
          })
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENT_ORDER.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `var(${s.colorVar})` }} />
            {s.label}
            <span className="font-mono text-foreground">{counts[s.key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
