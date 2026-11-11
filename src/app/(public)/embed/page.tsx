import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Website link" };
export const dynamic = "force-dynamic";

export default async function EmbedPage() {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") || headerList.get("host") || "complaints.mnsuam.edu.pk").split(",")[0].trim();
  const proto = headerList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = (process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`).replace(/\/$/, "");
  const snippet = `<a class="mnsuam-complaint-link" href="${origin}/submit">File a student complaint</a>`;
  const button = `<a class="mnsuam-complaint-button" href="${origin}/submit">File a student complaint</a>
<style>
  .mnsuam-complaint-button {
    display: inline-block;
    background: #0f5a3c;
    color: #fff;
    font-family: Georgia, "Times New Roman", serif;
    text-decoration: none;
    padding: 0.7rem 1.1rem;
    border-radius: 999px;
    font-weight: 700;
  }
  .mnsuam-complaint-button:focus { outline: 3px solid #0c3b28; outline-offset: 2px; }
</style>`;

  return (
    <div className="wrap">
      <article className="panel">
        <h1>Link this portal from mnsuam.edu.pk</h1>
        <p>Put a normal link in the student menu. Do not place the complaint form inside a hidden frame. A full page keeps the tracking key visible and avoids clickjacking.</p>
        <h2>Menu link</h2>
        <pre className="card">{snippet}</pre>
        <p>
          Suggested label: <strong>Student complaints</strong>. Also link the procedure at <code>{origin}/procedure</code> and tracking at <code>{origin}/track</code>.
        </p>
        <h2>Button</h2>
        <p>
          <a className="btn" href="/submit">
            File a student complaint
          </a>
        </p>
        <pre className="card">{button}</pre>
        <p className="hint">Set NEXT_PUBLIC_APP_URL to the public address so emails and this snippet use the correct host.</p>
      </article>
    </div>
  );
}
