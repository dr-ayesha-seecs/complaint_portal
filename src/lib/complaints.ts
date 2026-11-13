import { randomUUID } from "crypto";
import { audit } from "./audit";
import { ensureDatabase, getClient } from "./db";
import { studentEmail, studentUpdateEmail, staffEmail } from "./email-templates";
import { asBytes, inspectFile, MAX_ATTACHMENTS } from "./files";
import { toCsv } from "./csv";
import { HttpError } from "./http";
import { generateSecret, generateTrackingNumber, hashIp, hashSecret, isPlaceholderEmail, verifySecret } from "./ids";
import { deliverEmail } from "./mailer";
import { assertRateLimit } from "./rate-limit";
import { canAccessComplaint, canAssignComplaint, canHandleComplaint, scopeClause, type SessionUser } from "./rbac";
import { flag, integer, requiredText, text, type SqlRow } from "./rows";
import { buildRecipientList } from "./routing";
import { harassmentSettings } from "./settings";
import {
  appealDecisionDue,
  appealFilingDeadline,
  computeSla,
  isOverdue,
  karachiEndIso,
  karachiStartIso,
  type SlaProfile,
} from "./sla";
import { categoryLabel, OPEN_STATUSES, statusLabel, STATUSES, type Status } from "./categories";
import { complaintSchema, fieldErrorsFromZod, isEmailAddress, normalizePhone } from "./validation";
import { verifyTurnstile } from "./turnstile";
import type { ComplaintFilters, PublicEvent, StudentView } from "./view-types";

export type { ComplaintFilters };

export type ComplaintRecord = {
  id: string;
  trackingNumber: string;
  category: string;
  harassmentType: string | null;
  isAnonymous: boolean;
  concernsDepartmentHead: boolean;
  status: string;
  facultyId: string;
  departmentId: string;
  programme: string;
  semester: string;
  subject: string;
  description: string;
  desiredOutcome: string | null;
  incidentDate: string | null;
  location: string | null;
  respondentName: string | null;
  studentName: string | null;
  registrationNumber: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  slaProfile: SlaProfile;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  ackDueAt: string;
  initialDueAt: string;
  dueAt: string;
  resolvedAt: string | null;
  appealDeadline: string | null;
};

export type ComplaintEvent = PublicEvent;
export type { StudentView };

export type ComplaintDetail = ComplaintRecord & {
  facultyName: string;
  departmentName: string;
  overdue: boolean;
  events: ComplaintEvent[];
  notes: { id: string; body: string; createdAt: string; authorName: string }[];
  attachments: { id: string; filename: string; mime: string; size: number; createdAt: string }[];
  assignees: Assignee[];
};

export type ComplaintListItem = {
  id: string;
  trackingNumber: string;
  category: string;
  status: string;
  subject: string;
  facultyName: string;
  departmentName: string;
  createdAt: string;
  dueAt: string;
  isAnonymous: boolean;
  escalationLevel: number;
  overdue: boolean;
  studentName: string | null;
};

const SELECT_COMPLAINT = `
  c.id, c.tracking_number, c.category, c.harassment_type, c.is_anonymous, c.concerns_department_head,
  c.status, c.faculty_id, c.department_id, c.programme, c.semester, c.subject, c.description,
  c.desired_outcome, c.incident_date, c.location, c.respondent_name, c.student_name,
  c.registration_number, c.student_email, c.student_phone, c.sla_profile, c.escalation_level,
  c.created_at, c.updated_at, c.acknowledged_at, c.ack_due_at, c.initial_due_at, c.due_at,
  c.resolved_at, c.appeal_deadline
`;

