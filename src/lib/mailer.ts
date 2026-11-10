import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { getClient } from "./db";
import { isPlaceholderEmail } from "./ids";

export type MailMode = "smtp" | "resend" | "noop";

export function mailMode(): MailMode {
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  return "noop";
}

export async function deliverEmail(input: {
  to: string;
  subject: string;
  text: string;
  complaintId?: string | null;
}): Promise<"sent" | "logged" | "skipped_placeholder" | "failed"> {
  const mode = mailMode();
  const body = input.text.slice(0, 20000);
  if (mode !== "noop" && isPlaceholderEmail(input.to)) {
    await writeMailLog({ ...input, body, provider: mode, status: "skipped_placeholder", error: "Placeholder address was not delivered." });
    return "skipped_placeholder";
  }
  try {
    if (mode === "noop") {
      console.info(`[mail:noop] To: ${input.to}\nSubject: ${input.subject}\n${body}\n`);
      await writeMailLog({ ...input, body, provider: "noop", status: "logged", error: null });
      return "logged";
    }
    if (mode === "smtp") await sendSmtp(input.to, input.subject, body);
    else await sendResend(input.to, input.subject, body);
    await writeMailLog({ ...input, body, provider: mode, status: "sent", error: null });
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : "The message could not be sent.";
    console.error(`[mail:${mode}] ${input.to}: ${message}`);
    await writeMailLog({ ...input, body, provider: mode, status: "failed", error: message });
    return "failed";
  }
}

async function sendSmtp(to: string, subject: string, text: string): Promise<void> {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user ? { user, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
  });
  const from = process.env.SMTP_FROM?.trim();
  if (!from) throw new Error("SMTP_FROM is not set.");
  await transporter.sendMail({ from, to, subject, text });
}

async function sendResend(to: string, subject: string, text: string): Promise<void> {
  const from = process.env.RESEND_FROM?.trim();
  if (!from) throw new Error("RESEND_FROM is not set.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend returned ${response.status}: ${detail.slice(0, 300)}`);
  }
}

async function writeMailLog(input: {
  to: string;
  subject: string;
  body: string;
  complaintId?: string | null;
  provider: string;
  status: string;
  error: string | null;
}): Promise<void> {
  await getClient().execute({
    sql: `INSERT INTO mail_log (id, complaint_id, to_address, subject, body, provider, status, error, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      input.complaintId ?? null,
      input.to,
      input.subject,
      input.body,
      input.provider,
      input.status,
      input.error,
      new Date().toISOString(),
    ],
  });
}
