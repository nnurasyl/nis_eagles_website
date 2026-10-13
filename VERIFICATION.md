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


## Registration troubleshooting

- Vercel now bundles the supplied Supabase Project URL and publishable key; public reads succeed.
- Actual Auth logs show POST /signup returning 500 with SMTP address parsing error: too many colons in address. SMTP Host is incorrectly set to http://127.0.0.1:3000, and the user confirmed that no email service has been connected.
- Set Site URL to https://www.niseagles.study and added this exact origin to allowed Redirect URLs. Saved settings were verified in the Supabase dashboard.
- Added distinct localized messages for email delivery failures, account creation failures, and request limits. Eight tests and production build pass.
- SMTP provider/domain verification/API key must be configured by the user. No live signup/email-delivery success is claimed; school email restriction and confirmation remain enabled.
- Step-by-step instructions saved in SUPABASE-EMAIL-SETUP.md.


- Follow-up: the latest /signup failure was Resend 550: niseagles.study domain not verified. User-added Vercel DNS records exactly matched Resend requirements and resolved on authoritative DNS. Triggered Verify DNS Records; domain and all three required records reached Verified. SMTP form remains unsaved and its Username needs to be exactly resend; saving credentials is left to the user. No successful live signup/email-delivery claim is made.

- Final delivery follow-up: Resend Emails shows the school confirmation email with status Delivered. This confirms acceptance by the recipient's mail server. The user reports it is not visible in the inbox; inbox/spam/quarantine placement and clicking the confirmation link remain unverified. No mailbox access or additional email sending was performed.

## Profile and administration update — 2026-10-13

- Applied profile-admin.sql and grant-owner.sql to the connected Supabase database after explicit user confirmation. The owner account qurmangali_n63@hbalm.nis.edu.kz is email-verified and has is_admin=true and is_owner=true.
- Live public REST reads: 19 active Shanyraks, all points zero; 13 government positions. Anonymous profiles, memberships and administrator-directory RPC access are denied.
- Production routes now include /profile and /admin. Profile names, current-password-protected changes, recovery confirmation and own-account deletion are implemented. Administration controls appear only through the profile button.
- PGlite checks cover migration reruns, cleared leaders, private profiles, protected roles, owner transfer, last-admin preservation, deletion cascades/member counts, verified-only actions and public/archive visibility. No live accounts or school events were deleted during tests.
- Browser fixtures tested profile name editing, event create/draft/edit/publish, role confirmation/cancel, and mobile layouts at 360 and 390 px; laptop at 1366 px. Fixtures are isolated in a temporary project and are never deployed. Live sign-in/password-change testing still requires the account holder; credentials were not requested or entered.
- Onest.ttf cmap verified for Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі. A single full font is used; OFL license is included. Kazakh date formatting has a month-name fallback because Chromium may return ICU placeholders such as M11.
- Language labels use centered text with no inner padding and fixed 38 px desktop / 34 px mobile heights.
- Nine unit tests, TypeScript and the production build pass.

- A normal-student fixture cannot enter /admin and has no Admin profile link. Password mismatches are rejected before making an Auth request. The self-deletion form starts disabled until the school email is typed. The profile recovery modal is accessible. Auth dialogs retain their mode during exit animations, preventing a sign-in title flash on close.