function mapComplaint(row: SqlRow): ComplaintRecord {
  return {
    id: requiredText(row, "id"),
    trackingNumber: requiredText(row, "tracking_number"),
    category: requiredText(row, "category"),
    harassmentType: text(row, "harassment_type"),
    isAnonymous: flag(row, "is_anonymous"),
    concernsDepartmentHead: flag(row, "concerns_department_head"),
    status: requiredText(row, "status"),
    facultyId: requiredText(row, "faculty_id"),
    departmentId: requiredText(row, "department_id"),
    programme: requiredText(row, "programme"),
    semester: requiredText(row, "semester"),
    subject: requiredText(row, "subject"),
    description: requiredText(row, "description"),
    desiredOutcome: text(row, "desired_outcome"),
    incidentDate: text(row, "incident_date"),
    location: text(row, "location"),
    respondentName: text(row, "respondent_name"),
    studentName: text(row, "student_name"),
    registrationNumber: text(row, "registration_number"),
    studentEmail: text(row, "student_email"),
    studentPhone: text(row, "student_phone"),
    slaProfile: requiredText(row, "sla_profile") === "harassment" ? "harassment" : "standard",
    escalationLevel: integer(row, "escalation_level"),
    createdAt: requiredText(row, "created_at"),
    updatedAt: requiredText(row, "updated_at"),
    acknowledgedAt: text(row, "acknowledged_at"),
    ackDueAt: requiredText(row, "ack_due_at"),
    initialDueAt: requiredText(row, "initial_due_at"),
    dueAt: requiredText(row, "due_at"),
    resolvedAt: text(row, "resolved_at"),
    appealDeadline: text(row, "appeal_deadline"),
  };
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function submitComplaint(
  raw: unknown,
  files: { filename: string; bytes: Uint8Array }[],
  ctx: { ip: string; appUrl: string; turnstileToken?: string },
): Promise<{ trackingNumber: string; secretKey: string; dueAt: string; emailed: boolean }> {
  await ensureDatabase();
  await verifyTurnstile(ctx.turnstileToken, ctx.ip);
  const parsed = complaintSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "Please correct the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }
  const input = parsed.data;
  if (input.companyWebsite.trim()) throw new HttpError(400, "The complaint could not be submitted.");
  if (input.anonymous) {
    throw new HttpError(400, "Anonymous complaints are not allowed.", {
      anonymous: ["Anonymous complaints are not allowed. Please enter your name. Your name will remain strictly confidential."],
    });
  }
  if (input.studentName.trim().length < 3) {
    throw new HttpError(400, "Please correct the highlighted fields.", {
      studentName: ["Enter your full name. Your name is required for verification and will remain strictly confidential."],
    });
  }

  const ipHash = hashIp(ctx.ip);
  await assertRateLimit(`submit:${ipHash ?? ctx.ip}`, 8, 60 * 60 * 1000);
  if (files.length > MAX_ATTACHMENTS) throw new HttpError(400, "You can attach up to 2 files.");
  const storedFiles = files.map((file) => {
    const checked = inspectFile(file.filename, file.bytes);
    return { ...checked, bytes: file.bytes, size: file.bytes.byteLength };
  });

  const place = await loadPlace(input.facultyId, input.departmentId);
  const now = new Date();
  const sla = computeSla(input.category, now);
  const trackingNumber = await uniqueTracking(now);
  const secretKey = generateSecret();
  const id = randomUUID();
  const anonymous = false;
  const identity = {
    name: blankToNull(input.studentName),
    registration: blankToNull(input.registrationNumber)?.toUpperCase() ?? null,
    email: blankToNull(input.studentEmail)?.toLowerCase() ?? null,
    phone: input.studentPhone?.trim() ? normalizePhone(input.studentPhone) : null,
  };
  const concerns = Boolean(input.concernsDepartmentHead);
  const status: Status = concerns ? "escalated" : "submitted";
  const createdAt = now.toISOString();
  const harassmentType = input.category === "harassment" ? input.harassmentType || null : null;

  const statements: { sql: string; args: (string | number | Uint8Array | null)[] }[] = [
    {
      sql: `INSERT INTO complaints (
        id, tracking_number, secret_key_hash, category, harassment_type, is_anonymous, concerns_department_head,
        status, faculty_id, department_id, programme, semester, subject, description, desired_outcome,
        incident_date, location, respondent_name, student_name, registration_number, student_email, student_phone,
        sla_profile, escalation_level, created_at, updated_at, acknowledged_at, ack_due_at, initial_due_at, due_at, ip_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
      args: [
        id,
        trackingNumber,
        hashSecret(secretKey),
        input.category,
        harassmentType,
        anonymous ? 1 : 0,
        concerns ? 1 : 0,
        status,
        place.facultyId,
        place.departmentId,
        input.programme.trim(),
        input.semester,
        input.subject.trim(),
        input.description.trim(),
        blankToNull(input.desiredOutcome),
        blankToNull(input.incidentDate),
        blankToNull(input.location),
        blankToNull(input.respondentName),
        identity.name,
        identity.registration,
        identity.email,
        identity.phone,
        sla.profile,
        concerns ? 1 : 0,
        createdAt,
        createdAt,
        sla.ackDueAt,
        sla.dueAt,
        sla.dueAt,
        ipHash,
      ],
    },
    {
      sql: `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, from_status, to_status, public_message, created_at)
            VALUES (?, ?, NULL, 'created', NULL, ?, ?, ?)`,
      args: [
        randomUUID(),
        id,
        status,
        concerns
          ? "Your complaint was received and escalated to the Dean and the Vice Chancellor because you indicated that the head of department is involved."
          : "Your complaint was received. Keep your tracking number and secret key.",
        createdAt,
      ],
    },
  ];
  for (const file of storedFiles) {
    statements.push({
      sql: `INSERT INTO attachments (id, complaint_id, filename, mime, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), id, file.filename, file.mime, file.size, file.bytes, createdAt],
    });
  }
  await getClient().batch(statements, "write");
  await audit({
    action: "complaint_created",
    entity: "complaint",
    entityId: id,
    ipHash,
    meta: { category: input.category, anonymous, trackingNumber },
  });

  const settings = await harassmentSettings();
  const recipients = buildRecipientList({
    category: input.category,
    chairEmail: place.chairEmail,
    deanEmail: place.deanEmail,
    focalEmail: settings.focalEmail,
    committeeEmail: settings.committeeEmail,
    vcEmail: settings.vcEmail,
    notifyChair: !concerns,
    notifyDean: true,
    notifyVc: concerns,
  });
  const complaintForMail: ComplaintRecord = {
    id,
    trackingNumber,
    category: input.category,
    harassmentType,
    isAnonymous: anonymous,
    concernsDepartmentHead: concerns,
    status,
    facultyId: place.facultyId,
    departmentId: place.departmentId,
    programme: input.programme.trim(),
    semester: input.semester,
    subject: input.subject.trim(),
    description: input.description.trim(),
    desiredOutcome: blankToNull(input.desiredOutcome),
    incidentDate: blankToNull(input.incidentDate),
    location: blankToNull(input.location),
    respondentName: blankToNull(input.respondentName),
    studentName: identity.name,
    registrationNumber: identity.registration,
    studentEmail: identity.email,
    studentPhone: identity.phone,
    slaProfile: sla.profile,
    escalationLevel: concerns ? 1 : 0,
    createdAt,
    updatedAt: createdAt,
    acknowledgedAt: null,
    ackDueAt: sla.ackDueAt,
    initialDueAt: sla.dueAt,
    dueAt: sla.dueAt,
    resolvedAt: null,
    appealDeadline: null,
  };
  await notifyStaff(complaintForMail, place, recipients, ctx.appUrl, concerns ? "Escalated at intake." : undefined);
  let emailed = false;
  if (identity.email && isEmailAddress(identity.email)) {
    const message = studentEmail({
      trackingNumber,
      secretKey,
      category: input.category,
      dueAt: sla.dueAt,
      appUrl: ctx.appUrl,
      harassment: input.category === "harassment",
    });
    const result = await deliverEmail({ to: identity.email, subject: message.subject, text: message.text, complaintId: id });
    emailed = result === "sent" || result === "logged";
  }
  return { trackingNumber, secretKey, dueAt: sla.dueAt, emailed };
}

