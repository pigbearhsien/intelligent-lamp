# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Serve the built bundle
npm run lint       # ESLint (--quiet: errors only)
npm run lint:fix   # ESLint with autofix
npm run typecheck  # tsc against jsconfig.json (checkJs on .js/.jsx)
```

There is no test runner configured.

Requires an `.env.local` with `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` (see README.md). Optional: `VITE_BASE44_FUNCTIONS_VERSION`.

## Architecture

A Base44-backed React 18 + Vite SPA — a study-tracking app ("專注學習"). The UI is in Traditional Chinese.

**Backend is Base44, accessed only through the SDK client.** All data and auth flow through the singleton `base44` client in [src/api/base44Client.js](src/api/base44Client.js):
- `base44.entities.<Entity>.{list,filter,create,update}(...)` for CRUD. Entities: `Exam`, `StudySession`, `StudyGroup`, `Environment`, plus built-in `User`. Their schemas live in [docs/](docs/) as `.txt` JSON files.
- `base44.integrations.Core.InvokeLLM({ prompt, response_json_schema })` for AI features (e.g. focus-coaching in [src/components/FocusComment.jsx](src/components/FocusComment.jsx)). It returns the parsed JSON object directly.
- `base44.auth.*` for everything auth (`me`, `loginViaEmailPassword`, `loginWithProvider`, `register`, `verifyOtp`, `resetPassword`, `logout`, `redirectToLogin`).

There is no custom REST layer — never `fetch`/`axios` a backend directly except the one raw `createAxiosClient` call in AuthContext that reads app public-settings.

**Config resolution** ([src/lib/app-params.js](src/lib/app-params.js)): app params (`app_id`, `access_token`, etc.) resolve from URL query → localStorage → Vite env var, in that order. The access token is read from the URL then stripped from it. This is how the app receives its identity when embedded in the Base44 Builder.

**Auth flow** ([src/lib/AuthContext.jsx](src/lib/AuthContext.jsx) + [src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx)): `AuthProvider` first fetches the app's public settings (which signals `auth_required` / `user_not_registered` via a 403 `extra_data.reason`), then verifies the user if a token exists. `App.jsx` gates the whole tree on these loading/error states; `ProtectedRoute` wraps the authenticated routes and redirects to `/login` when unauthenticated.

**Routing** ([src/App.jsx](src/App.jsx)): public routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) sit outside `ProtectedRoute`; the app routes (`/`, `/calendar`, `/timer`, `/groups`) are nested inside `ProtectedRoute` → `Layout` (top nav). Use `createPageUrl()` from [src/index.ts](src/index.ts) to build page URLs.

**Provider nesting** is `AuthProvider` → `QueryClientProvider` → `Router`. The shared React Query client ([src/lib/query-client.js](src/lib/query-client.js)) defaults to no refetch-on-focus and a single retry.

## Conventions

- `@/` aliases `src/` (configured in both vite.config.js and jsconfig.json).
- UI is shadcn/ui ("new-york" style) under [src/components/ui/](src/components/ui/) — generated, JSX (not TSX). Add components via the shadcn CLI per [components.json](components.json); don't hand-edit them. Use `cn()` from [src/lib/utils.js](src/lib/utils.js) for class merging and `lucide-react` for icons.
- The `vite.config.js` Base44 plugin enables `visualEditAgent`, `hmrNotifier`, and `analyticsTracker` — changes pushed to the repo reflect back into the Base44 Builder, so keep edits SDK-idiomatic.

### Entity field naming — read before touching data code

Entity field keys are **Traditional Chinese** in the schemas (e.g. `StudySession` has `日期`, `科目`, `開始時間`, `總時長(分鐘)`, `專注度(1-10)`; `Exam` has `考試日期`, `科目`, `我的成績`, `全校平均`, `排名`). Some components correctly query by these Chinese keys (e.g. [src/components/PerformanceChart.jsx](src/components/PerformanceChart.jsx), [src/components/SubjectTimeTable.jsx](src/components/SubjectTimeTable.jsx) use `日期`/`考試日期`), while others read/write **English** keys that don't exist in the schema — `date`, `subject`, `duration_minutes`, `focus_score` ([src/components/FocusComment.jsx](src/components/FocusComment.jsx), [src/components/StudyTimer.jsx](src/components/StudyTimer.jsx)) and `exam_date` ([src/components/ExamCalendar.jsx](src/components/ExamCalendar.jsx)). This mismatch is a live source of bugs: queries filtering on the wrong key silently return nothing. When working with entity data, confirm the actual field name against the schema in [docs/](docs/) rather than trusting the surrounding code.

Note `docs/StudyGroup.txt` actually contains the `Exam` schema (mislabeled), so it is not a reliable source for `StudyGroup`'s shape.
