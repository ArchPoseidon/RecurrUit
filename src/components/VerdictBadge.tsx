const STYLES: Record<string, string> = {
  Shortlist: "bg-accent/15 text-accent border-accent/30",
  "Hold for Review": "bg-warning/15 text-warning border-warning/30",
  "Do Not Advance": "bg-muted/15 text-muted border-muted/30",
  "Flagged for Review (Gate)": "bg-danger/15 text-danger border-danger/30",
};

export function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return <span className="text-xs text-muted">—</span>;
  const style = STYLES[verdict] ?? "bg-muted/15 text-muted border-muted/30";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {verdict}
    </span>
  );
}
