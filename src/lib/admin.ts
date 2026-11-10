import { randomUUID } from "crypto";
import { audit } from "./audit";
import { ensureDatabase, getClient } from "./db";
import { HttpError } from "./http";
import { isEmailAddress } from "./validation";
import { canManageDirectory, type SessionUser } from "./rbac";
import { flag, integer, requiredText, text, type SqlRow } from "./rows";
import { placeholderFlag, setSetting } from "./settings";
import type { DepartmentContact, FacultyContact } from "./view-types";

export type { DepartmentContact, FacultyContact };

function assertVc(user: SessionUser): void {
  if (!canManageDirectory(user)) throw new HttpError(403, "Only the Vice Chancellor can change these records.");
}

export async function listDirectory(): Promise<FacultyContact[]> {
  await ensureDatabase();
  const faculties = await getClient().execute("SELECT * FROM faculties ORDER BY sort_order, name");
  const departments = await getClient().execute("SELECT * FROM departments ORDER BY sort_order, name");
  return faculties.rows.map((row) => {
    const faculty = row as SqlRow;
    const id = requiredText(faculty, "id");
    return {
      id,
      name: requiredText(faculty, "name"),
      nameUr: requiredText(faculty, "name_ur"),
      deanName: requiredText(faculty, "dean_name"),
      deanEmail: requiredText(faculty, "dean_email"),
      emailIsPlaceholder: flag(faculty, "email_is_placeholder"),
      departments: departments.rows
        .filter((item) => String((item as SqlRow).faculty_id) === id)
        .map((item) => mapDepartment(item as SqlRow)),
    };
  });
}

export async function publicOrganisation(): Promise<{ id: string; name: string; nameUr: string; departments: { id: string; name: string; nameUr: string }[] }[]> {
  const directory = await listDirectory();
  return directory.map((faculty) => ({
    id: faculty.id,
    name: faculty.name,
    nameUr: faculty.nameUr,
    departments: faculty.departments.map((dept) => ({ id: dept.id, name: dept.name, nameUr: dept.nameUr })),
  }));
}

function mapDepartment(row: SqlRow): DepartmentContact {
  return {
    id: requiredText(row, "id"),
    facultyId: requiredText(row, "faculty_id"),
    name: requiredText(row, "name"),
    nameUr: requiredText(row, "name_ur"),
    chairpersonName: requiredText(row, "chairperson_name"),
    chairpersonEmail: requiredText(row, "chairperson_email"),
    emailIsPlaceholder: flag(row, "email_is_placeholder"),
  };
}

export async function updateFacultyContact(
  user: SessionUser,
  id: string,
  input: { deanName: string; deanEmail: string },
): Promise<void> {
  assertVc(user);
  await ensureDatabase();
  const deanName = input.deanName.trim();
  const deanEmail = input.deanEmail.trim().toLowerCase();
  if (deanName.length < 3) throw new HttpError(400, "Enter the dean's name or office.");
  if (!isEmailAddress(deanEmail)) throw new HttpError(400, "Enter a valid dean email address.");
  const result = await getClient().execute({
    sql: `UPDATE faculties SET dean_name = ?, dean_email = ?, email_is_placeholder = ?, updated_at = ? WHERE id = ?`,
    args: [deanName, deanEmail, placeholderFlag(deanEmail), new Date().toISOString(), id],
  });
  if (Number(result.rowsAffected) === 0) throw new HttpError(404, "That faculty was not found.");
  await audit({
    actorId: user.id,
    action: "faculty_contact_updated",
    entity: "faculty",
    entityId: id,
    meta: { placeholder: placeholderFlag(deanEmail) === 1 },
  });
}

export async function updateDepartmentContact(
  user: SessionUser,
  id: string,
  input: { chairpersonName: string; chairpersonEmail: string },
): Promise<void> {
  assertVc(user);
  await ensureDatabase();
  const chairpersonName = input.chairpersonName.trim();
  const chairpersonEmail = input.chairpersonEmail.trim().toLowerCase();
  if (chairpersonName.length < 3) throw new HttpError(400, "Enter the chairperson's name or office.");
  if (!isEmailAddress(chairpersonEmail)) throw new HttpError(400, "Enter a valid chairperson email address.");
  const result = await getClient().execute({
    sql: `UPDATE departments
          SET chairperson_name = ?, chairperson_email = ?, email_is_placeholder = ?, updated_at = ?
          WHERE id = ?`,
    args: [chairpersonName, chairpersonEmail, placeholderFlag(chairpersonEmail), new Date().toISOString(), id],
  });
  if (Number(result.rowsAffected) === 0) throw new HttpError(404, "That department was not found.");
  await audit({
    actorId: user.id,
    action: "department_contact_updated",
    entity: "department",
    entityId: id,
    meta: { placeholder: placeholderFlag(chairpersonEmail) === 1 },
  });
}

