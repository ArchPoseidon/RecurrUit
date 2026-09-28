import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const jobDescriptions = pgTable("job_descriptions", {
  role: text("role").primaryKey(), // 'pm' | 'spm'
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rubricSettings = pgTable("rubric_settings", {
  role: text("role").primaryKey(), // 'pm' | 'spm'
  shortlistThreshold: real("shortlist_threshold").notNull().default(65),
  holdThreshold: real("hold_threshold").notNull().default(50),
  gateMinimum: real("gate_minimum").notNull().default(3),
});

export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  resendApiKey: text("resend_api_key"),
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role").notNull(), // 'pm' | 'spm'
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  sourceFileName: text("source_file_name").notNull(),

  resumeText: text("resume_text").notNull(), // full extracted text, incl. PII — display only
  redactedText: text("redacted_text").notNull(), // PII-stripped text — sent to Gemini

  c1: integer("c1"),
  c2: integer("c2"),
  c3: integer("c3"),
  c4: integer("c4"),
  c5: integer("c5"),
  c6: integer("c6"),
  c7: integer("c7"),
  rationale: jsonb("rationale").$type<Record<string, string>>(),

  weightedTotal: real("weighted_total"),
  gateStatus: text("gate_status"), // 'Pass' | 'FAIL – below gate min'
  verdict: text("verdict"), // 'Shortlist' | 'Hold for Review' | 'Do Not Advance' | 'Flagged for Review (Gate)'

  interviewBrief: text("interview_brief"),
  emailSubject: text("email_subject"),
  emailBody: text("email_body"),
  emailStatus: text("email_status").notNull().default("not_generated"), // 'not_generated' | 'draft' | 'sent'
  sentAt: timestamp("sent_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
