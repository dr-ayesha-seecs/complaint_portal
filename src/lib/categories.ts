export const CATEGORIES = [
  { id: "academic_teaching", en: "Academic — teaching and supervision", ur: "تدریس و نگرانی", group: "Academic" },
  { id: "academic_grading", en: "Academic — grading and assessment", ur: "گریڈنگ اور تشخیص", group: "Academic" },
  { id: "academic_exams", en: "Academic — examinations and results", ur: "امتحانات اور نتائج", group: "Academic" },
  { id: "admission", en: "Admission", ur: "داخلہ", group: "Academic" },
  { id: "administrative", en: "Administrative services", ur: "انتظامی امور", group: "Administration" },
  { id: "fee", en: "Fees", ur: "فیس", group: "Administration" },
  { id: "scholarship", en: "Scholarships and financial aid", ur: "وظائف و مالی امداد", group: "Administration" },
  { id: "finance", en: "Other finance matters", ur: "دیگر مالی امور", group: "Administration" },
  { id: "bribery", en: "Bribery or demand of unsolicited money", ur: "رشوت یا ناجائز رقم کا مطالبہ", group: "Administration" },
  { id: "hostel", en: "Hostel and accommodation", ur: "ہاسٹل و رہائش", group: "Campus life" },
  { id: "transport", en: "Transport", ur: "ٹرانسپورٹ", group: "Campus life" },
  { id: "library", en: "Library", ur: "لائبریری", group: "Facilities" },
  { id: "labs", en: "Laboratories", ur: "لیبارٹریز", group: "Facilities" },
  { id: "it_services", en: "IT services", ur: "آئی ٹی خدمات", group: "Facilities" },
  { id: "facilities", en: "Campus facilities", ur: "کیمپس سہولیات", group: "Facilities" },
  { id: "discrimination", en: "Discrimination", ur: "امتیازی سلوک", group: "Conduct" },
  { id: "bullying_ragging", en: "Bullying or ragging", ur: "غنڈہ گردی یا رگنگ", group: "Conduct" },
  { id: "harassment", en: "Harassment, including sexual harassment", ur: "ہراسانی، بشمول جنسی ہراسانی", group: "Conduct" },
  { id: "safety_security", en: "Safety and security", ur: "حفاظت و سلامتی", group: "Conduct" },
  { id: "disability_access", en: "Disability and accessibility", ur: "معذوری اور رسائی", group: "Conduct" },
  { id: "other", en: "Other", ur: "دیگر", group: "Other" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((item) => item.id) as [CategoryId, ...CategoryId[]];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((item) => item.id === id)?.en ?? id;
}

export function categoryLabelUr(id: string): string {
  return CATEGORIES.find((item) => item.id === id)?.ur ?? "";
}

export const CATEGORY_HINTS: Partial<Record<CategoryId, string>> = {
  harassment:
    "Harassment complaints cannot be anonymous. Your full name, registration number, department, programme, email, and mobile number are required. The file is confidential. Retaliation for reporting is prohibited.",
  bullying_ragging:
    "You may file this without your name. If someone is in immediate danger, contact campus security or the police before using this portal.",
  safety_security:
    "If you or someone else is in immediate danger, contact campus security or the police first. This portal is not an emergency service.",
  disability_access:
    "You can address this to Disability and Accessibility Coordination under University Administration, or to your own department. It may be escalated to the Vice Chancellor.",
  fee: "If you have a challan, bank receipt, or fee notice, attach a copy.",
  scholarship: "Name the scholarship and the semester in your description.",
  bribery: "Include dates, amounts, and who asked, as far as you know. You may file this without your name.",
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

export const STATUS_LABELS: Record<Status, { en: string; ur: string }> = {
  submitted: { en: "Submitted", ur: "جمع ہو گئی" },
  acknowledged: { en: "Acknowledged", ur: "وصولی تسلیم" },
  under_review: { en: "Under review", ur: "زیر جائزہ" },
  in_progress: { en: "In progress", ur: "جاری" },
  awaiting_student: { en: "Waiting for the student", ur: "طالب علم کے جواب کا انتظار" },
  escalated: { en: "Escalated", ur: "اعلیٰ سطح پر بھیج دی گئی" },
  resolved: { en: "Resolved", ur: "حل ہو گئی" },
  closed: { en: "Closed", ur: "بند" },
  appealed: { en: "Appeal in progress", ur: "اپیل زیر سماعت" },
  appeal_upheld: { en: "Appeal upheld", ur: "اپیل منظور" },
  appeal_dismissed: { en: "Appeal not upheld", ur: "اپیل مسترد" },
  withdrawn: { en: "Withdrawn", ur: "واپس لے لی گئی" },
  withdrawal_requested: { en: "Withdrawal requested", ur: "واپسی کی درخواست" },
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as Status]?.en ?? status;
}

export function isOpenStatus(status: string): boolean {
  return (OPEN_STATUSES as string[]).includes(status);
}
