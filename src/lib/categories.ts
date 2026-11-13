export const CATEGORIES = [
  { id: "academic_teaching", en: "Academic — teaching and supervision", group: "Academic" },
  { id: "academic_grading", en: "Academic — grading and assessment", group: "Academic" },
  { id: "academic_exams", en: "Academic — examinations and results", group: "Academic" },
  { id: "admission", en: "Admission", group: "Academic" },
  { id: "administrative", en: "Administrative services", group: "Administration" },
  { id: "fee", en: "Fees", group: "Administration" },
  { id: "scholarship", en: "Scholarships and financial aid", group: "Administration" },
  { id: "finance", en: "Other finance matters", group: "Administration" },
  { id: "bribery", en: "Bribery or demand of unsolicited money", group: "Administration" },
  { id: "hostel", en: "Hostel and accommodation", group: "Campus life" },
  { id: "transport", en: "Transport", group: "Campus life" },
  { id: "library", en: "Library", group: "Facilities" },
  { id: "labs", en: "Laboratories", group: "Facilities" },
  { id: "it_services", en: "IT services", group: "Facilities" },
  { id: "facilities", en: "Campus facilities", group: "Facilities" },
  { id: "discrimination", en: "Discrimination", group: "Conduct" },
  { id: "bullying_ragging", en: "Bullying or ragging", group: "Conduct" },
  { id: "harassment", en: "Harassment, including sexual harassment", group: "Conduct" },
  { id: "safety_security", en: "Safety and security", group: "Conduct" },
  { id: "disability_access", en: "Disability and accessibility", group: "Conduct" },
  { id: "other", en: "Other", group: "Other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((item) => item.id) as [CategoryId, ...CategoryId[]];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((item) => item.id === id)?.en ?? id;
}
export const CATEGORY_HINTS: Partial<Record<CategoryId, string>> = {
  harassment:
    "Your full name, registration number, department, programme, email, and mobile number are required. Your name will remain strictly confidential. Retaliation for reporting is prohibited.",
  bullying_ragging:
    "Your name is required for verification and will remain strictly confidential. If someone is in immediate danger, contact campus security or the police before using this portal.",
  safety_security:
    "If you or someone else is in immediate danger, contact campus security or the police first. This portal is not an emergency service.",
  disability_access:
    "You can address this to Disability and Accessibility Coordination under University Administration, or to your own department. It may be escalated to the Vice Chancellor.",
  fee: "If you have a challan, bank receipt, or fee notice, attach a copy.",
  scholarship: "Name the scholarship and the semester in your description.",
  bribery: "Include dates, amounts, and who asked, as far as you know. Your name is required for verification and will remain strictly confidential.",
  academic_grading: "Give the course, the assessment, and what you believe should be reviewed. This is not a re-marking shortcut; it opens a recorded process.",
  academic_exams: "Include the course code, exam date, and result notification if you have them.",
};

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "summer", "not_applicable"] as const;
export type Semester = (typeof SEMESTERS)[number];

export function semesterLabel(value: string): string {
  if (value === "summer") return "Summer";
  if (value === "not_applicable") return "Not applicable";
  return `Semester ${value}`;
}

export const PROGRAMME_SUGGESTIONS = [
  "B.Sc. (Hons.) Agriculture",
  "B.Sc. (Hons.) Agronomy",
  "B.Sc. (Hons.) Horticulture",
  "B.Sc. (Hons.) Soil Science",
  "B.Sc. (Hons.) Food Science and Technology",
  "B.Sc. (Hons.) Human Nutrition and Dietetics",
  "B.Sc. (Hons.) Poultry Science",
  "BS Computer Science",
  "BS Information Technology",
  "BS Data Science",
  "BS Artificial Intelligence",
  "BS Zoology",
  "BS Public Health",
  "BBA Agribusiness",
  "DVM",
  "MBA",
  "M.Sc. (Hons.)",
  "MS Computer Science",
  "PhD",
];

export const STATUSES = [
  "submitted",
  "acknowledged",
  "under_review",
  "in_progress",
  "awaiting_student",
  "escalated",
  "resolved",
  "closed",
  "appealed",
  "appeal_upheld",
  "appeal_dismissed",
  "withdrawn",
  "withdrawal_requested",
] as const;

export type Status = (typeof STATUSES)[number];

export const OPEN_STATUSES: Status[] = [
  "submitted",
  "acknowledged",
  "under_review",
  "in_progress",
  "awaiting_student",
  "escalated",
  "appealed",
  "withdrawal_requested",
];

export const STATUS_LABELS: Record<Status, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  under_review: "Under review",
  in_progress: "In progress",
  awaiting_student: "Waiting for the student",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
  appealed: "Appeal in progress",
  appeal_upheld: "Appeal upheld",
  appeal_dismissed: "Appeal not upheld",
  withdrawn: "Withdrawn",
  withdrawal_requested: "Withdrawal requested",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

export function isOpenStatus(status: string): boolean {
  return (OPEN_STATUSES as string[]).includes(status);
}
