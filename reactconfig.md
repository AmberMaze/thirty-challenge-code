# React 18 + Vite 7 Configuration Guide

This document provides a complete guide for configuring React 18 with Vite 7, including essential plugins and development settings.

## React 18 Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@testing-library/react": "^15.0.7"
  }
}
```

### Key Differences from React 19
- **Stable API**: React 18.3.1 is the latest stable version with well-tested APIs
- **Better ecosystem compatibility**: Most third-party libraries fully support React 18
- **Type safety**: Mature TypeScript definitions with fewer experimental features
- **Performance**: Optimized bundle sizes and runtime performance

## Vite 7 Configuration

### Basic `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // JSX runtime configuration
      jsxRuntime: 'automatic',
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  
  // Build configuration
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true, // Enable sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  
  // Enable sourcemaps in development
  css: {
    devSourcemap: true,
  },
});
```

## Essential Vite Plugins

### 1. React Plugin (@vitejs/plugin-react)
```bash
pnpm add -D @vitejs/plugin-react
```

```typescript
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds (optional)
      jsxRuntime: 'automatic',
      fastRefresh: true,
    })
  ],
});
```

### 2. TypeScript Support
```bash
pnpm add -D typescript @types/node
```

### 3. ESLint Integration
```bash
pnpm add -D eslint @eslint/js typescript-eslint
```

### 4. Bundle Analysis
```bash
pnpm add -D vite-bundle-analyzer rollup-plugin-analyzer
```

```typescript
import { defineConfig } from 'vite';
import { analyzer } from 'rollup-plugin-analyzer';

export default defineConfig({
  plugins: [
    // ... other plugins
    analyzer({
      summaryOnly: true,
      limit: 10,
    })
  ],
  
  build: {
    rollupOptions: {
      plugins: [
        analyzer({
          summaryOnly: true,
        })
      ],
    },
  },
});
```

## Enabling Sourcemaps

### Development Sourcemaps
```typescript
export default defineConfig({
  // Enable sourcemaps for JavaScript/TypeScript
  build: {
    sourcemap: true,
  },
  
  // Enable sourcemaps for CSS
  css: {
    devSourcemap: true,
  },
  
  // Esbuild configuration for better sourcemaps
  esbuild: {
    sourcemap: 'linked',
  },
});
```

### Production Sourcemaps (Optional)
```typescript
export default defineConfig({
  build: {
    sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden',
  },
});
```

## Performance Optimizations

### Code Splitting
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
```

### Bundle Size Monitoring
```typescript
import bundlesize from 'vite-plugin-bundlesize';

export default defineConfig({
  plugins: [
    bundlesize({
      limits: [
        {
          name: 'main bundle',
          limit: '205kb',
        },
      ],
    }),
  ],
});
```

## Development Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "analyze": "pnpm run build && pnpm exec vite-bundle-analyzer"
  }
}
```

## Environment Configuration

### .env Files
```bash
# .env.local (not committed)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_API_KEY=your_daily_key

# .env.example (committed)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_DAILY_API_KEY=your_daily_api_key_here
```

### Environment Type Safety
```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DAILY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## Debugging Configuration

### VS Code Launch Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

### Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Enable "Enable JavaScript source maps" in Settings
4. Your TypeScript files should appear in the file tree

## Common Issues & Solutions

### 1. Module Resolution
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 2. React Fast Refresh Issues
```typescript
// Ensure components are exported as default or use displayName
const MyComponent = () => <div>Hello</div>;
MyComponent.displayName = 'MyComponent';
export default MyComponent;
```

### 3. Build Optimization
```typescript
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
```

## Migration from React 19

If migrating from React 19 to React 18:

1. Update dependencies to React 18 versions
2. Remove any experimental React 19 features
3. Update component patterns to React 18 standards
4. Test thoroughly, especially async components and suspense boundaries
5. Update type definitions that may have changed

## Best Practices

1. **Always use sourcemaps in development** for better debugging
2. **Monitor bundle sizes** to prevent performance regressions  
3. **Use code splitting** for large applications
4. **Configure proper TypeScript paths** for clean imports
5. **Enable Fast Refresh** for better developer experience
6. **Use environment variables** for configuration
7. **Set up proper linting** with ESLint and TypeScript

This configuration provides a solid foundation for React 18 applications with Vite 7, ensuring good performance, debugging capabilities, and maintainability.