async function uniqueTracking(now: Date): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const tracking = generateTrackingNumber(now);
    const existing = await getClient().execute({
      sql: "SELECT 1 AS n FROM complaints WHERE tracking_number = ?",
      args: [tracking],
    });
    if (existing.rows.length === 0) return tracking;
  }
  throw new HttpError(500, "Could not allocate a tracking number. Please try again.");
}

async function loadPlace(facultyId: string, departmentId: string): Promise<{
  facultyId: string;
  facultyName: string;
  deanEmail: string;
  departmentId: string;
  departmentName: string;
  chairEmail: string;
}> {
  const row = await getClient().execute({
    sql: `SELECT d.id AS department_id, d.name AS department_name, d.chairperson_email, d.faculty_id,
                 f.name AS faculty_name, f.dean_email
          FROM departments d JOIN faculties f ON f.id = d.faculty_id
          WHERE d.id = ?`,
    args: [departmentId],
  });
  const record = row.rows[0] as SqlRow | undefined;
  if (!record || requiredText(record, "faculty_id") !== facultyId) {
    throw new HttpError(400, "Choose a department that belongs to the selected faculty.");
  }
  return {
    facultyId,
    facultyName: requiredText(record, "faculty_name"),
    deanEmail: requiredText(record, "dean_email"),
    departmentId,
    departmentName: requiredText(record, "department_name"),
    chairEmail: requiredText(record, "chairperson_email"),
  };
}

async function notifyStaff(
  complaint: ComplaintRecord,
  place: { facultyName: string; departmentName: string },
  recipients: ReturnType<typeof buildRecipientList>,
  appUrl: string,
  escalationNote?: string,
): Promise<void> {
  for (const recipient of recipients) {
    const message = staffEmail({
      role: recipient.role,
      trackingNumber: complaint.trackingNumber,
      category: complaint.category,
      subject: complaint.subject,
      description: complaint.description,
      departmentName: place.departmentName,
      facultyName: place.facultyName,
      anonymous: complaint.isAnonymous,
      concernsDepartmentHead: complaint.concernsDepartmentHead,
      dueAt: complaint.dueAt,
      appUrl,
      escalationNote,
    });
    await deliverEmail({ to: recipient.email, subject: message.subject, text: message.text, complaintId: complaint.id });
  }
}

const NOT_FOUND = "No complaint matched that tracking number and key.";

export async function trackComplaint(trackingNumber: string, secret: string, ip: string): Promise<StudentView> {
  await ensureDatabase();
  const ipHash = hashIp(ip);
  await assertRateLimit(`track:${ipHash ?? ip}`, 12, 15 * 60 * 1000);
  const complaint = await complaintByTracking(trackingNumber);
  if (!complaint || !verifySecret(secret, complaint.secretHash)) {
    await audit({ action: "track_failed", entity: "complaint", ipHash, meta: { trackingNumber: trackingNumber.trim().toUpperCase() } });
    throw new HttpError(404, NOT_FOUND);
  }
  return studentView(complaint.record);
}

export async function appealComplaint(trackingNumber: string, secret: string, grounds: string, ip: string, appUrl: string): Promise<void> {
  await ensureDatabase();
  const ipHash = hashIp(ip);
  await assertRateLimit(`appeal:${ipHash ?? ip}`, 6, 60 * 60 * 1000);
  const loaded = await requireOwned(trackingNumber, secret, ipHash);
  const textBody = grounds.trim();
  if (textBody.length < 20) throw new HttpError(400, "Explain the grounds of the appeal in a little more detail.");
  if (textBody.length > 4000) throw new HttpError(400, "The appeal is too long.");
  if (loaded.status !== "resolved" && loaded.status !== "closed") {
    throw new HttpError(400, "An appeal can be filed after an outcome has been recorded.");
  }
  if (!loaded.appealDeadline || new Date(loaded.appealDeadline).getTime() < Date.now()) {
    throw new HttpError(400, "The time allowed for an appeal has ended.");
  }
  const now = new Date();
  const due = appealDecisionDue(loaded.slaProfile, now).toISOString();
  await getClient().execute({
    sql: "UPDATE complaints SET status = 'appealed', due_at = ?, updated_at = ? WHERE id = ?",
    args: [due, now.toISOString(), loaded.id],
  });
  await addEvent(loaded.id, null, "appeal", loaded.status, "appealed", `Appeal received. ${textBody}`);
  await audit({ action: "appeal_filed", entity: "complaint", entityId: loaded.id, ipHash });
  const updated = { ...loaded, status: "appealed", dueAt: due };
  await emailParties(updated, appUrl, "The student has filed an appeal.", {
    notifyChair: !loaded.concernsDepartmentHead,
    notifyDean: true,
    notifyVc: true,
  });
  if (loaded.studentEmail) {
    const message = studentUpdateEmail({
      trackingNumber: loaded.trackingNumber,
      statusLabel: statusLabel("appealed"),
      message: "Your appeal has been received and will be reviewed.",
      appUrl,
    });
    await deliverEmail({ to: loaded.studentEmail, subject: message.subject, text: message.text, complaintId: loaded.id });
  }
}

