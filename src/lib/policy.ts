/** Categories used in routing for bullying, discrimination and harassment files. */

export const REGISTRAR_ADDRESS = "Old Shujabad Road, Multan";
export const REGISTRAR_PHONE = "061-9201541";
export const REGISTRAR_EMAIL = "hr@mnsuam.edu.pk";

export const COMMITTEE_CATEGORIES = ["harassment", "discrimination", "bullying_ragging"] as const;

export function isCommitteeCategory(category: string): boolean {
  return (COMMITTEE_CATEGORIES as readonly string[]).includes(category);
}
