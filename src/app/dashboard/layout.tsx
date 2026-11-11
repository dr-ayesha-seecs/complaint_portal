import Link from "next/link";
import { redirect } from "next/navigation";
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
      <header className="staff-bar">
        <div className="staff-inner">
          <div className="staff-meta">
            <div>
              <p className="brand-kicker">MNSUAM complaints desk</p>
              <strong>
                {user.name} · {ROLE_LABELS[user.role]}
              </strong>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="btn secondary" type="submit">
                Sign out
              </button>
            </form>
          </div>
          <nav className="nav" aria-label="Staff">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="content" className="wrap">
        {children}
      </main>
    </div>
  );
}
