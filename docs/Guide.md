# Guide to this repository

This guide helps you find the right documentation and explains which part of the codebase does what.

Overview
- Project name: Thirty Challenge (realtime football quiz)
- Live: https://quiz.tyshub.xyz (Netlify)

Important docs and when to use them
- `docs/PROJECT_OVERVIEW.md` — Canonical project description, tech choices, goals.
- `docs/SETUP.md` — Local setup and environment variables (`.env` examples), how to run dev servers.
- `docs/DAILY_CO_INTEGRATION.md` — Video integration details, Netlify functions for rooms/tokens.
- `docs/QUIZ_STRUCTURE.md` — Quiz segments, scoring rules, and mechanics.
- `docs/VSCode.md` — Editor/debugging setup and Copilot usage tips.
- `docs/AGENTS.md` — How AI/coding agents should approach changes, PR checklist and hard NOs.
- `docs/Environment-variables-Netlify.md` — Which env vars Netlify expects and their scopes.
- `docs/WORKFLOWS.md` — CI/CD and GitHub Actions guidance.
- `docs/VIDEO_ROOM_FIX.md` — Notes about video room bug fixes and current architecture.

Where code lives (quick map)
- `src/` — Main application code
  - `src/components/` — UI components used across pages
  - `src/pages/` — Route pages (Lobby, ControlRoom, QuizRoom, etc.)
  - `src/segments/` — Segment-specific logic and hooks (BELL, SING, REMO)
  - `src/state/` or `state/` — Jotai atoms used for app state
  - `src/lib/` and `src/api/` — Integration helpers (Supabase, Daily, sync utilities)
- `netlify/functions/` — Serverless functions for Daily.co room/token operations and other backend tasks
- `public/` — Static assets

Quick start checklist
1. Copy `.env.example` to `.env.local` and populate keys (do not commit)
2. Run `pnpm install` then `pnpm run dev` (or `pnpm run dev:netlify` to include functions)
3. Open `http://localhost:5173` (Vite) or `http://localhost:8888` (Netlify dev)

Notes for agents/Copilot
- Follow `docs/AGENTS.md` for PR checklist and hard NOs.
- Avoid introducing circular dependencies; run `pnpm dep:graph` after structural changes.
- Keep atoms small and single-responsibility.

If you need help, start with `docs/PROJECT_OVERVIEW.md` and open an issue describing intent.
