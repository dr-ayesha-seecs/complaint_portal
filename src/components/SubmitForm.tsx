"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CATEGORY_HINTS, PROGRAMME_SUGGESTIONS, SEMESTERS, semesterLabel, type CategoryId } from "@/lib/categories";
import { complaintSchema } from "@/lib/validation";

type Org = { id: string; name: string; nameUr: string; departments: { id: string; name: string; nameUr: string }[] }[];

type Success = { trackingNumber: string; secretKey: string; dueAt: string; emailed: boolean };

export function SubmitForm({ org, preset, turnstileSiteKey }: { org: Org; preset: string; turnstileSiteKey: string }) {
  const [category, setCategory] = useState<string>(preset);
  const [anonymous, setAnonymous] = useState(preset !== "harassment");
  const [facultyId, setFacultyId] = useState(org[0]?.id ?? "");
  const [departmentId, setDepartmentId] = useState(org[0]?.departments[0]?.id ?? "");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const harassment = category === "harassment";

  useEffect(() => {
    if (!turnstileSiteKey) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (error) summaryRef.current?.focus();
  }, [error]);

  const departments = useMemo(() => org.find((item) => item.id === facultyId)?.departments ?? [], [org, facultyId]);

  useEffect(() => {
    if (!departments.some((item) => item.id === departmentId)) {
      setDepartmentId(departments[0]?.id ?? "");
    }
  }, [departments, departmentId]);

  function onCategory(next: string) {
    setCategory(next);
    if (next === "harassment") setAnonymous(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFields({});
    const form = new FormData(event.currentTarget);
    const payload = {
      category,
      harassmentType: harassment ? String(form.get("harassmentType") || "") : "",
      anonymous: harassment ? false : anonymous,
      concernsDepartmentHead: form.get("concernsDepartmentHead") === "on",
      facultyId,
      departmentId,
      programme: String(form.get("programme") || ""),
      semester: String(form.get("semester") || ""),
      subject: String(form.get("subject") || ""),
      description: String(form.get("description") || ""),
      desiredOutcome: String(form.get("desiredOutcome") || ""),
      incidentDate: String(form.get("incidentDate") || ""),
      location: String(form.get("location") || ""),
      respondentName: String(form.get("respondentName") || ""),
      studentName: String(form.get("studentName") || ""),
      registrationNumber: String(form.get("registrationNumber") || ""),
      studentEmail: String(form.get("studentEmail") || ""),
      studentPhone: String(form.get("studentPhone") || ""),
      confirmTruth: form.get("confirmTruth") === "on",
      confirmPrivacy: form.get("confirmPrivacy") === "on",
      confirmNonRetaliation: form.get("confirmNonRetaliation") === "on",
      companyWebsite,
    };
    const parsed = complaintSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        next[key] = [...(next[key] || []), issue.message];
      }
      setFields(next);
      setError("Please correct the highlighted fields.");
      return;
    }
    const body = new FormData();
    body.set("payload", JSON.stringify(payload));
    const selected = form.getAll("files");
    for (const file of selected) {
      if (file instanceof File && file.size > 0) body.append("files", file);
    }
    const turnstile = form.get("cf-turnstile-response");
    if (typeof turnstile === "string") body.set("turnstileToken", turnstile);
    setPending(true);
    const response = await fetch("/api/complaints", { method: "POST", body });
    const result = (await response.json().catch(() => null)) as (Success & { error?: string; fields?: Record<string, string[]> }) | null;
    setPending(false);
    if (!response.ok || !result || !result.trackingNumber) {
      setError(result?.error || "The complaint could not be submitted.");
      setFields(result?.fields || {});
      return;
    }
    setSuccess(result);
  }

  if (success) {
    return (
      <article className="panel">
        <h1>Complaint received</h1>
        <p>Save both values below. This page will not show the secret key again.</p>
        <div className="secret-box">
          <p>
            Tracking number
            <br />
            <code>{success.trackingNumber}</code>
          </p>
          <p>
            Secret key
            <br />
            <code>{success.secretKey}</code>
          </p>
        </div>
        <p style={{ marginTop: "1rem" }}>
          {success.emailed
            ? "An acknowledgement, including the key, has been sent or queued to the email address you gave."
            : "No email was requested, or the address was left blank. The key exists only in this message."}
        </p>
        <p>Target response date: {new Date(success.dueAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} (Pakistan time).</p>
        <p className="banner warn">If you filed anonymously, this key cannot be reissued. Store it somewhere you can find it.</p>
        <p>
          <Link className="btn" href="/track">
            Track this complaint
          </Link>
        </p>
      </article>
    );
  }

  const groups = [...new Set(CATEGORIES.map((item) => item.group))];

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h1>
        File a complaint
        <span className="ur">شکایت درج کریں</span>
      </h1>
      <p>Fields marked required must be completed. You can write in English or Urdu.</p>
      {error ? (
        <div className="error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
          <strong>{error}</strong>
          {Object.values(fields).flat().slice(0, 6).map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      ) : null}

      <fieldset>
        <legend>What is this about?</legend>
        <div className="choice-grid">
          {groups.map((group) => (
            <div key={group} style={{ display: "contents" }}>
              <p className="group-label">{group}</p>
              {CATEGORIES.filter((item) => item.group === group).map((item) => (
                <label className="choice" key={item.id}>
                  <input
                    type="radio"
                    name="category"
                    value={item.id}
                    checked={category === item.id}
                    onChange={() => onCategory(item.id)}
                    required
                  />
                  <span>
                    {item.en}
                    <span className="ur">{item.ur}</span>
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
        {category && CATEGORY_HINTS[category as CategoryId] ? <p className="banner info">{CATEGORY_HINTS[category as CategoryId]}</p> : null}
        {fieldMessage(fields, "category")}
        {harassment ? (
          <div className="field" style={{ marginTop: "0.8rem" }}>
            <label htmlFor="harassmentType">Type of harassment (required)</label>
            <select id="harassmentType" name="harassmentType" defaultValue="" required>
              <option value="">Choose one</option>
              <option value="sexual">Sexual harassment</option>
              <option value="other">Other harassment</option>
            </select>
            {fieldMessage(fields, "harassmentType")}
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend>About you</legend>
        {harassment ? (
          <p className="banner warn">Harassment complaints cannot be anonymous. Your name, registration number, email, and mobile number are required.</p>
        ) : (
          <label className="check">
            <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
            <span>Submit without my name. I understand I must keep the secret key, and that it cannot be reissued.</span>
          </label>
        )}
        {fieldMessage(fields, "anonymous")}
        {!anonymous || harassment ? (
          <div className="fields">
            <TextField id="studentName" label={harassment ? "Full name (required)" : "Full name"} fields={fields} autoComplete="name" />
            <TextField id="registrationNumber" label={harassment ? "Registration / roll number (required)" : "Registration / roll number"} fields={fields} />
            <TextField id="studentEmail" label={harassment ? "Email (required)" : "Email"} type="email" fields={fields} autoComplete="email" />
            <TextField id="studentPhone" label={harassment ? "Mobile number (required)" : "Mobile number"} fields={fields} autoComplete="tel" hint="Pakistani mobile, for example 03001234567." />
          </div>
        ) : (
          <p className="hint">Leave your name off the file. You will still choose a department so the complaint reaches the right office.</p>
        )}
      </fieldset>

      <fieldset>
        <legend>Where should it go?</legend>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="facultyId">Faculty (required)</label>
            <select
              id="facultyId"
              value={facultyId}
              onChange={(event) => setFacultyId(event.target.value)}
              required
            >
              {org.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="departmentId">Department (required)</label>
            <select id="departmentId" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {fieldMessage(fields, "departmentId")}
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: "0.8rem" }}>
          <div className="field">
            <label htmlFor="programme">Programme (required)</label>
            <input id="programme" name="programme" list="programmes" required maxLength={160} />
            <datalist id="programmes">
              {PROGRAMME_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            {fieldMessage(fields, "programme")}
          </div>
          <div className="field">
            <label htmlFor="semester">Semester (required)</label>
            <select id="semester" name="semester" defaultValue="1" required>
              {SEMESTERS.map((item) => (
                <option key={item} value={item}>
                  {semesterLabel(item)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" name="concernsDepartmentHead" />
          <span>The head of this department is involved. Do not send the complaint to the chairperson. Escalate it to the Dean and the Vice Chancellor.</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>What happened?</legend>
        <div className="fields">
          <TextField id="subject" label="Subject (required)" fields={fields} maxLength={180} />
          <div className="field">
            <label htmlFor="description">Description (required)</label>
            <textarea id="description" name="description" required minLength={30} maxLength={8000} />
            <span className="hint">What happened, when, and what you have already tried. At least a few sentences.</span>
            {fieldMessage(fields, "description")}
          </div>
          <TextField id="desiredOutcome" label="What outcome do you want?" fields={fields} />
          <div className="grid-2">
            <TextField id="incidentDate" label="Date of the incident" type="date" fields={fields} />
            <TextField id="location" label="Where did it happen?" fields={fields} />
          </div>
          <TextField id="respondentName" label="Who is the complaint about, if you want to say?" fields={fields} />
          <div className="field">
            <label htmlFor="files">Attachments</label>
            <input id="files" name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,application/pdf,image/png,image/jpeg,image/webp" />
            <span className="hint">Up to 2 files. PDF, PNG, JPEG, WEBP, or DOCX. 1 MB each.</span>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Before you submit</legend>
        <label className="check">
          <input type="checkbox" name="confirmTruth" required />
          <span>The information is true to the best of my knowledge.</span>
        </label>
        <label className="check">
          <input type="checkbox" name="confirmPrivacy" required />
          <span>
            I have read the <Link href="/privacy">privacy notice</Link>.
          </span>
        </label>
        <label className="check">
          <input type="checkbox" name="confirmNonRetaliation" required />
          <span>I understand that retaliation for making a complaint in good faith is prohibited, and that I can report it.</span>
        </label>
        {fieldMessage(fields, "confirmTruth")}
        {fieldMessage(fields, "confirmPrivacy")}
        {fieldMessage(fields, "confirmNonRetaliation")}
        <div className="hp" aria-hidden="true">
          <label htmlFor="companyWebsite">Company website</label>
          <input id="companyWebsite" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
        </div>
        {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} style={{ margin: "0.8rem 0" }} /> : null}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit complaint"}
        </button>
      </fieldset>
    </form>
  );
}

function TextField({
  id,
  label,
  type = "text",
  fields,
  hint,
  autoComplete,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  fields: Record<string, string[]>;
  hint?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} autoComplete={autoComplete} maxLength={maxLength} />
      {hint ? <span className="hint">{hint}</span> : null}
      {fieldMessage(fields, id)}
    </div>
  );
}

function fieldMessage(fields: Record<string, string[]>, key: string) {
  const messages = fields[key];
  if (!messages?.length) return null;
  return (
    <span className="field-error" role="alert">
      {messages[0]}
    </span>
  );
}
