import { redirect } from "next/navigation";
import { UsersAdmin } from "@/components/UsersAdmin";
import { listDirectory } from "@/lib/admin";
import { listUsers } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { canManageUsers } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageUsers(user)) redirect("/dashboard");
  const [users, directory] = await Promise.all([listUsers(), listDirectory()]);
  return (
    <>
      <h1>Staff accounts</h1>
      <p>System administrators manage accounts and contacts and do not see complaint files. The Vice Chancellor can read every complaint and assign a file to an additional officer, but cannot change accounts or contacts. A dean is limited to one faculty, a chairperson to one department. Complaints staff follow the same boundary. A harassment focal person sees harassment files only. Central staff with no faculty do not see harassment files.</p>
      <UsersAdmin users={users} directory={directory} />
    </>
  );
}
