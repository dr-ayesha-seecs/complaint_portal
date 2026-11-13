"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES, statusLabel } from "@/lib/categories";

export function ComplaintActions({
  id,
  status,
  anonymous,
  hasEmail,
  escalationLevel,
}: {
  id: string;
  status: string;
  anonymous: boolean;
  hasEmail: boolean;
  escalationLevel: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState(false);

  async function send(payload: Record<string, unknown>) {
    setPending(true);
    setError("");
    setInfo("");
    const response = await fetch(`/api/complaints/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { error?: string; newSecret?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "The action could not be saved.");
      return;
    }
    if (body?.newSecret) setSecret(body.newSecret);
    setInfo("Saved.");
    router.refresh();
  }

  return (
    <div className="grid-2">
      <form
        className="card fields"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void send({ type: "status", status: form.get("status"), message: form.get("message") });
        }}
      >
        <h2>Update status</h2>
        {error ? <div className="error-summary">{error}</div> : null}
        {info ? <div className="banner info">{info}</div> : null}
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="message">Message the student can see (optional)</label>
          <textarea id="message" name="message" />
        </div>
        {!hasEmail || anonymous ? <p className="hint">There is no email on the file. The student will see a message only when they track the complaint.</p> : null}
        <button className="btn" disabled={pending} type="submit">
          Save status
        </button>
      </form>

      <form
        className="card fields"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void send({ type: "respond", status: form.get("responseStatus"), message: form.get("response") });
        }}
      >
        <h2>Send a response</h2>
        <div className="field">
          <label htmlFor="response">Response</label>
          <textarea id="response" name="response" required minLength={10} />
        </div>
        <div className="field">
          <label htmlFor="responseStatus">Also set status</label>
          <select id="responseStatus" name="responseStatus" defaultValue={status}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" disabled={pending} type="submit">
          Send response
        </button>
      </form>

      <form
        className="card fields"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void send({ type: "note", note: form.get("note") });
          event.currentTarget.reset();
        }}
      >
        <h2>Internal note</h2>
        <p className="hint">Students never see internal notes.</p>
        <div className="field">
          <label htmlFor="note">Note</label>
          <textarea id="note" name="note" required minLength={3} />
        </div>
        <button className="btn secondary" disabled={pending} type="submit">
          Add note
        </button>
      </form>

      <div className="card">
        <h2>Escalation and key</h2>
        <p>Current level: {escalationLevel === 0 ? "Department" : escalationLevel === 1 ? "Dean" : "Vice Chancellor"}.</p>
        <button className="btn secondary" type="button" disabled={pending || escalationLevel >= 2} onClick={() => void send({ type: "escalate" })}>
          Escalate
        </button>
        {anonymous ? (
          <p className="hint">This complaint is anonymous. The tracking key cannot be reissued.</p>
        ) : (
          <form
            className="fields"
            style={{ marginTop: "1rem" }}
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void send({ type: "rotate_secret", confirmedIdentity: form.get("confirmedIdentity") === "on" });
            }}
          >
            <label className="check">
              <input type="checkbox" name="confirmedIdentity" required />
              <span>I have verified the student&apos;s identity before issuing a new key.</span>
            </label>
            <button className="btn secondary" disabled={pending} type="submit">
              Issue a new tracking key
            </button>
          </form>
        )}
        {secret ? (
          <div className="secret-box" style={{ marginTop: "1rem" }}>
            <p>New secret key. Show it to the student through a checked channel, then leave this page. It will not be shown again.</p>
            <code>{secret}</code>
          </div>
        ) : null}
      </div>
    </div>
  );
}
