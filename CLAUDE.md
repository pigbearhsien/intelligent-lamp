# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint (eslint-config-next)
```

There is no test suite. Before running, copy env and add an OpenAI key (required for the AI focus endpoint):

```bash
cp .env.example .env.local   # then set OPENAI_API_KEY=sk-...
```

## Architecture

A personal study-tracking app (UI is Traditional Chinese, `lang="zh-TW"`). Next.js 16 App Router, React 19, TypeScript (strict), Tailwind v4. The `@/*` import alias maps to the repo root.

**Data layer — an Excel file, not a database.** All persistence goes through [lib/excel.ts](lib/excel.ts), which reads/writes `data/study_data.xlsx` (created on first write) via `exceljs`. The README markets this as a feature: users back up by copying the `.xlsx`. Two sheets:
- `StudySessions` — one row per study session (subject, start/end, duration, focus score)
- `Exams` — one row per exam (date, subject, my score, class average, rank)

IDs are `Date.now().toString()`. `getWorkbook()` reads the whole file, mutations re-write the whole file — there is no row-level concurrency control, so concurrent writes can clobber each other. Domain types and the fixed `SUBJECTS` list live in [lib/types.ts](lib/types.ts); `Subject` is a closed union of Chinese subject names.

**API routes** (`app/api/*/route.ts`) are thin wrappers over `lib/excel.ts`, returning JSON and catching errors as `{ error }` with a 500:
- `sessions` — GET list / POST add
- `exams` — GET list / POST add; `exams/[id]` — PATCH update (params is a `Promise`, must be awaited)
- `ai/focus` — POST; sends aggregated stats to OpenAI (`gpt-4o`, `response_format: json_object`) and returns `{ comment, tips[] }`. This is the only route that talks to an external service.

**UI.** Each route under `app/<name>/page.tsx` is a thin server wrapper that renders a `'use client'` component from `components/` (`HomeClient`, `CalendarClient`, `TimerClient`). Client components own all state and call the API routes via `fetch`. `app/layout.tsx` wraps everything with the persistent `Nav`. The aggregation logic (totals, average focus, per-subject breakdown) lives in `HomeClient` before posting to `ai/focus`. The `groups` route is a placeholder ("coming soon") with no backing API.

## Migration note

The committed HEAD is an older Vite + React + base44 SPA (`src/`, `vite.config.js`, etc.). The working tree has replaced it with this Next.js app — those `src/` files show as deleted and the Next.js files (`app/`, `components/`, `lib/`, configs) are untracked. Treat the Next.js app as the source of truth; ignore the legacy `src/` SPA.
