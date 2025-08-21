# Theme System

Overview

This document explains the runtime theming approach used by the app and how to add or modify themes.

Key points

- Themes are implemented via CSS custom properties (CSS variables) defined on theme classes applied to the `html` element (for example: `html.classList.add('football')`).
- The following variables are used across the UI components: `--theme-primary`, `--theme-secondary`, `--theme-accent`, `--theme-background`, `--theme-surface`.
- Tailwind's `dark:` variant is still leveraged by adding a `dark` class to `html` for dark-mode specific utilities.

How to add a theme

1. Add a CSS block for the new theme in `src/index.css` following the existing pattern (define the `--theme-*` variables).
2. Update any theme presets in `src/state/themeAtoms.ts` if a preset object is used.
3. Ensure `ThemeConfigurator` (UI) exposes the new theme option and that the `handleThemeChange` logic adds the theme class to `html` and removes previous theme classes.

Persisting custom colors

- `customColorsAtom` holds the runtime custom palette (primary/secondary/accent/background/surface).
- Persisting these values is intentionally out of scope for the runtime change and should be done either via:
  - `localStorage` (quick, local-only): use `useEffect` in `ThemeConfigurator` or a small atom wrapper (e.g., `atomWithStorage`) to persist and rehydrate.
  - Server-side persistence (user profile): store the palette in the user's profile in Supabase and load it on sign-in.

Notes

- Keep new theme assets small and avoid large imagery to respect bundle size limits.
- Register any new docs about themes in `docs/DocsGuide.md` and update `docs/TODOs.md` to reflect remaining work.
