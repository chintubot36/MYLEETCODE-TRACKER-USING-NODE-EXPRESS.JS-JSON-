# Sai's LeetCode

A personal LeetCode dashboard for **kiran_sai45**.

## Features

- Dashboard with total solved, Easy/Medium/Hard counts
- All solved problems
- Topic/category sections
- Search and filters
- Recent solves
- Automatic polling every 20 seconds
- Server-side persistent storage in `data/solved.json`
- Save your own accepted source code for each problem
- Direct links back to LeetCode

## Important limitation

The website now first uses a public solved-list endpoint intended to return the user's **complete solved-problem history**, rather than only the last 20/100 accepted submissions. If that service is temporarily unavailable, the site falls back to recent accepted submissions. Therefore:

1. A newly accepted problem is automatically detected and stored.
2. The problem title, slug, language, date, difficulty and topic tags are stored.
3. Your actual source code must be pasted once into **Add code / View code**.
4. The saved source code is then stored by this website.

This avoids putting your LeetCode password/session cookies into the project.

The project first uses LeetCode's public GraphQL query for recent accepted submissions and falls back to the community `alfa-leetcode-api` service if needed. It provides profile, solved, submission and problem-detail endpoints.

## Run locally

Install Node.js 18+.

```bash
npm install
npm start
```

Open:

http://localhost:3000

## Environment variables

Optional:

```bash
LEETCODE_USERNAME=kiran_sai45
PORT=3000
LEETCODE_API=https://alfa-leetcode-api.onrender.com
```

## Deploy

Deploy the Node/Express project to a service that supports a persistent filesystem if you want `data/solved.json` to survive restarts.

For production, a real database such as PostgreSQL/Supabase is recommended.

## Sync behavior

The server checks the complete solved list every 20 seconds. You can also press **Sync now**.

Because this relies on a community API rather than a stable official public LeetCode API, the sync may occasionally fail or be delayed if the upstream service is unavailable.

References:
- LeetCode profile: https://leetcode.com/u/kiran_sai45/
- alfa-leetcode-api: https://github.com/alfaarghya/alfa-leetcode-api


## Sync fix in this version

The sync endpoint now uses the configured `LEETCODE_USERNAME` instead of a hard-coded username, calls LeetCode directly first, reports errors instead of silently returning stale data, and tells the dashboard how many new problems were detected.


## Full historical code import

For a complete historical import, use the included Chrome extension in `extension/`.

The public LeetCode profile is not enough to retrieve all of your submitted source code. Authenticated LeetCode GraphQL operations can return all submissions and submission details including code. The included extension runs in your logged-in LeetCode browser context and sends imported data to the local site.

See `extension/README.md`.
