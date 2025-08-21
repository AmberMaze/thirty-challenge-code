# Chrome Development Setup Guide

Chrome-optimized setup instructions for the Thirty Challenge football quiz app.

## Prerequisites

- **Google Chrome** (Primary development browser) - Latest version recommended
- **Node.js** 18+
- **pnpm** (Package manager - project uses pnpm workspace)
- **Git**

## Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd thirty-challenge-code
   pnpm install
   ```

2. **Environment Variables Setup**
   Create a `.env.local` file in the project root (this file is gitignored):

   ```bash
   # PUBLIC (VITE_ prefix - sent to browser)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_DAILY_DOMAIN=your-team.daily.co

   # PRIVATE (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   DAILY_API_KEY=your_daily_api_key_here
   ```

3. **Development Modes**

   ```bash
   # Frontend only (Vite dev server on :5173)
   pnpm dev

   # Full stack with Netlify functions (:3000)
   pnpm dev:netlify

   # Production preview
   pnpm preview
   ```

## Chrome Development Setup

### VSCode Chrome Debugging

The project is optimized for Chrome debugging with multiple launch configurations:

- **Chrome + Vite Dev**: Debug React app with hot reload
- **Chrome + Netlify Dev**: Debug full-stack with functions
- **Chrome Mobile View**: Test responsive design (375x812)
- **Chrome Production**: Debug live site at https://thirtyquiz.tyshub.xyz/

### Chrome DevTools Features

- React Developer Tools integration
- Source map debugging for TypeScript
- Network request monitoring for Supabase/Daily.co
- Mobile device simulation for Arabic RTL testing
- Performance profiling for bundle size optimization

### Browser Extensions Recommended

- React Developer Tools
- Redux DevTools (for Jotai debugging)
- JSON Formatter (already installed)
- Lighthouse (performance auditing)

## Development Workflow

### Quick Commands

```bash
# Build and type-check
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Check dependencies
pnpm dep:graph
```

### Chrome Tasks (via VSCode)

- `Ctrl+Shift+P` → "Tasks: Run Task"
- **Chrome: Launch Debug** - Opens Chrome with debugging
- **Chrome: Open Production Site** - Quick access to live site
- **pnpm: dev** - Start development server

## MCP Tools Integration

The project includes Model Context Protocol servers for enhanced development:

- **Context7**: Library documentation lookup
- **Memory**: Project knowledge graph
- **ImageSorcery**: Image processing for logos/assets
- **Playwright**: Browser automation testing
- **Firecrawl**: Web scraping and content analysis

## Mobile Testing (Chrome DevTools)

### Arabic/RTL Testing

1. Open Chrome DevTools (`F12`)
2. Toggle device toolbar (`Ctrl+Shift+M`)
3. Select iPhone/Android device
4. Test Arabic language toggle
5. Verify RTL layout and text direction

### Performance Testing

- Bundle size: Target <200 kB JS
- Lighthouse scores: Aim for 90+ on mobile
- Arabic font loading optimization

## Security & Environment

### What Goes Where

- **`.env.local`**: Local development secrets (gitignored)
- **Netlify Environment**: Production secrets (via Netlify dashboard)
- **`VITE_` variables**: Public, sent to browser
- **Non-prefixed variables**: Server-side only

### Never Commit

- Service role keys
- API keys
- `.env` files
- Personal browser profiles

## Troubleshooting

### Chrome Issues

- Clear browser data: `Ctrl+Shift+Delete`
- Disable extensions if debugging fails
- Check remote debugging port conflicts (9222-9225)

### Development Server

- Port conflicts: Change Vite port in `vite.config.ts`
- CORS issues: Use `pnpm dev:netlify` for full-stack testing
- Hot reload not working: Restart dev server

### Build Issues

- TypeScript errors: Run `pnpm tsc --noEmit`
- Bundle size: Check `bundlemeta.json` after build
- Missing dependencies: Run `pnpm install`

## Project Structure for Chrome Development

```
├── .vscode/                    # Chrome debugging configs
│   ├── launch.json            # Chrome launch configurations
│   ├── tasks.json             # Build and Chrome tasks
│   └── settings.json          # Chrome-optimized settings
├── public/                    # Static assets
│   └── tahadialthalatheen/    # Arabic branding assets
├── src/                       # React application
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── state/                 # Jotai atoms
│   └── styles/                # Tailwind styles
└── netlify/functions/         # Edge functions
```
