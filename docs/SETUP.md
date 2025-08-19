# SETUP.md (moved to docs)

Contains setup instructions and environment variable examples for local development and Netlify. Use it when configuring a local `.env` or starting `pnpm run dev` / `pnpm run dev:netlify`.

# Setup Guide

## Environment Variables Setup

Create a `.env.local` file in the project root (this file is gitignored):

```bash
# PUBLIC (VITE_ prefix)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_DAILY_DOMAIN=your-team.daily.co

# PRIVATE (no VITE_ prefix)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DAILY_API_KEY=your_daily_api_key_here
```

## Running the Development Server

- Frontend only: `pnpm run dev` (Vite)
- Full stack (with Netlify functions): `pnpm run dev:netlify`

## Security Notes

- Never commit service role keys or `.env` files.
- Only `VITE_` prefixed vars are sent to the browser.
