import { HttpError } from "./http";

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return;
  if (!token) throw new HttpError(400, "Please complete the spam check and try again.");
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "0.0.0.0") body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) throw new HttpError(400, "The spam check could not be verified. Please try again.");
  const data = (await response.json()) as { success?: boolean };
  if (!data.success) throw new HttpError(400, "The spam check failed. Please try again.");
}
