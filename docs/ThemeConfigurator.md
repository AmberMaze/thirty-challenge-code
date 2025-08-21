# ThemeConfigurator Notes

Location: `src/components/ThemeConfigurator.tsx`

Purpose

This component is the single place for runtime theme selection and simple customization (color pickers for primary/secondary/accent).

Developer notes

- Atoms used:
  - `themeAtom` (string union: 'light'|'dark'|'football'|'neon')
  - `customColorsAtom` (object: primary/secondary/accent/background/surface)
  - `isDarkModeAtom` (derived boolean)

- `handleThemeChange(newTheme)` should:
  1. Remove prior theme classes from `html` (light, dark, football, neon).
  2. Add the new theme class to `html`.
  3. If the chosen theme is a dark-like theme, also add the `dark` class to `html` to activate Tailwind `dark:` utilities.

- Adding color pickers:
  - Use native `<input type="color">` for simple pickers. Update `customColorsAtom` on change.
  - For more advanced UX, consider a small color-swatch component and an accessible label.

- Persistence options:
  - Local: use `atomWithStorage` (Jotai utilities) or `useEffect` to sync `customColorsAtom` to `localStorage`.
  - Remote: sync to Supabase user metadata on explicit "Save".

Testing

- Add unit tests for `ThemeConfigurator` that verify:
  - Theme class changes on `html` when selecting themes.
  - `customColorsAtom` updates when pickers change.
  - Reset-to-defaults restores expected atom values.

Docs

- When changing behavior, update `docs/DocsGuide.md` and `docs/TODOs.md` in the same commit per the repository rules.
