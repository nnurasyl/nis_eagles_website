# NIS Eagles · 2026–2027

A responsive student government website for NIS Almaty-Nauryzbay. Built with Next.js App Router, TypeScript, Zustand, Tailwind CSS, Framer Motion, Lucide, and Supabase Postgres/Auth.

## What is included

- Your `back1.jpeg` hero photo at **50% opacity** and your `eagles.jpeg` logo, both bundled in `public/`.
- All 19 supplied Shanyrak leader names are shown in the standings and student government. Алмалы replaces Жетісу and is led by Өмірбек Инеш; Алаш is led by Назаркина Алима Станиславовна. The source photo is included in `references/shanyrakname.jpeg`, outside publicly served assets.
- Shanyraks are described as unions of two, three, or four classes.
- Responsive desktop/mobile navigation, bold typography, animation with reduced-motion support, keyboard-accessible dialogs, search and category filters.
- Kazakh (default), Russian, and English interface; language choice persists locally. All navigation, forms, status messages, categories, roles, date formatting, and participant counts are localized. People/Shanyrak names and student-written club/event content keep their original spelling.
- School-only email/password registration, email verification, sign-in/out, password recovery, private names/profiles.
- Student-created clubs, school-only membership, founder membership automatically added, accurate member counts, and founder deletion.
- Events on the homepage: an Events heading and a clear “Пока событий нет.” message when there are none, event details and calendar downloads when published. Administrators can publish and remove events.
- Separate `/clubs`, `/shanyraks`, and `/ministries` pages, keeping the homepage focused on a brief welcome, three navigation links, and events.
- All 19 Shanyraks from the provided screenshot on `/shanyraks`, initialized to zero. Equal scores display as tied.
- A ministries page with the president, council leadership, and nine ministry roles. Names remain in Kazakh. Finance: Әбдіқайым Гүлжауһар. Ecology: Сәрсенбек Камилла.
- An airy visual style based on the Satify reference: floating white navigation, centered headings, pastel accents, pill buttons, generous spacing.

There are **no invented live clubs or events**, and no fake login. The club directory shows a clear empty state until students publish clubs. Without database environment values, the public design works, but account actions explain that setup is still required.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local`. Open http://127.0.0.1:3000.

## Connect the school database (one-time setup)

1. Create a [Supabase project](https://supabase.com/dashboard). Use a **new project dedicated to this school**: the schema intentionally prevents non-school accounts throughout its Auth service.
2. In its SQL Editor, run **`supabase/schema.sql` once**. This creates profiles, clubs, private memberships, events, and the 19 zero-point Shanyraks, plus row-level permissions and server-side school-domain checks.
3. From the project Connect/API settings, copy the project URL and **publishable key** into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   A legacy public `anon` key also works in the second value. **Never use a service-role/secret key in a `NEXT_PUBLIC_` variable.**

4. In Authentication → Providers, enable Email and **keep Confirm email enabled**. Set the minimum password length to **10**. The database also independently requires verified school email before any student can create or join clubs.
5. In Authentication → URL Configuration, set Site URL to the deployed website URL. Add the exact deployed homepage URL and `http://127.0.0.1:3000` to Redirect URLs. Sign-up confirmations and password reset emails return to the homepage; the browser handles the recovery session and opens the new-password form.
6. Configure [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) for real students. Supabase's default email service is for testing and restricts recipients; production school verification needs a working email provider. Keep the built-in confirmation/reset email links (`{{ .ConfirmationURL }}`).
7. Register your administrator using their actual `@hbalm.nis.edu.kz` email and verify it. Run this in the SQL Editor, replacing the example:

   ```sql
   update public.profiles
   set is_admin = true
   where id = (
     select id from auth.users
     where lower(email) = 'your.admin@hbalm.nis.edu.kz'
       and email_confirmed_at is not null
   );
   ```

   Sign out/in after promoting the administrator. They will see **Add event** beside the events heading. Students cannot grant themselves administrator access.

## Deploy to Vercel

1. Upload this source folder to a GitHub repository, then **Import Project** in [Vercel](https://vercel.com/new). If this folder is nested in a repository, select it as the Root Directory.
2. Vercel detects **Next.js**. Use Node 22 or later; the standard install/build commands work automatically.
3. Add both `NEXT_PUBLIC_SUPABASE_*` values from the previous section to Production (and Preview if you want working preview accounts).
4. Deploy, then set the resulting Vercel URL in Supabase's Site URL and Redirect URLs as above.
5. Environment values are embedded at build time. Redeploy after changing them. The database persists in Supabase across Vercel deployments and all devices; it does not use Vercel's temporary filesystem.

Vercel hosting does not create a database or email service automatically. The above connection is required for live accounts/clubs. No paid secret or database credential is included in the project.

## Update Shanyrak points

All scores begin at zero. An authorized administrator can update them in the Supabase Table Editor, or through the SQL Editor:

```sql
update public.shanyraks set points = 10 where name = 'Алаш';
```

The website refreshes data on page load and when the browser tab regains focus. It does not claim real-time streaming. Event times are entered/displayed in Almaty (UTC+5). Only published future events appear on the homepage. Calendar reminders reserve one hour.

## Security and verification

Passwords are securely managed by Supabase Auth; the application never stores plaintext passwords. Emails stay in Auth, while `profiles` holds the student's name and role. Profiles/memberships are private; only aggregate member counts are public. Database policies enforce the school domain and verification, ownership, and administrator privileges even if someone bypasses the UI. Account sessions are managed by Supabase's browser client; Zustand holds UI state and does not persist passwords.

```sh
npm run typecheck
npm test
npm run build
```

For an optional database permission check, run `supabase/security-checks.sql` in a disposable Supabase test project after applying the schema. It creates transaction-only fixtures, checks authorization, and rolls everything back. Run against a test project rather than a live school project.

The supplied Supabase project is connected locally in ignored `.env.local`. Its public club/event reads and all 19 zero-point Shanyraks were checked; anonymous profile and membership reads were rejected. Email auth is enabled and email confirmation is required. A real verified school account is still needed to verify SMTP delivery, sign-in, and authenticated club creation end to end.

The source ZIP includes `.env.local` with the user-supplied public URL and publishable key for local running. Vercel needs these same two values entered in its Environment Variables settings; ignored local environment files are not uploaded by Git. No secret/service-role/database-password credentials are used.

The production build uses Next.js Webpack (`next build --webpack`) to avoid a local Windows Turbopack subprocess failure.

## Useful references

- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js deployment on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)


Current roster: 19 Shanyraks. Алатау is excluded from site queries, including existing Supabase projects. Existing stored rows are preserved. The homepage and ranking heading derive their community count from the loaded roster.