export async function withdrawComplaint(trackingNumber: string, secret: string, ip: string, appUrl: string): Promise<{ status: string }> {
  await ensureDatabase();
  const ipHash = hashIp(ip);
  await assertRateLimit(`withdraw:${ipHash ?? ip}`, 6, 60 * 60 * 1000);
  const loaded = await requireOwned(trackingNumber, secret, ipHash);
  if (["withdrawn", "appeal_upheld", "appeal_dismissed"].includes(loaded.status)) {
    throw new HttpError(400, "This complaint can no longer be withdrawn.");
  }
  const now = new Date().toISOString();
  const next: Status = loaded.category === "harassment" ? "withdrawal_requested" : "withdrawn";
  const message =
    next === "withdrawal_requested"
      ? "You asked to withdraw this complaint. Because it concerns harassment, the university may still have a duty to look into it. The office will confirm what happens next."
      : "You withdrew this complaint. The university will take no further action unless a fresh complaint is filed.";
  await getClient().execute({
    sql: "UPDATE complaints SET status = ?, updated_at = ?, resolved_at = COALESCE(resolved_at, ?) WHERE id = ?",
    args: [next, now, next === "withdrawn" ? now : null, loaded.id],
  });
  await addEvent(loaded.id, null, "withdrawal", loaded.status, next, message);
  await audit({ action: "withdrawal", entity: "complaint", entityId: loaded.id, ipHash, meta: { status: next } });
  await emailParties({ ...loaded, status: next }, appUrl, message);
  return { status: next };
}

async function requireOwned(trackingNumber: string, secret: string, ipHash: string | null): Promise<ComplaintRecord & { secretHash: string }> {
  const complaint = await complaintByTracking(trackingNumber);
  if (!complaint || !verifySecret(secret, complaint.secretHash)) {
    await audit({ action: "track_failed", entity: "complaint", ipHash });
    throw new HttpError(404, NOT_FOUND);
  }
  return complaint.recordWithSecret;
}

type Loaded = { record: ComplaintRecord; secretHash: string; recordWithSecret: ComplaintRecord & { secretHash: string } };

async function complaintByTracking(trackingNumber: string): Promise<Loaded | null> {
  const row = await getClient().execute({
    sql: `SELECT ${SELECT_COMPLAINT}, c.secret_key_hash FROM complaints c WHERE c.tracking_number = ?`,
    args: [trackingNumber.trim().toUpperCase()],
  });
  if (!row.rows[0]) return null;
  const record = mapComplaint(row.rows[0] as SqlRow);
  const secretHash = requiredText(row.rows[0] as SqlRow, "secret_key_hash");
  return { record, secretHash, recordWithSecret: { ...record, secretHash } };
}

async function studentView(complaint: ComplaintRecord): Promise<StudentView> {
  const place = await loadPlace(complaint.facultyId, complaint.departmentId);
  const events = await listEvents(complaint.id);
  const canAppeal =
    (complaint.status === "resolved" || complaint.status === "closed") &&
    Boolean(complaint.appealDeadline) &&
    new Date(complaint.appealDeadline as string).getTime() >= Date.now();
  return {
    trackingNumber: complaint.trackingNumber,
    category: complaint.category,
    categoryLabel: categoryLabel(complaint.category),
    harassmentType: complaint.harassmentType,
    status: complaint.status,
    statusLabel: statusLabel(complaint.status),
    anonymous: complaint.isAnonymous,
    subject: complaint.subject,
    programme: complaint.programme,
    semester: complaint.semester,
    facultyName: place.facultyName,
    departmentName: place.departmentName,
    createdAt: complaint.createdAt,
    dueAt: complaint.dueAt,
    appealDeadline: complaint.appealDeadline,
    overdue: isOverdue(complaint.dueAt, complaint.status),
    studentName: complaint.isAnonymous ? null : complaint.studentName,
    events,
    canAppeal,
    canWithdraw: !["withdrawn", "appeal_upheld", "appeal_dismissed"].includes(complaint.status),
  };
}

