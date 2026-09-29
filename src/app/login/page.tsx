"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Login failed");
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-border bg-surface/80 backdrop-blur-sm p-6 space-y-4 shadow-2xl shadow-black/40"
    >
      <input
        type="password"
        autoFocus
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

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

        <Suspense>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="px-8 py-6 text-center text-xs text-muted">
        Kargo · Internal hiring tool
      </footer>
    </div>
  );
}
