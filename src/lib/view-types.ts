export type DepartmentContact = {
  id: string;
  facultyId: string;
  name: string;
  nameUr: string;
  chairpersonName: string;
  chairpersonEmail: string;
  emailIsPlaceholder: boolean;
};

export type FacultyContact = {
  id: string;
  name: string;
  nameUr: string;
  deanName: string;
  deanEmail: string;
  emailIsPlaceholder: boolean;
  departments: DepartmentContact[];
};

export type ComplaintFilters = {
  q?: string;
  category?: string;
  status?: string;
  facultyId?: string;
  departmentId?: string;
  overdue?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PublicEvent = {
  id: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  publicMessage: string | null;
  createdAt: string;
  actorName: string | null;
};

export type StudentView = {
  trackingNumber: string;
  category: string;
  categoryLabel: string;
  harassmentType: string | null;
  status: string;
  statusLabel: string;
  anonymous: boolean;
  subject: string;
  programme: string;
  semester: string;
  facultyName: string;
  departmentName: string;
  createdAt: string;
  dueAt: string;
  appealDeadline: string | null;
  overdue: boolean;
  studentName: string | null;
  events: PublicEvent[];
  canAppeal: boolean;
  canWithdraw: boolean;
};
