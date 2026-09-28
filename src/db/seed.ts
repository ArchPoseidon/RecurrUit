import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { jobDescriptions, rubricSettings, appSettings } from "./schema";
import { PM_JD_TITLE, PM_JD_CONTENT, SPM_JD_TITLE, SPM_JD_CONTENT } from "./seed-jds";
import { ROLE_RUBRICS } from "@/lib/rubric";

async function main() {
  await db
    .insert(jobDescriptions)
    .values([
      { role: "pm", title: PM_JD_TITLE, content: PM_JD_CONTENT },
      { role: "spm", title: SPM_JD_TITLE, content: SPM_JD_CONTENT },
    ])
    .onConflictDoNothing();

  await db
    .insert(rubricSettings)
    .values([
      {
        role: "pm",
        shortlistThreshold: ROLE_RUBRICS.pm.defaultShortlistThreshold,
        holdThreshold: ROLE_RUBRICS.pm.defaultHoldThreshold,
        gateMinimum: ROLE_RUBRICS.pm.defaultGateMinimum,
      },
      {
        role: "spm",
        shortlistThreshold: ROLE_RUBRICS.spm.defaultShortlistThreshold,
        holdThreshold: ROLE_RUBRICS.spm.defaultHoldThreshold,
        gateMinimum: ROLE_RUBRICS.spm.defaultGateMinimum,
      },
    ])
    .onConflictDoNothing();

  await db.insert(appSettings).values({ id: 1 }).onConflictDoNothing();

  console.log("Seed complete.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