export async function addDepartment(
  user: SessionUser,
  input: { facultyId: string; name: string; nameUr: string; chairpersonName: string; chairpersonEmail: string },
): Promise<void> {
  assertVc(user);
  await ensureDatabase();
  const name = input.name.trim();
  const email = input.chairpersonEmail.trim().toLowerCase();
  const chair = input.chairpersonName.trim();
  if (name.length < 3) throw new HttpError(400, "Enter the department name.");
  if (chair.length < 3) throw new HttpError(400, "Enter the chairperson's name or office.");
  if (!isEmailAddress(email)) throw new HttpError(400, "Enter a valid chairperson email address.");
  const faculty = await getClient().execute({ sql: "SELECT id FROM faculties WHERE id = ?", args: [input.facultyId] });
  if (!faculty.rows[0]) throw new HttpError(400, "That faculty was not found.");
  const order = await getClient().execute({
    sql: "SELECT COALESCE(MAX(sort_order), 0) AS n FROM departments WHERE faculty_id = ?",
    args: [input.facultyId],
  });
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const id = `${input.facultyId}-${slug || "unit"}-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  await getClient().execute({
    sql: `INSERT INTO departments
      (id, faculty_id, code, name, name_ur, chairperson_name, chairperson_email, email_is_placeholder, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.facultyId,
      id.toUpperCase(),
      name,
      input.nameUr.trim(),
      chair,
      email,
      placeholderFlag(email),
      integer(order.rows[0] as SqlRow, "n") + 1,
      now,
      now,
    ],
  });
  await audit({ actorId: user.id, action: "department_added", entity: "department", entityId: id });
}

export async function updateHarassmentContacts(
  user: SessionUser,
  input: { focalName: string; focalEmail: string; committeeEmail: string; vcEmail: string },
): Promise<void> {
  assertVc(user);
  await ensureDatabase();
  const focalName = input.focalName.trim();
  const focalEmail = input.focalEmail.trim().toLowerCase();
  const committeeEmail = input.committeeEmail.trim().toLowerCase();
  const vcEmail = input.vcEmail.trim().toLowerCase();
  if (focalName.length < 3) throw new HttpError(400, "Enter the focal person's name.");
  for (const email of [focalEmail, committeeEmail, vcEmail]) {
    if (!isEmailAddress(email)) throw new HttpError(400, "Enter a valid email address for every harassment and VC contact.");
  }
  await setSetting("harassment_focal_name", focalName);
  await setSetting("harassment_focal_email", focalEmail);
  await setSetting("harassment_committee_email", committeeEmail);
  await setSetting("vc_notification_email", vcEmail);
  await audit({ actorId: user.id, action: "harassment_contacts_updated", entity: "settings", entityId: "harassment" });
}

export async function placeholderCount(): Promise<number> {
  await ensureDatabase();
  const faculties = await getClient().execute("SELECT COUNT(*) AS n FROM faculties WHERE email_is_placeholder = 1");
  const departments = await getClient().execute("SELECT COUNT(*) AS n FROM departments WHERE email_is_placeholder = 1");
  return Number(faculties.rows[0]?.n ?? 0) + Number(departments.rows[0]?.n ?? 0);
}

export async function recentAudit(limit = 200): Promise<
  { id: string; action: string; entity: string; entityId: string | null; actorName: string | null; createdAt: string; meta: string | null }[]
> {
  await ensureDatabase();
  const rows = await getClient().execute({
    sql: `SELECT a.id, a.action, a.entity, a.entity_id, a.meta, a.created_at, u.name AS actor_name
          FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
          ORDER BY a.created_at DESC LIMIT ?`,
    args: [limit],
  });
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      action: requiredText(record, "action"),
      entity: requiredText(record, "entity"),
      entityId: text(record, "entity_id"),
      actorName: text(record, "actor_name"),
      createdAt: requiredText(record, "created_at"),
      meta: text(record, "meta"),
    };
  });
}
