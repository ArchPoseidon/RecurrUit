import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col">
      {/* Decorative glow, echoes the reference dashboard's green ambient light */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 38%, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -z-10 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{ background: "var(--accent)", opacity: 0.12, top: "-120px", left: "50%", transform: "translateX(-50%)" }}
      />

      <header className="px-8 py-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="font-semibold tracking-tight text-lg">RecurrUit</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10">
        <div className="max-w-2xl flex flex-col items-center gap-5">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">
            Made for Early Teams
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Recruit fast with{" "}
            <span className="text-accent">RecurrUit</span>
          </h1>

          <p className="max-w-lg text-base sm:text-lg text-muted leading-relaxed">
            AI-assisted CV shortlisting, rubric scoring, and interview-ready outreach — built for Kargo&apos;s
            Product Manager and Senior Product Manager hiring.
          </p>
        </div>

        <LoginForm initialPassword={process.env.APP_PASSWORD ?? ""} />
      </main>

      <footer className="px-8 py-6 text-center text-xs text-muted">
        Kargo · Internal hiring tool
      </footer>
    </div>
  );
}
