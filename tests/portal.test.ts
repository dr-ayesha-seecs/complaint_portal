import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { organisation } from "../src/data/organisation";
import { staffEmail } from "../src/lib/email-templates";
import { csvCell } from "../src/lib/csv";
import { isPlaceholderEmail } from "../src/lib/ids";
import { canAccessComplaint, canAssignComplaint, canHandleComplaint, canManageDirectory, canManageUsers, canViewAudit, canViewComplaints, scopeClause, type SessionUser } from "../src/lib/rbac";
import { buildRecipientList } from "../src/lib/routing";
import { addWorkingDays, computeSla, isOverdue } from "../src/lib/sla";
import { complaintSchema } from "../src/lib/validation";

const dbPath = path.join(process.cwd(), "data", "vitest.db");

const base = {
  category: "academic_teaching" as const,
  harassmentType: "" as const,
  anonymous: true,
  concernsDepartmentHead: false,
  facultyId: "foc",
  departmentId: "foc-aids",
  programme: "BS Artificial Intelligence",
  semester: "3" as const,
  subject: "Lecture materials were not provided",
  description: "The course outline promised weekly notes. None have been shared for six weeks and questions in class are dismissed.",
  desiredOutcome: "",
  incidentDate: "",
  location: "",
  respondentName: "",
  studentName: "",
  registrationNumber: "",
  studentEmail: "",
  studentPhone: "",
  confirmTruth: true,
  confirmPrivacy: true,
  confirmNonRetaliation: true,
  companyWebsite: "",
};

beforeAll(async () => {
  const { resetClient } = await import("../src/lib/db");
  await resetClient();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbPath + suffix, { force: true });
});

