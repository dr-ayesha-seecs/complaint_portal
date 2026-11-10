import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { organisation } from "@/data/organisation";
import { isPlaceholderEmail } from "./ids";
import { assertPasswordStrength, hashPassword } from "./password";
import { isRole, assignmentError, type Role } from "./rbac";
import { SCHEMA_STATEMENTS } from "./schema";

let client: Client | null = null;
let ready: Promise<void> | null = null;

export function databaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_DB !== "true") {
    throw new Error(
      "TURSO_DATABASE_URL is required in production. Local SQLite is only for development, or for a server with a persistent disk and ALLOW_LOCAL_DB=true.",
    );
  }
  return `file:${path.join(process.cwd(), "data", "local.db")}`;
}

export function getClient(): Client {
  if (!client) {
    const url = databaseUrl();
    if (url.startsWith("file:")) {
      const filePath = url.slice("file:".length);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

export async function resetClient(): Promise<void> {
  if (client) {
    client.close();
    client = null;
  }
  ready = null;
}

export async function ensureDatabase(): Promise<void> {
  if (!ready) {
    ready = initialise().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

async function initialise(): Promise<void> {
  const db = getClient();
  await db.execute("PRAGMA foreign_keys = ON");
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }
  const now = new Date().toISOString();
  await db.execute({
    sql: "INSERT INTO schema_migrations (id, applied_at) VALUES ('001_init', ?) ON CONFLICT(id) DO NOTHING",
    args: [now],
  });
  await seedOrganisation();
  await seedSettings();
  await bootstrapUsers();
  await warnPlaceholders();
}

async function seedOrganisation(): Promise<void> {
  const db = getClient();
  const existing = await db.execute("SELECT COUNT(*) AS n FROM faculties");
  if (Number(existing.rows[0]?.n ?? 0) > 0) return;
  const now = new Date().toISOString();
  const statements: { sql: string; args: (string | number)[] }[] = [];
  organisation.forEach((item, facultyIndex) => {
    statements.push({
      sql: `INSERT INTO faculties
        (id, code, name, name_ur, dean_name, dean_email, email_is_placeholder, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.code,
        item.name,
        item.nameUr,
        item.deanName,
        item.deanEmail,
        isPlaceholderEmail(item.deanEmail) ? 1 : 0,
        facultyIndex,
        now,
        now,
      ],
    });
    item.departments.forEach((dept, departmentIndex) => {
      statements.push({
        sql: `INSERT INTO departments
          (id, faculty_id, code, name, name_ur, chairperson_name, chairperson_email, email_is_placeholder, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          dept.id,
          item.id,
          dept.code,
          dept.name,
          dept.nameUr,
          dept.chairpersonName,
          dept.chairpersonEmail,
          isPlaceholderEmail(dept.chairpersonEmail) ? 1 : 0,
          departmentIndex,
          now,
          now,
        ],
      });
    });
  });
  await db.batch(statements, "write");
}

async function seedSettings(): Promise<void> {
  const db = getClient();
  const defaults: Record<string, string> = {
    harassment_focal_name: process.env.HARASSMENT_FOCAL_NAME?.trim() || "Harassment Focal Person",
    harassment_focal_email: process.env.HARASSMENT_FOCAL_EMAIL?.trim() || "placeholder+harassment-focal@mnsuam.invalid",
    harassment_committee_email:
      process.env.HARASSMENT_COMMITTEE_EMAIL?.trim() || "placeholder+harassment-committee@mnsuam.invalid",
    vc_notification_email:
      process.env.VC_NOTIFICATION_EMAIL?.trim() ||
      process.env.BOOTSTRAP_VC_EMAIL?.trim() ||
      "placeholder+vice-chancellor@mnsuam.invalid",
  };
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(defaults)) {
    await db.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO NOTHING",
      args: [key, value, now],
    });
  }
}

type BootstrapAccount = {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  facultyId?: string | null;
  departmentId?: string | null;
};

