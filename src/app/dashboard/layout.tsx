import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCurrentUser } from "@/lib/current-user";
import { canManageDirectory, canManageUsers, canViewAudit, canViewComplaints, ROLE_LABELS } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const links = [{ href: "/dashboard", label: "Overview" }];
  if (canViewComplaints(user)) links.push({ href: "/dashboard/complaints", label: "Complaints" });
  if (canManageDirectory(user)) links.push({ href: "/dashboard/contacts", label: "Contacts" });
  if (canManageUsers(user)) links.push({ href: "/dashboard/users", label: "Accounts" });
  if (canViewAudit(user)) links.push({ href: "/dashboard/audit", label: "Audit log" });
  links.push({ href: "/dashboard/account", label: "Password" });

  return (
    <div className="staff-shell">
      <SiteHeader links={links} brandHref="/dashboard">
        <span className="user-chip">
          <span className="chip-text">
            {user.name}
            <small>{ROLE_LABELS[user.role]}</small>
          </span>
        </span>
        <form action="/api/auth/logout" method="post">
          <button className="btn secondary small" type="submit">
            Sign out
          </button>
        </form>
      </SiteHeader>
      <main id="content" className="wrap">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
