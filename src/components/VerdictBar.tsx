const SEGMENT_ORDER = [
  { key: "Shortlist", label: "Shortlist", colorVar: "--accent" },
  { key: "Hold for Review", label: "Hold for Review", colorVar: "--warning" },
  { key: "Do Not Advance", label: "Do not advance", colorVar: "--muted" },
  { key: "Flagged for Review (Gate)", label: "Flagged (gate)", colorVar: "--danger" },
] as const;

export function VerdictBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
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
  );
}

export function VerdictBuckets({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {SEGMENT_ORDER.map((s) => {
        const count = counts[s.key] ?? 0;
        return (
          <div
            key={s.key}
            className="rounded-xl border-2 p-5"
            style={{
              borderColor: `color-mix(in srgb, var(${s.colorVar}) 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, var(${s.colorVar}) 10%, transparent)`,
            }}
          >
            <p className="text-4xl font-bold font-mono leading-none" style={{ color: `var(${s.colorVar})` }}>
              {count}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}