export async function listComplaints(
  user: SessionUser,
  filters: ComplaintFilters,
): Promise<{ items: ComplaintListItem[]; total: number; page: number; pageSize: number }> {
  await ensureDatabase();
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const page = Math.max(1, filters.page ?? 1);
  const { where, args } = filterSql(user, filters);
  const totalRow = await getClient().execute({
    sql: `SELECT COUNT(*) AS n FROM complaints c JOIN faculties f ON f.id = c.faculty_id JOIN departments d ON d.id = c.department_id WHERE ${where}`,
    args,
  });
  const total = Number(totalRow.rows[0]?.n ?? 0);
  const rows = await getClient().execute({
    sql: `SELECT c.id, c.tracking_number, c.category, c.status, c.subject, c.created_at, c.due_at,
                 c.is_anonymous, c.escalation_level, c.student_name, f.name AS faculty_name, d.name AS department_name
          FROM complaints c
          JOIN faculties f ON f.id = c.faculty_id
          JOIN departments d ON d.id = c.department_id
          WHERE ${where}
          ORDER BY c.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [...args, pageSize, (page - 1) * pageSize],
  });
  const now = new Date();
  return {
    total,
    page,
    pageSize,
    items: rows.rows.map((row) => {
      const record = row as SqlRow;
      const status = requiredText(record, "status");
      const dueAt = requiredText(record, "due_at");
      return {
        id: requiredText(record, "id"),
        trackingNumber: requiredText(record, "tracking_number"),
        category: requiredText(record, "category"),
        status,
        subject: requiredText(record, "subject"),
        facultyName: requiredText(record, "faculty_name"),
        departmentName: requiredText(record, "department_name"),
        createdAt: requiredText(record, "created_at"),
        dueAt,
        isAnonymous: flag(record, "is_anonymous"),
        escalationLevel: integer(record, "escalation_level"),
        overdue: isOverdue(dueAt, status, now),
        studentName: flag(record, "is_anonymous") ? null : text(record, "student_name"),
      };
    }),
  };
}

function filterSql(user: SessionUser, filters: ComplaintFilters): { where: string; args: (string | number)[] } {
  const scope = scopeClause(user, "c");
  const clauses = [scope.sql];
  const args: (string | number)[] = [...scope.args];
  if (filters.category) {
    clauses.push("c.category = ?");
    args.push(filters.category);
  }
  if (filters.status) {
    clauses.push("c.status = ?");
    args.push(filters.status);
  }
  if (filters.facultyId) {
    clauses.push("c.faculty_id = ?");
    args.push(filters.facultyId);
  }
  if (filters.departmentId) {
    clauses.push("c.department_id = ?");
    args.push(filters.departmentId);
  }
  if (filters.overdue) {
    const marks = OPEN_STATUSES.map(() => "?").join(", ");
    clauses.push(`c.due_at < ? AND c.status IN (${marks})`);
    args.push(new Date().toISOString(), ...OPEN_STATUSES);
  }
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    clauses.push("c.created_at >= ?");
    args.push(karachiStartIso(filters.from));
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    clauses.push("c.created_at <= ?");
    args.push(karachiEndIso(filters.to));
  }
  if (filters.q?.trim()) {
    const like = `%${filters.q.trim().replace(/[%_]/g, "")}%`;
    clauses.push(
      "(c.tracking_number LIKE ? COLLATE NOCASE OR c.subject LIKE ? COLLATE NOCASE OR c.description LIKE ? COLLATE NOCASE OR c.student_name LIKE ? COLLATE NOCASE OR c.registration_number LIKE ? COLLATE NOCASE OR c.student_email LIKE ? COLLATE NOCASE)",
    );
    args.push(like, like, like, like, like, like);
  }
  return { where: clauses.join(" AND "), args };
}

export type Assignee = { id: string; name: string; email: string; role: string; assignedAt: string };

async function hasAssignment(userId: string, complaintId: string): Promise<boolean> {
  const row = await getClient().execute({
    sql: "SELECT 1 AS n FROM complaint_assignments WHERE complaint_id = ? AND user_id = ? LIMIT 1",
    args: [complaintId, userId],
  });
  return row.rows.length > 0;
}

export async function mayAccessComplaint(
  user: SessionUser,
  complaintId: string,
  complaint: { facultyId: string; departmentId: string; category: string },
): Promise<boolean> {
  if (!user.active) return false;
  if (user.role === "admin") return false;
  if (canAccessComplaint(user, complaint)) return true;
  return hasAssignment(user.id, complaintId);
}

export async function listAssignees(complaintId: string): Promise<Assignee[]> {
  const rows = await getClient().execute({
    sql: `SELECT u.id, u.name, u.email, u.role, a.created_at
          FROM complaint_assignments a JOIN users u ON u.id = a.user_id
          WHERE a.complaint_id = ? ORDER BY a.created_at ASC`,
    args: [complaintId],
  });
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      name: requiredText(record, "name"),
      email: requiredText(record, "email"),
      role: requiredText(record, "role"),
      assignedAt: requiredText(record, "created_at"),
    };
  });
}

export async function listAssignableUsers(user: SessionUser): Promise<{ id: string; name: string; email: string; role: string }[]> {
  if (!canAssignComplaint(user)) throw new HttpError(403, "Only the Vice Chancellor can assign complaints.");
  await ensureDatabase();
  const rows = await getClient().execute(
    "SELECT id, name, email, role FROM users WHERE active = 1 AND role != 'admin' ORDER BY name",
  );
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      name: requiredText(record, "name"),
      email: requiredText(record, "email"),
      role: requiredText(record, "role"),
    };
  });
}

export async function assignComplaint(user: SessionUser, complaintId: string, assigneeId: string): Promise<void> {
  if (!canAssignComplaint(user)) throw new HttpError(403, "Only the Vice Chancellor can assign complaints.");
  const id = assigneeId.trim();
  if (!id) throw new HttpError(400, "Choose a person to assign this complaint to.");
  const detail = await getComplaintForUser(user, complaintId);
  const row = await getClient().execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
  if (!row.rows[0]) throw new HttpError(404, "That account was not found.");
  const assigneeRole = String((row.rows[0] as SqlRow).role || "");
  const assigneeName = String((row.rows[0] as SqlRow).name || "");
  const active = Number((row.rows[0] as SqlRow).active ?? 0) === 1;
  if (!active) throw new HttpError(400, "That account is not active.");
  if (assigneeRole === "admin") throw new HttpError(400, "System administrators do not receive access to complaint files.");
  const now = new Date().toISOString();
  try {
    await getClient().execute({
      sql: `INSERT INTO complaint_assignments (id, complaint_id, user_id, assigned_by, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [randomUUID(), complaintId, id, user.id, now],
    });
  } catch {
    throw new HttpError(400, "That person already has access to this complaint.");
  }
  await addEvent(
    complaintId,
    user.id,
    "assigned",
    detail.status,
    detail.status,
    `The Vice Chancellor assigned this complaint to ${assigneeName}.`,
  );
  await audit({
    actorId: user.id,
    action: "complaint_assigned",
    entity: "complaint",
    entityId: complaintId,
    meta: { assigneeId: id, assigneeName },
  });
}

export async function getComplaintForUser(user: SessionUser, id: string): Promise<ComplaintDetail> {

  await ensureDatabase();
  const row = await getClient().execute({
    sql: `SELECT ${SELECT_COMPLAINT}, f.name AS faculty_name, d.name AS department_name
          FROM complaints c
          JOIN faculties f ON f.id = c.faculty_id
          JOIN departments d ON d.id = c.department_id
          WHERE c.id = ?`,
    args: [id],
  });
  if (!row.rows[0]) throw new HttpError(404, "Complaint not found.");
  const record = mapComplaint(row.rows[0] as SqlRow);
  if (!(await mayAccessComplaint(user, record.id, record))) throw new HttpError(404, "Complaint not found.");
  const assignees = await listAssignees(id);
  const [events, notes, attachments] = await Promise.all([listEvents(id), listNotes(id), listAttachmentMeta(id)]);
  return {
    ...record,
    facultyName: requiredText(row.rows[0] as SqlRow, "faculty_name"),
    departmentName: requiredText(row.rows[0] as SqlRow, "department_name"),
    overdue: isOverdue(record.dueAt, record.status),
    events,
    notes,
    attachments,
    assignees,
  };
}

