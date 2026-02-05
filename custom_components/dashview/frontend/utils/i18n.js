/**
 * Dashview Internationalization (i18n) Module
 *
 * @module utils/i18n
 * @description
 * This module provides translation utilities for the Dashview dashboard.
 * It uses a window-scoped singleton to ensure consistent state across module instances.
 *
 * ## Architecture
 *
 * Language is determined by the admin setting in Admin → Settings → Language.
 * The initialization happens in `dashview-panel.js` during the `updated()` lifecycle,
 * which runs BEFORE any component renders.
 *
 * ## Language Priority
 *
 * 1. **Manual setting** (`_manualLanguage`) - User's explicit choice in admin settings
 * 2. **Home Assistant language** (`hass.language`) - When set to "Auto"
 * 3. **Default 'en'** - Fallback for unsupported languages
 *
 * ## Usage
 *
 * All components should import and use these utilities:
 *
 * ```javascript
 * import { t, getCurrentLang } from '../../utils/i18n.js';
 *
 * // Translate a key
 * const label = t('common.status.on');
 *
 * // Translate with fallback
 * const label = t('common.status.on', 'On');
 *
 * // Translate with parameters (auto-escaped for XSS safety)
 * const msg = t('time.ago_hours', { hours: 3 });
 *
 * // Get current language code
 * const lang = getCurrentLang();  // 'en' or 'de'
 * ```
 *
 * ## Anti-Patterns (DO NOT DO)
 *
 * - **Never** access `hass.language` directly in components
 * - **Never** implement your own language detection/fallback logic
 * - **Never** hardcode language-specific strings in components
 * - **Never** check `getCurrentLang() === 'en'` and then override based on `hass.language`
 *
 * ## Single Source of Truth
 *
 * `getCurrentLang()` is the ONLY approved method to get the current language.
 * It returns the language that was initialized based on admin settings.
 *
 * @see dashview-panel.js:1538-1555 - Language initialization logic
 * @see features/admin/users-tab.js - Admin language settings UI
 * @see _bmad-output/project-context.md - Full language architecture documentation
 */

// Use window-scoped state to ensure singleton pattern works across module instances
// This is needed because ?v=xxx query params create separate module instances
if (!window.__dashviewI18n) {
  window.__dashviewI18n = {
    translations: {},
    currentLang: 'en',
    initialized: false
  };
}

// IMPORTANT: Do NOT expose t on window to avoid conflicts with other components
// Some components (like card-mod) may have their own 't' variable that would be overwritten

// Reference the shared state
const state = window.__dashviewI18n;

/**
 * HTML escape character mapping (pre-defined for performance)
 * @private
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Hardcoded fallback translations for critical UI when all fetches fail
 * SECURITY: Ensures app remains functional even with network failures (Story 7.5, GitHub #8)
 * @private
 */
const FALLBACK_TRANSLATIONS = {
  error: {
    loading: 'Loading...',
    unknown: 'Unknown error',
    network: 'Network error'
  },
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back'
  },
  status: {
    on: 'On',
    off: 'Off',
    unavailable: 'Unavailable'
  }
};

/**
 * Retry state for tracking fetch attempts per locale
 * SECURITY: Prevents infinite retry loops (Story 7.5, GitHub #8)
 * @private
 */
const retryState = {
  attempts: {},
  maxAttempts: 2,
  loading: false, // Prevents concurrent initI18n race conditions
  retryDelayMs: 200 // Delay between retry attempts for transient errors
};

/**
 * Delay helper for retry backoff
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 * @private
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout using AbortController
 * SECURITY: Prevents indefinite hangs on slow networks (Story 7.5, GitHub #8)
 * @param {string} url - URL to fetch
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000)
 * @returns {Promise<Response>} Fetch response
 * @private
 */
function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {*} str - Value to escape (converted to string if needed)
 * @returns {string} HTML-escaped string
 * @example
 *   escapeHtml('<script>') // '&lt;script&gt;'
 *   escapeHtml('A & B') // 'A &amp; B'
 */
