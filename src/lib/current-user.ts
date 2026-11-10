import { cookies } from "next/headers";
import { SESSION_COOKIE, userFromToken } from "./auth";
import { HttpError } from "./http";
import type { SessionUser } from "./rbac";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  return user;
}
