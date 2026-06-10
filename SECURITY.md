# Security

This project is a **client-only UI demo**. It does not provide production-grade authentication, encryption, or server-side validation.

## What is protected

- **Input sanitization** — messages, channel names, status text, emails, and file names are validated and length-limited before use.
- **Rate limiting** — message sends, channel creation, and auth attempts are throttled in the browser.
- **No secret transmission** — passwords are never stored or sent to any server. Only a minimal demo profile is kept in `sessionStorage`.
- **Content Security Policy** — restricts scripts, images, and connections to same-origin resources.
- **Example env file** — `.env.local.example` uses placeholders only. Real keys belong in `.env.local` (gitignored).

## What is not protected (by design)

- Auth is cosmetic. Anyone can edit browser storage or bypass `AuthGuard`.
- Messages and channels live in memory only and reset on refresh.
- Client-side rate limits can be bypassed via DevTools.
- GitHub Pages serves a public static bundle.

## Reporting

If you find a security issue in this demo repo, open a GitHub issue with reproduction steps.
