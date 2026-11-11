import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ComplaintActions } from "@/components/ComplaintActions";
import { ComplaintAssign } from "@/components/ComplaintAssign";
import { StatusBadge } from "@/components/StatusBadge";
import { getComplaintForUser, listAssignableUsers } from "@/lib/complaints";
import { categoryLabel, semesterLabel } from "@/lib/categories";
import { getCurrentUser } from "@/lib/current-user";
import { canAssignComplaint, canHandleComplaint } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { HttpError } from "@/lib/http";
import { formatBytes, formatDateTime } from "@/lib/format";
import { escalationLabel } from "@/lib/complaints";

export const dynamic = "force-dynamic";

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const complaint = await getComplaintForUser(user, id);
    await audit({ actorId: user.id, action: "complaint_viewed", entity: "complaint", entityId: id });
    return (
      <>
        <p>
          <Link href="/dashboard/complaints">All complaints</Link>
        </p>
        <h1>{complaint.subject}</h1>
        <p>
          <code>{complaint.trackingNumber}</code> · {categoryLabel(complaint.category)}
          {complaint.harassmentType ? ` · ${complaint.harassmentType === "sexual" ? "sexual harassment" : "other harassment"}` : ""}
        </p>
        <p>
          <StatusBadge status={complaint.status} overdue={complaint.overdue} /> · Handling level: {escalationLabel(complaint.escalationLevel)}
        </p>
        {complaint.category === "harassment" ? (
          <p className="banner danger">
            Confidential harassment file. Do not forward it. Retaliation against the student or a witness is prohibited. Handle it under the HEC 2020 policy and, where it applies, the 2010 Act.
          </p>
        ) : null}
        {complaint.concernsDepartmentHead ? (
          <p className="banner warn">The student said the head of department is involved. The chairperson was not notified.</p>
        ) : null}
        <section className="grid-2 section">
          <article className="card">
            <h2>Case</h2>
            <p>
              {complaint.facultyName}
              <br />
              {complaint.departmentName}
            </p>
            <p>
              {complaint.programme} · {semesterLabel(complaint.semester)}
            </p>
            <p>Filed: {formatDateTime(complaint.createdAt)}</p>
            <p>Acknowledgement due: {formatDateTime(complaint.ackDueAt)}</p>
            <p>Outcome due: {formatDateTime(complaint.dueAt)}</p>
            <p>Acknowledged: {formatDateTime(complaint.acknowledgedAt)}</p>
            <p>Resolved: {formatDateTime(complaint.resolvedAt)}</p>
            <p>Appeal window ends: {formatDateTime(complaint.appealDeadline)}</p>
            {complaint.incidentDate ? <p>Incident date: {complaint.incidentDate}</p> : null}
            {complaint.location ? <p>Location: {complaint.location}</p> : null}
            {complaint.respondentName ? <p>Complaint about: {complaint.respondentName}</p> : null}
          </article>
          <article className="card">
            <h2>Student</h2>
            {complaint.isAnonymous ? (
              <p>Anonymous. No name, registration number, or contact details were stored.</p>
            ) : (
              <>
                <p>{complaint.studentName}</p>
                <p>{complaint.registrationNumber || "No registration number"}</p>
                <p>{complaint.studentEmail || "No email"}</p>
                <p>{complaint.studentPhone || "No mobile number"}</p>
              </>
            )}
          </article>
        </section>
        <section className="card section">
          <h2>Description</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{complaint.description}</p>
          {complaint.desiredOutcome ? (
            <>
              <h3>Outcome requested</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{complaint.desiredOutcome}</p>
            </>
          ) : null}
        </section>
        <section className="section">
          <h2>Attachments</h2>
          {complaint.attachments.length === 0 ? <p className="muted">None.</p> : null}
          <ul>
            {complaint.attachments.map((file) => (
              <li key={file.id}>
                <a href={`/api/attachments/${file.id}`}>{file.filename}</a> · {formatBytes(file.size)}
              </li>
            ))}
          </ul>
        </section>
        <section className="section">
          <h2>What the student can see</h2>
          <ol className="timeline">
            {complaint.events.map((event) => (
              <li key={event.id}>
                <strong>{formatDateTime(event.createdAt)}</strong>
                {event.actorName ? ` · ${event.actorName}` : ""}
                {event.toStatus ? ` · ${event.toStatus.replaceAll("_", " ")}` : ""}
                {event.publicMessage ? <p>{event.publicMessage}</p> : null}
              </li>
            ))}
          </ol>
        </section>
        <section className="section">
          <h2>Internal notes</h2>
          {complaint.notes.length === 0 ? <p className="muted">No internal notes yet.</p> : null}
          <ul>
            {complaint.notes.map((note) => (
              <li key={note.id}>
                <strong>
                  {note.authorName} · {formatDateTime(note.createdAt)}
                </strong>
                <p style={{ whiteSpace: "pre-wrap" }}>{note.body}</p>
              </li>
            ))}
          </ul>
        </section>
        {canHandleComplaint(user) ? (
          <section className="section">
            <ComplaintActions
              id={complaint.id}
              status={complaint.status}
              anonymous={complaint.isAnonymous}
              hasEmail={Boolean(complaint.studentEmail)}
              escalationLevel={complaint.escalationLevel}
            />
          </section>
        ) : null}
        {canAssignComplaint(user) ? (
          <ComplaintAssign
            complaintId={complaint.id}
            people={await listAssignableUsers(user)}
            assignees={complaint.assignees}
          />
        ) : complaint.assignees.length > 0 ? (
          <section className="section">
            <h2>Assigned officers</h2>
            <ul>
              {complaint.assignees.map((item) => (
                <li key={item.id}>
                  {item.name} · {item.email}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </>
    );
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
}