async function listEvents(complaintId: string): Promise<ComplaintEvent[]> {
  const rows = await getClient().execute({
    sql: `SELECT e.id, e.event_type, e.from_status, e.to_status, e.public_message, e.created_at, u.name AS actor_name
          FROM complaint_events e LEFT JOIN users u ON u.id = e.actor_id
          WHERE e.complaint_id = ? ORDER BY e.created_at ASC`,
    args: [complaintId],
  });
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      eventType: requiredText(record, "event_type"),
      fromStatus: text(record, "from_status"),
      toStatus: text(record, "to_status"),
      publicMessage: text(record, "public_message"),
      createdAt: requiredText(record, "created_at"),
      actorName: text(record, "actor_name"),
    };
  });
}

async function listNotes(complaintId: string) {
  const rows = await getClient().execute({
    sql: `SELECT n.id, n.body, n.created_at, u.name AS author_name
          FROM internal_notes n JOIN users u ON u.id = n.author_id
          WHERE n.complaint_id = ? ORDER BY n.created_at ASC`,
    args: [complaintId],
  });
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      body: requiredText(record, "body"),
      createdAt: requiredText(record, "created_at"),
      authorName: requiredText(record, "author_name"),
    };
  });
}

async function listAttachmentMeta(complaintId: string) {
  const rows = await getClient().execute({
    sql: "SELECT id, filename, mime, size, created_at FROM attachments WHERE complaint_id = ? ORDER BY created_at",
    args: [complaintId],
  });
  return rows.rows.map((row) => {
    const record = row as SqlRow;
    return {
      id: requiredText(record, "id"),
      filename: requiredText(record, "filename"),
      mime: requiredText(record, "mime"),
      size: integer(record, "size"),
      createdAt: requiredText(record, "created_at"),
    };
  });
}

export async function readAttachment(user: SessionUser, attachmentId: string): Promise<{ filename: string; mime: string; bytes: Uint8Array }> {
  await ensureDatabase();
  const row = await getClient().execute({
    sql: `SELECT a.filename, a.mime, a.data, c.faculty_id, c.department_id, c.category, c.id AS complaint_id
          FROM attachments a JOIN complaints c ON c.id = a.complaint_id WHERE a.id = ?`,
    args: [attachmentId],
  });
  if (!row.rows[0]) throw new HttpError(404, "Attachment not found.");
  const record = row.rows[0] as SqlRow;
  const allowed = await mayAccessComplaint(user, requiredText(record, "complaint_id"), {
    facultyId: requiredText(record, "faculty_id"),
    departmentId: requiredText(record, "department_id"),
    category: requiredText(record, "category"),
  });
  if (!allowed) throw new HttpError(404, "Attachment not found.");
  await audit({ actorId: user.id, action: "attachment_downloaded", entity: "attachment", entityId: attachmentId });
  return { filename: requiredText(record, "filename"), mime: requiredText(record, "mime"), bytes: asBytes(record.data) };
}

