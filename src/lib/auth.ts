import { randomUUID } from "crypto";
import { audit } from "./audit";
import { ensureDatabase, getClient } from "./db";
import { hashIp, hashSessionToken, newSessionToken } from "./ids";
import { HttpError } from "./http";
import { assertPasswordStrength, dummyPasswordHash, hashPassword, verifyPassword } from "./password";
import { assignmentError, isRole, type Role, type SessionUser } from "./rbac";
import { flag, requiredText, text, type SqlRow } from "./rows";

export const SESSION_COOKIE = "mns_session";
const SESSION_MS = 8 * 60 * 60 * 1000;

export function mapUser(row: SqlRow): SessionUser | null {
  const role = requiredText(row, "role");
  if (!isRole(role)) return null;
  return {
    id: requiredText(row, "id"),
    email: requiredText(row, "email"),
    name: requiredText(row, "name"),
    role,
    facultyId: text(row, "faculty_id"),
    departmentId: text(row, "department_id"),
    active: flag(row, "active"),
  };
}

export async function authenticate(email: string, password: string, ipHash?: string | null): Promise<SessionUser | null> {
  await ensureDatabase();
  const normalised = email.trim().toLowerCase();
  const row = await getClient().execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [normalised],
  });
  const record = row.rows[0];
  const hash = record ? String(record.password_hash) : dummyPasswordHash();
  const match = await verifyPassword(password, hash);
  if (!record || !match || Number(record.active) !== 1) {
    await audit({
      action: "login_failed",
      entity: "user",
      entityId: record ? String(record.id) : null,
      ipHash: ipHash ?? null,
      meta: { email: normalised },
    });
    return null;
  }
  const user = mapUser(record as SqlRow);
  if (!user) return null;
  await audit({ actorId: user.id, action: "login", entity: "user", entityId: user.id, ipHash: ipHash ?? null });
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const { token, hash } = newSessionToken();
  const now = new Date();
  await getClient().execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [now.toISOString()],
  });
  await getClient().execute({
    sql: "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [randomUUID(), userId, hash, new Date(now.getTime() + SESSION_MS).toISOString(), now.toISOString()],
  });
  return token;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await ensureDatabase();
  await getClient().execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hashSessionToken(token)] });
}

