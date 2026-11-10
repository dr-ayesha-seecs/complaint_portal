"use client";

import { useState } from "react";
import { semesterLabel } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";
import type { StudentView } from "@/lib/view-types";

export function TrackPanel() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [view, setView] = useState<StudentView | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber, secretKey }),
    });
    const body = (await response.json().catch(() => null)) as StudentView & { error?: string };
    setPending(false);
    if (!response.ok) {
      setView(null);
      setError(body?.error || "No complaint matched that tracking number and key.");
      return;
    }
    setView(body);
  }

  async function appeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const grounds = String(new FormData(event.currentTarget).get("grounds") || "");
    await post("/api/track/appeal", { trackingNumber, secretKey, grounds }, "Your appeal has been received.");
  }

  async function withdraw() {
    if (!window.confirm("Withdraw this complaint?")) return;
    await post("/api/track/withdraw", { trackingNumber, secretKey }, "Your request has been recorded.");
  }

  async function post(url: string, payload: unknown, okMessage: string) {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "That request could not be completed.");
      return;
    }
    setMessage(okMessage);
    const refresh = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber, secretKey }),
    });
    if (refresh.ok) setView((await refresh.json()) as StudentView);
  }

  return (
    <div className="panel">
      <h1>
        Track a complaint
        <span className="ur">شکایت کی صورتحال</span>
      </h1>
      <p>Enter the tracking number and the secret key from your acknowledgement. Staff cannot look the key up for an anonymous complaint.</p>
      <form onSubmit={lookup} className="fields">
        {error ? (
          <div className="error-summary" role="alert">
            {error}
          </div>
        ) : null}
        {message ? <div className="banner info">{message}</div> : null}
        <div className="field">
          <label htmlFor="trackingNumber">Tracking number</label>
          <input id="trackingNumber" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} autoComplete="off" required />
        </div>
        <div className="field">
          <label htmlFor="secretKey">Secret key</label>
          <input id="secretKey" value={secretKey} onChange={(event) => setSecretKey(event.target.value)} autoComplete="off" required />
        </div>
        <button className="btn" disabled={pending} type="submit">
          {pending ? "Checking…" : "Show status"}
        </button>
      </form>

      {view ? (
        <section className="section">
          <p>
            <strong>{view.trackingNumber}</strong> · {view.categoryLabel}
          </p>
          <p>
            Status: <strong>{view.statusLabel}</strong>
            {view.overdue ? " · overdue" : ""}
          </p>
          <p>
            {view.facultyName} · {view.departmentName}
            <br />
            {view.programme} · {semesterLabel(view.semester)}
          </p>
          <p>Subject: {view.subject}</p>
          {!view.anonymous && view.studentName ? <p>Filed by: {view.studentName}</p> : null}
          <p>Filed: {formatDateTime(view.createdAt)}</p>
          <p>Current due date: {formatDateTime(view.dueAt)}</p>
          {view.appealDeadline ? <p>Appeal can be filed until: {formatDateTime(view.appealDeadline)}</p> : null}
          <h2>Updates</h2>
          <ol className="timeline">
            {view.events.map((event) => (
              <li key={event.id}>
                <strong>{formatDateTime(event.createdAt)}</strong>
                {event.toStatus ? <span> · {event.toStatus.replaceAll("_", " ")}</span> : null}
                {event.publicMessage ? <p>{event.publicMessage}</p> : null}
              </li>
            ))}
          </ol>
          {view.canAppeal ? (
            <form onSubmit={appeal} className="section">
              <h2>Appeal the outcome</h2>
              <div className="field">
                <label htmlFor="grounds">Grounds for appeal</label>
                <textarea id="grounds" name="grounds" required minLength={20} maxLength={4000} />
              </div>
              <button className="btn" type="submit" disabled={pending}>
                Submit appeal
              </button>
            </form>
          ) : null}
          {view.canWithdraw ? (
            <p className="section">
              <button className="btn secondary" type="button" onClick={withdraw} disabled={pending}>
                Withdraw this complaint
              </button>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
