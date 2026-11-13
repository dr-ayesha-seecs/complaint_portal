# Handover: Students Complaints Portal

**Date:** 13 November 2026 (Asia/Karachi)

This is the short Complaints Portal handover. The full brief for all three systems (website, FIS, Complaints Portal), including standing decisions and the combined cPanel checklist, is:

**https://github.com/dr-ayesha-seecs/mnsuam_website/blob/cursor/mnsuam-preview-upload-b950/HANDOVER.md**

(Also `HANDOVER.md` at the root of `dr-ayesha-seecs/mnsuam_website` on branch `cursor/mnsuam-preview-upload-b950`. That branch's PR #1 is not merged; the website `main` is untouched.)

Product, policy, environment variables, and local setup: **`README.md`**.

---

## Current state of this repository

| | |
| --- | --- |
| Repository | https://github.com/dr-ayesha-seecs/complaint_portal |
| Work branch | `cursor/mnsuam-complaints-portal-08fe` |
| Latest commit | `93ed7971bdd1ccc559522fbbec518b8358bd2cf5` — *Match the complaints portal theme to the new university website.* |
| Policy/SLA wording | `a35657197b6024e6654f551f9563a40dad3a7bcd` — *Remove notification numbers and committee constitution details from the public pages.* (after `5c0171a`, which aligned `/procedure` and `/privacy` with the adopted policies) |
| Pull request | [PR #1](https://github.com/dr-ayesha-seecs/complaint_portal/pull/1) — **open**, base `main` |
| `main` | **untouched** — `ccb5e9187917b4c0c3c2fc04d2f9526ee30d3655` (*Initial commit*, 10 Nov 2026). Do not merge until the owner says ready. |
| Published site | https://mnsuam-complaints.netlify.app — **new deploys blocked** because the Netlify team "AI and DS" has exceeded its account credit usage. The last successful publish may be older than `93ed797`. |
| Database | Turso (libSQL) in production; local `data/local.db` for development |
| Tests | `npm test` — 23/23 `it()` cases in `tests/portal.test.ts` (last reported run before `93ed797` passed; production build succeeded) |

---

## Theme and configuration

Commit `93ed797` aligns colours, typography (**Plus Jakarta Sans** headings, **Inter** body), official emblem, two-line university name, sticky header, top bar, and footer with the new university website. Header and footer must not link to old Joomla pages.

Production website origin:

```bash
NEXT_PUBLIC_UNIVERSITY_SITE_URL=https://mnsuam.edu.pk
```

The current default in `src/lib/university.ts` and `.env.example` is `https://mnsuam-website-demo.netlify.app`. Change it when the public website is live. Also set `NEXT_PUBLIC_APP_URL` to this portal's own public origin.

Full university name: **Muhammad Nawaz Shareef University of Agriculture, Multan** (Shareef with `ee`). Do not use `MNS - …` or `MNSUAM` in headings, titles, or badges.

---

## Would a cPanel publish of the other repos replace this portal?

**No.** The main website is a static upload to `mnsuam.edu.pk`. FIS is a PHP app on `fis.mnsuam.edu.pk`. This portal is a **Next.js application with a Turso database**. It cannot be dropped into a plain cPanel `public_html` as static files.

**Pending owner decision:** keep the portal on Netlify or Vercel, or provision Node hosting on cPanel. New Netlify deploys are blocked until credits are added or the allowance resets, so a host decision also unblocks publishing `93ed797`.

On 13 November 2026 the owner asked to publish the website and FIS directly for cPanel and asked whether that would replace the live site and FIS. That question does **not** by itself authorise a Complaints Portal move. Do not change this portal's production host or merge PR #1 until the owner confirms.

Never commit `.env.local`, Turso tokens, `SECRET_PEPPER`, SMTP/Resend keys, or bootstrap passwords.

---

## Policy reminder

Public procedure and privacy wording follows the university's adopted arrangements (Committee of Anti-Bullying and Harassment Monitoring; 45-day investigation target and seven-year record period for those files; ordinary-complaint SLAs as in `README.md`). Do not put notification numbers, circular dates, or committee constitution details back on the public pages (removed in `a356571`).

Keep this work separate from ADP work.
