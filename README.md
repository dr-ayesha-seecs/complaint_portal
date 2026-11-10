# MNSUAM Students Complaints Portal

Online grievance redressal for students of **MNS University of Agriculture, Multan** (Muhammad Nawaz Sharif University of Agriculture). The portal is meant to be linked from [mnsuam.edu.pk](https://mnsuam.edu.pk). It gives every complaint a tracking number, a published time limit, a status the student can check, and a route to the right chairperson and dean.

The portal owner is **Prof. Dr. Ayesha Hakim**, Chairperson, Department of Artificial Intelligence and Data Science.

This repository does not deploy the portal. Set the environment variables below and deploy it yourself to Vercel or Netlify.

## What a student can do

- File a complaint about teaching, grading, exams, admission, administration, fees, scholarships, other finance matters, bribery, hostels, transport, the library, laboratories, IT, facilities, discrimination, bullying or ragging, harassment (including sexual harassment), safety, disability and access, or something else.
- Attach up to **2 files**, each up to **1 MB**: PDF, PNG, JPEG, WEBP, or DOCX.
- File **without a name** for every category **except harassment**. Harassment requires a full name, registration or roll number, department, programme, email, and Pakistani mobile number. The browser and the server both enforce that.
- Receive a tracking number immediately, and an acknowledgement email when they give an address.
- Track the case with the tracking number plus a secret key. No student account is required.
- Appeal an outcome inside the time limit, or withdraw. A harassment withdrawal is recorded as a request, because the university may still have to inquire.

If the head of department is involved, the student can say so. The chairperson is then **not** emailed. The dean and the Vice Chancellor are.

## How the standards are applied

The in-portal procedure (`/procedure`) is the page students should be able to read from the university site. In short:

| Source | What this portal takes from it |
| --- | --- |
| [HEC grievance redressal](https://www.hec.gov.pk/english/services/students/pages/grp.aspx) and the HEC system-of-grievance standards used in the ODL policy (a time for every stage, an online reference number, status tracking, confidentiality, a chance to withdraw, access for students with disabilities) | Immediate reference number, status page, category list covering the HEC types (admission, fees, scholarships, evaluation, discrimination, harassment, administration, bribery), and a route for disability complaints |
| HEC Policy on Protection Against Sexual Harassment in HEIs, effective 1 July 2020 (see the [HEC note on the policy](https://www.hec.gov.pk/english/NAHE/CDP/Pages/Protection-Against-Sexual-Harassment-Policy.aspx)) | Harassment cannot be anonymous. Target to pass the file on within **24 hours**. Inquiry recommendation within **30 days**. Appeal within **30 days**. Confidential file. Prohibition on retaliation |
| Protection against Harassment of Women at the Workplace Act, 2010 | The same 30-day inquiry window, and the note that an Ombudsperson appeal remains available where the Act applies. This portal does not replace that appeal |
| UK [OIA Good Practice Framework](https://www.oiahe.org.uk/resources-and-publications/good-practice-framework) | Early resolution where it fits, a formal stage, a review (appeal) stage, and an outcome normally inside **90 calendar days** |
| ISO 10002 (complaints handling) | Free to use, visible procedure, acknowledgement, tracking, impartial handling, a response, and closure. The audit log supports accountability |

**Ordinary complaints.** Automatic acknowledgement at once. A person should acknowledge the file within **2 working days** (Monday–Friday, Asia/Karachi). Written outcome within **20 working days**, extendable with reasons up to 40 working days, and still inside 90 calendar days. Appeal within **10 working days** of the outcome; the review is due within **15 working days**.

**Harassment.** Acknowledgement at once. Referral target **24 hours**. Inquiry recommendation within **30 calendar days**, implementation of an endorsed decision within **7 days**. Appeal within **30 calendar days**; the appellate decision is due within **30 calendar days**.

Overdue files are flagged on the staff dashboard. There is no background cron: the overdue state is calculated whenever someone opens the desk.

## Roles

| Role | Sees | Can update |
| --- | --- | --- |
| `vice_chancellor` | Every complaint, full detail, filters, search, CSV export, dashboard counts, contacts, accounts, audit log | Yes |
| `dean` | One faculty | Yes, for that faculty |
| `chairperson` | One department | Yes, for that department |
| `staff` | One department, or one faculty, or (if neither is set) all **non-harassment** complaints | Yes, inside that boundary |
| `harassment_focal` | Harassment complaints only | Yes, for those files |

Deans and chairpersons do see harassment files in their own faculty or department, because they are the people notified. Central unassigned staff do not. Export is available to every signed-in role, but only for the rows that role can already see. The Vice Chancellor is the only person who can edit contacts, create accounts, and read the audit log.

Passwords are hashed with bcrypt. Sessions last 8 hours in an httpOnly cookie. Mutating requests must come from the same site. Inputs are checked with Zod. Complaint submission, tracking, appeals, and sign-in are rate limited. A hidden honeypot field drops obvious spam. If `TURNSTILE_SECRET_KEY` is set, Cloudflare Turnstile is required as well. Staff views and changes are written to an audit log. IP addresses on complaints are stored only as a hash.

## Department and dean emails

Seed data is in `src/data/organisation.ts`. It follows the faculties and departments published by MNSUAM (prospectus and faculty pages), including Faculty of Computing and the Department of Artificial Intelligence and Data Science. **Every address is a placeholder** on the reserved `.invalid` domain, for example `placeholder+foc-aids-chair@mnsuam.invalid`. The chairperson name for that department is set to Prof. Dr. Ayesha Hakim because she is the named owner of this portal. Other office-holder names are left as “Office of the Dean” or “Office of the Chairperson” so the file does not invent people. Confirm names before you announce the portal.

The database is the source of truth **after the first boot**. Editing the TypeScript file later does not overwrite contacts that already exist.

To set real addresses:

1. Sign in as the Vice Chancellor.
2. Open **Contacts**.
3. Replace each dean and chairperson address, and the harassment focal person, inquiry committee, and Vice Chancellor notification address.
4. Or add a missing department on that same page.

While email delivery is in log-only mode, placeholder addresses are still recorded so you can see who would have been notified. Once SMTP or Resend is configured, placeholder addresses are **not sent**. They are stored in `mail_log` as `skipped_placeholder`. The overview page counts how many placeholders remain.

Harassment complaints are emailed to the focal person and the committee only when those settings have an address. They ship as placeholders until you replace them.

## Environment variables

Copy `.env.example` to `.env.local` for local development. On Vercel and Netlify, set the same names in the project settings. Do not commit real secrets.

| Variable | Purpose |
| --- | --- |
| `TURSO_DATABASE_URL` | libSQL URL, such as `libsql://your-db-your-org.turso.io`. Required in production |
| `TURSO_AUTH_TOKEN` | Turso token. Required with a remote database |
| `ALLOW_LOCAL_DB` | Set to `true` only if production really has a persistent disk. Otherwise the app refuses to use a local file |
| `SECRET_PEPPER` | Random string, at least 32 characters. Required in production. Used to hash tracking keys and IP addresses. Changing it invalidates existing keys |
| `BOOTSTRAP_VC_EMAIL` | Creates the Vice Chancellor account if that email does not exist yet |
| `BOOTSTRAP_VC_NAME` | Display name. Defaults to “Vice Chancellor” |
| `BOOTSTRAP_VC_PASSWORD` | Initial password. At least 12 characters, with upper case, lower case, and a number. Not reset on later boots unless you ask |
| `BOOTSTRAP_USERS_JSON` | Optional JSON array of extra accounts. See `.env.example` |
| `BOOTSTRAP_RESET_PASSWORDS` | `true` overwrites passwords for bootstrap emails on the next boot. Turn it off again |
| `VC_NOTIFICATION_EMAIL` | Where escalation mail for the Vice Chancellor goes. On first boot this falls back to `BOOTSTRAP_VC_EMAIL`, then a placeholder. Editable under Contacts |
| `HARASSMENT_FOCAL_NAME` | Used only when the setting does not exist yet |
| `HARASSMENT_FOCAL_EMAIL` | Same |
| `HARASSMENT_COMMITTEE_EMAIL` | Same |
| `SMTP_HOST` | If set, mail goes out by SMTP (Nodemailer) |
| `SMTP_PORT` | Default `587` |
| `SMTP_SECURE` | `true` for implicit TLS. Port 465 is treated as secure |
| `SMTP_USER` / `SMTP_PASSWORD` | Optional SMTP auth |
| `SMTP_FROM` | Required when `SMTP_HOST` is set. Example: `MNSUAM Complaints Portal <complaints@mnsuam.edu.pk>` |
| `RESEND_API_KEY` | Used only when `SMTP_HOST` is empty |
| `RESEND_FROM` | Required with Resend |
| `NEXT_PUBLIC_APP_URL` | Public origin, no trailing slash. Used in emails and the website snippet |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | If set, submission requires a valid Turnstile token |

If neither SMTP nor Resend is set, the mailer logs the message and stores it. Nothing is delivered. That is the safe default.

Generate a pepper with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Local setup

```bash
npm install
cp .env.example .env.local
# Edit BOOTSTRAP_VC_EMAIL, BOOTSTRAP_VC_PASSWORD, and SECRET_PEPPER.
npm run db:migrate
npm run dev
```

Without Turso variables, development uses `data/local.db` (SQLite via libSQL). Open [http://localhost:3000](http://localhost:3000), then [http://localhost:3000/login](http://localhost:3000/login) with the Vice Chancellor account.

`npm run db:seed` is the same command: it creates tables, inserts faculties and departments if none exist, and creates missing bootstrap users.

```bash
npm test
npm run build
```

## Deploy on Vercel

1. Create a Turso database and copy the URL and token.
2. Import this repository. Framework preset: **Next.js**. `vercel.json` records that.
3. Set the environment variables above. Production must include `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SECRET_PEPPER`, and the Vice Chancellor bootstrap values.
4. Set `NEXT_PUBLIC_APP_URL` to the Vercel domain (or your own domain).
5. Deploy. The first request creates the schema and seed rows. There is no separate migration host.
6. Sign in, open **Contacts**, and replace placeholder emails before you announce the link.
7. Do not enable `ALLOW_LOCAL_DB` on Vercel. The filesystem is not durable.

## Deploy on Netlify

1. Create the same Turso database.
2. Import the repository. `netlify.toml` sets Node 22, `npm run build`, and `@netlify/plugin-nextjs`. Netlify installs that plugin during the build. You do not add it to this package.json.
3. Set the same environment variables in the Netlify UI, including `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
4. Deploy. Confirm `/api/health` returns `{ "ok": true }`.
5. Replace placeholder contacts, as on Vercel.

The app uses the Node.js runtime, not the Edge runtime, because libSQL, bcrypt, and Nodemailer need Node.

## Link from the university website

After deployment, open `/embed` on the portal. It shows a menu link and a button snippet aimed at `/submit`. Prefer a normal link over an iframe. Also link `/procedure`, `/track`, and `/privacy`.

Suggested menu label: **Student complaints**.

## Assumptions

- Weekend is Saturday and Sunday. Pakistan public holidays are not subtracted from the working-day count.
- The university exchange number 061-9201541 and info@mnsuam.edu.pk are the public contacts printed on the university website. No personal inboxes were guessed.
- Faculty and department lists follow the 2025 prospectus and current faculty pages (Agriculture and Environmental Sciences, Food and Home Sciences, Social Sciences and Humanities, Veterinary and Animal Sciences, Agricultural Biosystems Engineering and Technology, Computing, plus a University Administration group for hostels, transport, fees, security, and disability coordination). A unit that has since moved can be added by the Vice Chancellor under Contacts.
- “University Administration” is included so a hostel or fee complaint has a real destination. Its dean contact is the administration mailbox, still a placeholder until you set it.
- The Vice Chancellor is not copied on every complaint. They see all files on the dashboard. They are emailed when a complaint is escalated to them, when the student says the head of department is involved, and when a student appeals.
- Harassment identity is mandatory even if someone calls the API directly.
- Anonymous tracking keys cannot be recovered. A named student can be given a new key after a member of staff confirms their identity. That action is audited.
- Retention stated in the privacy notice (3 years for ordinary files, 7 years for harassment files) is a proposed rule for the Registrar to confirm. The software does not delete files on a timer.
- The privacy notice and procedure should be read by the Registrar before the portal is announced. They describe how this software behaves; they are not a substitute for a signed university statute.
- CSV export and attachment download are limited to staff who may already open that complaint. Students keep their own copies of attachments. The tracking page does not offer a second download link, so the secret key is never used as a file URL.
- No third-party analytics or font CDN is loaded. Urdu labels use the reader’s own Urdu fonts.
- `npm run build` does not need a database. Pages that read complaints are rendered on request.
