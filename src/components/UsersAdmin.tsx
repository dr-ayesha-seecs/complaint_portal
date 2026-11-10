"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FacultyContact } from "@/lib/view-types";
import { ROLE_LABELS, ROLES, type Role, type SessionUser } from "@/lib/rbac";

export function UsersAdmin({ users, directory }: { users: SessionUser[]; directory: FacultyContact[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const departments = useMemo(
    () => directory.find((item) => item.id === facultyId)?.departments ?? [],
    [directory, facultyId],
  );

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role,
        facultyId: facultyId || "",
        departmentId: String(form.get("departmentId") || ""),
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error || "The account could not be created.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    setError("");
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error || "The account could not be updated.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <div className="error-summary">{error}</div> : null}
      <form className="card fields" onSubmit={create}>
        <h2>New account</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Temporary password</label>
            <input id="password" name="password" type="text" required minLength={12} autoComplete="new-password" />
            <span className="hint">At least 12 characters, with upper case, lower case, and a number. Ask them to change it.</span>
          </div>
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="facultyId">Faculty</label>
            <select id="facultyId" value={facultyId} onChange={(event) => setFacultyId(event.target.value)}>
              <option value="">None</option>
              {directory.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="departmentId">Department</label>
            <select id="departmentId" name="departmentId" defaultValue="">
              <option value="">None</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn" type="submit">
          Create account
        </button>
      </form>
      <div className="table-wrap section">
        <table className="responsive">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>Reset password</th>
            </tr>
          </thead>
          <tbody>
            {users.map((account) => (
              <tr key={account.id}>
                <td data-label="Name">{account.name}</td>
                <td data-label="Email">{account.email}</td>
                <td data-label="Role">{ROLE_LABELS[account.role]}</td>
                <td data-label="Active">
                  <button className="btn small secondary" type="button" onClick={() => void patch(account.id, { active: !account.active })}>
                    {account.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
                <td data-label="Reset password">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const password = String(new FormData(event.currentTarget).get("password") || "");
                      void patch(account.id, { password });
                      event.currentTarget.reset();
                    }}
                  >
                    <input name="password" aria-label={`New password for ${account.name}`} type="text" minLength={12} required />
                    <button className="btn small" type="submit">
                      Set password
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
