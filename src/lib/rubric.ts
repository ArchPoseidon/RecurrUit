// Encodes Kargo_PM_SPM_Hiring_Rubric.xlsx exactly: same criteria, weights, gate
// minimums, formulas and default thresholds as the source workbook. Do not
// change criterion definitions/weights here without updating the workbook —
// this file is the single source of truth used both for the Gemini scoring
// prompt and for computing Weighted Total / Gate Status / Verdict.

export type Role = "pm" | "spm";

export function isRole(value: string): value is Role {
  return value === "pm" || value === "spm";
}

export type CriterionId = "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7";

export interface Criterion {
  id: CriterionId;
  name: string;
  measures: string;
  lookFor: string;
}

export const SCORING_SCALE: { score: 1 | 2 | 3 | 4 | 5; definition: string }[] = [
  { score: 1, definition: "No evidence in the CV" },
  { score: 2, definition: "Weak / indirect evidence — implied but not demonstrated with specifics" },
  { score: 3, definition: "Moderate evidence — one instance, some specificity" },
  { score: 4, definition: "Strong evidence — multiple instances or clear quantified proof" },
  { score: 5, definition: "Exceptional evidence — repeated pattern, quantified impact, and adopted/trusted by others explicitly" },
];

export const CRITERIA: Record<CriterionId, Criterion> = {
  C1: {
    id: "C1",
    name: "Unprompted Ownership",
    measures: "Identifies a gap and builds or fixes it before being asked, with no mandate to do so.",
    lookFor: "Built a tool/process nobody requested; fixed something proactively; created a template others now use.",
  },
  C2: {
    id: "C2",
    name: "Frontier Ownership & Decisiveness",
    measures: "Operates as senior-most or sole owner of a domain, with no layer above approving the call, and is trusted to decide.",
    lookFor: "'Sole owner', 'no layer above', runs the process independently, manager quote about trusting their calls.",
  },
  C3: {
    id: "C3",
    name: "Systemizes Beyond Self",
    measures: "Turns individual work into a process, template, or standard that others adopt after the person moves on.",
    lookFor: "SOP/template/framework explicitly described as 'adopted by the team' or becoming 'company standard'.",
  },
  C4: {
    id: "C4",
    name: "Documents Rationale / Ships Fast, Kills What Doesn't Work",
    measures: "Makes fast calls, retires what isn't working, and can explain why in a way others trust.",
    lookFor: "Killed a feature/initiative based on data, wrote a post-mortem, has a stated point of view others follow.",
  },
  C5: {
    id: "C5",
    name: "Quantified Outperformance",
    measures: "Metrics that beat a stated team average, target, or benchmark — not just 'did the job'.",
    lookFor: "Numbers explicitly compared to a team average, quota, or benchmark, not just an absolute figure.",
  },
  C6: {
    id: "C6",
    name: "Independent Crisis Resolution",
    measures: "Resolves a high-stakes problem alone, under a deadline, without escalating.",
    lookFor: "Weekend/overnight fix, same-day resolution, handled before anyone above them found out.",
  },
  C7: {
    id: "C7",
    name: "Ground-Level Domain Exposure",
    measures: "Direct hands-on experience with logistics/freight/ops-heavy environments, or comparably deep firsthand exposure to a complex operational domain.",
    lookFor: "Weighted only — NOT gated. Score generously for adjacent ground-truth depth even without logistics/freight background.",
  },
};

export const CRITERION_ORDER: CriterionId[] = ["C1", "C2", "C3", "C4", "C5", "C6", "C7"];

export interface RoleRubricConfig {
  role: Role;
  label: string;
  weights: Record<CriterionId, number>; // percentage points, sum to 100
  gateCriterion: CriterionId;
  gateJustification: string;
  defaultShortlistThreshold: number;
  defaultHoldThreshold: number;
  defaultGateMinimum: number;
}

export const ROLE_RUBRICS: Record<Role, RoleRubricConfig> = {
  pm: {
    role: "pm",
    label: "Product Manager",
    weights: { C1: 20, C2: 15, C3: 15, C4: 15, C5: 10, C6: 10, C7: 15 },
    gateCriterion: "C1",
    gateJustification: "PM JD: \"no PM handbook... you'll build those.\"",
    defaultShortlistThreshold: 65,
    defaultHoldThreshold: 50,
    defaultGateMinimum: 3,
  },
  spm: {
    role: "spm",
    label: "Senior Product Manager",
    weights: { C1: 15, C2: 25, C3: 15, C4: 20, C5: 10, C6: 5, C7: 10 },
    gateCriterion: "C2",
    gateJustification: "SPM JD: \"no committee that approves product decisions.\"",
    defaultShortlistThreshold: 65,
    defaultHoldThreshold: 50,
    defaultGateMinimum: 3,
  },
};

export type CriterionScores = Record<CriterionId, number>; // 1-5 each

export type GateStatus = "Pass" | "FAIL – below gate min";
export type Verdict = "Shortlist" | "Hold for Review" | "Do Not Advance" | "Flagged for Review (Gate)";

export interface ScoreResult {
  weightedTotal: number; // 0-100
  gateStatus: GateStatus;
  verdict: Verdict;
}

// Mirrors the workbook formulas exactly:
// K = IF(scores empty,"", SUM(score_i/5 * weight_i))
// L = IF(gateScore >= gateMin, "Pass", "FAIL – below gate min")
// M = IF(gate fail, "Flagged for Review (Gate)",
//        IF(total >= shortlist, "Shortlist",
//        IF(total >= hold, "Hold for Review", "Do Not Advance")))
export function computeScore(
  role: Role,
  scores: CriterionScores,
  settings: { shortlistThreshold: number; holdThreshold: number; gateMinimum: number },
): ScoreResult {
  const config = ROLE_RUBRICS[role];

  const weightedTotal = CRITERION_ORDER.reduce((sum, id) => {
    return sum + (scores[id] / 5) * config.weights[id];
  }, 0);

  const gateScore = scores[config.gateCriterion];
  const gateStatus: GateStatus = gateScore >= settings.gateMinimum ? "Pass" : "FAIL – below gate min";

  let verdict: Verdict;
  if (gateStatus !== "Pass") {
    verdict = "Flagged for Review (Gate)";
  } else if (weightedTotal >= settings.shortlistThreshold) {
    verdict = "Shortlist";
  } else if (weightedTotal >= settings.holdThreshold) {
    verdict = "Hold for Review";
  } else {
    verdict = "Do Not Advance";
  }

  return { weightedTotal: Math.round(weightedTotal * 100) / 100, gateStatus, verdict };
}