export function escapeHtml(str) {
  // Handle Symbol and other non-stringifiable types gracefully
  if (typeof str === 'symbol') {
    return String(str.description || 'Symbol');
  }
  const s = String(str);
  return s.replace(/[&<>"']/g, char => HTML_ESCAPE_MAP[char]);
}

/**
 * Initialize the i18n system with a language code
 * Uses fetch() for broader browser compatibility (Safari doesn't support import assertions)
 * SECURITY: Includes timeout, retry limit, and fallback to prevent hangs/loops (Story 7.5, GitHub #8)
 * @param {string} lang - Language code ('en', 'de')
 * @returns {Promise<boolean>} - Success status
 */
export async function initI18n(lang = 'en') {
  // Prevent concurrent initialization race conditions
  if (retryState.loading) {
    // Wait for current initialization to complete
    while (retryState.loading) {
      await delay(50);
    }
    // If already initialized, return current state
    if (state.initialized) {
      return state.translations !== FALLBACK_TRANSLATIONS;
    }
  }

  retryState.loading = true;

  try {
    return await _doInitI18n(lang);
  } finally {
    retryState.loading = false;
  }
}

/**
 * Internal initialization logic (called by initI18n with loading lock)
 * @private
 */
async function _doInitI18n(lang) {
  // Initialize attempt counter for this locale
  retryState.attempts[lang] = (retryState.attempts[lang] || 0) + 1;

  // Check retry limit to prevent infinite loops
  if (retryState.attempts[lang] > retryState.maxAttempts) {
    console.warn(`[Dashview i18n] Max retries (${retryState.maxAttempts}) exceeded for locale: ${lang}`);

    // If we've exhausted all options including English, use fallback translations
    if (lang === 'en') {
      console.warn('[Dashview i18n] All fetch attempts failed, using hardcoded fallback translations');
      state.translations = FALLBACK_TRANSLATIONS;
      state.currentLang = 'en';
      state.initialized = true;
      return false;
    }

    // Try English as last resort
    retryState.attempts['en'] = 0; // Reset English counter
    return _doInitI18n('en');
  }

  try {
    // Get the base URL from the current script location
    // Remove query params first, then find the utils folder
    const scriptUrl = import.meta.url.split('?')[0];
    const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/utils/'));
    const localeUrl = `${baseUrl}/locales/${lang}.json`;

    console.log(`[Dashview i18n] Loading translations (attempt ${retryState.attempts[lang]}/${retryState.maxAttempts}): ${localeUrl}`);

    // Use fetchWithTimeout to prevent indefinite hangs on slow networks
    const response = await fetchWithTimeout(localeUrl, 5000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    state.translations = await response.json();
    state.currentLang = lang;
    state.initialized = true;

    // Reset retry counter on success
    retryState.attempts = {};

    console.log(`[Dashview i18n] Initialized with language: ${lang}, loaded ${Object.keys(state.translations).length} top-level keys`);
    return true;

  } catch (error) {
    // Differentiate timeout vs network error for better logging
    const errorType = error.name === 'AbortError' ? 'timeout' : 'network';
    console.warn(
      `[Dashview i18n] Failed to load ${lang} (attempt ${retryState.attempts[lang]}/${retryState.maxAttempts}, ${errorType}): ${error.message}`
    );

    // Retry same locale if under limit (with delay for transient errors)
    if (retryState.attempts[lang] < retryState.maxAttempts) {
      await delay(retryState.retryDelayMs);
      return _doInitI18n(lang); // Retry same locale
    }

    // Exhausted retries for this locale, try English fallback
    if (lang !== 'en') {
      retryState.attempts['en'] = 0; // Reset English counter
      return _doInitI18n('en'); // Try English
    }

    // All options exhausted - use hardcoded fallback translations
    console.warn('[Dashview i18n] All fetch attempts failed, using hardcoded fallback translations');
    state.translations = FALLBACK_TRANSLATIONS;
    state.currentLang = 'en';
    state.initialized = true;
    return false;
  }
}

/**
 * Translate a key with optional fallback or parameter substitution
 * @param {string} key - Dot-notation key (e.g., 'sensor.motion.on')
 * @param {string|Object} fallbackOrParams - Either a fallback string or params object
 * @returns {string} Translated string, fallback, or key if not found
 * @security All parameter values are HTML-escaped to prevent XSS attacks.
 *   Characters &, <, >, ", ' are converted to HTML entities.
 * @example
 *   t('sensor.motion.on') // "Motion detected"
 *   t('sensor.motion.on', 'Default text') // Uses 'Default text' if key not found
 *   t('status.lights_on', { count: 3 }) // "3 lights on"
 *   t('greeting', { name: '<script>' }) // "Hello, &lt;script&gt;!" (XSS safe)
 */
export function t(key, fallbackOrParams = null, fallbackWhenParams = null) {
  // Support 3-arg form: t(key, params, fallback) — and 2-arg: t(key, fallback) or t(key, params)
  const isFallbackString = typeof fallbackOrParams === 'string';
  const fallback = isFallbackString ? fallbackOrParams : (fallbackWhenParams ?? key);
  const params = isFallbackString ? {} : (fallbackOrParams || {});

  // Navigate to nested key
  const keys = key.split('.');
  let value = state.translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, return fallback
      return fallback;
    }
  }

  // If we didn't find a string, return fallback
  if (typeof value !== 'string') {
    return fallback;
  }

  // Parameter substitution: replace {paramName} or {{paramName}} with params.paramName
  // SECURITY: All parameter values are HTML-escaped to prevent XSS attacks (Story 7.1, GitHub #3)
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    return value.replace(/\{\{?(\w+)\}?\}/g, (match, paramName) => {
      return paramName in params ? escapeHtml(params[paramName]) : match;
    });
  }

  return value;
}

/**
 * Check if i18n has been initialized
 * @returns {boolean} True if initialized
 */
export function isI18nInitialized() {
  return state.initialized;
}

/**
 * Get current active language - SINGLE SOURCE OF TRUTH
 *
 * This is the ONLY approved method to get the current language in Dashview.
 * It returns the language that was initialized based on admin settings.
 *
 * DO NOT access `hass.language` directly - use this function instead.
 *
 * @returns {string} Language code ('en' or 'de')
 * @example
 * const lang = getCurrentLang();
 * const pollenName = POLLEN_TYPES[type][lang];  // Use lang for lookups
 */
export function getCurrentLang() {
  return state.currentLang;
}

/**
 * Reset i18n state (for testing purposes only)
 * SECURITY: Allows tests to verify retry/fallback behavior (Story 7.5, GitHub #8)
 * @private
 */
export function _resetI18nState() {
  retryState.attempts = {};
  retryState.loading = false;
  state.translations = {};
  state.currentLang = 'en';
  state.initialized = false;
}
