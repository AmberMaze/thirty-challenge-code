import { createClient } from '@supabase/supabase-js';

// Comprehensive environment validation with detailed error reporting
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseKey: string;
  isConfigured: boolean;
  missingVars: string[];
}

function validateEnvironment(): EnvironmentConfig {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env as {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
  };

  const missingVars: string[] = [];

  if (!VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');

  const isConfigured =
    missingVars.length === 0 &&
    VITE_SUPABASE_URL !== 'https://example.supabase.co' &&
    VITE_SUPABASE_ANON_KEY !== 'example-key-placeholder';

  if (missingVars.length > 0) {
    console.warn(
      '🔧 Supabase Configuration Missing:',
      missingVars.join(', '),
      '- Running in offline mode',
    );
  } else if (!isConfigured) {
    console.warn(
      '🔧 Supabase Configuration Invalid:',
      'Using placeholder values - Running in offline mode',
    );
  } else {
    // Mask key for safety (show first 6 chars only)
    const masked = VITE_SUPABASE_ANON_KEY
      ? VITE_SUPABASE_ANON_KEY.slice(0, 6) +
        '...' +
        VITE_SUPABASE_ANON_KEY.slice(-4)
      : 'missing';
    console.log('[Supabase] ✅ Config OK', {
      url: VITE_SUPABASE_URL,
      anonKeyPreview: masked,
    });
  }

  return {
    supabaseUrl: VITE_SUPABASE_URL ?? 'https://example.supabase.co',
    supabaseKey: VITE_SUPABASE_ANON_KEY ?? 'example-key-placeholder',
    isConfigured,
    missingVars,
  };
}

const envConfig = validateEnvironment();

/**
 * Singleton Supabase client with comprehensive environment validation.
 * Uses either real configuration or safe placeholder values for development.
 */
export const supabase = createClient(
  envConfig.supabaseUrl,
  envConfig.supabaseKey,
);

/**
 * Returns detailed configuration status for environment validation.
 */
export const getSupabaseConfig = () => envConfig;

/**
 * Returns `true` if real Supabase credentials are properly configured.
 */
export const isSupabaseConfigured = () => envConfig.isConfigured;

/**
 * Returns a user-friendly error message for configuration issues.
 */
export const getConfigurationError = (): string | null => {
  if (envConfig.isConfigured) return null;

  if (envConfig.missingVars.length > 0) {
    return `متغيرات البيئة مفقودة: ${envConfig.missingVars.join(', ')}`;
  }

  return 'إعدادات قاعدة البيانات غير صحيحة - تعمل في وضع التطوير';
};
