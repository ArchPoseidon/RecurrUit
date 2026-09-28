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

export function parseResume(rawText: string): ParsedResume {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Every sample CV leads with the candidate's full name on the first
  // non-empty line — a near-universal resume convention.
  const name = lines[0] ?? "Unknown Candidate";

  const emailMatch = rawText.match(EMAIL_RE);
  const email = emailMatch?.[0] ?? "";

  const phoneMatches = rawText.match(PHONE_RE) ?? [];
  // Filter out short matches that are more likely to be false positives
  // (e.g. year ranges, percentages) than real phone numbers.
  const phone = phoneMatches.find((p) => p.replace(/\D/g, "").length >= 10) ?? null;

  let redactedText = rawText;
  redactedText = redactedText.replace(EMAIL_RE, "[redacted-email]");
  if (phone) redactedText = redactedText.split(phone).join("[redacted-phone]");
  redactedText = redactedText.replace(URL_RE, "[redacted-link]");
  if (name && name !== "Unknown Candidate") {
    redactedText = redactedText.split(name).join("[Candidate]");
  }

  return { name, email, phone, rawText, redactedText };
}
