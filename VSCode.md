# VSCode Development Guide for Thirty Challenge

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Debugging Setup](#debugging-setup)
3. [Error Tracing](#error-tracing)
4. [Development Environments](#development-environments)
5. [VSCode Copilot Usage](#vscode-copilot-usage)
6. [Recommended MCPs](#recommended-mcps)
7. [Performance Analysis](#performance-analysis)
8. [Testing Workflow](#testing-workflow)
9. [Essential Extensions](#essential-extensions)

## Prerequisites

### Firefox Setup for Development

**Step 1:** Install Firefox Developer Edition (Recommended)
- Download from [https://www.mozilla.org/en-US/firefox/developer/](https://www.mozilla.org/en-US/firefox/developer/)
- Developer Edition includes enhanced debugging tools and experimental features
- Install to `/usr/bin/firefox-devedition` (or update `launch.json` with your path)
- Regular Firefox also works but with fewer developer-specific features

**Step 2:** Configure Firefox for Development
- Open Firefox and navigate to `about:config`
- Search for and set these preferences:
  - `devtools.debugger.remote-enabled` → `true`
  - `devtools.chrome.enabled` → `true`
  - `devtools.debugger.prompt-connection` → `false`

**Step 3:** Install VS Code Firefox Debugger Extension
- Open VS Code Extensions panel (Ctrl+Shift+X)
- Search for "Debugger for Firefox"
- Install the official extension by Mozilla (`firefox-devtools.vscode-firefox-debug`)
- Restart VS Code after installation

**Step 4:** Create Firefox Profile for Persistent Extensions
- Firefox Developer Edition will create a dedicated profile for debugging
- Extensions and settings will persist across debugging sessions
- Profile is stored in `.vscode/firefox-profile` (automatically managed)

## Debugging Setup

### 1. Browser Debugger Configuration

**Step 1:** Install the Firefox Debugger extension for VS Code:
- Open VS Code Extensions panel (Ctrl+Shift+X)
- Search for "Debugger for Firefox" 
- Install the official Firefox debugger extension

**Step 2:** Create `.vscode/launch.json` in your project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Firefox (Vite Dev)",
      "request": "launch",
      "type": "firefox",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "firefoxExecutable": "/usr/bin/firefox-devedition",
      "sourceMaps": true,
      "keepProfileChanges": true,
      "profile": "${workspaceFolder}/.vscode/firefox-profile"
    },
    {
      "name": "Launch Firefox (Netlify Dev)",
      "request": "launch",
      "type": "firefox",
      "url": "http://localhost:8888",
      "webRoot": "${workspaceFolder}/src",
      "firefoxExecutable": "/usr/bin/firefox-devedition",
      "sourceMaps": true,
      "keepProfileChanges": true,
      "profile": "${workspaceFolder}/.vscode/firefox-profile"
    },
    {
      "name": "Attach to Firefox",
      "request": "attach",
      "type": "firefox",
      "port": 6000,
      "webRoot": "${workspaceFolder}/src",
      "firefoxExecutable": "/usr/bin/firefox-devedition"
    }
  ]
}
```

**Key Configuration Options:**
- `firefoxExecutable`: Path to Firefox Developer Edition
- `keepProfileChanges`: Preserves extensions and settings between sessions
- `profile`: Dedicated debugging profile to avoid conflicts with personal Firefox
- `sourceMaps`: Enables source map support for debugging TypeScript/JSX

**Step 3:** Start your development server:
- For Vite development: Run `pnpm run dev` in terminal
- For Netlify development: Run `pnpm run dev:netlify` in terminal

**Step 4:** Start debugging:
- Open VS Code's Debug panel (Ctrl+Shift+D)
- Select "Launch Firefox (Vite Dev)" or "Launch Firefox (Netlify Dev)" from dropdown
- Click the green play button to start debugging

### 2. Node.js Debugging for Netlify Functions

Add to `.vscode/launch.json`:

```json
{
  "name": "Debug Netlify Functions",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/netlify",
  "args": ["functions:serve", "--port", "9999"],
  "env": {
    "NODE_ENV": "development"
  },
  "console": "integratedTerminal",
  "restart": true,
  "protocol": "inspector"
}
```

### 3. React Developer Tools Integration

**Step 1:** Install Firefox browser extensions for development:
- Open Firefox and navigate to Firefox Add-ons (Ctrl+Shift+A)
- Search for and install:
  - **React Developer Tools** - Essential for React component debugging
  - **Redux DevTools** - For state inspection and time-travel debugging
  - **Vue.js devtools** - Alternative state management inspection

**Step 2:** Enable Developer Mode in Firefox:
- Open Firefox Developer Tools (F12)
- Navigate to Settings (gear icon)
- Check "Enable browser chrome and add-on debugging toolboxes"
- Check "Enable remote debugging"

**Step 3:** Verify extensions are working:
- Open your React application in Firefox
- Open Developer Tools (F12)
- Look for "React" and "Redux" tabs in the developer tools panel

## Error Tracing

### 1. Console Debugging Patterns

The project includes a standardized `debugLog` utility in `src/utils/debugLog.ts`:

```typescript
// Enhanced error logging for development
const debugLog = (component: string, action: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.group(`🐛 ${component} - ${action}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', data);
    console.trace('Call stack');
    console.groupEnd();
  }
};

// Usage in components
const MyComponent = () => {
  const handleClick = () => {
    debugLog('MyComponent', 'handleClick', { userId: 123 });
    // ... rest of logic
  };
};
```

**Integration Status:**
- ✅ Already integrated in `src/components/LanguageToggle.tsx`
- ✅ Already integrated in `src/pages/Lobby.tsx`
- 🔧 Add to other components as needed using the same pattern

### 2. Error Boundary for React

The `ErrorBoundary` component is located at `src/components/ErrorBoundary.tsx` and is automatically wrapped around the entire app in `src/main.tsx`.

**Features:**
- Catches JavaScript errors anywhere in the component tree
- Shows user-friendly error message in production
- Shows detailed error information in development mode
- Provides reload button for recovery
- Automatically logs errors to console with full stack traces

**Usage:**
```typescript
// Already integrated in main.tsx - wraps entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// For specific components that need isolation:
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### 3. Network Request Debugging

The `debugNetworkRequests` utility in `src/utils/debugNetworkRequests.ts` is automatically enabled in development mode via `src/main.tsx`.

**Features:**
- Intercepts all `fetch()` calls in development
- Logs request details (method, URL, headers, body)
- Logs response details (status, headers)
- Groups related logs for easy debugging
- Shows network timing and error information

**Integration Status:**
- ✅ Automatically enabled in `src/main.tsx`
- ✅ Works with all HTTP requests (Supabase, Daily.co, etc.)
- ✅ Only active in development mode

**Example Output:**
```
🌐 POST https://thirtyquiz.tyshub.xyz/.netlify/functions/create-daily-room
  Request: { method: 'POST', body: '{"roomName":"game-123"}' }
  Response: { status: 200, statusText: 'OK', headers: {...} }
```

## Development Environments

### Npm Run Dev vs Netlify Dev

| Aspect | `pnpm run dev` (Vite) | `netlify dev` |
|--------|---------------------|---------------|
| **Purpose** | Frontend-only development | Full-stack development with serverless functions |
| **Port** | 5173 (default) | 8888 (public), 5173 (internal) |
| **Serverless Functions** | ❌ Not available | ✅ Available at `/.netlify/functions/` |
| **Environment Variables** | Only `VITE_*` vars | All vars including function secrets |
| **Hot Reload** | ✅ Instant | ✅ Frontend only (functions require restart) |
| **Build Process** | Vite bundling | Vite + Netlify function bundling |
| **Production Similarity** | Partial | High (matches Netlify hosting) |

### When to Use Each

**Use `pnpm run dev` when:**
- Working on UI components
- Testing React state management
- Rapid frontend iteration
- No serverless function calls needed

**Use `netlify dev` when:**
- Testing Daily.co integration (requires functions)
- Testing Supabase with serverless functions
- Full end-to-end testing
- Debugging environment variable issues

### Setup Instructions

#### 1. Frontend-Only Development

**Step 1:** Ensure Firefox is installed and up to date on your system

**Step 2:** Open terminal and start the Vite development server:
```bash
# Navigate to project directory
cd your-project-directory

# Start Vite dev server  
pnpm run dev
```

**Step 3:** The server will start on http://localhost:5173

**Step 4:** Launch debugging in VS Code:
- Open VS Code Debug panel (Ctrl+Shift+D)
- Select "Launch Firefox (Vite Dev)" from the dropdown
- Click the green play button
- Firefox will open automatically with debugging enabled

**Benefits:** Fast hot reload, frontend-only features, ideal for UI development

#### 2. Full-Stack Development

**Step 1:** Ensure you have a properly configured `.env` file:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual API keys using your preferred editor
nano .env  # or code .env for VS Code
```

**Step 2:** Start the Netlify development server:
```bash
# Start Netlify dev server (includes serverless functions)
pnpm run dev:netlify
```

**Step 3:** The server will start on http://localhost:8888

**Step 4:** Launch debugging in VS Code:
- Open VS Code Debug panel (Ctrl+Shift+D)  
- Select "Launch Firefox (Netlify Dev)" from the dropdown
- Click the green play button
- Firefox will open automatically with debugging enabled

**Step 5:** Verify serverless functions are available:
- Functions are accessible at `http://localhost:8888/.netlify/functions/`
- Check the terminal for function compilation status

**Benefits:** Full environment simulation, serverless functions available, environment variables loaded

## VSCode Copilot Usage

### 1. Effective Prompting Strategies

```typescript
// Good: Specific context with types
// @copilot Generate a React hook for managing Daily.co room state with TypeScript
const useDailyRoom = (roomName: string) => {
  // Copilot will generate appropriate hook logic
};

// Good: Component with clear requirements  
// @copilot Create a bilingual button component that switches between English/Arabic
// Should accept language prop and onClick handler
const LanguageToggle = ({ language, onClick }: Props) => {
  // Copilot generates with proper types and styling
};

// Good: Error handling pattern
// @copilot Add proper error boundaries for async Supabase operations
const handleSupabaseQuery = async () => {
  // Copilot adds try-catch and error handling
};
```

### 2. Copilot Chat Commands

- **`/explain`** - Understand complex code sections
- **`/fix`** - Fix bugs and issues
- **`/tests`** - Generate unit tests
- **`/doc`** - Generate documentation
- **`/review`** - Code review suggestions

### 3. Workspace-Specific Prompts

```typescript
// Use project context for better suggestions
// @copilot Following the Thirty Challenge project patterns, create a new quiz segment
// Should use Jotai atoms for state and follow the segment structure in src/segments/

// @copilot Add Supabase real-time subscription following the project's channel patterns
// Use the existing connection utilities in src/api/supabase.ts
```

## Recommended MCPs

### 1. GitHub MCP
- **Purpose**: Direct repository access, issue tracking, PR management
- **Setup**: Already integrated in your development environment
- **Usage**: Code reviews, commit history analysis, automated testing

### 2. Supabase MCP
- **Purpose**: Database schema management, real-time debugging
- **Benefits**: Direct SQL query execution, table inspection, real-time subscription debugging

### 3. Daily.co MCP (Custom)
- **Purpose**: Room management, video call debugging
- **Potential Features**: Room creation monitoring, participant tracking, call quality metrics

### 4. Bundle Analyzer MCP
- **Purpose**: Automated bundle size monitoring
- **Integration**: Hook into Vite build process
- **Alerts**: Warn when bundle exceeds 200kB limit

### 5. Performance Monitoring MCP
- **Purpose**: Real-time performance metrics
- **Metrics**: Component render times, network request latency, memory usage

## Performance Analysis

### 1. Bundle Size Monitoring

```bash
# Analyze current bundle
pnpm run analyze

# Check dependency impact
pnpm run dep:graph

# Monitor in real-time during development
pnpm run build && pnpm exec vite-bundle-analyzer
```

### 2. React Performance Profiling

```typescript
// Enable React Profiler in development
import { Profiler } from 'react';

const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
  if (import.meta.env.DEV) {
    console.log(`🏃‍♂️ Component ${id} (${phase}): ${actualDuration}ms`);
  }
};

// Wrap components to monitor
<Profiler id="GameLobby" onRender={onRenderCallback}>
  <GameLobby />
</Profiler>
```

### 3. Network Request Optimization

```typescript
// Identify redundant API calls
const apiCallTracker = new Map<string, { count: number, lastCalled: number }>();

const trackApiCall = (endpoint: string) => {
  const now = Date.now();
  const existing = apiCallTracker.get(endpoint);
  
  if (existing) {
    existing.count++;
    if (now - existing.lastCalled < 1000) { // Called within 1 second
      console.warn(`⚠️ Potential redundant API call: ${endpoint} (${existing.count} times)`);
    }
    existing.lastCalled = now;
  } else {
    apiCallTracker.set(endpoint, { count: 1, lastCalled: now });
  }
};
```

## Testing Workflow

### 1. Test Setup Configuration

The project uses Jest with React Testing Library. Configuration is in `jest.config.ts`:

```typescript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: './tsconfig.app.json', useESM: true },
    ],
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
};
```

### 2. VS Code Jest Integration

Create `.vscode/settings.json` with Jest configuration:

```json
{
  "jest.jestCommandLine": "pnpm test",
  "jest.autoRun": {
    "watch": true,
    "onSave": "test-src-file"
  },
  "jest.showCoverageOnLoad": true,
  "testing.automaticallyOpenPeekView": "never"
}
```

**Features:**
- Automatic test discovery and running
- Test results shown inline in VS Code
- Coverage information displayed
- Watch mode for continuous testing

### 3. Running Tests

**Command Line:**
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Run specific test file
pnpm test ErrorBoundary.test.tsx
```

**VS Code Integration:**
1. Install "Jest" extension (`ms-vscode.vscode-jest`)
2. Tests appear in VS Code Test Explorer
3. Click gutter icons to run individual tests
4. View test results inline with code

### 4. Test File Structure

Tests are located in `__tests__` folders next to source files:

```
src/
├── components/
│   ├── ErrorBoundary.tsx
│   └── __tests__/
│       └── ErrorBoundary.test.tsx
├── utils/
│   ├── debugLog.ts
│   └── __tests__/
│       └── debugLog.test.ts
└── tests/
    └── setup.ts  # Global test setup
```

### 5. Example Test Files

**Component Test (ErrorBoundary.test.tsx):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>No error</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

**Utility Test (debugLog.test.ts):**
```typescript
import { debugLog } from '../debugLog';

describe('debugLog', () => {
  it('should log debug information in development mode', () => {
    jest.spyOn(console, 'group').mockImplementation();
    debugLog('TestComponent', 'testAction', { test: 'data' });
    expect(console.group).toHaveBeenCalledWith('🐛 TestComponent - testAction');
  });
});
```

## Essential Extensions

### 1. Required Extensions (Auto-Install)

Create `.vscode/extensions.json` in your project root:

```json
{
  "recommendations": [
    "firefox-devtools.vscode-firefox-debug",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "github.copilot",
    "github.copilot-chat",
    "ms-vscode.vscode-react-native",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "jotai-labs.jotai-vscode",
    "supabase.supabase",
    "humao.rest-client",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-jest",
    "ms-playwright.playwright",
    "gruntfuggly.todo-tree",
    "streetsidesoftware.code-spell-checker",
    "yzhang.markdown-all-in-one"
  ]
}
```

**Installation:**
1. Open project in VS Code
2. Press `Ctrl+Shift+P` and run "Extensions: Show Recommended Extensions"
3. Click "Install All" to install all recommended extensions
4. Restart VS Code after installation

### 2. Firefox Browser Extensions (Install in Debug Profile)

**React Developer Tools:**
- Install from Firefox Add-ons
- Essential for React component debugging
- Shows component tree, props, and state

**Redux DevTools:**
- Install from Firefox Add-ons  
- For state inspection and time-travel debugging
- Works with Jotai atoms in development mode

**Vue.js devtools:**
- Alternative state management inspection
- Useful for complex state debugging scenarios

### 3. Core Development Extensions (Essential)

## Common Issues & Solutions

### 🔧 Multiple GoTrueClient Instances Warning

**Issue:** Console shows "Multiple GoTrueClient instances detected in the same browser context"

**Root Cause:** Multiple Supabase client instances being created

**Solution:** 
- ✅ **Fixed** - Project now uses singleton Supabase client from `src/lib/supabaseClient.ts`
- All imports standardized to use the same client instance
- Lazy loading approach removed to prevent duplicate clients

**Verification:**
```typescript
// Check in browser console - should only see one client
console.log(window.supabase); // Should be consistent across calls
```

### 🌐 OPTIONS 405 Method Not Allowed Error  

**Issue:** `OPTIONS https://thirtyquiz.tyshub.xyz/.netlify/functions/create-daily-room` returns 405

**Root Cause:** Browsers send CORS preflight OPTIONS requests, but Netlify functions didn't handle them

**Solution:**
- ✅ **Fixed** - All Netlify functions now handle OPTIONS requests
- Added CORS headers to all function responses
- Functions affected: `create-daily-room`, `delete-daily-room`, `create-daily-token`, `check-daily-room`, `game-event`

**Example Fix Applied:**
```typescript
export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }
  // ... rest of function
};
```

### 🦊 Firefox Extensions Reinstalling Every Debug Session

**Issue:** React DevTools and other extensions disappear after each debugging session

**Root Cause:** Firefox creates new profile each time without persistence

**Solution:**
- ✅ **Fixed** - Launch configuration now includes persistent profile
- Added `keepProfileChanges: true` and dedicated profile path
- Extensions installed once will persist across sessions

**Configuration in `.vscode/launch.json`:**
```json
{
  "keepProfileChanges": true,
  "profile": "${workspaceFolder}/.vscode/firefox-profile"
}
```

**Setup Steps:**
1. Start debugging session in VS Code (Ctrl+Shift+D)
2. Install React DevTools, Redux DevTools in the opened Firefox instance
3. Extensions will persist in future debugging sessions
4. Profile data stored in `.vscode/firefox-profile/` (add to `.gitignore`)

### 🔍 VS Code Extensions Not Auto-Installing

**Issue:** Recommended extensions don't install automatically

**Solution:**
- ✅ **Fixed** - Created `.vscode/extensions.json` with full recommendation list
- Extensions will be suggested when opening project in VS Code

**Manual Installation:**
1. Press `Ctrl+Shift+P` 
2. Run "Extensions: Show Recommended Extensions"
3. Click "Install All" button
4. Restart VS Code after installation

### 🐛 Application Not Loading
**Step 1:** Open Firefox Developer Tools (F12) and check Console tab for JavaScript errors
**Step 2:** Verify environment variables are properly set in `.env` file:
   - Copy `.env.example` to `.env` if it doesn't exist
   - Ensure all required `VITE_*` variables are defined
**Step 3:** Confirm you're using the correct development server:
   - Use `pnpm run dev` for frontend-only development (port 5173)
   - Use `pnpm run dev:netlify` for full-stack development (port 8888)
**Step 4:** Check Network tab in Firefox Developer Tools for failed requests:
   - Look for 404, 500, or CORS errors
   - Verify API endpoints are correct

### 🌐 API Errors
1. Verify function deployment: `netlify functions:list`
2. Check function logs: `netlify dev` terminal output
3. Test function directly: `curl http://localhost:8888/.netlify/functions/function-name`
4. Validate environment variables are accessible in functions

### 🎥 Daily.co Issues
**Step 1:** Test API key by checking the response from create-daily-room function
**Step 2:** Verify domain configuration in `.env` file:
   - Ensure `VITE_DAILY_DOMAIN` is set correctly
   - Check `DAILY_API_KEY` is valid
**Step 3:** Check Firefox permissions for camera/microphone:
   - Click the shield/lock icon in Firefox address bar
   - Ensure Camera and Microphone are set to "Allow"
   - Try refreshing the page after granting permissions
**Step 4:** Monitor Daily.co dashboard for room creation:
   - Log into your Daily.co dashboard
   - Check if rooms are being created successfully

### 📱 Supabase Connection
**Step 1:** Test connection in Firefox Developer Tools:
   - Open Firefox Developer Tools (F12)
   - Navigate to Console tab
   - Type `window.supabase` and press Enter
   - Should return the Supabase client object
**Step 2:** Check real-time subscriptions in Supabase dashboard:
   - Log into your Supabase project dashboard
   - Navigate to Database > Realtime
   - Verify subscriptions are active
**Step 3:** Verify row-level security policies:
   - Open Supabase dashboard > Authentication > Policies
   - Ensure policies allow your operations
**Step 4:** Test queries in Supabase SQL editor:
   - Use the SQL editor to run test queries
   - Verify data structure matches your application expectations

### 🎨 UI/Styling Issues
**Step 1:** Check Tailwind classes are properly applied:
   - Open Firefox Developer Tools (F12)
   - Use Inspector tab to examine elements
   - Verify Tailwind classes are present in the computed styles
**Step 2:** Test responsive design using Firefox's Responsive Design Mode:
   - Press Ctrl+Shift+M to toggle Responsive Design Mode
   - Test different device sizes and orientations
   - Check for layout issues at various breakpoints
**Step 3:** Test both English and Arabic layouts:
   - Use the language toggle feature in your app
   - Check for text overflow, alignment issues, or RTL problems
   - Verify Arabic text displays correctly
**Step 4:** Check console for hydration errors:
   - Open Console tab in Firefox Developer Tools
   - Look for React hydration warnings or errors
   - Check for mismatched server/client rendering

## Flow Analysis Commands

```bash
# Generate dependency graph
pnpm run dep:graph

# Analyze bundle composition
pnpm run analyze

# Check for circular dependencies
pnpm exec madge --circular src

# Performance audit
npx lighthouse http://localhost:8888 --view

# Bundle size tracking
npx vite-bundle-analyzer dist/stats.html
```

This comprehensive guide should help you leverage VSCode effectively for debugging, testing, and optimizing the Thirty Challenge application. The key is to use the right development environment for your current task and leverage the appropriate debugging tools for each layer of the stack.