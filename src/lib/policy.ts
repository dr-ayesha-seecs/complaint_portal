/** Official MNSUAM bodies and categories used on the public procedure and in routing. */

export const COMMITTEE_NAME = "Committee of Anti-Bullying and Harassment Monitoring";

export const COMMITTEE_MEMBERS = [
  {
    name: "Dr. Ayesha Hakim, Assistant Professor, Institute of Computing",
    role: "Convener",
  },
  {
    name: "Dr. Fawad Zafar Ahmad Khan, Assistant Professor, Department of Outreach and Continuing Education",
    role: "Member",
  },
  {
    name: "Dr. Nighat, Assistant Professor (Food Science and Technology), Director Student Affairs (Female), in the case of a student",
    role: "Member",
  },
  {
    name: "Mr. Muhammad Zakir Khan, Deputy Registrar (HR)",
    role: "Member",
  },
  {
    name: "Ms. Aimen Batool, Lecturer (English), Department of Outreach and Continuing Education",
    role: "Member/Secretary",
  },
] as const;

export const REGISTRAR_ADDRESS = "Old Shujabad Road, Multan";
export const REGISTRAR_PHONE = "061-9201541";
export const REGISTRAR_EMAIL = "hr@mnsuam.edu.pk";

export const COMMITTEE_CATEGORIES = ["harassment", "discrimination", "bullying_ragging"] as const;

export function isCommitteeCategory(category: string): boolean {
  return (COMMITTEE_CATEGORIES as readonly string[]).includes(category);
}
