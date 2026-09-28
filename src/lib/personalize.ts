export function personalize(text: string, fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? fullName;
  return text.split("{{CANDIDATE_NAME}}").join(firstName);
}
