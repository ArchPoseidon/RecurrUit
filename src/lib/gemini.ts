import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { z } from "zod";
import {
  CRITERIA,
  CRITERION_ORDER,
  SCORING_SCALE,
  ROLE_RUBRICS,
  type Role,
  type CriterionScores,
} from "./rubric";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let genAI: GoogleGenerativeAI | undefined;
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

const scoreProperties: Record<string, Schema> = Object.fromEntries(
  CRITERION_ORDER.map((id) => [id, { type: SchemaType.INTEGER } satisfies Schema]),
);
const rationaleProperties: Record<string, Schema> = Object.fromEntries(
  CRITERION_ORDER.map((id) => [id, { type: SchemaType.STRING } satisfies Schema]),
);

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    scores: {
      type: SchemaType.OBJECT,
      properties: scoreProperties,
      required: [...CRITERION_ORDER],
    },
    rationale: {
      type: SchemaType.OBJECT,
      properties: rationaleProperties,
      required: [...CRITERION_ORDER],
    },
    interviewBrief: { type: SchemaType.STRING },
    inviteEmail: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        body: { type: SchemaType.STRING },
      },
      required: ["subject", "body"],
    },
    rejectionEmail: {
      type: SchemaType.OBJECT,
      properties: {
        subject: { type: SchemaType.STRING },
        body: { type: SchemaType.STRING },
      },
      required: ["subject", "body"],
    },
  },
  required: ["scores", "rationale", "interviewBrief", "inviteEmail", "rejectionEmail"],
};

const geminiResponseSchema = z.object({
  scores: z.record(z.string(), z.number().int().min(1).max(5)),
  rationale: z.record(z.string(), z.string()),
  interviewBrief: z.string(),
  inviteEmail: z.object({ subject: z.string(), body: z.string() }),
  rejectionEmail: z.object({ subject: z.string(), body: z.string() }),
});

export interface CandidateAssessment {
  scores: CriterionScores;
  rationale: Record<string, string>;
  interviewBrief: string;
  inviteEmail: { subject: string; body: string };
  rejectionEmail: { subject: string; body: string };
}

function buildRubricPrompt(role: Role): string {
  const config = ROLE_RUBRICS[role];
  const scaleText = SCORING_SCALE.map((s) => `${s.score} — ${s.definition}`).join("\n");
  const criteriaText = CRITERION_ORDER.map((id) => {
    const c = CRITERIA[id];
    const weight = config.weights[id];
    const gateNote = id === config.gateCriterion
      ? ` [HARD GATE for this role: must score >= ${config.defaultGateMinimum}/5. ${config.gateJustification}]`
      : "";
    return `${id} — ${c.name} (weight ${weight}%)${gateNote}\nMeasures: ${c.measures}\nLook for: ${c.lookFor}`;
  }).join("\n\n");

  return `SCORING SCALE (apply to every criterion):\n${scaleText}\n\nCRITERIA FOR THIS ROLE (${config.label}):\n${criteriaText}`;
}

export async function assessCandidate(params: {
  role: Role;
  jdContent: string;
  redactedResumeText: string;
}): Promise<CandidateAssessment> {
  const { role, jdContent, redactedResumeText } = params;

  const model = getGenAI().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt = `You are scoring a candidate's CV for a Kargo job opening, using a fixed behavioral rubric. Score strictly from evidence actually present in the CV text below — do not assume or invent evidence that isn't there. If a criterion has no supporting evidence, score it 1.

The CV text has had the candidate's name, email, phone, and profile links redacted for this evaluation — refer to the candidate only as "the candidate" in your rationale, and use the literal placeholder "{{CANDIDATE_NAME}}" everywhere a name/greeting would go in the interview brief or email drafts.

${buildRubricPrompt(role)}

JOB DESCRIPTION:
${jdContent}

CANDIDATE CV (redacted):
${redactedResumeText}

Produce:
1. scores: an integer 1-5 for each of C1-C7.
2. rationale: one short sentence per criterion (C1-C7) citing the specific CV evidence (or lack of it) behind that score.
3. interviewBrief: a concise brief (3-5 sentences) for the founder covering the candidate's strongest signals, the biggest open question to probe in an interview, and any notable gap.
4. inviteEmail: a warm, specific interview-invite email (subject + body) referencing 1-2 concrete things from their background that stood out. Sign off as "Arjun". Use "{{CANDIDATE_NAME}}" as the greeting name.
5. rejectionEmail: a brief, respectful rejection email (subject + body), no specific negative feedback, keep it generic and kind. Sign off as "Arjun". Use "{{CANDIDATE_NAME}}" as the greeting name.

Return both inviteEmail and rejectionEmail regardless of how the candidate scores — the caller decides which one to use.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 500)}`);
  }

  const validated = geminiResponseSchema.parse(parsed);

  const scores = Object.fromEntries(
    CRITERION_ORDER.map((id) => [id, validated.scores[id]]),
  ) as CriterionScores;

  return {
    scores,
    rationale: validated.rationale,
    interviewBrief: validated.interviewBrief,
    inviteEmail: validated.inviteEmail,
    rejectionEmail: validated.rejectionEmail,
  };
}
