import { redirect } from "next/navigation";
import { ContactsAdmin } from "@/components/ContactsAdmin";
import { listDirectory } from "@/lib/admin";
import { getCurrentUser } from "@/lib/current-user";
import { harassmentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "vice_chancellor") redirect("/dashboard");
  const [directory, harassment] = await Promise.all([listDirectory(), harassmentSettings()]);
  return (
    <>
      <h1>Department and dean contacts</h1>
      <p>Every new complaint is emailed to the chairperson of the department and the dean of the faculty. Harassment complaints are also emailed to the focal person and the committee below, when those addresses are real.</p>
      <ContactsAdmin directory={directory} harassment={harassment} />
    </>
  );
}
