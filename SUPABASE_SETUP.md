# Supabase Setup

The app runs in two modes, chosen automatically from `.env.local`:

| Mode | When | Content | Uploads | Login |
|---|---|---|---|---|
| **Local** (default) | No Supabase vars set | JSON files in `/data` | `public/uploads/` | `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` |
| **Supabase** | Vars below are set | Postgres (`cms_documents` + tables) | Supabase Storage | Supabase Auth accounts |

Local mode needs a writable Node server. Supabase mode works anywhere
(including serverless hosts) because nothing is written to disk.

## 1 · Create the project
1. [supabase.com](https://supabase.com) → **New project** (free tier is fine).
   Region: Singapore is closest to Nepal. Save the database password.
2. Project **Settings → API**: copy the Project URL, `anon` key, and
   `service_role` key.

## 2 · Environment variables
Add to `.env.local` (never commit this file):

```dotenv
NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."      # server only — never ships to the browser
AUTH_SECRET="run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
NEXT_PUBLIC_SITE_URL="https://your-domain.example"   # used in password-reset links
```

`SUPABASE_SERVICE_ROLE_KEY` is only ever read in server code
(`lib/supabase.ts`); no `NEXT_PUBLIC_` prefix means Next.js physically
excludes it from browser bundles.

## 3 · Schema
Supabase dashboard → **SQL** → paste `supabase/schema.sql` → Run.
This creates all tables, enables Row Level Security (anon key can touch
nothing directly — the app goes through server code), and creates the
`school-media` (public) and `school-documents` (private) buckets.

## 4 · Seed the content
```bash
npm run seed:supabase
```
Copies the current `/data` JSON (news, notices, events, settings, gallery,
homepage, testimonials, academic setup, navigation) into Postgres. From then
on the CMS reads and writes the database.

**Upgrading an existing project** that already held results in the older flat
`exam_results` table (per-row class/examination/year columns)? Run
`supabase/migration-results.sql` once instead of re-running the results part
of the schema — it creates `result_batches`, groups your existing rows into
batches, and converts dates of birth to Bikram Sambat strings. Fresh projects
skip this: `schema.sql` already contains the final shape.

**Adding marksheets to a project that already has result batches?** Run
`supabase/migration-marksheet.sql` once — it adds the subjects scheme and
marksheet columns without touching existing results.

## 5 · Admin account (Supabase Auth)
Dashboard → **Authentication → Users → Add user** → email + password
(untick "send confirmation" for the first account). With the anon key set,
`/admin/login` now verifies against Supabase Auth — the old
`ADMIN_PASSWORD_HASH` is ignored. "Forgot password?" on the login page sends
Supabase's reset email (configure the redirect under
**Auth → URL Configuration**, and SMTP under **Auth → Emails** for custom
sending).

Optionally give the account a role:
```sql
insert into public.profiles (id, name, role)
values ('<user-uuid from Authentication → Users>', 'Head Admin', 'Super Admin');
```

## 6 · Verify
1. Restart `npm run dev`, sign in with the Supabase account.
2. Create a notice in `/admin/notices` → check **Table editor →
   cms_documents → notices** — your notice is in the JSON.
3. Refresh `/news` — the notice is live.
4. Upload a photo in `/admin/gallery` → **Storage → school-media/gallery**
   holds the file; `/gallery` shows it.
5. Submit the public admission form → row appears in **applications** and in
   `/admin/admissions`.

## Roadmap
- **Email invitations** — the `invitations` table exists; the flow uses
  `supabase.auth.admin.inviteUserByEmail` plus Supabase SMTP settings. Until
  then, Super Admins create accounts directly from Admin Users.
- **Per-role publishing approval** — Editors currently publish like managers;
  a draft-approval step is the next refinement of `lib/roles.ts`.
- **Remaining homepage sections** (About/Academics/Facilities/Student Life
  previews) and a navigation/footer editor — same pattern as the hero editor.
- **Realtime dashboards** — the CMS re-reads on refresh and the notification
  bell polls every 30s; Supabase Realtime subscriptions can replace polling.
