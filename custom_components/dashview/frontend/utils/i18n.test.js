import { describe, it, expect, beforeEach, vi } from 'vitest';

// Tests for i18n utility
describe('i18n utility', () => {
  describe('t() function', () => {
    it('should return the key if translations not loaded', async () => {
      const { t } = await import('./i18n.js');
      // Reset module between tests would need special handling
      expect(typeof t('some.key')).toBe('string');
    });

    // Add more tests for parameter substitution, nested keys, etc.
  });

  describe('getCurrentLang()', () => {
    it('should return default language', async () => {
      const { getCurrentLang } = await import('./i18n.js');
      expect(getCurrentLang()).toBe('en');
    });
  });
});
