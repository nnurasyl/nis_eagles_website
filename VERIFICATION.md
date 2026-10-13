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

## Recovery-email delivery investigation — 2026-10-14

The user requested recovery on www.niseagles.study for qurmangali_n63@hbalm.nis.edu.kz. Resend shows the actual latest recovery email as Delivered. Microsoft 365 acknowledged it with SMTP 250 2.6.0 and Queued mail for delivery; the captured server message ID and InternalId are recorded in SUPABASE-EMAIL-SETUP.md for school IT tracing. The sender is no-reply@niseagles.study, display name Nurassyl - IT Ministry. Inbox placement remains unverified; the user is checking Microsoft quarantine. No password-reset links were opened, no credentials changed, and no extra email was sent.


## Personal email and contact phone — 2026-10-14

- Direct Desktop source changes accept valid personal and school email addresses in registration, login, recovery and Auth session handling. Email confirmation remains required.
- New registration asks for an international contact number; profile supports adding, editing and clearing it. No SMS provider or verification is used. The number is private to the owner and admins and grants no authentication privileges.
- open-email-registration.sql is additive and rollout-compatible: old accounts and clients may have a null phone; current signup requires a phone. The old admin directory RPC is preserved; admin_list_contacts adds private contact access.
- Ten unit tests, TypeScript and optimized production build pass. Isolated PGlite checks cover personal/school email validation, confirmation requirements, private contacts, role protection, club create/join, event management, deletion cascades and migration reruns. No real account was created/deleted or recovery email sent during these tests.
- Isolated browser fixture confirms personal-email profile loading and formatted contact saving. Registration was checked on mobile at 390 px in kk/ru/en and laptop at 1366 px; fields fit without horizontal overflow.
- Language labels now reserve space for the right arrow and sit approximately 5 px left of the whole control center. Height and vertical alignment are preserved.
- Live database migration is awaiting the action-time confirmation; source changes require a new Vercel deployment.
- Follow-up presentation changes remove the personal-email and no-SMS helper text from registration/profile in all languages, and remove the decorative season dot from Shanyrak standings. Production build passed after both edits; the live local page visibly shows the season without the dot.


## Signup failure diagnosis — 2026-10-14

- Read the actual Auth /signup failure in Supabase, request 01a136c5-a1fe-7ae6-9d5b-e53baefcc2a7. HTTP 500 is caused by the unchanged school-email trigger: Only @hbalm.nis.edu.kz school accounts are allowed. The request origin is https://www.niseagles.study.
- The personal-email form is published but open-email-registration.sql has not yet run. The SQL editor still shows Click Run to execute your query. Action-time confirmation for expanding enrollment is pending; no SMTP change or password action is needed for this failure.

- After the user confirmed Apply now, executed open-email-registration.sql on the live production database. SQL Editor returned Success. No rows returned. All 11 read-only checks passed: personal/school emails, invalid-email rejection, old trigger removal, new trigger enabled, contact column, confirmation requirement, profile RLS, anonymous directory/contact edits denied, and owner/admin preserved. This supersedes the pending-migration notes above. End-to-end signup with a real email/password is left to the user; no credentials entered or email sent by the agent.


## Admin user directory fix — 2026-10-14

- Reproduced the live RPC error 42804: Auth email is character varying(255), but both directory functions declared text. Original PGlite fixtures used email text and missed this production compatibility issue.
- Both admin_list_contacts and admin_list_students now select u.email::text. Applied additive fix-admin-directory.sql to the live project; privileges, verification and administrator guards stay unchanged. Corrected both setup migration sources too.
- Six live checks pass: both directory functions return users, exact email search returns the owner, both anonymous RPC executions remain denied, and current owner administrator status remains true. Only counts/booleans were queried; no users or roles were modified.
- Updated the fixture to varchar(255): it fails on the original code and passes on the corrected functions, including existing owner access, contact privacy, confirmed-email rules and migration reruns. Ten unit tests and production build pass.
- Admin data-loading errors use their own localized message in kk/ru/en; failed People requests clear old rows. This interface change requires deployment to Vercel; the actual live directory fix already applies to the existing site.
- Main local server was restarted on port 3000. No account credentials entered and no administrator roles granted or revoked during verification.


## Ideas and administrator deletion — 2026-10-14

- Added /ideas, homepage invitation and navigation/footer links. kk/ru/en translations and Onest typography match the existing style. Ideas are private to authors/admins; admin status updates are reflected in the author history.
- Added typed-email confirmation for admin_delete_user. Self deletion remains in the profile; owner deletion is blocked in both UI and SQL. Owned clubs/memberships cascade; ideas retain content with a null author.
- Applied ideas-admin.sql to live Supabase after explicit action-time user confirmation. No real account was deleted or real suggestion inserted. Six read-only live checks pass for RLS/private ideas, denied anonymous access, new authenticated RPC grants, denied direct writes, admin inbox query and preserved owner/directory.
- PGlite fixtures use actual Auth email varchar(255). Tests pass for verified submission, length checks, rate limit, private author reads, no spoofing/direct edits, admin statuses, anonymous denial, wrong-confirmation rejection, self/owner protection, club/member cascades, author anonymization, migration reruns and preserved roles.
- Isolated browser copy confirms submission and own history, admin status changes visible to author, deletion disabled for incorrect email and successful deletion of a reload-restorable fixture. No auth credentials entered. Layout checks cover laptop 1280 px and mobile 390/320 px; no horizontal overflow at 320 px. All three languages checked; viewport overrides reset.
- Ten unit tests, TypeScript and production build pass. No Vercel publication performed; new frontend features require redeployment.
