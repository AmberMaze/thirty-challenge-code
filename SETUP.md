# Setup Guide

## Environment Variables Setup

### 1. Local Development

Create a `.env.local` file in the project root (this file is gitignored):

```bash
# === PUBLIC VARIABLES (VITE_ prefix) ===
# These will be visible in the browser bundle

# Supabase public configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Daily.co domain (optional, defaults to daily.co)
VITE_DAILY_DOMAIN=your-team.daily.co

# === PRIVATE VARIABLES (NO VITE_ prefix) ===
# These are NEVER sent to the browser - only used in Netlify Functions

# Supabase service role key (admin access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Daily.co API key (can create/delete rooms)
DAILY_API_KEY=your_daily_api_key_here
```

### 2. Netlify Environment Variables

In your Netlify dashboard, go to Site Settings → Environment Variables and add:

| Variable                    | Value                          | Scopes    |
| --------------------------- | ------------------------------ | --------- |
| `VITE_SUPABASE_URL`         | Your Supabase URL              | Builds    |
| `VITE_SUPABASE_ANON_KEY`    | Your Supabase anon key         | Builds    |
| `VITE_DAILY_DOMAIN`         | Your Daily.co domain           | Builds    |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Functions |
| `DAILY_API_KEY`             | Your Daily.co API key          | Functions |

### 3. Running the Development Server

For local development with Netlify Functions:

```bash
pnpm run dev:netlify
```

For regular Vite development (without functions):

```bash
pnpm run dev
```

## Security Notes

- **NEVER** put service role keys or API keys with `VITE_` prefix
- **NEVER** commit `.env.local` files to git
- Only `VITE_` prefixed variables are sent to the browser
- Private variables are only available in Netlify Functions

## Daily.co Integration

The app now uses proper Daily.co integration with:

- Server-side room creation via Netlify Functions
- Secure token generation for users
- No API keys exposed to the browser
- Automatic room management per game session
