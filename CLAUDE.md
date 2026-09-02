# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env.local        # then: npm run hash-password -- "a password"
npm run dev      # dev server on http://localhost:3000
npm run build    # production build — the only real verification step in this repo
npm run start    # serve the production build
```

Without `ADMIN_PASSWORD_HASH` in `.env.local` the CMS is unreachable by design (the public site is unaffected). `npm run hash-password` prints the `.env.local` lines to paste.

`npm run lint` is declared but **eslint is not installed and there is no eslint config** — `next lint` will drop into its interactive setup prompt. Don't run it non-interactively. There are no tests and no test runner; `npm run build` (type-check + static generation of all routes) is the verification gate for any change.

The first build needs internet access: Poppins is fetched by `next/font/google` at build time, and every image points at `images.unsplash.com` (the only host allowed in `next.config.mjs` `remotePatterns` — adding an image from another domain requires adding its hostname there).

**Git caveat:** this directory is not its own git repository. `git rev-parse --show-toplevel` resolves to the user's home directory, whose history contains unrelated projects. Don't assume `git log`/`git status` output relates to this codebase, and don't commit here without checking with the user.

## Stack

Next.js 14 App Router + TypeScript (`strict`) + Tailwind. Import alias `@/*` maps to the project root (`@/lib/content`, `@/components/ui/Button`). Icons come from `lucide-react`. Route `params` are plain objects, not promises (Next 14 semantics) — see `app/(site)/news/[slug]/page.tsx`.

## Architecture

Two route groups plus an API, under one root layout (`app/layout.tsx`, which loads Poppins into `--font-poppins` and builds its metadata from `settings.json`):

- `app/(site)/…` — public website, wrapped by `app/(site)/layout.tsx` (skip link + `Header` + `Footer`). Pages are **server components** that compose section components; each exports `metadata`. `app/(site)/page.tsx` is nothing but an ordered list of `components/site/home/*` sections.
- `app/admin/(dashboard)/…` — CMS, wrapped by `AdminShell` (client: collapsible sidebar, mobile drawer, sidebar nav `groups` array). Every dashboard page is `"use client"` except the dashboard index, which reads live counts on the server.
- `app/api/…` — route handlers that read and write the JSON in `/data`.

### The data seam

**Editable content lives in `/data` as JSON and is served by `/api`.** `news.json`, `notices.json` and `events.json` hold one record per entry; `settings.json` holds the school details, social links, map embed and SEO text.

- `lib/store.ts` — the only module that touches `fs`. Reads are direct; writes are serialized through one promise chain and land via write-to-temp-then-rename. **Never import it (or `lib/data.ts`) from a client component.**
- `lib/data.ts` — server reads plus the *projections* the public site renders: `getPublicPosts()` folds published news + notices + `Event`-category events into one `Post[]` feed for `/news`, `getCalendarEvents()` and `getEventsPage()` derive the calendar and the featured/upcoming/past split from the same event records.
- `lib/collections.ts` — normalizers that rebuild each record field by field, so unknown keys in a request body never reach disk. `lib/collection-api.ts` holds the handler bodies; the files under `app/api/**` are thin wrappers (`GET`/`POST` on the collection, `GET`/`PATCH`/`DELETE` on `[id]`, `GET`/`PUT` for settings), each with `dynamic = "force-dynamic"` so Next doesn't cache them.
- `lib/visibility.ts` — `isPublicEntry()`, the single rule for what the website shows: status `Published`, or `Scheduled` with a date that has arrived. It is `fs`-free so the admin can apply the same rule in the browser.

Public pages read the store directly (no self-`fetch`); `app/(site)/layout.tsx` sets `dynamic = "force-dynamic"` for the whole group, so an admin edit is live on the next refresh. Slugs are unique across news, notices *and* events, because all three publish under `/news/<slug>`.

The admin dashboard is the mirror image: client pages call the API through `components/admin/useCollection.ts` (load, create, update, remove, with `saving`/`error` state), and edit records in the shared `EntryForm` modal, whose field list per collection is the whole editor definition. Writing changes needs a writable filesystem — a Node server, not a read-only serverless target.

`lib/content.ts` now keeps only structural page content (nav, programmes, facilities, gallery, admissions copy); `lib/admin-data.ts` keeps the mock data for the sections still unwired (applications, messages, media, users, homepage sections, traffic).

`lib/images.ts` is a keyed image map (`img.hero`, `img.lab`, …) for that structural content, so swapping a photo is a one-line change. News and event photos, by contrast, are plain URLs on the record — editable from the admin form.

### Auth

`middleware.ts` is the gate, and it fails closed:

- `/admin/*` — no valid session cookie redirects to `/admin/login?next=<path>`; visiting the login page *with* a session bounces to `/admin`.
- `/api/*` — `POST`/`PATCH`/`PUT`/`DELETE` need a session and return `401 {"error":"Sign in to make changes."}` without one. **`GET` stays open** because the public website renders from those reads.
- `/api/auth/*` is exempt, or signing in would be impossible.

The password lives only as an scrypt hash in `ADMIN_PASSWORD_HASH` (`.env.local`, gitignored; `.env.example` documents it, `npm run hash-password` generates it). `lib/auth-password.ts` verifies it with `timingSafeEqual` in the Node runtime; the hash is colon-separated because **dotenv expands a dollar sign inside .env values** and would silently corrupt a `$`-separated hash. `POST /api/auth/login` sets `steam_admin_session` — httpOnly, SameSite=Lax, Secure in production, 8h or 30d with "stay signed in" — signed with HMAC-SHA256 by `lib/auth-token.ts`, which uses **Web Crypto only** so middleware can verify it on the Edge runtime. Never import `lib/auth-password.ts` (or anything Node-specific) from middleware. `AUTH_SECRET` signs the cookie and falls back to the password hash, so changing the password signs everyone out.

Env values are read into the Edge bundle at build time — **rebuild after changing `.env.local`**, not just restart.

Local mode has one shared admin credential; in Supabase mode staff accounts live in Supabase Auth + `public.profiles` (role/status), managed under Admin → Users.

### Shared primitives — reach for these before writing markup

- `components/ui/` — `Button`/`ButtonLink` (variants `primary|dark|outline|ghost|light`, sizes `sm|md|lg`), `Badge` + `statusTone(status)` (maps the `Status`/`AppStatus`/`MsgStatus` string unions to a tone), `Field` + `inputCls`, `Reveal` (IntersectionObserver scroll-in).
- `components/site/Section.tsx` — `Section` (tone `paper|ivory|ink|white`, standard `max-w-shell` + vertical rhythm), `SectionHead` (eyebrow + display heading + lead), `PageHero`. Public pages should be built from these, not from bespoke wrappers.
- `components/admin/ui.tsx` — `PageHeader`, `Card`, `DataTable`, `Status`, plus `Loading`, `ErrorNotice`, `NoResults`, `QuickAction`. `DataTable` renders a real table on `md+` and restacks rows as labelled cards on mobile; feed it `columns` + `rows` (arrays of cells) + optional `renderActions(rowIndex)`.
- `components/admin/Toolbar.tsx` — the search + filter-pill row every list page uses. `RowActions` takes `onEdit`, `onDelete` (with its own inline confirm) and `previewHref`, which opens the live public page.
- `components/admin/EntryForm.tsx` — the modal editor; `components/admin/eventFields.ts` is the shared event field list used by both Events and Calendar.

The standard admin list page is: `useCollection` → `PageHeader` → `ErrorNotice` → `Card` → `Toolbar` (search/filter over the loaded array) → `Loading` / `NoResults` / `DataTable` with `RowActions`, plus an `EntryForm` when a row is being created or edited (`app/admin/(dashboard)/news/page.tsx` is the reference implementation).

## Design system

Tokens live in `tailwind.config.ts` — semantic color names only (`paper`, `ivory`, `mist`, `ink`/`ink-soft`, `charcoal`, `slate2`, `teal-*`, `sun-*`), `max-w-shell` (76rem), `shadow-soft`/`shadow-lift`, `rounded-xl2`. Use these rather than raw hex or default Tailwind grays.

`app/globals.css` defines the signature classes: `.display` (tight extra-bold headings), `.eyebrow` (uppercase micro-label that draws its own teal rule via `::before`), `.mark` (warm-yellow marker underline applied to **one word** inside a display heading), `.reveal`/`.is-in`, `.img-zoom`, `.hero-media`, `.nice-scroll`. All motion is inside `@media (prefers-reduced-motion: no-preference)` — keep new animations behind that guard.

Accessibility and responsiveness are load-bearing here, not decoration: semantic landmarks, a global focus-visible ring, `aria-current`/`aria-pressed`/`aria-label` on interactive controls, keyboard-operable lightbox and drawers, and layouts that must not overflow horizontally at 390px (tables → cards, sidebar → drawer). The public desktop nav appears from `lg` (1024px) and uses condensed padding plus each item's optional `short` label (from `lib/navigation.ts`) between `lg` and `xl` to stay on one line — verified at 1024/1152/1279px. Match that bar in new work.


## Results, academics and navigation (v4)

- **Results are batch-based.** `lib/results-shared.ts` holds the types: a `ResultBatch` (title, class *name*, examination, academic year, published flag) owns `ExamResult` rows (name + normalized name, `date_of_birth_bs` + `date_of_birth_ad` mirror, gpa, status, remarks). Identity inside a batch = normalized name + BS dob — the duplicate rule the importer and the unique DB index share. Publishing is batch-level only.
- **CSV pipeline** lives in `lib/results-csv.ts` (parse + validate, exact per-row issues, `CSV_TEMPLATE`) and `lib/results.ts` (`importIntoBatch` with `skip`/`update`, plus a `mode: "check"` pre-count reached through `/api/results/import`). Class/exam/year come from the batch, never from CSV rows. Caps: 2 MB, 5,000 rows.
- **Bikram Sambat** is handled only through `lib/bs-calendar.ts` (wraps `nepali-date-converter`; `isValidBs` round-trips because the library rolls invalid days over). Store BS strings, compute the AD mirror server-side, render with `bsDisplay`. The shared `components/ui/BSDatePicker.tsx` is the one date input for results.
- **Public search** (`/api/results/search`) is deliberately narrow: exact normalized name + BS dob + class, published batches only, newest year first, one minimal record out, rate-limited. Never widen it to partial matches or lists.
- **Academic setup** (`lib/academics.ts`, Admin → Academic Setup) is the single source of classes/examinations/years for uploads, filters, and the public form — never hardcode class lists.
- **Navigation** is CMS content: `lib/navigation.ts` (defaults + `normalizeNavigation` + `publicNavigation`), edited at Admin → Navigation, consumed by `components/site/Header.tsx` via the site layout. `lib/content.ts` no longer exports a nav.
- The result celebration modal + sparkles live in `components/site/ResultSearch.tsx` with keyframes at the end of `app/globals.css`; printing uses the `body.result-print` visibility trick so only the card prints. Keep all of it behind the reduced-motion guard.

## Marksheets

- The marks scheme lives on the batch (`subjects: SubjectDef[]`); marks live on the result (`marks: Record<subject, number|null>`). `lib/grading.ts` is the only place grades/GPA/pass-fail are computed — the CSV validator, single add/edit routes and the marksheet all call it, and the stored `gpa`/`result_status` are always re-derived from marks when a scheme exists (`patchResultWithScheme`). Never hand-write a GPA for a scheme batch.
- `lib/marksheet.ts` builds the one view model both renderers consume: `components/results/MarksheetSheet.tsx` (HTML, A4 metric sizing, inline styles so print matches screen) and `lib/marksheet-pdf.tsx` (`@react-pdf/renderer`, standard Helvetica — no font files to ship; it's listed in `serverComponentsExternalPackages`). Keep the two layouts in step.
- `/api/marksheet/[id]` accepts a staff session OR a family token from `lib/marksheet-token.ts` (HMAC of the result id with `AUTH_SECRET`), issued only by a successful public search. Token access is limited to published batches.
- Branding fields (`logoUrl`, `principalName`, `establishedYear`, `registrationNo`, `motto`) are on `SiteSettings`.

## Homepage, staff, popup, passwords (v7)

- Accent: `.mark` is a teal-coloured word, not an underline; on dark sections (`.bg-ink`) it is soft teal. There is no yellow (`sun-*`) on the homepage — keep it that way.
- Homepage order lives in `app/(site)/page.tsx`: Hero → NewsBoard → AboutPreview → Highlights → Teachers → LifeAtSchool → AcademicsPreview → WhySteam → StudentLifePreview → Journey → Testimonials → CTA. `Stats`/`StatsBand` and `FacilitiesPreview` are intentionally unused.
- Staff: `lib/staff.ts` (JSON doc `staff.json`), `/api/staff`, Admin → Teachers & Staff. `Teachers` (homepage, `featured` only) and `/about#teachers` (all published) render from it; both hide when empty.
- Popup: `popup` boolean on NewsItem/NoticeItem/EventItem (normalised in `lib/collections.ts`), `getPopupPost()` in `lib/data.ts` picks the newest flagged live item, `AnnouncementPopup` is rendered by the site layout and remembers dismissal per session.
- Passwords: `PATCH /api/users/[id] { password }` is Super Admin only (already existed; the Users page now exposes it). `POST /api/auth/password { current, next }` lets anyone change their own after re-verifying the current password. Both are Supabase-mode features; local mode explains the env-var route.
- Navigation defaults no longer include a "Campus" group; Student Life and Gallery sit under About. Live sites keep whatever is in their `navigation` document — edit it in Admin → Navigation.

## Homepage v8 + staff directory

- Homepage is `Hero → FeaturedNews → SchoolUpdates → ImportantNotices → UpcomingEvents → LifeAtSchool → Teachers → AboutPreview` (`components/site/home/LatestNews.tsx` holds the four news sections). Each renders nothing when empty. Older sections (Highlights, WhySteam, Journey, Testimonials, CTA, NewsBoard, StatsBand…) are unused on the homepage but still power inner pages — don't delete them casually.
- Staff types/constants live in `lib/staff-shared.ts` (browser-safe); `lib/staff.ts` re-exports them and adds storage. Client components must import from `staff-shared`.
- `/teachers` is a compact directory (`components/site/StaffDirectory.tsx`: 2/3/4-column grid, category tabs, search, profile modal). `publicNavigation()` guarantees a top-level "Teachers & Staff" item even if the saved menu lacks one.
- `Section` has a `compact` prop; mobile padding was reduced globally. `globals.css` clips horizontal overflow on html/body as a safety net — fix the real cause if something still overflows.

## Homepage v9 (premium redesign)

Flow (v10): Hero (parallax via `HeroParallax`) → AboutPreview → StudentExperience → LifeAtSchool → NoticesAndEvents (4 notices, 3 events; no news on the homepage) → Teachers (≤6 featured) → Achievements (news matching award/achievement words) → Moments (gallery masonry + `Lightbox`) → FinalCTA (photo-backed). All CMS-driven; each section hides when empty.

## Homepage v11 (light editorial redesign)

Flow: Hero (light, photo right) → AboutPreview → LifeAtSchool (six STEAM discipline tiles + side card) → NoticesAndEvents (two light panels, notices wider) → StudentExperience → Teachers (six + directory card) → AchievementsMoments (list + masonry) → FinalCTA (photo card). `HeroParallax` and the standalone Achievements/Moments components are no longer used on the homepage.

## Homepage v12 (spacious editorial)

Flow: Hero → AboutPreview (50/50) → NoticesAndEvents → LifeAtSchool (editorial grid, Science large / Sports wide) → StudentExperience (large + supporting photo, four words) → Teachers (centred, ≤6) → Achievements (icon list) → Moments (masonry) → FinalCTA. Section padding is py-16/24/32 by design — keep the whitespace. Hero/intro copy defaults live in `lib/homepage.ts` (the CMS overrides them).

## Settings (v13)

- Settings is split into pages under `app/admin/(dashboard)/settings/` (General, SEO & Sharing, Social Media, Marksheets, Error Pages, Maintenance Mode, Security), all rendered through `components/admin/SettingsShell.tsx` (tabs + load/save of the single settings document). Add a new settings area by adding a page there and a tab in `SETTINGS_TABS`.
- `SiteSettings.seo` gained keywords / shareTitle / shareDescription / shareImage / faviconUrl (root metadata uses them); `errorPages` feeds `app/not-found.tsx`, `app/(site)/error.tsx` and `/access-denied`; `maintenance` is enforced in `middleware.ts` (rewrite to `/maintenance` for visitors without a session, flag read from `/api/settings/public`, cached 10 s) with a second gate in the site layout.
- `getSettings()` in `lib/data.ts` defaults every newer field so older saved documents keep working.

## Marksheet v2 (v14)

Lean composition: header (logo from `settings.logoUrl` or `/public/school-logo.png`), student card, marks table (S.N., Subject, Full, Pass, Obtained, Grade, Grade Point), five-tile result summary (Total, Obtained, Grade, GPA, PASS/FAIL), optional remarks, one-line grading key, CMS-managed signatures, footer. No percentage, rank, QR, seal or per-subject remarks — don't add them back. `settings.marksheet` (Settings → Marksheets) holds showLogo/headerNote/footerNote/signatures mode + signature images and the Class Teacher's name; the Principal's name is `settings.principalName`. The PDF route inlines `/public` images as data URLs (`inlineIfLocal`) because react-pdf can't load site-relative paths.