export async function applyComplaintAction(
  user: SessionUser,
  id: string,
  input: { type: "status" | "note" | "respond" | "escalate" | "rotate_secret" | "assign"; status?: string; message?: string; note?: string; confirmedIdentity?: boolean; assigneeId?: string },
  appUrl: string,
): Promise<{ newSecret?: string }> {
  await ensureDatabase();
  if (input.type === "assign") {
    await assignComplaint(user, id, input.assigneeId || "");
    return {};
  }
  const detail = await getComplaintForUser(user, id);
  if (!canHandleComplaint(user)) {
    throw new HttpError(403, "This account can view the complaint but cannot change it.");
  }
  if (input.type === "note") {
    const note = input.note?.trim() ?? "";
    if (note.length < 3) throw new HttpError(400, "Write a short internal note.");
    if (note.length > 4000) throw new HttpError(400, "That note is too long.");
    await getClient().execute({
      sql: "INSERT INTO internal_notes (id, complaint_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [randomUUID(), id, user.id, note, new Date().toISOString()],
    });
    await audit({ actorId: user.id, action: "note_added", entity: "complaint", entityId: id });
    return {};
  }
  if (input.type === "rotate_secret") {
    if (detail.isAnonymous) throw new HttpError(400, "Keys for anonymous complaints cannot be reissued. The student must keep the original key.");
    if (!input.confirmedIdentity) throw new HttpError(400, "Confirm that you have verified the student's identity before issuing a new key.");
    const secret = generateSecret();
    await getClient().execute({
      sql: "UPDATE complaints SET secret_key_hash = ?, updated_at = ? WHERE id = ?",
      args: [hashSecret(secret), new Date().toISOString(), id],
    });
    await addEvent(id, user.id, "key_rotated", detail.status, detail.status, "A new tracking key was issued after identity was checked. The previous key no longer works.");
    await audit({ actorId: user.id, action: "secret_rotated", entity: "complaint", entityId: id });
    if (detail.studentEmail) {
      const message = studentEmail({
        trackingNumber: detail.trackingNumber,
        secretKey: secret,
        category: detail.category,
        dueAt: detail.dueAt,
        appUrl,
        harassment: detail.category === "harassment",
      });
      await deliverEmail({
        to: detail.studentEmail,
        subject: `New tracking key for ${detail.trackingNumber}`,
        text: `A staff member issued a new secret key after checking your identity. The old key no longer works.\n\n${message.text}`,
        complaintId: id,
      });
    }
    return { newSecret: secret };
  }
  if (input.type === "escalate") {
    if (detail.escalationLevel >= 2) throw new HttpError(400, "This complaint is already with the Vice Chancellor.");
    const level = detail.escalationLevel + 1;
    const now = new Date().toISOString();
    await getClient().execute({
      sql: "UPDATE complaints SET escalation_level = ?, status = 'escalated', updated_at = ?, acknowledged_at = COALESCE(acknowledged_at, ?) WHERE id = ?",
      args: [level, now, now, id],
    });
    const publicMessage =
      level >= 2
        ? "Your complaint has been escalated to the Vice Chancellor."
        : "Your complaint has been escalated to the Dean.";
    await addEvent(id, user.id, "escalation", detail.status, "escalated", publicMessage);
    await audit({ actorId: user.id, action: "escalated", entity: "complaint", entityId: id, meta: { level } });
    await emailParties({ ...detail, status: "escalated", escalationLevel: level }, appUrl, publicMessage, {
      notifyChair: false,
      notifyDean: true,
      notifyVc: level >= 2,
    });
    return {};
  }

  const message = input.message?.trim() ?? "";
  let nextStatus = detail.status;
  if (input.type === "status" || (input.type === "respond" && input.status)) {
    if (!input.status || !(STATUSES as readonly string[]).includes(input.status)) {
      throw new HttpError(400, "Choose a valid status.");
    }
    nextStatus = input.status;
  }
  if (input.type === "respond" && message.length < 10) throw new HttpError(400, "Write a response the student can read.");
  if (message.length > 4000) throw new HttpError(400, "That response is too long.");
  const now = new Date();
  const nowIso = now.toISOString();
  let appealDeadline = detail.appealDeadline;
  let resolvedAt = detail.resolvedAt;
  let dueAt = detail.dueAt;
  if ((nextStatus === "resolved" || nextStatus === "closed") && detail.status !== nextStatus) {
    resolvedAt = resolvedAt ?? nowIso;
    appealDeadline = appealDeadline ?? appealFilingDeadline(detail.slaProfile, now).toISOString();
  }
  if (nextStatus === "appealed" && detail.status !== "appealed") {
    dueAt = appealDecisionDue(detail.slaProfile, now).toISOString();
  }
  if ((nextStatus === "appeal_upheld" || nextStatus === "appeal_dismissed") && !resolvedAt) resolvedAt = nowIso;
  const acknowledgedAt =
    detail.acknowledgedAt || (nextStatus !== "submitted" && nextStatus !== "withdrawn" ? nowIso : null);
  await getClient().execute({
    sql: `UPDATE complaints
          SET status = ?, updated_at = ?, acknowledged_at = COALESCE(acknowledged_at, ?),
              resolved_at = ?, appeal_deadline = ?, due_at = ?
          WHERE id = ?`,
    args: [nextStatus, nowIso, acknowledgedAt, resolvedAt, appealDeadline, dueAt, id],
  });
  const publicMessage =
    message ||
    (nextStatus !== detail.status ? `Status changed to ${statusLabel(nextStatus)}.` : null);
  await addEvent(id, user.id, input.type === "respond" ? "response" : "status", detail.status, nextStatus, publicMessage);
  await audit({
    actorId: user.id,
    action: input.type === "respond" ? "response_sent" : "status_changed",
    entity: "complaint",
    entityId: id,
    meta: { from: detail.status, to: nextStatus },
  });
  if (message && detail.studentEmail && !detail.isAnonymous) {
    const mail = studentUpdateEmail({
      trackingNumber: detail.trackingNumber,
      statusLabel: statusLabel(nextStatus),
      message,
      appUrl,
    });
    await deliverEmail({ to: detail.studentEmail, subject: mail.subject, text: mail.text, complaintId: id });
  }
  return {};
}

