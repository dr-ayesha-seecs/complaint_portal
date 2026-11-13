"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FacultyContact } from "@/lib/view-types";

type Harassment = { focalName: string; focalEmail: string; committeeEmail: string; vcEmail: string };

export function ContactsAdmin({ directory, harassment }: { directory: FacultyContact[]; harassment: Harassment }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(payload: Record<string, string>) {
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(body?.error || "The contact could not be saved.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <div>
      {error ? <div className="error-summary">{error}</div> : null}
      {message ? <div className="banner info">{message}</div> : null}
      <p className="banner warn">
        Addresses containing “placeholder” or ending in .invalid are not delivered once SMTP or Resend is turned on. Replace them with real office mailboxes. Do not invent a personal address.
      </p>
      <form
        className="card fields"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void save({
            action: "harassment",
            focalName: String(form.get("focalName") || ""),
            focalEmail: String(form.get("focalEmail") || ""),
            committeeEmail: String(form.get("committeeEmail") || ""),
            vcEmail: String(form.get("vcEmail") || ""),
          });
        }}
      >
        <h2>Harassment route and Vice Chancellor notices</h2>
        <div className="field">
          <label htmlFor="focalName">Focal person name</label>
          <input id="focalName" name="focalName" defaultValue={harassment.focalName} required />
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="focalEmail">Focal person email</label>
            <input id="focalEmail" name="focalEmail" type="email" defaultValue={harassment.focalEmail} required />
          </div>
          <div className="field">
            <label htmlFor="committeeEmail">Inquiry committee email</label>
            <input id="committeeEmail" name="committeeEmail" type="email" defaultValue={harassment.committeeEmail} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="vcEmail">Vice Chancellor notification email</label>
          <input id="vcEmail" name="vcEmail" type="email" defaultValue={harassment.vcEmail} required />
        </div>
        <button className="btn" type="submit">
          Save harassment contacts
        </button>
      </form>

      {directory.map((faculty) => (
        <section className="section" key={faculty.id}>
          <h2>{faculty.name}</h2>
          <form
            className="card grid-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void save({
                action: "faculty",
                id: faculty.id,
                deanName: String(form.get("deanName") || ""),
                deanEmail: String(form.get("deanEmail") || ""),
              });
            }}
          >
            <div className="field">
              <label htmlFor={`dean-name-${faculty.id}`}>Dean or office</label>
              <input id={`dean-name-${faculty.id}`} name="deanName" defaultValue={faculty.deanName} required />
            </div>
            <div className="field">
              <label htmlFor={`dean-email-${faculty.id}`}>Dean email {faculty.emailIsPlaceholder ? "(placeholder)" : ""}</label>
              <input id={`dean-email-${faculty.id}`} name="deanEmail" type="email" defaultValue={faculty.deanEmail} required />
            </div>
            <button className="btn small" type="submit">
              Save dean
            </button>
          </form>
          {faculty.departments.map((department) => (
            <form
              key={department.id}
              className="card grid-2"
              style={{ marginTop: "0.6rem" }}
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void save({
                  action: "department",
                  id: department.id,
                  chairpersonName: String(form.get("chairpersonName") || ""),
                  chairpersonEmail: String(form.get("chairpersonEmail") || ""),
                });
              }}
            >
              <strong>{department.name}</strong>
              <span />
              <div className="field">
                <label htmlFor={`chair-name-${department.id}`}>Chairperson or office</label>
                <input id={`chair-name-${department.id}`} name="chairpersonName" defaultValue={department.chairpersonName} required />
              </div>
              <div className="field">
                <label htmlFor={`chair-email-${department.id}`}>
                  Email {department.emailIsPlaceholder ? "(placeholder)" : ""}
                </label>
                <input id={`chair-email-${department.id}`} name="chairpersonEmail" type="email" defaultValue={department.chairpersonEmail} required />
              </div>
              <button className="btn small secondary" type="submit">
                Save department
              </button>
            </form>
          ))}
          <form
            className="card fields"
            style={{ marginTop: "0.6rem" }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void save({
                action: "add-department",
                facultyId: faculty.id,
                name: String(form.get("name") || ""),
                chairpersonName: String(form.get("chairpersonName") || ""),
                chairpersonEmail: String(form.get("chairpersonEmail") || ""),
              });
              event.currentTarget.reset();
            }}
          >
            <h3>Add a department</h3>
            <div className="grid-2">
              <input name="name" aria-label="New department name" placeholder="Department name" required />
              <input name="chairpersonName" aria-label="Chairperson name" placeholder="Chairperson or office" required />
              <input name="chairpersonEmail" aria-label="Chairperson email" type="email" placeholder="placeholder+unit-chair@mnsuam.invalid" required />
            </div>
            <button className="btn secondary" type="submit">
              Add department
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
