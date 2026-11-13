import type { CategoryId } from "./categories";

import { isCommitteeCategory } from "./policy";

/**
 * Institutional timelines.
 *
 * Ordinary complaints use the portal's published service standards: a person
 * acknowledges the file within 2 working days, and a written outcome is due
 * within 20 working days (extendable with reasons).
 *
 * Bullying, discrimination and harassment files follow the investigation
 * timetable in the Anti-Discrimination-Anti-Harassment complaint procedure
 * used by the Committee of Anti-Bullying and Harassment Monitoring: a
 * prompt, thorough and impartial investigation, to be completed within
 * 45 days where possible, with notice to the complainant if that period
 * has to be extended; the relevant head of department confirms remedial
 * action to the dean or director within 14 days.
 *
 * Working days are Monday to Friday in Asia/Karachi. The university can record an
 * extension, but the portal flags the file as overdue once `dueAt` has passed.
 */
export const SLA = {
  standard: {
    humanAckWorkingDays: 2,
    resolutionWorkingDays: 20,
    extensionWorkingDays: 40,
    outerCalendarDays: 90,
    appealWindowWorkingDays: 10,
    appealDecisionWorkingDays: 15,
  },
  harassment: {
    inquiryCalendarDays: 45,
    implementationDays: 14,
    appealWindowCalendarDays: 30,
    appealDecisionCalendarDays: 30,
  },
} as const;

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function weekdayInKarachi(date: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "short",
  }).format(date);
  const day = WEEKDAY[label];
  if (day === undefined) throw new Error(`Unrecognised weekday: ${label}`);
  return day;
}

export function karachiYear(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", year: "numeric" }).format(date),
  );
}

export function todayKarachi(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function karachiStartIso(date: string): string {
  return new Date(`${date}T00:00:00+05:00`).toISOString();
}

export function karachiEndIso(date: string): string {
  return new Date(`${date}T23:59:59.999+05:00`).toISOString();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function addWorkingDays(start: Date, days: number): Date {
  const cursor = new Date(start.getTime());
  let added = 0;
  while (added < days) {
    cursor.setTime(cursor.getTime() + DAY_MS);
    const weekday = weekdayInKarachi(cursor);
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return cursor;
}

export function addCalendarDays(start: Date, days: number): Date {
  return new Date(start.getTime() + days * DAY_MS);
}

export type SlaProfile = "standard" | "harassment";

export type SlaClock = {
  profile: SlaProfile;
  ackDueAt: string;
  dueAt: string;
};

export function isHarassmentCategory(category: string): boolean {
  return isCommitteeCategory(category);
}

export function computeSla(category: string, createdAt: Date): SlaClock {
  if (isHarassmentCategory(category)) {
    return {
      profile: "harassment",
      ackDueAt: addWorkingDays(createdAt, SLA.standard.humanAckWorkingDays).toISOString(),
      dueAt: addCalendarDays(createdAt, SLA.harassment.inquiryCalendarDays).toISOString(),
    };
  }
  return {
    profile: "standard",
    ackDueAt: addWorkingDays(createdAt, SLA.standard.humanAckWorkingDays).toISOString(),
    dueAt: addWorkingDays(createdAt, SLA.standard.resolutionWorkingDays).toISOString(),
  };
}

export function appealFilingDeadline(profile: SlaProfile, decisionAt: Date): Date {
  if (profile === "harassment") return addCalendarDays(decisionAt, SLA.harassment.appealWindowCalendarDays);
  return addWorkingDays(decisionAt, SLA.standard.appealWindowWorkingDays);
}

export function appealDecisionDue(profile: SlaProfile, appealedAt: Date): Date {
  if (profile === "harassment") return addCalendarDays(appealedAt, SLA.harassment.appealDecisionCalendarDays);
  return addWorkingDays(appealedAt, SLA.standard.appealDecisionWorkingDays);
}

export function isOverdue(dueAt: string, status: string, now = new Date()): boolean {
  const open = [
    "submitted",
    "acknowledged",
    "under_review",
    "in_progress",
    "awaiting_student",
    "escalated",
    "appealed",
    "withdrawal_requested",
  ];
  if (!open.includes(status)) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

export function profileForCategory(category: CategoryId | string): SlaProfile {
  return isHarassmentCategory(category) ? "harassment" : "standard";
}
