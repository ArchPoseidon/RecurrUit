import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings, rubricSettings } from "@/db/schema";
import { ROLE_RUBRICS } from "@/lib/rubric";
import { EmailSettingsForm, RubricSettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  const rubricRows = await db.select().from(rubricSettings);

  const emailInitial = {
    fromEmail: settings?.fromEmail ?? null,
    fromName: settings?.fromName ?? null,
    resendConnected: Boolean(settings?.resendApiKey),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-muted">Connect your sending identity and adjust verdict thresholds.</p>
      </div>

      <EmailSettingsForm initial={emailInitial} />

      {(["pm", "spm"] as const).map((role) => {
        const row = rubricRows.find((r) => r.role === role);
        if (!row) return null;
        return (
          <RubricSettingsForm
            key={role}
            label={ROLE_RUBRICS[role].label}
            initial={{
              role,
              shortlistThreshold: row.shortlistThreshold,
              holdThreshold: row.holdThreshold,
              gateMinimum: row.gateMinimum,
            }}
          />
        );
      })}
    </div>
  );
}
