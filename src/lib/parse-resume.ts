import mammoth from "mammoth";

export interface ParsedResume {
  name: string;
  email: string;
  phone: string | null;
  rawText: string; // full extracted text, incl. PII — stored for display/email only
  redactedText: string; // PII stripped — the only text ever sent to Gemini
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Matches +91-style and bare Indian mobile numbers (e.g. "+91 98204 37810"),
// and generic 10+ digit phone numbers split into 2-3 groups.
const PHONE_RE = /(\+\d{1,3}[-.\s]?)?\d{3,5}[-.\s]?\d{3,4}[-.\s]?\d{2,4}\b/g;
const URL_RE = /(https?:\/\/)?(www\.)?(linkedin\.com|github\.com)\/[^\s|,)]+/gi;

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${file.name}. Please upload a .docx, .pdf, or .txt file.`);
}

// Section headers that structurally look like a 2-4 word "name" (all letters,
// no digits) but obviously aren't one — excluded so the name heuristic below
// doesn't mistake a heading for the candidate's name.
const SECTION_HEADER_RE =
  /^(PROFESSIONAL|PERSONAL|CAREER|EXECUTIVE)?\s*(SUMMARY|SYNOPSIS|PROFILE|OBJECTIVE|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CONTACT|ACHIEVEMENTS|CERTIFICATIONS|COMPETENCIES|ACADEMIC|EMPLOYMENT|DETAILS|INFORMATION|BACKGROUND|QUALIFICATIONS|DEVELOPMENT|CREDENTIALS)$/i;

const NAME_LINE_RE = /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){1,3}$/;

function cleanNameLine(line: string): string {
  // Some PDF exports render a decorative all-caps name badge overlapping the
  // normally-cased name as a second, tab-separated run of text — collapse
  // "ROHAN MEHTA\tRohan Mehta" down to the properly-cased version.
  const parts = line.split(/\t+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    return parts[1];
  }
  return parts[0] ?? line.trim();
}

function isPlausibleName(line: string): boolean {
  if (!line || line.length < 3 || line.length > 60) return false;
  if (/[@\d]/.test(line)) return false;
  if (SECTION_HEADER_RE.test(line)) return false;
  return NAME_LINE_RE.test(line);
}

// Resume templates vary wildly in where the name/contact header actually
// lands in extracted text — a multi-column or decorative-header template can
// push it to the end of the document instead of the top. Name and email
// almost always sit right next to each other in a contact block wherever
// that block falls, so search backward from the found email first, and only
// fall back to "first line of the document" when there's no email to anchor on.
function extractName(rawText: string, emailIndex: number | null): string {
  if (emailIndex !== null) {
    const windowStart = Math.max(0, emailIndex - 200);
    const windowLines = rawText
      .slice(windowStart, emailIndex)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = windowLines.length - 1; i >= 0; i--) {
      const cleaned = cleanNameLine(windowLines[i]);
      if (isPlausibleName(cleaned)) return cleaned;
    }
  }

  const firstLine = rawText.split("\n").map((l) => l.trim()).find(Boolean);
  return firstLine ?? "Unknown Candidate";
}

export function parseResume(rawText: string): ParsedResume {
  const emailMatches = [...rawText.matchAll(EMAIL_RE)];
  const email = emailMatches[0]?.[0] ?? "";
  const emailIndex = emailMatches[0]?.index ?? null;

  const name = extractName(rawText, emailIndex);

  // Filter out short matches that are more likely to be false positives
  // (e.g. year ranges, percentages) than real phone numbers.
  const realPhoneMatches = (rawText.match(PHONE_RE) ?? []).filter(
    (p) => p.replace(/\D/g, "").length >= 10,
  );
  const phone = realPhoneMatches[0] ?? null;

  let redactedText = rawText;
  redactedText = redactedText.replace(EMAIL_RE, "[redacted-email]");
  // Some PDF exports duplicate the phone number (e.g. once with a country
  // code, once without) — redact every real match, not just the first.
  for (const match of new Set(realPhoneMatches)) {
    redactedText = redactedText.split(match).join("[redacted-phone]");
  }
  redactedText = redactedText.replace(URL_RE, "[redacted-link]");
  if (name && name !== "Unknown Candidate") {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Case-insensitive so a decorative ALL-CAPS rendering of the same name
    // elsewhere in the document (common in styled PDF headers) is caught,
    // plus a hyphen-slug form (e.g. a bare "rohan-mehta" LinkedIn handle left
    // behind after a URL prefix gets mangled in extraction).
    const nameRe = new RegExp(escapedName, "gi");
    const slugRe = new RegExp(escapedName.replace(/\s+/g, "-"), "gi");
    redactedText = redactedText.replace(nameRe, "[Candidate]").replace(slugRe, "[Candidate]");
  }

  return { name, email, phone, rawText, redactedText };
}
