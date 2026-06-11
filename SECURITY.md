# Security

This project uses **Supabase Auth** and **Row Level Security (RLS)** for multi-user messaging. It is suitable for learning and small teams, not hardened production Slack replacement without additional review.

## What is protected

- **Supabase Auth** — email/password sign up and sign in; sessions refreshed via middleware
- **Row Level Security** — users only read channels, messages, and DMs they belong to
- **Input sanitization** — messages, channel names, status text, and emails are validated and length-limited
- **Client rate limiting** — message sends, channel creation, and auth attempts are throttled in the browser
- **Content Security Policy** — restricts scripts and connections; allows Supabase API endpoints
- **Secrets** — real keys live in `.env.local` (gitignored); `.env.local.example` uses placeholders only

## What requires care

- The publishable Supabase key is exposed in the client bundle (expected for browser apps); security relies on RLS policies
- Client-side rate limits can be bypassed via DevTools — add server-side limits for production scale
- GitHub Pages serves a public static bundle; auth and data access are client-side against Supabase
- Huddles, threads, and third-party apps are UI placeholders without backend support

## Reporting

If you find a security issue, open a GitHub issue with reproduction steps.