export async function userFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  await ensureDatabase();
  const row = await getClient().execute({
    sql: `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    args: [hashSessionToken(token), new Date().toISOString()],
  });
  if (!row.rows[0]) return null;
  return mapUser(row.rows[0] as SqlRow);
}

export async function insertUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
  facultyId: string | null;
  departmentId: string | null;
}): Promise<SessionUser> {
  await ensureDatabase();
  assertPasswordStrength(input.password);
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Enter a valid email address.");
  if (input.name.trim().length < 3) throw new HttpError(400, "Enter the person's name.");
  const departmentFaculty = await departmentFacultyId(input.departmentId);
  const problem = assignmentError(input.role, input.facultyId, input.departmentId, departmentFaculty);
  if (problem) throw new HttpError(400, problem);
  if (input.facultyId) await assertFaculty(input.facultyId);
  const now = new Date().toISOString();
  const id = randomUUID();
  try {
    await getClient().execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, faculty_id, department_id, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [id, email, input.name.trim(), await hashPassword(input.password), input.role, input.facultyId, input.departmentId, now, now],
    });
  } catch {
    throw new HttpError(400, "An account with that email already exists.");
  }
  return {
    id,
    email,
    name: input.name.trim(),
    role: input.role,
    facultyId: input.facultyId,
    departmentId: input.departmentId,
    active: true,
  };
}

export async function updateUser(
  actor: SessionUser,
  userId: string,
  patch: { active?: boolean; password?: string; role?: Role; facultyId?: string | null; departmentId?: string | null },
): Promise<void> {
  await ensureDatabase();
  const current = await getClient().execute({ sql: "SELECT * FROM users WHERE id = ?", args: [userId] });
  if (!current.rows[0]) throw new HttpError(404, "That account was not found.");
  const existing = mapUser(current.rows[0] as SqlRow);
  if (!existing) throw new HttpError(400, "That account is not valid.");
  const role = patch.role ?? existing.role;
  const facultyId = patch.facultyId === undefined ? existing.facultyId : patch.facultyId;
  const departmentId = patch.departmentId === undefined ? existing.departmentId : patch.departmentId;
  const departmentFaculty = await departmentFacultyId(departmentId);
  const problem = assignmentError(role, facultyId, departmentId, departmentFaculty);
  if (problem) throw new HttpError(400, problem);
  if (facultyId) await assertFaculty(facultyId);
  const active = patch.active === undefined ? existing.active : patch.active;
  if (existing.role === "vice_chancellor" && existing.active && (!active || role !== "vice_chancellor")) {
    const others = await getClient().execute({
      sql: "SELECT COUNT(*) AS n FROM users WHERE role = 'vice_chancellor' AND active = 1 AND id != ?",
      args: [userId],
    });
    if (Number(others.rows[0]?.n ?? 0) === 0) {
      throw new HttpError(400, "Keep at least one active Vice Chancellor account.");
    }
  }
  if (existing.role === "admin" && existing.active && (!active || role !== "admin")) {
    const others = await getClient().execute({
      sql: "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id != ?",
      args: [userId],
    });
    if (Number(others.rows[0]?.n ?? 0) === 0) {
      throw new HttpError(400, "Keep at least one active system administrator account.");
    }
  }
  if (userId === actor.id && active === false) throw new HttpError(400, "You cannot deactivate your own account.");
  const passwordHash = patch.password ? await hashPassword(checkedPassword(patch.password)) : null;
  await getClient().execute({
    sql: `UPDATE users
          SET role = ?, faculty_id = ?, department_id = ?, active = ?, updated_at = ?,
              password_hash = COALESCE(?, password_hash)
          WHERE id = ?`,
    args: [role, facultyId, departmentId, active ? 1 : 0, new Date().toISOString(), passwordHash, userId],
  });
}

function checkedPassword(password: string): string {
  assertPasswordStrength(password);
  return password;
}

export async function changeOwnPassword(user: SessionUser, currentPassword: string, nextPassword: string): Promise<void> {
  await ensureDatabase();
  assertPasswordStrength(nextPassword);
  const row = await getClient().execute({ sql: "SELECT password_hash FROM users WHERE id = ?", args: [user.id] });
  const hash = row.rows[0] ? String(row.rows[0].password_hash) : "";
  const match = await verifyPassword(currentPassword, hash);
  if (!match) throw new HttpError(400, "The current password is not correct.");
  await getClient().execute({
    sql: "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    args: [await hashPassword(nextPassword), new Date().toISOString(), user.id],
  });
  await audit({ actorId: user.id, action: "password_changed", entity: "user", entityId: user.id });
}

export async function listUsers(): Promise<SessionUser[]> {
  await ensureDatabase();
  const rows = await getClient().execute("SELECT * FROM users ORDER BY role, name");
  return rows.rows.map((row) => mapUser(row as SqlRow)).filter((user): user is SessionUser => Boolean(user));
}

async function departmentFacultyId(departmentId: string | null): Promise<string | null> {
  if (!departmentId) return null;
  const row = await getClient().execute({ sql: "SELECT faculty_id FROM departments WHERE id = ?", args: [departmentId] });
  if (!row.rows[0]) throw new HttpError(400, "That department was not found.");
  return String(row.rows[0].faculty_id);
}

async function assertFaculty(facultyId: string): Promise<void> {
  const row = await getClient().execute({ sql: "SELECT id FROM faculties WHERE id = ?", args: [facultyId] });
  if (!row.rows[0]) throw new HttpError(400, "That faculty was not found.");
}

export function clientIpHash(ip: string): string | null {
  return hashIp(ip);
}
