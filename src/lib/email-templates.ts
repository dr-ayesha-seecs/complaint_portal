import { categoryLabel } from "./categories";
import { isCommitteeCategory, COMMITTEE_NAME } from "./policy";
import { formatDateTime } from "./format";
import type { RecipientRole } from "./routing";
import { UNIVERSITY_NAME, UNIVERSITY_SHORT } from "./university";

const ROLE_LINE: Record<RecipientRole, string> = {
  chairperson: "You are receiving this because you are recorded as the chairperson of the department.",
  dean: "You are receiving this because you are recorded as the dean of the faculty.",
  harassment_focal: "You are receiving this as a contact for the Committee of Anti-Bullying and Harassment Monitoring.",
  harassment_committee: "You are receiving this as a contact for the Committee of Anti-Bullying and Harassment Monitoring.",
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
  if (isCommitteeCategory(input.category)) {
    const kind =
      input.category === "harassment"
        ? "Harassment"
        : input.category === "bullying_ragging"
          ? "Bullying or ragging"
          : "Discrimination";
    return {
      subject: `[Confidential] ${kind} complaint ${input.trackingNumber}`,
      text: [
        "CONFIDENTIAL — do not forward.",
        "",
        ROLE_LINE[input.role],
        "",
        `A ${kind.toLowerCase()} complaint has been filed with tracking number ${input.trackingNumber}.`,
        `Department: ${input.departmentName}`,
        `Faculty: ${input.facultyName}`,
        `Response due: ${formatDateTime(input.dueAt)} (Pakistan time)`,
        input.concernsDepartmentHead
          ? "The student indicated that the head of department is involved, so the chairperson was not copied."
          : "",
        input.escalationNote ?? "",
        "",
        "The complainant's identity and the narrative are visible only after you sign in to the portal.",
        `Handle this under the university's Anti-Bullying and Harassment Policy, through the ${COMMITTEE_NAME}. Aim to complete the investigation within 45 days where possible. Confirm remedial action to the dean or director within 14 days.`,
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
      `Filed: ${input.anonymous ? "without the student's name (historical file)" : "with the student's name on the file — keep confidential"}`,
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
        ? "This file is confidential. It will be referred to the Committee of Anti-Bullying and Harassment Monitoring. The university prohibits retaliation against you, against a witness, or against anyone associated with you. The investigation should be completed within 45 days where possible. If more time is needed, you will be told. You may ask the Registrar or the Vice Chancellor to review how the file was handled."
        : "The department and the dean have been notified. A member of staff should acknowledge the file within 2 working days, and the target for a written outcome is 20 working days. You may ask for the outcome to be reviewed within 10 working days.",
      "",
      "Making a complaint in good faith must not affect your studies, residence, grades, or employment at the university.",
      "",
      "If you are in immediate danger, contact campus security or the police. This mailbox is not an emergency service.",
      "",
      UNIVERSITY_NAME,
      "Old Shujabad Road, Multan",
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
