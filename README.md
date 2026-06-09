# Slack Clone (UI/UX)

A Slack-inspired UI clone built with Next.js and Tailwind CSS. No backend required — runs entirely in the browser with mock data.

## Features

- Slack-style login and signup screens (any credentials work)
- Dark purple sidebar with channel list
- Message feed with welcome header, timestamps, and avatars
- Send messages (stored in local state)
- Create new channels via modal

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) — sign up or log in with any email/password.

## Live demo (GitHub Pages)

[https://brovaset.github.io/Slack-Clone/](https://brovaset.github.io/Slack-Clone/)

Pushes to `main` deploy automatically via GitHub Actions. In your repo settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Tech stack

- Next.js 15 (App Router)
- React + TypeScript
- Tailwind CSS
- Mock data + localStorage (no Supabase needed)
