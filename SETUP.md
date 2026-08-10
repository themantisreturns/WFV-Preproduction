# WFV v3 — Google login + shared Supabase setup

The site code is wired for Google sign-in, band-only access, shared song edits/checklists/discussion, realtime updates, and private demo/PDF storage.

You only need to connect your own Supabase + Google credentials. Those cannot be created from the ZIP because they belong to your accounts.

## 1) Create a Supabase project
Create a new project in Supabase.

In **Project Settings / API**, copy:
- Project URL
- Publishable key (or anon key if your project still labels it that way)

Put them in `config.js`.

The publishable browser key is intentionally client-side. Security comes from the Row Level Security policies in `supabase-setup.sql`.

## 2) Add the four Google accounts
Open `supabase-setup.sql` and replace these four placeholders with the actual Google accounts:
- JAY_GOOGLE_EMAIL@gmail.com
- BART_GOOGLE_EMAIL@gmail.com
- SCOTT_GOOGLE_EMAIL@gmail.com
- DEREK_GOOGLE_EMAIL@gmail.com

Then run the whole SQL file in **Supabase > SQL Editor**.

## 3) Enable Google login
In Google Cloud / Google Auth Platform:
1. Create or choose a project.
2. Configure the OAuth consent screen/audience.
3. Create a **Web application** OAuth client.
4. Use the callback URL shown in **Supabase > Authentication > Providers > Google** as the authorized redirect URI. It normally looks like:
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
5. Put the Google Client ID and Client Secret into **Supabase > Authentication > Providers > Google** and enable Google.

In **Supabase > Authentication > URL Configuration**:
- Set Site URL to the final GitHub Pages URL.
- Add the final GitHub Pages URL to Redirect URLs.
- While testing from a local web server, also add that localhost URL.

## 4) Upload the private audio and lyric PDFs
In **Supabase > Storage**, open the `wfv-private` bucket created by the SQL.

Upload the contents of this ZIP's local `assets` folder preserving these paths:
- `audio/<song file>.mp3`
- `lyrics/<song title>.pdf`

The site requests short-lived signed URLs only after an approved band member signs in.

### Important
Do **not** put `assets/audio/` or `assets/lyrics/` into the public GitHub repository. `.gitignore` is included to help prevent that.

## 5) Deploy the site
GitHub Pages is fine for the static site. Commit the code files, but not the private audio/PDF folders.

Once deployed, send the URL to the band. They click **Continue with Google** and must use one of the four approved email accounts.

## How shared data works
- Song key/BPM/status/structure/chords/arrangement/harmony/member tasks sync to Supabase.
- Preproduction and recording checkmarks sync.
- Song discussion notes sync.
- Realtime updates are enabled on the shared workspace table, so another member's change appears without needing a new build.
- Each update records the signed-in member name in the database.

## Local preview
If `config.js` still contains placeholders, the site opens in **LOCAL PREVIEW** mode and behaves like v2.3 using browser storage. That lets you keep reviewing the design before Supabase is connected.
