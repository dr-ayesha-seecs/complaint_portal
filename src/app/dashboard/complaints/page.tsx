import { isCommitteeCategory } from "@/lib/policy";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExportButton } from "@/components/ExportButton";
import { StatusBadge } from "@/components/StatusBadge";
import { listDirectory } from "@/lib/admin";
import { CATEGORIES, STATUSES, categoryLabel, statusLabel } from "@/lib/categories";
import { listComplaints } from "@/lib/complaints";
import { getCurrentUser } from "@/lib/current-user";
import { canViewComplaints } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewComplaints(user)) redirect("/dashboard");
  const params = await searchParams;
  const filters = {
    q: one(params.q),
    category: one(params.category),
    status: one(params.status),
    facultyId: one(params.facultyId),
    departmentId: one(params.departmentId),
    overdue: one(params.overdue) === "1",
    from: one(params.from),
    to: one(params.to),
    page: Number(one(params.page) || 1),
  };
  const result = await listComplaints(user, filters);
  const directory = await listDirectory();
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (key === "page" || key === "overdue") continue;
    if (value) query.set(key, String(value));
  }
  if (filters.overdue) query.set("overdue", "1");

  return (
    <>
      <h1>Complaints</h1>
      <form className="filters" method="get">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Tracking number, name, subject" />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={filters.category}>
            <option value="">All</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.en}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={filters.status}>
            <option value="">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="facultyId">Faculty</label>
          <select id="facultyId" name="facultyId" defaultValue={filters.facultyId}>
            <option value="">All</option>
            {directory.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="departmentId">Department</label>
          <select id="departmentId" name="departmentId" defaultValue={filters.departmentId}>
            <option value="">All</option>
            {directory.flatMap((faculty) =>
              faculty.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              )),
            )}
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={filters.from} />
        </div>
        <div className="field">
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <label className="check">
          <input type="checkbox" name="overdue" value="1" defaultChecked={filters.overdue} />
          <span>Overdue only</span>
        </label>
        <button className="btn" type="submit">
          Apply filters
        </button>
      </form>
      <div className="actions">
        <ExportButton
          filters={{
            q: filters.q || undefined,
            category: filters.category || undefined,
            status: filters.status || undefined,
            facultyId: filters.facultyId || undefined,
            departmentId: filters.departmentId || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
            overdue: filters.overdue || undefined,
          }}
        />
        <Link href="/dashboard/complaints">Clear</Link>
      </div>
      <p className="muted">
        {result.total} complaint{result.total === 1 ? "" : "s"}
      </p>
      <div className="table-wrap">
        <table className="responsive">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Subject</th>
              <th>Where</th>
              <th>Student</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id}>
                <td data-label="Tracking">
                  <Link href={`/dashboard/complaints/${item.id}`}>{item.trackingNumber}</Link>
                  {isCommitteeCategory(item.category) ? <span className="sub">Confidential</span> : null}
                </td>
                <td data-label="Subject">
                  {item.subject}
                  <span className="sub">{categoryLabel(item.category)}</span>
                </td>
                <td data-label="Where">
                  {item.departmentName}
                  <span className="sub">{item.facultyName}</span>
                </td>
                <td data-label="Student">{item.isAnonymous ? "Anonymous" : item.studentName || "Named"}</td>
                <td data-label="Status">
                  <StatusBadge status={item.status} overdue={item.overdue} />
                </td>
                <td data-label="Due">{formatDateTime(item.dueAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.items.length === 0 ? <p>No complaints match these filters.</p> : null}
      <p className="section">
        Page {result.page} of {pages}.{" "}
        {result.page > 1 ? <Link href={`/dashboard/complaints?${query.toString()}&page=${result.page - 1}`}>Previous</Link> : null}{" "}
        {result.page < pages ? <Link href={`/dashboard/complaints?${query.toString()}&page=${result.page + 1}`}>Next</Link> : null}
      </p>
    </>
  );
}
