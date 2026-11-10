"use client";

import { useState } from "react";

export function PasswordForm() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        nextPassword: form.get("nextPassword"),
      }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(body?.error || "The password could not be changed.");
      return;
    }
    setMessage("Password updated.");
    event.currentTarget.reset();
  }

  return (
    <form className="fields" onSubmit={onSubmit} style={{ maxWidth: 480 }}>
      {error ? <div className="error-summary">{error}</div> : null}
      {message ? <div className="banner info">{message}</div> : null}
      <div className="field">
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="nextPassword">New password</label>
        <input id="nextPassword" name="nextPassword" type="password" autoComplete="new-password" minLength={12} required />
        <span className="hint">At least 12 characters, with upper case, lower case, and a number.</span>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
