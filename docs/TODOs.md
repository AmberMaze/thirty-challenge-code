# TODOs

This is a living TODO file intended for both humans and automated agents. Keep entries short and actionable.

Sections

## Pages

- ~~Landing: finish theme polish, ensure `ActiveGames` responsive sizing, remove quick-preview (done)~~
  - Rationale: Quick preview removed and ActiveGames sizing adjusted in `Landing.tsx` — 2025-08-21

- Game Lobby: accessibility pass, keyboard navigation

## Flows

- Real-time sync: improve reconnection resilience for Supabase channels

- Video rooms: automatic cleanup of stale Daily rooms (Netlify function review)

## Features

- Theme system: persist custom colors and apply them globally (write CSS vars from `customColorsAtom`)

- Color picker: add background/surface pickers and live preview
  - Note: partial implementation added for primary/secondary/accent pickers; background/surface and persistence remain TODO — 2025-08-21

- Onboarding: add a quick guided tour for new hosts

## Documentation Consolidation

- ✅ Consolidated minimal documentation files into DEVELOPER_GUIDE.md, REFERENCE.md, and enhanced SETUP.md

- ✅ Removed redundant documentation files: DocsGuide.md, Guide.md, reactconfig.md, VSCode.md, CHROME_SETUP.md, DAILY_CO_INTEGRATION.md, QUIZ_STRUCTURE.md, Theme.md, ThemeConfigurator.md, Environment-variables-Netlify.md

## Tests

- Add Vitest unit tests for `themeAtoms` and `ThemeConfigurator` (recommended: test persistence and CSS var propagation)

- E2E smoke test for creating a game and joining

## Docs

- DocsGuide.md: keep updated with new docs (this file created 2025-08-21)

- Add usage examples for `pnpm` commands in `SETUP.md`

## Infra / Deployment

- Pin Netlify build image and document env var differences between preview and production

Notes

- When an automated agent (Copilot) completes a task that changes behavior, it must update this file in the same commit to reflect status changes.

- Strike-out convention: when an item is finished or superseded, wrap the line in ~~strikethrough~~ and add a one-line rationale and ISO timestamp.

Change log

- 2025-08-21: Initial TODOs.md created — Copilot
