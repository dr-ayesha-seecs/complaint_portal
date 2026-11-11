"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Person = { id: string; name: string; email: string; role: string };
type Assignee = { id: string; name: string; email: string; role: string; assignedAt: string };

export function ComplaintAssign({
  complaintId,
  people,
  assignees,
}: {
  complaintId: string;
  people: Person[];
  assignees: Assignee[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  const assignedIds = new Set(assignees.map((item) => item.id));
  const options = people.filter((item) => !assignedIds.has(item.id));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setInfo("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "assign", assigneeId: form.get("assigneeId") }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(body?.error || "The assignment could not be saved.");
        return;
      }
      setInfo("The complaint was assigned.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setError("The assignment could not be saved. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section">
      <h2>Assign to another officer</h2>
      <p className="muted">This grants that person access to this complaint only. It is recorded in the audit log.</p>
      {assignees.length > 0 ? (
        <ul>
          {assignees.map((item) => (
            <li key={item.id}>
              {item.name} · {item.email}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No additional officers have been assigned yet.</p>
      )}
      <form className="card fields" onSubmit={onSubmit} style={{ marginTop: "0.8rem" }}>
        {error ? (
          <div className="error-summary" role="alert">
            {error}
          </div>
        ) : null}
        {info ? <div className="banner info">{info}</div> : null}
        <div className="field">
          <label htmlFor="assigneeId">Staff account</label>
          <select id="assigneeId" name="assigneeId" required disabled={options.length === 0}>
            <option value="">{options.length === 0 ? "No further accounts to assign" : "Choose a person"}</option>
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.email}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit" disabled={pending || options.length === 0}>
          {pending ? "Assigning…" : "Assign complaint"}
        </button>
      </form>
    </section>
  );
}
