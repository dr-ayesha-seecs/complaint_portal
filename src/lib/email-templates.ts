import { categoryLabel } from "./categories";
import { formatDateTime } from "./format";
import type { RecipientRole } from "./routing";
import { UNIVERSITY_NAME, UNIVERSITY_SHORT } from "./university";

const ROLE_LINE: Record<RecipientRole, string> = {
  chairperson: "You are receiving this because you are recorded as the chairperson of the department.",
  dean: "You are receiving this because you are recorded as the dean of the faculty.",
  harassment_focal: "You are receiving this as a harassment focal person for the university.",
  harassment_committee: "You are receiving this as the harassment inquiry committee contact.",
  vice_chancellor: "You are receiving this because the complaint has been escalated to the Vice Chancellor.",
};

export function staffEmail(input: {
  role: RecipientRole;
  trackingNumber: string;
  category: string;
  subject: string;
  description: string;
  departmentName: string;
  facultyName: string;
  anonymous: boolean;
  concernsDepartmentHead: boolean;
  dueAt: string;
  appUrl: string;
  escalationNote?: string;
}): { subject: string; text: string } {
  const link = `${input.appUrl}/dashboard/complaints`;
  if (input.category === "harassment") {
    return {
      subject: `[Confidential] Harassment complaint ${input.trackingNumber}`,
      text: [
        "CONFIDENTIAL — do not forward.",
        "",
        ROLE_LINE[input.role],
        "",
        `A harassment complaint has been filed with tracking number ${input.trackingNumber}.`,
        `Department: ${input.departmentName}`,
        `Faculty: ${input.facultyName}`,
        `Response due: ${formatDateTime(input.dueAt)} (Pakistan time)`,
        input.concernsDepartmentHead
          ? "The student indicated that the head of department is involved, so the chairperson was not copied."
          : "",
        input.escalationNote ?? "",
        "",
        "The complainant's identity and the narrative are visible only after you sign in to the portal.",
        "Handle this under the HEC Policy on Protection Against Sexual Harassment (2020) and, where it applies, the Protection against Harassment of Women at the Workplace Act, 2010.",
        "Retaliation against the complainant or a witness is prohibited.",
        "",
        `Sign in: ${input.appUrl}/login`,
        `Complaint desk: ${link}`,
        "",
        UNIVERSITY_NAME,
        "Students Complaints Portal",
      ]
        .filter((line) => line !== "")
        .join("\n"),
    };
  }

  const excerpt = input.description.length > 500 ? `${input.description.slice(0, 500)}…` : input.description;
  return {
    subject: `Student complaint ${input.trackingNumber} — ${categoryLabel(input.category)}`,
    text: [
      ROLE_LINE[input.role],
      "",
      `Tracking number: ${input.trackingNumber}`,
      `Category: ${categoryLabel(input.category)}`,
      `Faculty: ${input.facultyName}`,
      `Department: ${input.departmentName}`,
      `Subject: ${input.subject}`,
      `Filed: ${input.anonymous ? "without the student's name" : "with contact details on the file"}`,
      `Response due: ${formatDateTime(input.dueAt)} (Pakistan time)`,
      input.concernsDepartmentHead
        ? "The student indicated that the head of department is involved, so the chairperson was not copied."
        : "",
      input.escalationNote ?? "",
      "",
      "Summary:",
      excerpt,
      "",
      "Please sign in for the full file, attachments, and to record a response.",
      `Sign in: ${input.appUrl}/login`,
      "",
      "Keep this message limited to staff who need it to deal with the complaint.",
      "",
      UNIVERSITY_NAME,
      "Students Complaints Portal",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  };
}

export function studentEmail(input: {
  trackingNumber: string;
  secretKey: string;
  category: string;
  dueAt: string;
  appUrl: string;
  harassment: boolean;
}): { subject: string; text: string } {
  return {
    subject: `${UNIVERSITY_SHORT} complaint received — ${input.trackingNumber}`,
    text: [
      `Your complaint has been received by ${UNIVERSITY_NAME}.`,
      "",
      `Tracking number: ${input.trackingNumber}`,
      `Secret key: ${input.secretKey}`,
      "",
      "Keep both. Anyone who has the tracking number and the key can see the status of this complaint.",
      `Track it at: ${input.appUrl}/track`,
      "",
      `Category: ${categoryLabel(input.category)}`,
      `Target response date: ${formatDateTime(input.dueAt)} (Pakistan time)`,
      "",
      input.harassment
        ? "This file is confidential. It will be referred to the harassment focal person and inquiry route. The university prohibits retaliation for making this complaint. An inquiry recommendation is due within 30 days. You may appeal within 30 days of the outcome."
        : "The department and the dean have been notified. A member of staff should acknowledge the file within 2 working days, and the target for a written outcome is 20 working days. You may appeal within 10 working days of the outcome.",
      "",
      "Making a complaint in good faith must not affect your studies, residence, grades, or employment at the university.",
      "",
      "If you are in immediate danger, contact campus security or the police. This mailbox is not an emergency service.",
      "",
      UNIVERSITY_NAME,
      "University Road, Multan",
    ].join("\n"),
  };
}

export function studentUpdateEmail(input: {
  trackingNumber: string;
  statusLabel: string;
  message: string;
  appUrl: string;
}): { subject: string; text: string } {
  return {
    subject: `Update on complaint ${input.trackingNumber}`,
    text: [
      `There is an update on complaint ${input.trackingNumber}.`,
      `Status: ${input.statusLabel}`,
      "",
      input.message,
      "",
      `Track the complaint with your tracking number and secret key: ${input.appUrl}/track`,
      "",
      UNIVERSITY_NAME,
    ].join("\n"),
  };
}
