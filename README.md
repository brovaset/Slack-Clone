# Slack Clone

A Slack-inspired team messaging app built with Next.js, Tailwind CSS, and Supabase.

## Features

- Real sign up / sign in with Supabase Auth
- Channels with membership — add or remove teammates
- Channel and direct messages stored in Postgres
- Per-user views — each person sees only their channels and DMs
- Real-time message updates
- Profile status and presence

## Quick start

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL migrations in `supabase/migrations/` via the Supabase SQL editor
3. Enable Realtime for `messages`, `dm_messages`, and `channel_members`
4. Copy env vars:

```bash
cp .env.local.example .env.local
```

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Live demo (GitHub Pages)

[https://brovaset.github.io/Slack-Clone/](https://brovaset.github.io/Slack-Clone/)

### GitHub Pages + Supabase

Static export bakes env vars in at **build time**. Add these **repository secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → publishable/anon key |

(`NEXT_PUBLIC_SUPABASE_ANON_KEY` works as an alternative name for the key secret.)

In Supabase → Authentication → URL configuration, add:

- **Site URL:** `https://brovaset.github.io/Slack-Clone/`
- **Redirect URLs:** `https://brovaset.github.io/Slack-Clone/**`

Then re-run the deploy workflow (or push to `main`).

## Security

See [SECURITY.md](./SECURITY.md) for auth, RLS, and deployment notes.

## Tech stack

- Next.js 15 (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
