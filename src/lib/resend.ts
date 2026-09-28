import { Resend } from "resend";

export async function sendCandidateEmail(params: {
  apiKey: string;
  fromEmail: string;
  fromName: string | null;
  to: string;
  subject: string;
  body: string;
}) {
  const { apiKey, fromEmail, fromName, to, subject, body } = params;
  const resend = new Resend(apiKey);

  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
