import { redirect } from "next/navigation";
import { recentAudit } from "@/lib/admin";
import { getCurrentUser } from "@/lib/current-user";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "vice_chancellor") redirect("/dashboard");
  const rows = await recentAudit(200);
  return (
    <>
      <h1>Audit log</h1>
      <p className="muted">The latest 200 actions. Network addresses are stored as hashes.</p>
      <div className="table-wrap">
        <table className="responsive">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td data-label="When">{formatDateTime(row.createdAt)}</td>
                <td data-label="Who">{row.actorName || "Student or system"}</td>
                <td data-label="Action">{row.action.replaceAll("_", " ")}</td>
                <td data-label="Record">
                  {row.entity}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
