# Verification · 13 October 2026

## Supabase connection

- The user-supplied Project URL and publishable key are saved in ignored .env.local in the deliverable and running Desktop copy. No secret/service-role credentials are present.
- Live requests to club_directory, events, and shanyraks returned HTTP 200. Clubs/events are empty; all 20 Shanyraks have zero points.
- Anonymous profile and club_members reads returned permission denied, as intended.
- Public Auth settings confirm email accounts are enabled and email confirmation is required.
- SMTP delivery, verified sign-in, and authenticated club creation/joining cannot be verified without a real school account and mailbox; no fabricated live users or clubs were created.

## Languages and responsive UI

- Kazakh is the default, including server-rendered document language and route metadata. Russian and English are available through the header language select. Selection persists across navigation and reload.
- Navigation, headings, empty states, form labels/placeholders, client validation, Auth errors, notifications, categories, government roles, dates, participant grammar, and accessibility labels are localized.
- People and Shanyrak names retain the exact supplied spelling. Student-written club/event content retains its original language. Category values submitted to Postgres remain canonical English values.
- 60 browser checks: four pages × three languages × 320/390/768/1024/1440 px widths. No horizontal overflow, heading/name/role clipping, or overlapping header groups was observed.
- Mobile menu and registration modal work at 320 px. Russian sign-in rejects non-school email with a localized message before calling Auth. Language persistence was checked after reload.
- Corrected word spacing when mobile cards hide line breaks. Localized tab titles are preserved against streamed Next.js metadata.
- President, council, nine ministries, and 19 active Shanyrak leader rows are shown. Finance: Әбдіқайым Гүлжауһар; ecology: Сәрсенбек Камилла. Алаш: Назаркина Алима Станиславовна. Алмалы: Өмірбек Инеш. Алатау is excluded from the site; all active Shanyraks have a supplied leader name.

## Automated checks and build

- Seven tests pass: email/domain validation, club/password bounds, zero-point Shanyraks, three-language completeness, interface/category/role coverage, plural grammar, and localized Auth errors.
- Strict TypeScript and Next.js optimized production build pass. Production uses Webpack because the local Windows Turbopack CSS subprocess failed.
- Routes: /, /clubs, /shanyraks, /ministries, and normal not-found page.
- Final production route language/title checks passed.
- Both original photos remain bundled in public; the roster reference is in references.

## Earlier schema checks

The PostgreSQL schema ran successfully in PGlite with Supabase Auth stubs. Checks covered domain enforcement, unverified-user rejection, private profiles/memberships, administrator protection, founder membership, join/leave counts, ownership, and event/score permissions. These earlier fixture checks do not substitute for authenticated live testing.

## Delivery

The running project is C:/Users/Lenovo/Desktop/nis-eagles on http://127.0.0.1:3000/. The task deliverable is outputs/nis-eagles and its ZIP. Public .env.local is included in the ZIP for local running and ignored by Git. For Vercel, enter the two environment variables in its project settings. No Vercel deployment has been made.


## Latest roster changes

- Changes made directly in C:/Users/Lenovo/Desktop/nis-eagles.
- Supabase row 11 was renamed from Жетісу to Алмалы through a transaction; ID and zero points were preserved.
- Алатау is excluded from the public site query and both lists. Its existing database row is preserved; new-project schema seeds only the 19 active Shanyraks.
- Homepage and ranking heading derive the number from the active roster, with localized grammar.
- Seven existing tests and the optimized production build passed in the Desktop project.
- Browser checks confirmed 19 rows, no Алатау or Жетісу in either list, and all corrected names. Changed pages passed at 320/390/768/1024/1440 px; final counts were checked on all three languages at 320 and 1440 px.
- Server runs from the Desktop project on http://127.0.0.1:3000/.
