import bcrypt from "bcryptjs";
import { HttpError } from "./http";

function cost(): number {
  const parsed = Number(process.env.BCRYPT_COST || 12);
  const value = Number.isFinite(parsed) ? parsed : 12;
  if (process.env.NODE_ENV === "production") return Math.max(12, Math.min(value, 14));
  return Math.min(12, Math.max(4, value));
}

export function assertPasswordStrength(password: string): void {
  if (password.length < 12 || password.length > 200) {
    throw new HttpError(400, "Use a password of at least 12 characters.");
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new HttpError(400, "The password needs an uppercase letter, a lowercase letter, and a number.");
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, cost());
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummy: string | null = null;

export function dummyPasswordHash(): string {
  if (!dummy) dummy = bcrypt.hashSync("timing-only-password", cost());
  return dummy;
}