describe("standards helpers", () => {
  it("skips Saturday and Sunday in Pakistan", () => {
    const friday = new Date("2026-11-13T05:00:00.000Z");
    expect(addWorkingDays(friday, 1).toISOString()).toBe("2026-11-16T05:00:00.000Z");
  });

  it("uses a 30-day clock for harassment and 20 working days otherwise", () => {
    const start = new Date("2026-11-10T05:00:00.000Z");
    const harassment = computeSla("harassment", start);
    const standard = computeSla("academic_grading", start);
    expect(harassment.profile).toBe("harassment");
    expect(harassment.dueAt).toBe(new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
    expect(standard.profile).toBe("standard");
    expect(isOverdue(standard.dueAt, "resolved", new Date("2030-01-01T00:00:00.000Z"))).toBe(false);
    expect(isOverdue(standard.dueAt, "submitted", new Date("2030-01-01T00:00:00.000Z"))).toBe(true);
  });

  it("keeps department emails obviously fake", () => {
    const aids = organisation.find((faculty) => faculty.id === "foc")?.departments.find((dept) => dept.id === "foc-aids");
    expect(aids?.chairpersonName).toBe("Prof. Dr. Ayesha Hakim");
    expect(aids && isPlaceholderEmail(aids.chairpersonEmail)).toBe(true);
    expect(organisation.every((faculty) => isPlaceholderEmail(faculty.deanEmail))).toBe(true);
  });
});

describe("complaint validation", () => {
  it("allows an anonymous academic complaint", () => {
    expect(complaintSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an anonymous harassment complaint", () => {
    const parsed = complaintSchema.safeParse({ ...base, category: "harassment", anonymous: true, harassmentType: "sexual" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes("anonymous"))).toBe(true);
    }
  });

  it("requires the full identity for harassment", () => {
    const parsed = complaintSchema.safeParse({
      ...base,
      category: "harassment",
      anonymous: false,
      harassmentType: "sexual",
      studentName: "Test Student",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a complete harassment complaint", () => {
    const parsed = complaintSchema.safeParse({
      ...base,
      category: "harassment",
      anonymous: false,
      harassmentType: "sexual",
      studentName: "Test Student",
      registrationNumber: "2022-AI-014",
      studentEmail: "student@example.com",
      studentPhone: "03001234567",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("routing and access", () => {
  const chair: SessionUser = {
    id: "1",
    email: "chair@mnsuam.invalid",
    name: "Chair",
    role: "chairperson",
    facultyId: "foc",
    departmentId: "foc-aids",
    active: true,
  };
  const other: SessionUser = { ...chair, id: "2", departmentId: "foc-cs" };
  const central: SessionUser = { ...chair, id: "3", role: "staff", facultyId: null, departmentId: null };
  const focal: SessionUser = { ...chair, id: "4", role: "harassment_focal", facultyId: null, departmentId: null };

  it("limits chairpersons to their department and keeps harassment away from central staff", () => {
    const academic = { facultyId: "foc", departmentId: "foc-aids", category: "academic_teaching" };
    const harassment = { facultyId: "foc", departmentId: "foc-aids", category: "harassment" };
    expect(canAccessComplaint(chair, academic)).toBe(true);
    expect(canAccessComplaint(other, academic)).toBe(false);
    expect(canAccessComplaint(central, academic)).toBe(true);
    expect(canAccessComplaint(central, harassment)).toBe(false);
    expect(canAccessComplaint(focal, harassment)).toBe(true);
    expect(canAccessComplaint(focal, academic)).toBe(false);
    expect(scopeClause(other).sql).toContain("department_id");
  });

  it("does not copy the chairperson when the student flags a conflict, and adds the harassment route", () => {
    const recipients = buildRecipientList({
      category: "harassment",
      chairEmail: "placeholder+foc-aids-chair@mnsuam.invalid",
      deanEmail: "placeholder+foc-dean@mnsuam.invalid",
      focalEmail: "placeholder+harassment-focal@mnsuam.invalid",
      committeeEmail: "placeholder+harassment-committee@mnsuam.invalid",
      vcEmail: "placeholder+vice-chancellor@mnsuam.invalid",
      notifyChair: false,
      notifyVc: true,
    });
    expect(recipients.map((item) => item.role)).toEqual(["dean", "vice_chancellor", "harassment_focal", "harassment_committee"]);
    expect(recipients.every((item) => item.placeholder)).toBe(true);
  });

  it("keeps the harassment narrative out of the staff email", () => {
    const narrative = "UNIQUE_HARASSMENT_NARRATIVE_TOKEN_42 and the student's own words.";
    const message = staffEmail({
      role: "dean",
      trackingNumber: "MNS-2026-ABCDEFGH",
      category: "harassment",
      subject: "Confidential report",
      description: narrative,
      departmentName: "Department of Artificial Intelligence and Data Science",
      facultyName: "Faculty of Computing",
      anonymous: false,
      concernsDepartmentHead: false,
      dueAt: "2026-12-10T05:00:00.000Z",
      appUrl: "https://complaints.example",
    });
    expect(message.text).not.toContain(narrative);
    expect(message.text).not.toContain("Test Student");
    expect(message.subject).toContain("Confidential");
  });

  it("escapes CSV cells", () => {
    expect(csvCell('She said "no", then left')).toBe('"She said ""no"", then left"');
  });
});

describe("roles and assignments", () => {
  const admin: SessionUser = {
    id: "admin-1",
    email: "ayesha.hakim@mnsuam.edu.pk",
    name: "Admin",
    role: "admin",
    facultyId: null,
    departmentId: null,
    active: true,
  };
  const vc: SessionUser = { ...admin, id: "vc-1", email: "vc@mnsuam.edu.pk", name: "Vice Chancellor", role: "vice_chancellor" };
  const academic = { facultyId: "foc", departmentId: "foc-aids", category: "academic_teaching" };

  it("keeps administrators out of complaint files and gives them accounts and contacts", () => {
    expect(canAccessComplaint(admin, academic)).toBe(false);
    expect(canViewComplaints(admin)).toBe(false);
    expect(canHandleComplaint(admin)).toBe(false);
    expect(canAssignComplaint(admin)).toBe(false);
    expect(canManageDirectory(admin)).toBe(true);
    expect(canManageUsers(admin)).toBe(true);
    expect(canViewAudit(admin)).toBe(true);
    expect(scopeClause(admin).sql).toBe("0 = 1");
  });

  it("lets the Vice Chancellor read every complaint and assign, but not manage accounts", () => {
    expect(canAccessComplaint(vc, academic)).toBe(true);
    expect(canViewComplaints(vc)).toBe(true);
    expect(canHandleComplaint(vc)).toBe(false);
    expect(canAssignComplaint(vc)).toBe(true);
    expect(canManageDirectory(vc)).toBe(false);
    expect(canManageUsers(vc)).toBe(false);
    expect(canViewAudit(vc)).toBe(false);
    expect(scopeClause(vc).sql).toBe("1 = 1");
  });
});

describe("complaint flow", () => {
  it("stores an anonymous complaint, rejects anonymous harassment, and enforces access", async () => {
    const { submitComplaint, trackComplaint, getComplaintForUser } = await import("../src/lib/complaints");
    const { insertUser } = await import("../src/lib/auth");
    const { getClient } = await import("../src/lib/db");
    const { HttpError } = await import("../src/lib/http");

    const created = await submitComplaint(base, [], { ip: "127.0.0.1", appUrl: "http://localhost:3000" });
    expect(created.trackingNumber).toMatch(/^MNS-\d{4}-[A-Z2-9]{8}$/);
    const view = await trackComplaint(created.trackingNumber, created.secretKey, "127.0.0.1");
    expect(view.status).toBe("submitted");
    await expect(trackComplaint(created.trackingNumber, "WRONG-KEY1-XXXX", "10.0.0.8")).rejects.toBeInstanceOf(HttpError);

    await expect(
      submitComplaint(
        {
          ...base,
          category: "harassment",
          anonymous: true,
          harassmentType: "sexual",
          subject: "A harassment report that must not be anonymous",
          description: "This narrative must be rejected because the complainant tried to hide their identity.",
        },
        [],
        { ip: "127.0.0.2", appUrl: "http://localhost:3000" },
      ),
    ).rejects.toMatchObject({ status: 400 });

    const named = await submitComplaint(
      {
        ...base,
        category: "harassment",
        anonymous: false,
        harassmentType: "other",
        concernsDepartmentHead: true,
        studentName: "Test Student",
        registrationNumber: "2022-AI-014",
        studentEmail: "student@example.com",
        studentPhone: "0300-1234567",
        subject: "Harassment by a staff member",
        description: "UNIQUE_HARASSMENT_NARRATIVE_TOKEN_42 was included so the staff email can be checked.",
      },
      [{ filename: "notes.txt", bytes: new Uint8Array(Buffer.from("not a real pdf")) }],
      { ip: "127.0.0.3", appUrl: "http://localhost:3000" },
    ).catch((error: unknown) => error);
    expect(named).toBeInstanceOf(HttpError);

    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
    const harassment = await submitComplaint(
      {
        ...base,
        category: "harassment",
        anonymous: false,
        harassmentType: "sexual",
        concernsDepartmentHead: true,
        studentName: "Test Student",
        registrationNumber: "2022-AI-014",
        studentEmail: "student@example.com",
        studentPhone: "+92 300 1234567",
        subject: "Harassment by a staff member",
        description: "UNIQUE_HARASSMENT_NARRATIVE_TOKEN_42 was included so the staff email can be checked.",
      },
      [{ filename: "evidence.png", bytes: png }],
      { ip: "127.0.0.4", appUrl: "http://localhost:3000" },
    );
    const row = await getClient().execute({
      sql: "SELECT id, is_anonymous FROM complaints WHERE tracking_number = ?",
      args: [harassment.trackingNumber],
    });
    const complaintId = String(row.rows[0]?.id);
    expect(Number(row.rows[0]?.is_anonymous)).toBe(0);
    const mail = await getClient().execute({
      sql: "SELECT to_address, body FROM mail_log WHERE complaint_id = ?",
      args: [complaintId],
    });
    const addresses = mail.rows.map((item) => String(item.to_address));
    expect(addresses.some((address) => address.includes("aids-chair"))).toBe(false);
    expect(addresses.some((address) => address.includes("harassment-focal"))).toBe(true);
    expect(mail.rows.some((item) => String(item.body).includes("UNIQUE_HARASSMENT_NARRATIVE_TOKEN_42"))).toBe(false);

    const aidsChair = await insertUser({
      email: "chair.aids@mnsuam.invalid",
      name: "AI Chair",
      password: "ChangeMe_Now_12",
      role: "chairperson",
      facultyId: "foc",
      departmentId: "foc-aids",
    });
    const csChair = await insertUser({
      email: "chair.cs@mnsuam.invalid",
      name: "CS Chair",
      password: "ChangeMe_Now_12",
      role: "chairperson",
      facultyId: "foc",
      departmentId: "foc-cs",
    });
    const academicId = String(
      (
        await getClient().execute({
          sql: "SELECT id FROM complaints WHERE tracking_number = ?",
          args: [created.trackingNumber],
        })
      ).rows[0]?.id,
    );
    await expect(getComplaintForUser(csChair, academicId)).rejects.toMatchObject({ status: 404 });
    const visible = await getComplaintForUser(aidsChair, academicId);
    expect(visible.trackingNumber).toBe(created.trackingNumber);
    expect(visible.notes).toEqual([]);

    const vc = await insertUser({
      email: "vc.test@mnsuam.invalid",
      name: "Vice Chancellor",
      password: "ChangeMe_Now_12",
      role: "vice_chancellor",
      facultyId: null,
      departmentId: null,
    });
    const admin = await insertUser({
      email: "admin.test@mnsuam.invalid",
      name: "System Admin",
      password: "ChangeMe_Now_12",
      role: "admin",
      facultyId: null,
      departmentId: null,
    });
    await expect(getComplaintForUser(admin, academicId)).rejects.toMatchObject({ status: 404 });
    const { applyComplaintAction } = await import("../src/lib/complaints");
    await expect(applyComplaintAction(vc, academicId, { type: "status", status: "acknowledged" }, "http://localhost:3000")).rejects.toMatchObject({
      status: 403,
    });
    await applyComplaintAction(vc, academicId, { type: "assign", assigneeId: csChair.id }, "http://localhost:3000");
    const assigned = await getComplaintForUser(csChair, academicId);
    expect(assigned.trackingNumber).toBe(created.trackingNumber);
    expect(assigned.assignees.some((item) => item.id === csChair.id)).toBe(true);
  });
});
