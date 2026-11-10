import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboard } from "@/lib/complaints";
import { categoryLabel } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboard(user);
  const maxCategory = Math.max(1, ...data.byCategory.map((item) => item.count));
  return (
    <>
      <h1>Overview</h1>
      <p className="muted">Counts are limited to the complaints your role is allowed to see.</p>
      {data.placeholderContacts > 0 ? (
        <p className="banner warn">
          {data.placeholderContacts} contact addresses are still placeholders, so live email will skip them.{" "}
          <Link href="/dashboard/contacts">Update contacts</Link>.
        </p>
      ) : null}
      {data.mailFailures > 0 ? <p className="banner danger">{data.mailFailures} email messages failed in the last 7 days. Check the mail log in the database.</p> : null}
      <section className="stat-grid">
        <article className="card stat">
          <span className="muted">Complaints</span>
          <strong>{data.total}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Overdue</span>
          <strong>{data.overdue}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Acknowledgement overdue</span>
          <strong>{data.awaitingAck}</strong>
        </article>
        <article className="card stat">
          <span className="muted">Open categories</span>
          <strong>{data.byCategory.length}</strong>
        </article>
      </section>
      <div className="grid-2">
        <section className="card">
          <h2>By category</h2>
          <div className="bars">
            {data.byCategory.length === 0 ? <p className="muted">No complaints yet.</p> : null}
            {data.byCategory.map((item) => (
              <div className="bar-row" key={item.key}>
                <span>{item.label}</span>
                <div className="bar" aria-hidden="true">
                  <span style={{ width: `${Math.round((item.count / maxCategory) * 100)}%` }} />
                </div>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>By status</h2>
          <ul>
            {data.byStatus.map((item) => (
              <li key={item.key}>
                {item.label}: {item.count}
              </li>
            ))}
          </ul>
          <h2>By department</h2>
          <ul>
            {data.byDepartment.map((item) => (
              <li key={item.key}>
                {item.key}: {item.count}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="section">
        <h2>Latest complaints</h2>
        <div className="table-wrap">
          <table className="responsive">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Subject</th>
                <th>Department</th>
                <th>Status</th>
                <th>Filed</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((item) => (
                <tr key={item.id}>
                  <td data-label="Tracking">
                    <Link href={`/dashboard/complaints/${item.id}`}>{item.trackingNumber}</Link>
                  </td>
                  <td data-label="Subject">
                    {item.subject}
                    <span className="ur">{categoryLabel(item.category)}</span>
                  </td>
                  <td data-label="Department">{item.departmentName}</td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} overdue={item.overdue} />
                  </td>
                  <td data-label="Filed">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
