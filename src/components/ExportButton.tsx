"use client";

import { useState } from "react";
import type { ComplaintFilters } from "@/lib/view-types";

export function ExportButton({ filters }: { filters: ComplaintFilters }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    setError("");
    const response = await fetch("/api/complaints/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "The export could not be created.");
      setPending(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mnsuam-complaints.csv";
    link.click();
    URL.revokeObjectURL(url);
    setPending(false);
  }

  return (
    <div>
      <button className="btn secondary" type="button" onClick={download} disabled={pending}>
        {pending ? "Preparing…" : "Export CSV"}
      </button>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
