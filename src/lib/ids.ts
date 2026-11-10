import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { karachiYear } from "./sla";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomFromAlphabet(length: number): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < length) {
    const bytes = randomBytes(length);
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function getPepper(): string {
  const pepper = process.env.SECRET_PEPPER?.trim();
  if (pepper && pepper.length >= 32) return pepper;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SECRET_PEPPER must be set to a random string of at least 32 characters in production.");
  }
  return "dev-only-pepper-not-for-production-use";
}

export function generateTrackingNumber(now = new Date()): string {
  return `MNS-${karachiYear(now)}-${randomFromAlphabet(8)}`;
}

export function generateSecret(): string {
  const raw = randomFromAlphabet(12);
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeSecret(secret: string): string {
  return secret.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(`${getPepper()}:${normalizeSecret(secret)}`).digest("hex");
}

export function verifySecret(secret: string, expectedHash: string): boolean {
  const actual = hashSecret(secret);
  const left = Buffer.from(actual);
  const right = Buffer.from(expectedHash);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashSessionToken(token) };
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`ip:${getPepper()}:${ip}`).digest("hex");
}

export function isPlaceholderEmail(email: string): boolean {
  const value = email.trim().toLowerCase();
  if (!value) return true;
  return (
    value.endsWith(".invalid") ||
    value.includes("placeholder") ||
    value.endsWith("@example.com") ||
    value.includes("replace_me") ||
    value.includes("replace-me") ||
    value.includes("changeme")
  );
}
