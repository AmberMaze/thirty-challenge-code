# GitHub Actions Suggestions

This repository already includes workflows under `.github/workflows`. The key files are:

- **ci.yml** – installs dependencies, runs tests, lints the code and builds the project.
- **lint.yml** – runs ESLint on pull requests touching TypeScript files.
- **deploy.yml** – example workflow deploying to Netlify using the `netlify/actions` CLI.

If additional automation is required, consider creating workflows that:

1. Run `pnpm run lint` and `pnpm test` on every push to ensure quality.
2. Deploy the `dist` folder to Netlify or another host after successful tests on the `main` branch.
3. Automatically regenerate `full-dependency-map.json` using `madge` when source files change.

These templates can be copied and adapted from the existing files.
