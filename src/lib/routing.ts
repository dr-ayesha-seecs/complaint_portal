import { isCommitteeCategory } from "./policy";
import { isPlaceholderEmail } from "./ids";

export type RecipientRole = "chairperson" | "dean" | "harassment_focal" | "harassment_committee" | "vice_chancellor";

export type Recipient = {
  email: string;
  role: RecipientRole;
  placeholder: boolean;
};

export function buildRecipientList(input: {
  category: string;
  chairEmail?: string | null;
  deanEmail?: string | null;
  focalEmail?: string | null;
  committeeEmail?: string | null;
  vcEmail?: string | null;
  notifyChair?: boolean;
  notifyDean?: boolean;
  notifyVc?: boolean;
}): Recipient[] {
  const list: Recipient[] = [];
  const push = (email: string | null | undefined, role: RecipientRole) => {
    const trimmed = email?.trim();
    if (!trimmed) return;
    if (list.some((item) => item.email.toLowerCase() === trimmed.toLowerCase())) return;
    list.push({ email: trimmed, role, placeholder: isPlaceholderEmail(trimmed) });
  };

  if (input.notifyChair) push(input.chairEmail, "chairperson");
  if (input.notifyDean !== false) push(input.deanEmail, "dean");
  if (input.notifyVc) push(input.vcEmail, "vice_chancellor");
  if (isCommitteeCategory(input.category)) {
    push(input.focalEmail, "harassment_focal");
    push(input.committeeEmail, "harassment_committee");
  }
  return list;
}
