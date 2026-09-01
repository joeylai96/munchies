# Munchies

A calorie tracker with real accounts (email, Google, GitHub), a Postgres
database (Supabase), and AI food-photo analysis, deployable to Netlify.

## Architecture

- **Frontend**: React + Vite, deployed as a static site.
- **Auth + Database**: Supabase (Postgres + Auth). Row Level Security means
  every table is locked to `auth.uid()` — a user can only ever see their own
  rows, even though the anon key ships in the browser bundle.
- **Backend**: two Netlify Functions (`netlify/functions/`) hold the two
  secrets that must never reach the browser — your Anthropic API key (for
  food-photo analysis) and your Supabase *service role* key (for account
  deletion).

## 1. Create a Supabase project

1. Go to https://supabase.com, sign up, click **New project**.
2. Once it's ready, open **SQL Editor** → **New query**, paste in the entire
   contents of `supabase/schema.sql`, and click **Run**. This creates the
   tables, locks them down with Row Level Security, and sets up a trigger
   that auto-creates a profile row whenever someone signs up.
3. Go to **Project Settings → API**. You'll need three values later:
   - `Project URL` → this is `VITE_SUPABASE_URL` / `SUPABASE_URL`
   - `anon public` key → this is `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → this is `SUPABASE_SERVICE_ROLE_KEY` (keep this
     one secret — never put it in a `VITE_` variable or commit it)

## 2. Turn on Google and GitHub sign-in

In Supabase: **Authentication → Providers**.

**Google**
1. Enable the Google provider.
2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an OAuth Client ID (type: Web application).
3. Add this Authorized redirect URI (Supabase shows you the exact value on
   the same Providers page): `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Paste the resulting Client ID and Client Secret into Supabase and save.

**GitHub**
1. Enable the GitHub provider in Supabase.
2. In GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
3. Authorization callback URL: same pattern,
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
4. Paste the Client ID and Client Secret into Supabase and save.

Email/password sign-in works with no extra setup — Supabase sends the
confirmation emails automatically on the free tier.

## 3. Get a free Gemini API key (for photo analysis)

1. Go to https://aistudio.google.com/apikey and sign in with any Google account.
2. Click **Create API key**. No billing account or credit card required for the
   free tier — it's genuinely free, rate-limited rather than metered (roughly
   1,500 requests/day on `gemini-1.5-flash`, far more than a personal app needs).
3. This key is **only** ever used inside `netlify/functions/analyze-food.mjs`,
   which runs on Netlify's servers — it's never sent to the browser.

## 4. Push this project to GitHub

```bash
cd munchies-app
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repo on GitHub, then follow GitHub's own instructions to
push (`git remote add origin ...`, `git push -u origin main`).

## 5. Deploy on Netlify

1. Go to https://app.netlify.com, sign up, **Add new site → Import an
   existing project**, connect your GitHub account, pick this repo.
2. Build settings are already correct via `netlify.toml`
   (`npm run build`, publish `dist`) — Netlify should detect this automatically.
3. Before the first deploy (or right after, then redeploy), go to
   **Site configuration → Environment variables** and add:

   | Key | Value | 
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `VITE_USDA_API_KEY` | your free USDA FoodData Central key (optional — falls back to a shared low-limit demo key) |
   | `GEMINI_API_KEY` | your free Gemini API key from step 3 |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
   | `SUPABASE_URL` | your Supabase project URL (same value, used server-side by the delete-account function) |

4. Deploy. Netlify gives you a `*.netlify.app` URL — that's your live app.
5. Back in Supabase **Authentication → URL Configuration**, set the **Site
   URL** to your Netlify URL, and add it to **Redirect URLs** too, so OAuth
   logins redirect back to the right place instead of `localhost`.

## Local development

```bash
npm install
cp .env.example .env   # fill in VITE_ values; Netlify functions need the Netlify CLI to run locally
npm run dev
```

To test the Netlify Functions locally, install the Netlify CLI
(`npm install -g netlify-cli`) and run `netlify dev` instead of `npm run
dev` — it proxies both the Vite dev server and the functions together.

## What's already handled

- Row Level Security so users can only ever touch their own data.
- Secrets (Gemini key, Supabase service role key) never reach the client.
- Every paid dependency avoided on purpose: Supabase, Netlify, and Google's
  Gemini API all have genuinely free tiers with no credit card required, so
  this whole project costs $0 to run at personal-project scale.
- Self-service account deletion that cascades through the database via
  foreign keys, triggered from a verified, server-side function.
- Auto-created profile row + onboarding gate on first login, regardless of
  which auth method was used.
