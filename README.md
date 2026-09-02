# The School of STEAM Education — Website + CMS

Public website and admin CMS for The School of STEAM Education, Deukhuri,
Dang (Lumbini Province, Nepal). Next.js 14 (App Router) · TypeScript ·
Tailwind CSS · Supabase.

## Quick start (local mode — no accounts needed)

```bash
npm install
npm run hash-password -- "choose-a-password"   # prints two lines
# put the printed ADMIN_PASSWORD_HASH and AUTH_SECRET into .env.local
# (copy .env.example → .env.local first)
npm run dev
```

- Website: http://localhost:3000
- CMS: http://localhost:3000/admin — sign in with `ADMIN_EMAIL` (default
  `admin@steamschool.edu.np`) and the password you hashed.

In local mode all content lives in `/data/*.json` and uploads in
`public/uploads/` — nothing external required.

## Production mode (Supabase)

Follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**: create a free project,
run `supabase/schema.sql`, set four env vars, `npm run seed:supabase`, and
create an admin account in Supabase Auth. The same codebase then uses:

- **Postgres** for all CMS content, applications, messages and the activity log
- **Supabase Storage** for photos, PDFs and admission documents
- **Supabase Auth** for admin sign-in and "forgot password" emails
- **RLS everywhere** — the browser key can read/write nothing directly; all
  data flows through server code holding the service-role key (never bundled
  to the browser)

## What's wired end-to-end

| Area | Status |
|---|---|
| News / Notices / Events CRUD (draft → scheduled → published → archived) | ✅ live |
| Notice priority, PDF attachment, **auto-expiry** (past `expires` date drops off the site) | ✅ live |
| Public News & Notices page: search, filters (Important / Notice / News / Event / Exam / Holiday / Admission), Important-notice banner | ✅ live |
| Calendar (add/edit/delete/categorise; synced to Events page + homepage) | ✅ live |
| Gallery: albums, multi-upload, drag-drop, reorder, cover photo, publish/unpublish → public gallery | ✅ live |
| Admission form → database; admin review, accept/reject/waitlist, notes, uploaded documents | ✅ live |
| Contact form → database; admin inbox (read / reply / archive / delete) | ✅ live |
| Settings (name, address, phone, email, hours, socials) → whole public site | ✅ live |
| Auth: login, logout, session expiry, protected `/admin` + write APIs, forgot password (Supabase mode) | ✅ live |
| Activity log (who did what, when) on the dashboard | ✅ live |
| Team accounts: create/disable/delete users, assign roles (Super Admin only, enforced server-side) | ✅ live (Supabase mode) |
| Role-based access: sidebar and every API respect the signed-in role | ✅ live |
| Media Library: browse, upload, copy link, delete every uploaded file | ✅ live |
| Homepage CMS: hero, intro, programs, statistics (add/reorder/rotating carousel), testimonials, closing CTA | ✅ live |
| Public navigation editor: reorder, rename, enable/disable, nested dropdowns → live menu + mobile drawer | ✅ live |
| Academic Setup: classes, examination types, academic years (one source for uploads, filters, public search) | ✅ live |
| Examination results: batches, CSV import (validate → preview → duplicates → confirm), BS date picker, publish, export | ✅ live |
| Official marksheets: subject-wise marks, computed grades/GPA, rank, QR verification, A4 PDF download | ✅ live |
| Teachers & Staff profiles with photos → homepage section + About page | ✅ live |
| Popup announcements: flag any news, notice or event to greet visitors when the site opens | ✅ live |
| Password management: Super Admin resets any user's password; every user can change their own | ✅ live |
| Settings split by purpose: General, SEO & Sharing (share image, favicon), Social, Marksheets, Error Pages, Maintenance Mode, Security | ✅ live |
| Public result search: name + BS date of birth + class → celebration popup, full result view, print layout | ✅ live |
| Toast notifications & styled confirmations (no browser popups) | ✅ live |
| Invitations by email, per-role publishing approval, footer editor | 🔜 roadmap |

The homepage leads with what families come for — **News & Notices** (featured
story, notice board, upcoming events) — then the school's people and life:
About, Highlights, **Our Teachers**, **Life at School** (photos from the
gallery), Academics, Student Life, Testimonials. There is no statistics band
and no "Campus" section; the design uses one restrained teal accent.

No fake numbers anywhere: the dashboard shows real counts, and the analytics
slot says plainly that no provider is connected.

## Roles

