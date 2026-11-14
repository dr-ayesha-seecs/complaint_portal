"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InternalNoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function send(note: string) {
    setPending(true);
    setError("");
    setInfo("");
    const response = await fetch(`/api/complaints/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", note }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "The note could not be saved.");
      return;
    }
    setInfo("Saved.");
    router.refresh();
  }

  return (
    <form
      className="fields"
      style={{ marginTop: "1rem" }}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void send(String(form.get("note") || ""));
        event.currentTarget.reset();
      }}
    >
      {error ? <div className="error-summary">{error}</div> : null}
      {info ? <div className="banner info">{info}</div> : null}
      <p className="hint">Students never see internal notes.</p>
      <div className="field">
        <label htmlFor="internal-note">Add a note</label>
        <textarea id="internal-note" name="note" required minLength={3} maxLength={4000} />
      </div>
      <button className="btn secondary" disabled={pending} type="submit">
        Add note
      </button>
    </form>
  );
}
