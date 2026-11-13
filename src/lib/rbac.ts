import { isCommitteeCategory } from "./policy";

export const ROLES = ["admin", "vice_chancellor", "dean", "chairperson", "staff", "harassment_focal"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "System administrator",
  vice_chancellor: "Vice Chancellor",
  dean: "Dean",
  chairperson: "Chairperson",
  staff: "Complaints staff",
  harassment_focal: "Anti-bullying and harassment committee",
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  facultyId: string | null;
  departmentId: string | null;
  active: boolean;
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export type ScopedComplaint = {
  facultyId: string;
  departmentId: string;
  category: string;
};

export function assignmentError(
  role: Role,
  facultyId: string | null,
  departmentId: string | null,
  departmentFacultyId?: string | null,
): string | null {
  if (role === "admin" || role === "vice_chancellor" || role === "harassment_focal") {
    if (facultyId || departmentId) return "This role covers the whole university and is not tied to one faculty.";
    return null;
  }
  if (role === "dean") {
    if (!facultyId) return "A dean must be assigned to a faculty.";
    if (departmentId) return "Assign a dean to a faculty, not to a single department.";
    return null;
  }
  if (role === "chairperson") {
    if (!facultyId || !departmentId) return "A chairperson must be assigned to a faculty and a department.";
    if (departmentFacultyId && departmentFacultyId !== facultyId) return "That department is not in the selected faculty.";
    return null;
  }
  if (role === "staff") {
    if (departmentId && !facultyId) return "Select the faculty as well as the department.";
    if (departmentId && departmentFacultyId && departmentFacultyId !== facultyId) {
      return "That department is not in the selected faculty.";
    }
    return null;
  }
  return "Unknown role.";
}

/**
 * Central complaints staff (no faculty and no department) can work every file
 * except bullying, discrimination and harassment. Those files stay with the
 * Vice Chancellor, the relevant dean and chairperson, and the Committee of
 * Anti-Bullying and Harassment Monitoring.
 * System administrators do not see complaint contents. A user may also gain
 * access to one file if the Vice Chancellor assigns it to them.
 */
export function canAccessComplaint(user: SessionUser, complaint: ScopedComplaint): boolean {
  if (!user.active) return false;
  if (user.role === "admin") return false;
  if (user.role === "vice_chancellor") return true;
  if (user.role === "harassment_focal") return isCommitteeCategory(complaint.category);
  if (user.role === "dean") return Boolean(user.facultyId) && user.facultyId === complaint.facultyId;
  if (user.role === "chairperson") return Boolean(user.departmentId) && user.departmentId === complaint.departmentId;
  if (user.role === "staff") {
    if (user.departmentId) return user.departmentId === complaint.departmentId;
    if (user.facultyId) return user.facultyId === complaint.facultyId;
    return !isCommitteeCategory(complaint.category);
  }
  return false;
}

export function scopeClause(user: SessionUser, alias = "c"): { sql: string; args: string[] } {
  const column = (name: string) => `${alias}.${name}`;
  if (!user.active) return { sql: "0 = 1", args: [] };
  if (user.role === "admin") return { sql: "0 = 1", args: [] };
  if (user.role === "vice_chancellor") return { sql: "1 = 1", args: [] };

  let roleScope: { sql: string; args: string[] };
  if (user.role === "harassment_focal") roleScope = { sql: `${column("category")} IN ('harassment', 'discrimination', 'bullying_ragging')`, args: [] };
  else if (user.role === "dean") {
    if (!user.facultyId) return { sql: "0 = 1", args: [] };
    roleScope = { sql: `${column("faculty_id")} = ?`, args: [user.facultyId] };
  } else if (user.role === "chairperson") {
    if (!user.departmentId) return { sql: "0 = 1", args: [] };
    roleScope = { sql: `${column("department_id")} = ?`, args: [user.departmentId] };
  } else if (user.role === "staff") {
    if (user.departmentId) roleScope = { sql: `${column("department_id")} = ?`, args: [user.departmentId] };
    else if (user.facultyId) roleScope = { sql: `${column("faculty_id")} = ?`, args: [user.facultyId] };
    else roleScope = { sql: `${column("category")} NOT IN ('harassment', 'discrimination', 'bullying_ragging')`, args: [] };
  } else {
    return { sql: "0 = 1", args: [] };
  }

  return {
    sql: `(${roleScope.sql} OR EXISTS (SELECT 1 FROM complaint_assignments a WHERE a.complaint_id = ${alias}.id AND a.user_id = ?))`,
    args: [...roleScope.args, user.id],
  };
}

export function canManageDirectory(user: SessionUser): boolean {
  return user.active && user.role === "admin";
}

export function canManageUsers(user: SessionUser): boolean {
  return user.active && user.role === "admin";
}

export function canViewAudit(user: SessionUser): boolean {
  return user.active && user.role === "admin";
}

export function canViewComplaints(user: SessionUser): boolean {
  return user.active && user.role !== "admin";
}

export function canHandleComplaint(user: SessionUser): boolean {
  return user.active && user.role !== "admin" && user.role !== "vice_chancellor";
}

export function canAssignComplaint(user: SessionUser): boolean {
  return user.active && user.role === "vice_chancellor";
}

export function canViewVisitStats(user: SessionUser): boolean {
  return user.active && (user.role === "admin" || user.role === "vice_chancellor");
}
