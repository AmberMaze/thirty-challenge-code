# Docs Guide

This file explains the purpose and intended contents of each document under `docs/` and how automated agents should update them.

Purpose

- Provide a single place that maps docs to responsibilities and owners.

- Help agents (Copilot) register new docs and know where to update cross-references.

How to use

- When adding a new doc, add a short entry below describing: filename, purpose, owner (team/person), and any follow-ups.

- When an agent updates a doc, update this file to reflect the change and add a one-line rationale with ISO timestamp.

Documents index

- `AGENTS.md`
  - Purpose: Guidelines for automated agents beyond this file (operational advice, agent-run workflows).
  - Owner: Maintainers

- `CHROME_SETUP.md`
  - Purpose: Chrome-optimized development setup guide, VSCode debugging configurations, and MCP tools integration.
  - Owner: Frontend

- `current-flow.mmd`
  - Purpose: System flowchart and state-machine diagrams used for design & planning.
  - Owner: Architecture

- `DAILY_CO_INTEGRATION.md`
  - Purpose: Integration notes for Daily.co video service.
  - Owner: Infra / Video

- `Environment-variables-Netlify.md`
  - Purpose: Netlify environment variables and deployment instructions.
  - Owner: DevOps

- `Guide.md`
  - Purpose: Developer onboarding and local setup quick-start.
  - Owner: Maintainers

- `PROJECT_OVERVIEW.md`
  - Purpose: High-level product goals, audience, and release criteria.
  - Owner: Product

- `QUIZ_STRUCTURE.md`
  - Purpose: Domain model for quizzes, rounds, scoring, and game flow.
  - Owner: Design / Backend

- `reactconfig.md`
  - Purpose: React-specific runtime and conventions (hooks, error boundaries).
  - Owner: Frontend

- `SETUP.md`
  - Purpose: Full environment setup for new developers and CI.
  - Owner: Maintainers

- `VIDEO_ROOM_FIX.md`
  - Purpose: Notes and fixes related to video room stability.
  - Owner: Video

- `VSCode.md`
  - Purpose: Recommended VSCode extensions and settings.
  - Owner: Maintainers

- `WORKFLOWS.md`
  - Purpose: Developer workflows and PR process.
  - Owner: Maintainers

- `DocsGuide.md` (this file)
  - Purpose: Index and update rules for docs.
  - Owner: Maintainers

- `TODOs.md`
  - Purpose: Living project TODOs and scope (see TODOs.md for details).
  - Owner: Maintainers

- `Theme.md`
  - Purpose: Document theme system, CSS variables, and how to add new themes (color variables, dark-mode handling).
  - Owner: Frontend

- `ThemeConfigurator.md`
  - Purpose: Developer notes for `src/components/ThemeConfigurator.tsx` and `customColorsAtom` usage. Explains how to add color pickers and persist custom colors.
  - Owner: Frontend

Agent update rules

- Always add or update an entry here when you add a new doc in `docs/`.

- When deprecating a doc, mark it as deprecated with a strikethrough and add a short rationale and timestamp.

Change log

- 2025-08-21: Created initial DocsGuide.md — Copilot
- 2025-08-21: Registered Theme and ThemeConfigurator docs and noted Theme CSS variable guidance — Copilot
