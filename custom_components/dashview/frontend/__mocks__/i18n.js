import { vi } from 'vitest';

/**
 * Mock i18n module for testing
 * Provides mocked translation functions that return translation keys
 */

/**
 * Mock translation function
 * Returns the key as-is for testing purposes
 * @param {string} key - Translation key
 * @returns {string} The key itself
 */
export const t = vi.fn((key) => key);

/**
 * Mock i18n initialization function
 * @returns {Promise<void>}
 */
export const initI18n = vi.fn().mockResolvedValue(undefined);

/**
 * Mock function to get current language
 * @returns {string} Default language 'en'
 */
export const getCurrentLang = vi.fn(() => 'en');