| Role | Can manage |
|---|---|
| Super Admin | Everything, including users and settings |
| Content Manager | News, notices, events, calendar, gallery, media, homepage, navigation, academic setup |
| Admission Manager | Applications and messages |
| Editor | News, notices, events, calendar, gallery, media |
| Teacher | Examination results only — the sidebar shows nothing else, and every other API answers 403 |

Permissions are enforced in the API routes (`lib/roles.ts`), not just hidden in
the UI — a request without the right role gets 403 regardless of what the
browser shows. The sidebar only shows sections the signed-in role may use.

## Examination Results

Results are organised into **batches** — one class + examination + academic
year with a human title like *Annual Examination Result 2082*. Teachers (and
Super Admins) manage them in **Admin → Examination Results**:

1. **Upload Results** opens a wizard: name the batch, pick the class,
   examination and academic year (all managed in **Admin → Academic Setup**),
   then drop a CSV.
2. The file is validated row by row and previewed — valid / error / duplicate
   counts, exact per-row messages ("Row 18 — student name is missing"), and a
   choice to **skip** or **update** duplicates. Nothing is ever silently
   overwritten.
3. Importing creates Draft results inside the batch. Review, edit or add
   single results (with the Bikram Sambat date picker), then **Publish** the
   batch to make it findable on the public **/results** page.

CSV columns: `student_name, date_of_birth, gpa, result_status, remarks` — the
class, examination and year come from the batch, so rows never repeat them.
`date_of_birth` is **Bikram Sambat** (`2068-04-15` = 15 Shrawan 2068); the
server validates it against the BS calendar and stores an AD mirror alongside.
A template is downloadable in the upload dialog. Files up to 2 MB / 5,000 rows
per import; the admin tables paginate (25/50/100), so 10,000+ results stay
fast.

Families search with the student's full name, BS date of birth and class
(year optional — newest first). A match opens a celebration popup — gentle
sparkles, staged reveal, GPA front and centre — with a full result view and a
print layout; `prefers-reduced-motion` switches it all to a plain fade. The
public endpoint returns at most one published record with minimal fields, is
rate limited, and the results tables have no anon access at all.

### Marksheets

Give a batch a **marks scheme** (subjects with full and pass marks — a
standard set is pre-filled) and it becomes a marksheet batch: the CSV carries
one column per subject plus `roll_number`, `section` and `attendance`
(`180/200`); grades, grade points, percentage, GPA and pass/fail are computed
on the NEB letter-grading scale, so nothing is ever typed twice or left
stale. Each result then has an official **Grade Sheet**: school crest and
details, student particulars, subject table, summary strip, attendance,
remarks, grading key, Class Teacher / Principal signature lines, a seal area
and the date of issue (BS and AD). Staff open it from the Marksheet icon on
any row; families get *View Marksheet* and *Download Marksheet (PDF)* after a
successful result search — links are signed for that one result, so sheets
can't be enumerated. The PDF is drawn natively (vector, ~15 KB) and prints
cleanly on A4. Branding lives in Admin → Settings → *Marksheet & official
documents* (logo link, principal's name, established year, registration no.,
motto). Batches without a scheme keep working as GPA-only results.

**Existing Supabase projects** that already used the older flat results table:
run `supabase/migration-results.sql` once in the SQL Editor — it creates
`result_batches`, groups existing rows into batches, and converts dates of
birth to BS strings. Projects that already have batches run
`supabase/migration-marksheet.sql` once to add the marks scheme and marksheet
columns. Fresh projects just run `supabase/schema.sql`.

## Scripts

```bash
npm run dev             # develop
npm run build && npm start   # production
npm run hash-password -- "pw"  # local-mode admin credential
npm run seed:supabase   # copy /data seeds into Supabase (one-time)
```

## Deploying

- **Local mode** needs a persistent Node server with a writable disk (VPS,
  Railway, Render…).
- **Supabase mode** runs anywhere, including Vercel — nothing is written to
  disk. Set the same env vars in the host's dashboard.

## Security notes

- `.env.local` is git-ignored; `.env.example` documents every variable.
- The service-role key is read only in server files (`lib/supabase.ts`) and
  has no `NEXT_PUBLIC_` prefix, so Next.js excludes it from client bundles.
- Middleware fails closed: with no valid session, `/admin` redirects and all
  write APIs (plus reads of applications/messages/activity) return 401. The
  only unauthenticated writes are the two public forms.
