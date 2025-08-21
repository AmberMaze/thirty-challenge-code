/**
 * Test to verify Sentry is properly imported and available
 */

import * as Sentry from '@sentry/react';

describe('Sentry Integration', () => {
  test('should have Sentry available for import', () => {
    expect(Sentry).toBeDefined();
    expect(typeof Sentry.init).toBe('function');
    expect(typeof Sentry.captureException).toBe('function');
    expect(typeof Sentry.captureMessage).toBe('function');
  });

  test('should have BrowserTracing available for import', () => {
    const { BrowserTracing } = require('@sentry/tracing');
    expect(BrowserTracing).toBeDefined();
    expect(typeof BrowserTracing).toBe('function');
  });
});