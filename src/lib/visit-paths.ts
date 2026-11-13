export const PUBLIC_VISIT_PATHS = ["/", "/submit", "/track", "/procedure", "/privacy"] as const;
export type PublicVisitPath = (typeof PUBLIC_VISIT_PATHS)[number];

export function isPublicVisitPath(value: string): value is PublicVisitPath {
  return (PUBLIC_VISIT_PATHS as readonly string[]).includes(value);
}

/** Calendar date in Asia/Karachi, as YYYY-MM-DD. */
export function karachiDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
