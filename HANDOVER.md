# MNSUAM handover (15 Nov 2026, Asia/Karachi)

This is the starting point for the next bot. Work is paused because weekly credits are nearly exhausted (about 92–95% used as of 14–15 Nov 2026). The weekly limit resets on Saturday, 21 Nov 2026, 4:04 PM PKT. The owner (Shoaib Ali / Dr. Ayesha) will finish testing the new sites before any live switch, and may buy extra credits if needed. **Nothing goes live until the owner gives an explicit thumbs-up.**

A shared copy of this file also lives at `/workspace/HANDOVER-mnsuam.md` on the box.

## Hard rules

- Never touch live sites (`https://mnsuam.edu.pk`, `https://fis.mnsuam.edu.pk`, live cPanel, live FIS/Namecheap, or the live database) before the owner's thumbs-up.
- Never merge to `main` without the owner's approval. Work only on the `vercel-test` branch (or another named working branch). Do not force-push `main`.
- Do not put secrets, passwords, tokens, or login files in chat or in commits. Exclude `secrets/` directories, `*.env`, tokens, passwords, and test-login files.
- Credentials belong only in the owner's vault. Vault ids (values are not in this document):
  - cPanel: `4663144`
  - webadmin: `4663167`
- Box secret file locations (paths only; do not open, print, or commit them unless the owner has asked you to use one and you can keep the value out of chat and git):
  - `/workspace/secrets/complaint_portal_pepper.txt`
  - `/workspace/secrets/complaint_portal_site.json`
  - `/workspace/fis-vercel/secrets/` (`admin_password`, `app_secret`, `fis-my-login.txt`, `fis-test-logins.json`, `tidb.env`)
  - `/workspace/fis-vercel/test-login.txt`
  - `/workspace/complaints-vercel/secrets/` (`VC_PASSWORD`, `BOOTSTRAP_VC_PASSWORD`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_RESET_PASSWORDS`, `ADMIN_PASSWORD`, `SECRET_PEPPER`, `TURSO_AUTH_TOKEN`, `portal.env`, `portal-test-logins.txt`, `new-logins.json`)
  - `/workspace/complaints-vercel/test-login.txt`
  - `/workspace/vercel-test/token.txt`
  - `/workspace/vercel-test/url.txt`
- FIS test logins were previously copied to a file in the owner's Downloads (`fis-test-logins.txt`) and should be deleted once noted. Those logins work only on the test FIS, not live FIS.
- Keep this university website/FIS/portal work separate from ADP (Annual Development Programme) work.
- Do not leave a Netlify complaints URL (`https://mnsuam-complaints.netlify.app`) on the test or live website.

## Test URLs (current targets)

- Website: https://mnsuam-website-test.vercel.app
- FIS: https://mnsuam-fis-test.vercel.app
- Complaints Portal: https://mnsuam-complaints-test.vercel.app
- Website assets project: `mnsuam-website-test-assets` (site-images, proxied by the main site at `/site-images/*`)

An older Next.js Netlify demo (`https://mnsuam-website-demo.netlify.app`) is not the current test site. Do not treat it as the go-live candidate.

## Vercel

- Team slug: `dr-ayesha-seecs`
- Projects: `mnsuam-website-test`, `mnsuam-website-test-assets`, `mnsuam-fis-test`, `mnsuam-complaints-test`
- FIS test region: `sin1`
- The Vercel connector may 403 on this team until the owner approves team access. Prefer existing deploy scripts and the owner's approval rather than fighting the connector.

## GitHub repositories and branches

Do not merge these working branches into `main`.

### 1) Website (current static Vercel test site)

- Box workdir: `/workspace/vercel-test` (this is the current site; it was not a git repo until this handover).
- Intended GitHub repo: `https://github.com/dr-ayesha-seecs/mnsuam_website` (private). That repo already holds the earlier Next.js preview on branch `cursor/mnsuam-preview-upload-b950` (commit `49e41fca6c8c48138a04efed1e092cb5ec2e3273`) and `main` (`8f1a19d32ff0406f2ca56c91fb69d50cf6f1e0bf`). Those branches must be left alone.
- Working branch for the current static site: `vercel-test` (orphan branch of build scripts, maps, QA, and this handover — not the 2 GB HTML tree).
- If this branch could not be pushed, the local repo and a git bundle (if created) are on the box; see the "Push status" section at the bottom of the shared copy, or `git -C /workspace/vercel-test log -1`.
- Build/source notes:
  - Build pipeline and widget: `/workspace/vercel-test/fis/` (`build.sh`, `fis-widget.js`, `fis-dept-map` wiring in `wire-fis-widget.py`, `content-format.py` / `content-format.css`, `final-pass.py`, `aids-content.py`, `department-map.csv`, `office-canonical.py`, `qa-fix.py`, and related scripts).
  - Deploy parts / tarball: `/workspace/vercel-test/main/` (`site.tar.xz`, split `part-*` upload chunks, `vercel.json`, `build.sh`). Do not commit tokens or `.b64` upload payloads.
  - Older/full HTML tree on the box: `/workspace/webnew/site` (about 2.2 GB).
  - Latest local build used by the final pass: `/tmp/vw-qa-build/public`.
  - QA: `/workspace/vercel-test/qa-report.md` (tested the 14 Nov 2026, 10:10 PM PKT deploy) and `/workspace/vercel-test/DEPLOY.md`.

### 2) FIS (Faculty Information System)

- Box git repo: `/workspace/fis-vercel/src` (branch `vercel-test`).
- GitHub repo: `https://github.com/dr-ayesha-seecs/FIS` (private). GitHub has only `main` at `9c4366b524f82d55e966a52cde8b2ed4e0a6445f` (pushed 13 Nov 2026). The local `vercel-test` history does not contain that SHA; it started from a snapshot noted as "FIS main @ab22618". Do not merge or force-push to `main`.
- Local `vercel-test` tip before this handover commit: `dbd3d95` ("static CORS + SWR caching for /api-cache, pre-built feed seed for cold starts").
- Useful files outside the git root (copy into the repo if missing, but never copy `secrets/`):
  - `/workspace/fis-vercel/DEPLOY-STEPS.md`
  - `/workspace/fis-vercel/department-map.csv`
  - `/workspace/fis-vercel/tools/` and import helpers at `/workspace/fis-vercel/src/` (`import_all.py`, `build_bundle.sh`, and related scripts)
- Test deploy is a small loader bundle: `vercel.json`, `api/index.php`, `api/app.tgz`, `api/photos.tgz`, built with `tools/build_bundle.sh`. After a large faculty import, refresh `vercel/feed-seed` from the live test feed, then rebuild the bundle.

### 3) Complaints Portal

- Box git repo: `/workspace/complaints-vercel/src` (branch `vercel-test`).
- GitHub repo: `https://github.com/dr-ayesha-seecs/complaint_portal`.
- Remote heads as of this handover: `main` `ccb5e9187917b4c0c3c2fc04d2f9526ee30d3655`, and `cursor/mnsuam-complaints-portal-08fe` `d8fb487c7f8feb85d36ca1224d1bab119c70be1f`.
- Local `vercel-test` tip before this handover commit: `5097069` ("Let officers who can view a complaint add an internal note on the case page."). That branch had not yet been pushed.
- A second clone, `/workspace/complaint_portal`, is on `cursor/mnsuam-complaints-portal-08fe` and was diverged from origin (ahead 7, behind 13). Prefer `/workspace/complaints-vercel/src` on `vercel-test` as the current test-site source.

## Architecture (website + FIS feed)

- The test website is a static export deployed on Vercel. `fis/build.sh` unpacks the site, injects `fis-widget.js` into every HTML page, applies typography/content fixes, and retargets Complaints Portal links.
- Faculty lists and profiles on department pages are loaded from the FIS public feed, not from static HTML:
  - Widget: `/workspace/vercel-test/fis/fis-widget.js`
  - Single config value: `FIS_BASE` (currently `https://mnsuam-fis-test.vercel.app`). **At go-live, change `FIS_BASE` to `https://fis.mnsuam.edu.pk`**, then redeploy the website.
  - Feed URL: `FIS_BASE + '/api-cache/'`
- Department slug map: website paths do not always match FIS slugs. `fis-dept-map.js` is generated/wired from `department-map.csv` (see `wire-fis-widget.py`). A real bug: the site asked FIS for `plant-breeding-and-biotechnology`, but FIS stores IPBB as `institute-of-plant-breeding-and-biotechnology`. The same class of mismatch also affected IT, Statistics, and Plant Protection. The map was rebuilt from FIS's own names; all 21 department lists should work. Agricultural Extension has no staff in FIS, so it correctly has no list.
- FIS `/api-cache` response headers: `Access-Control-Allow-Origin: *`, `Cache-Control` with `s-maxage=600` and `stale-while-revalidate=86400` (plus a short browser `max-age`). Cold starts copy `vercel/feed-seed`.
- Complaints Portal URL is set once in `fis/build.sh` as `COMPLAINTS_PORTAL_URL` (currently `https://mnsuam-complaints-test.vercel.app`). Change it to the live portal address at go-live.
- Test copies should keep the Demo badge and `noindex` / `robots.txt` `Disallow: /` until go-live. Canonical and `og:url` already point at `mnsuam.edu.pk`.

## What is done

- Faculty lists load for all 21 departments with staff in FIS, including IPBB. AI & Data Science list and profiles were fixed after a feed-permission / retry issue (blinking or very slow load). Feed TTL 600s; typical list load is about a second when the cached feed is readable.
- AI & DS department page: vision and mission updated from the owner's files; Programs Offered now includes **BS CS (Specialization in Data Science)** and **BS CS (Specialization in Artificial Intelligence)**, with program objectives copied exactly from those files (`aids-content.py`).
- Menu, sidebar and quick links were fixed so pages do not go blank after a click. ORIC, BIAEC, Registrar, Counseling, International Students, Student Affairs, About Multan, and World Ranking were among the links confirmed working after that fix.
- Duplicate office pages under Graduate Resource Center redirect to the full office pages (`office-canonical.py`).
- FIS test copy has real public faculty data imported from the live FIS public API (read-only) plus old-site faculty pages: 163 people, plus Dr. Ayesha Hakim (curated, untouched). Sample/test accounts were renumbered and hidden from the public feed (`public_feed.exclude_email_domains = example.edu.pk`). Faculty of Computing placement follows Notification MNSUAM/FoC/2026/547 (`computing-faculty.csv`).
- Complaints test copy matches the new website theme, is noindexed, and officers who can view a complaint can add an internal note.
- A lean final pass script (`fis/final-pass.py` + `content-format.css`) was written to:
  - show the latest annual report (2020-21) with an archive note
  - remove "Award 2021" from menus
  - update counseling page details
  - rewrite leftover absolute `https://mnsuam.edu.pk/...` content links to same-site paths
  - put merit-list links each on their own line
  - make office staff photos a consistent size (those photos are copied from the old site, not from FIS)
- A run of an earlier final-pass version wrote `/tmp/final-pass-report.json` at 14 Nov 2026, 11:54 PM PKT: annual report pages 5, Award 2021 removed 32, counseling files 4 (70 replacements), apex hrefs rewritten 2864, remaining apex hrefs none, case hrefs fixed 6599. Merit-list and staff-photo patches were added to the script and CSS after that report (files dated 15 Nov 2026, 12:04 AM PKT). **Confirm on the test site whether the latest script (including merit lists and staff photo sizes) was actually deployed.** Upload artifacts were being prepared under `/tmp/vercel-upload/` around that time.

## What is still pending

Confirm or finish these before asking the owner for a go-live thumbs-up:

1. Deploy and click-check the latest final pass on https://mnsuam-website-test.vercel.app: latest annual report + archive note, Award 2021 gone, counseling details, leftover old-domain links, merit list formatting (each link on its own line), even staff photo sizes on office pages such as `/office-c-e-o-administration-staff/`.
2. Complaints Portal: officer contact emails are still placeholders (QA: "41 contact addresses are still placeholders, so live email will skip them").
3. Add **Ms. Somiya** for harassment (portal / relevant page — do not invent details; use the owner's source).
4. Two Faculty of Computing staff still have no FIS accounts (the owner will need to say who, or check `computing-faculty.csv` against the FIS import).
5. Remaining QA from `/workspace/vercel-test/qa-report.md` that was not in the final pass, including: latest careers advert missing on `/careers/`; some duplicate/near-duplicate pages; repeated generic titles; Next.js header/footer prefetch wasting mobile data; no Content-Security-Policy on the main website; department Faculty Members headings (e.g. Entomology); typography leftovers; RAF-SP quick link currently `https://raf-sp-six.vercel.app/` (confirm with the owner); Faculty of Computing photo still needs the owner's pick; hostel page is still a single line (same as the old site — needs owner-supplied text if it should be expanded).
6. Owner click-through of all three test sites, then an explicit thumbs-up to deploy.

## Go-live plan (do not start until thumbs-up)

- Time: outside office hours (the owner preferred Sunday night or another night before Monday, depending on credits).
- First, back up: current live website `public_html`, live FIS, and the `mnsuniet_fis` database.
- Website: deploy to the current server `37.27.141.47` via cPanel (not by pointing the main domain at Vercel unless the owner later changes that plan).
- FIS: stays on Namecheap at `https://fis.mnsuam.edu.pk` (deploy the new FIS there; do not take over the domain with the Vercel test URL).
- Complaints Portal: deploy with the website (same hosting plan as the new site).
- Then switch test-only settings to live:
  - Remove the Demo badge from the website footer.
  - Remove `robots.txt` `Disallow: /` and the `noindex, nofollow, noarchive, nocache` meta.
  - Set `FIS_BASE` in `fis-widget.js` to `https://fis.mnsuam.edu.pk`.
  - Set `COMPLAINTS_PORTAL_URL` to the live portal address.
- Check that everything works, and keep the backup ready to roll back.
- If usage credits are tight, do not start a live switch that cannot be finished. A half-finished cutover is worse than waiting for the Saturday reset or for the owner to add credits.

## How to resume (next bot)

1. Read this file and `/workspace/vercel-test/qa-report.md`. Pull or copy the `vercel-test` branches; never check out work onto `main` with the intent to merge.
2. Confirm whether the 15 Nov 2026 final-pass changes are on the test website. If not, run the latest `final-pass.py` against the current build (`/tmp/vw-qa-build/public` or a fresh unpack of `site.tar.xz` plus `fis/build.sh`) and deploy only to the test Vercel projects.
3. Give the owner a short click-through checklist (home, a few faculty pages including AI & DS and IPBB, office staff photos, merit lists, counseling, complaints portal, FIS login on the test copy only).
4. Stop there until the owner explicitly says to deploy to the live domain/server.
5. Only after thumbs-up: take backups, then follow the go-live plan above.

## Push status (15 Nov 2026, 12:08 AM PKT, Asia/Karachi)

Local commits were made on each `vercel-test` branch. **None of the three branches could be pushed to GitHub.** `gh` is not logged in, and `git push` failed with: `could not read Username for 'https://github.com': terminal prompts disabled`. No new GitHub repositories were created. `main` was not updated, merged, or force-pushed.

### Local commit hashes (push these; do not merge to main)

| Project | Box repo | GitHub remote | Branch | Local HEAD | Pushed? |
|---|---|---|---|---|---|
| Website | `/workspace/vercel-test` | `https://github.com/dr-ayesha-seecs/mnsuam_website` (private; add as `origin`; keep existing `main` and `cursor/mnsuam-preview-upload-b950` untouched) | `vercel-test` (new orphan branch) | `f871e6d71e502b4a0e1685d6497d0fdc150cd6f6` | No |
| FIS | `/workspace/fis-vercel/src` | `https://github.com/dr-ayesha-seecs/FIS` (private; `origin` added) | `vercel-test` | `15e0e8953b2ac7f0092b87f82a4b274b0589556c` | No |
| Complaints Portal | `/workspace/complaints-vercel/src` | `https://github.com/dr-ayesha-seecs/complaint_portal` | `vercel-test` | `aeee8cc410bbba4dc227c31c8581510a532e4021` | No |

### Git bundles (use these if the box git remotes are missing later)

- `/workspace/handover/bundles/mnsuam-website-vercel-test.bundle`
- `/workspace/handover/bundles/FIS-vercel-test.bundle`
- `/workspace/handover/bundles/complaint_portal-vercel-test.bundle`

To clone a bundle: `git clone <bundle> -b vercel-test <dir>`.

### How to push once GitHub auth is available

Do not use `--force` and do not push `main`. After `gh auth login` (or equivalent git credentials for `dr-ayesha-seecs`):

```bash
git -C /workspace/vercel-test push -u origin vercel-test
git -C /workspace/fis-vercel/src push -u origin vercel-test
git -C /workspace/complaints-vercel/src push -u origin vercel-test
```

### Intentionally not committed

- All `secrets/` dirs, `*.env`, `token.txt`, login/password files listed above.
- Website upload chunks and large media: `main/part-*`, `main/site.tar.xz`, `fis/restore-overlay-part-*`, `assets/`, QA screenshots, computing/social-sciences option photos.
- Full HTML trees: `/workspace/webnew/site`, `/tmp/vw-qa-build/public` (stay on the box only).
- FIS tools/secrets outside `/workspace/fis-vercel/src` except `DEPLOY-STEPS.md` and `department-map.csv`, which were copied into the repo.

Handover file paths:
- `/workspace/HANDOVER-mnsuam.md` (shared box copy; this push-status section lives here)
- `/workspace/handover/HANDOVER.md`
- `/workspace/vercel-test/HANDOVER.md` (committed in `f871e6d`)
- `/workspace/fis-vercel/src/HANDOVER.md` (committed in `15e0e89`)
- `/workspace/complaints-vercel/src/HANDOVER.md` (committed in `aeee8cc`)


---
## UPDATE 2026-11-15 06:00 PKT — open issues reported by user (in progress, NOT yet verified fixed)
Credits nearly exhausted; next bot should continue from here. A fix pass was running on branch `vercel-test` in /workspace/vercel-test (check `git log` / `git status` for uncommitted work; check latest Vercel deployment of mnsuam-website-test).
Reported issues to fix and verify on https://mnsuam-website-test.vercel.app :
1. **Intermittent links (TOP PRIORITY):** links sometimes work, sometimes not. Find root cause (client-side nav/prefetch, trailing-slash redirects, hydration, CDN-cached 404s, stale alias). Repro with repeated curl + headers.
2. Search intermittent (failed earlier, worked later) — make deterministic (wait for index, retry).
3. /offices/office-of-biaec/-office-staff-members/ broken (bad leading-hyphen slug); scan for other `/-` slugs.
4. Director External Linkages page/link broken.
5. ORIC does not open; ORIC staff cards misaligned (use uniform grid, 180x180).
6. University Web Radio page mostly empty — copy full content from old site (read-only GET).
7. World Ranking link does not open.
8. /crop-advisory/ broken.
9. Text "More information is available from the related pages in this section." still appears on AI&DS faculty page after refresh — remove site-wide, spinner only; widget must load on hard refresh.
10. Abdul Razzaq profile photo missing (AI&DS faculty) — fix photo + add placeholder avatar fallback.
11. Then run a FULL crawl: every internal link 200, flag near-empty pages vs old site; fix or list.
Still pending from before: push 3 vercel-test branches to GitHub (gh not authenticated — user must connect GitHub); user thumbs-up before any live switch; all hard rules above still apply.