async function addEvent(
  complaintId: string,
  actorId: string | null,
  eventType: string,
  fromStatus: string | null,
  toStatus: string | null,
  publicMessage: string | null,
): Promise<void> {
  await getClient().execute({
    sql: `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, from_status, to_status, public_message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [randomUUID(), complaintId, actorId, eventType, fromStatus, toStatus, publicMessage, new Date().toISOString()],
  });
}

async function emailParties(
  complaint: ComplaintRecord,
  appUrl: string,
  escalationNote: string,
  flags?: { notifyChair?: boolean; notifyDean?: boolean; notifyVc?: boolean },
): Promise<void> {
  const place = await loadPlace(complaint.facultyId, complaint.departmentId);
  const settings = await harassmentSettings();
  const recipients = buildRecipientList({
    category: complaint.category,
    chairEmail: place.chairEmail,
    deanEmail: place.deanEmail,
    focalEmail: settings.focalEmail,
    committeeEmail: settings.committeeEmail,
    vcEmail: settings.vcEmail,
    notifyChair: flags?.notifyChair ?? !complaint.concernsDepartmentHead,
    notifyDean: flags?.notifyDean ?? true,
    notifyVc: flags?.notifyVc ?? complaint.escalationLevel >= 2,
  });
  await notifyStaff(complaint, place, recipients, appUrl, escalationNote);
}

export async function exportComplaints(user: SessionUser, filters: ComplaintFilters): Promise<string> {
  const listed = await listComplaints(user, { ...filters, page: 1, pageSize: 100 });
  if (listed.total > 5000) throw new HttpError(400, "Narrow the filters before exporting. More than 5,000 rows matched.");
  const full = listed.total <= 100 ? listed : await listComplaints(user, { ...filters, page: 1, pageSize: listed.total });
  await audit({
    actorId: user.id,
    action: "complaints_exported",
    entity: "complaint",
    meta: { count: full.total, category: filters.category ?? null, status: filters.status ?? null },
  });
  const ids = full.items.map((item) => item.id);
  if (ids.length === 0) {
    return toCsv(["Tracking number"], []);
  }
  const marks = ids.map(() => "?").join(", ");
  const rows = await getClient().execute({
    sql: `SELECT c.*, f.name AS faculty_name, d.name AS department_name
          FROM complaints c JOIN faculties f ON f.id = c.faculty_id JOIN departments d ON d.id = c.department_id
          WHERE c.id IN (${marks}) ORDER BY c.created_at DESC`,
    args: ids,
  });
  const headers = [
    "Tracking number",
    "Created",
    "Status",
    "Category",
    "Harassment type",
    "Anonymous",
    "Faculty",
    "Department",
    "Programme",
    "Semester",
    "Subject",
    "Description",
    "Desired outcome",
    "Incident date",
    "Location",
    "Person complained about",
    "Student name",
    "Registration number",
    "Email",
    "Phone",
    "Escalation level",
    "Due",
    "Acknowledged",
    "Resolved",
    "Appeal deadline",
  ];
  const body = rows.rows.map((row) => {
    const record = row as SqlRow;
    const anonymous = flag(record, "is_anonymous");
    return [
      text(record, "tracking_number"),
      text(record, "created_at"),
      text(record, "status"),
      text(record, "category"),
      text(record, "harassment_type"),
      anonymous ? "yes" : "no",
      text(record, "faculty_name"),
      text(record, "department_name"),
      text(record, "programme"),
      text(record, "semester"),
      text(record, "subject"),
      text(record, "description"),
      text(record, "desired_outcome"),
      text(record, "incident_date"),
      text(record, "location"),
      text(record, "respondent_name"),
      anonymous ? "" : text(record, "student_name"),
      anonymous ? "" : text(record, "registration_number"),
      anonymous ? "" : text(record, "student_email"),
      anonymous ? "" : text(record, "student_phone"),
      integer(record, "escalation_level"),
      text(record, "due_at"),
      text(record, "acknowledged_at"),
      text(record, "resolved_at"),
      text(record, "appeal_deadline"),
    ];
  });
  return toCsv(headers, body);
}

export type DashboardData = {
  total: number;
  overdue: number;
  awaitingAck: number;
  byStatus: { key: string; label: string; count: number }[];
  byCategory: { key: string; label: string; count: number }[];
  byDepartment: { key: string; count: number }[];
  recent: ComplaintListItem[];
  placeholderContacts: number;
  mailFailures: number;
};

export async function getDashboard(user: SessionUser): Promise<DashboardData> {
  await ensureDatabase();
  const scope = scopeClause(user, "c");
  const db = getClient();
  const now = new Date().toISOString();
  const openMarks = OPEN_STATUSES.map(() => "?").join(", ");
  const total = await db.execute({ sql: `SELECT COUNT(*) AS n FROM complaints c WHERE ${scope.sql}`, args: scope.args });
  const byStatus = await db.execute({
    sql: `SELECT c.status AS key, COUNT(*) AS n FROM complaints c WHERE ${scope.sql} GROUP BY c.status`,
    args: scope.args,
  });
  const byCategory = await db.execute({
    sql: `SELECT c.category AS key, COUNT(*) AS n FROM complaints c WHERE ${scope.sql} GROUP BY c.category ORDER BY n DESC`,
    args: scope.args,
  });
  const byDepartment = await db.execute({
    sql: `SELECT d.name AS key, COUNT(*) AS n
          FROM complaints c JOIN departments d ON d.id = c.department_id
          WHERE ${scope.sql} GROUP BY d.id, d.name ORDER BY n DESC LIMIT 8`,
    args: scope.args,
  });
  const overdue = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM complaints c WHERE ${scope.sql} AND c.due_at < ? AND c.status IN (${openMarks})`,
    args: [...scope.args, now, ...OPEN_STATUSES],
  });
  const awaitingAck = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM complaints c WHERE ${scope.sql} AND c.status = 'submitted' AND c.ack_due_at < ?`,
    args: [...scope.args, now],
  });
  const recent = await listComplaints(user, { page: 1, pageSize: 6 });
  let placeholderContacts = 0;
  if (user.role === "vice_chancellor") {
    const faculties = await db.execute("SELECT COUNT(*) AS n FROM faculties WHERE email_is_placeholder = 1");
    const departments = await db.execute("SELECT COUNT(*) AS n FROM departments WHERE email_is_placeholder = 1");
    const settings = await harassmentSettings();
    placeholderContacts =
      Number(faculties.rows[0]?.n ?? 0) +
      Number(departments.rows[0]?.n ?? 0) +
      [settings.focalEmail, settings.committeeEmail, settings.vcEmail].filter((email) => isPlaceholderEmail(email)).length;
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const failures = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM mail_log WHERE status = 'failed' AND created_at >= ?",
    args: [since],
  });
  return {
    total: Number(total.rows[0]?.n ?? 0),
    overdue: Number(overdue.rows[0]?.n ?? 0),
    awaitingAck: Number(awaitingAck.rows[0]?.n ?? 0),
    byStatus: byStatus.rows.map((row) => ({
      key: String((row as SqlRow).key),
      label: statusLabel(String((row as SqlRow).key)),
      count: Number((row as SqlRow).n),
    })),
    byCategory: byCategory.rows.map((row) => ({
      key: String((row as SqlRow).key),
      label: categoryLabel(String((row as SqlRow).key)),
      count: Number((row as SqlRow).n),
    })),
    byDepartment: byDepartment.rows.map((row) => ({
      key: String((row as SqlRow).key),
      count: Number((row as SqlRow).n),
    })),
    recent: recent.items,
    placeholderContacts,
    mailFailures: user.role === "vice_chancellor" ? Number(failures.rows[0]?.n ?? 0) : 0,
  };
}

export function escalationLabel(level: number): string {
  if (level >= 2) return "Vice Chancellor";
  if (level === 1) return "Dean";
  return "Department";
}