async function bootstrapUsers(): Promise<void> {
  const accounts: BootstrapAccount[] = [];
  if (process.env.BOOTSTRAP_VC_EMAIL && process.env.BOOTSTRAP_VC_PASSWORD) {
    accounts.push({
      email: process.env.BOOTSTRAP_VC_EMAIL,
      name: process.env.BOOTSTRAP_VC_NAME || "Vice Chancellor",
      password: process.env.BOOTSTRAP_VC_PASSWORD,
      role: "vice_chancellor",
    });
  }
  if (process.env.BOOTSTRAP_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.BOOTSTRAP_USERS_JSON) as unknown;
      if (Array.isArray(parsed)) accounts.push(...(parsed as BootstrapAccount[]));
      else console.error("[mnsuam] BOOTSTRAP_USERS_JSON must be an array. Those accounts were skipped.");
    } catch {
      console.error("[mnsuam] BOOTSTRAP_USERS_JSON is not valid JSON. Those accounts were skipped.");
    }
  }

  const reset = process.env.BOOTSTRAP_RESET_PASSWORDS === "true";
  for (const account of accounts) {
    const email = account.email?.trim().toLowerCase() ?? "";
    const password = account.password ?? "";
    const role = account.role ?? "";
    if (!email || !password || !isRole(role)) {
      console.error(`[mnsuam] Skipped a bootstrap account because email, password, or role was invalid (${email || "no email"}).`);
      continue;
    }
    try {
      assertPasswordStrength(password);
    } catch (error) {
      console.error(`[mnsuam] Skipped bootstrap account ${email}: ${error instanceof Error ? error.message : "weak password"}`);
      continue;
    }
    const facultyId = account.facultyId?.trim() || null;
    const departmentId = account.departmentId?.trim() || null;
    let departmentFaculty: string | null = null;
    if (departmentId) {
      const row = await getClient().execute({ sql: "SELECT faculty_id FROM departments WHERE id = ?", args: [departmentId] });
      departmentFaculty = row.rows[0] ? String(row.rows[0].faculty_id) : null;
      if (!departmentFaculty) {
        console.error(`[mnsuam] Skipped bootstrap account ${email}: unknown department ${departmentId}.`);
        continue;
      }
    }
    if (facultyId) {
      const row = await getClient().execute({ sql: "SELECT id FROM faculties WHERE id = ?", args: [facultyId] });
      if (!row.rows[0]) {
        console.error(`[mnsuam] Skipped bootstrap account ${email}: unknown faculty ${facultyId}.`);
        continue;
      }
    }
    const problem = assignmentError(role, facultyId, departmentId, departmentFaculty);
    if (problem) {
      console.error(`[mnsuam] Skipped bootstrap account ${email}: ${problem}`);
      continue;
    }
    await upsertBootstrapUser({
      email,
      name: account.name?.trim() || email,
      password,
      role,
      facultyId,
      departmentId,
      reset,
    });
  }
}

async function upsertBootstrapUser(input: {
  email: string;
  name: string;
  password: string;
  role: Role;
  facultyId: string | null;
  departmentId: string | null;
  reset: boolean;
}): Promise<void> {
  const db = getClient();
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [input.email] });
  const now = new Date().toISOString();
  if (existing.rows[0] && !input.reset) return;
  const passwordHash = await hashPassword(input.password);
  if (existing.rows[0]) {
    await db.execute({
      sql: "UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?",
      args: [passwordHash, now, input.email],
    });
    console.info(`[mnsuam] Reset password for bootstrap account ${input.email}.`);
    return;
  }
  await db.execute({
    sql: `INSERT INTO users (id, email, name, password_hash, role, faculty_id, department_id, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [randomUUID(), input.email, input.name, passwordHash, input.role, input.facultyId, input.departmentId, now, now],
  });
  console.info(`[mnsuam] Created bootstrap account ${input.email} (${input.role}).`);
}

async function warnPlaceholders(): Promise<void> {
  const db = getClient();
  const faculties = await db.execute("SELECT COUNT(*) AS n FROM faculties WHERE email_is_placeholder = 1");
  const departments = await db.execute("SELECT COUNT(*) AS n FROM departments WHERE email_is_placeholder = 1");
  const count = Number(faculties.rows[0]?.n ?? 0) + Number(departments.rows[0]?.n ?? 0);
  if (count > 0) {
    console.warn(
      `[mnsuam] ${count} faculty or department contacts still use placeholder emails. Update them in Dashboard → Contacts before relying on delivery.`,
    );
  }
  if (!process.env.SECRET_PEPPER || process.env.SECRET_PEPPER.trim().length < 32) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mnsuam] SECRET_PEPPER is missing or short. Set a long random value before production.");
    }
  }
}
