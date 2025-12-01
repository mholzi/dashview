/**
 * Lightweight i18n utility for Dashview
 * Uses window-scoped state to ensure singleton across module instances
 * (Different import URLs can create separate module instances)
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
 * Initialize the i18n system with a language code
 * Uses fetch() for broader browser compatibility (Safari doesn't support import assertions)
 * @param {string} lang - Language code ('en', 'de')
 * @returns {Promise<boolean>} - Success status
 */
export async function initI18n(lang = 'en') {
  try {
    // Get the base URL from the current script location
    // Remove query params first, then find the utils folder
    const scriptUrl = import.meta.url.split('?')[0];
    const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/utils/'));
    const localeUrl = `${baseUrl}/locales/${lang}.json`;

    console.log(`[Dashview i18n] Loading translations from: ${localeUrl}`);

    const response = await fetch(localeUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    state.translations = await response.json();
    state.currentLang = lang;
    state.initialized = true;
    console.log(`[Dashview i18n] Initialized with language: ${lang}, loaded ${Object.keys(state.translations).length} top-level keys`);
    return true;
  } catch (error) {
    console.warn(`[Dashview i18n] Translation file for ${lang} not found: ${error.message}`);
    // If fallback to 'en' fails too, continue with empty translations
    if (lang !== 'en') {
      return initI18n('en');
    }
    state.initialized = true; // Mark as initialized even on failure to prevent loops
    return false;
  }
}

/**
 * Translate a key with optional fallback or parameter substitution
 * @param {string} key - Dot-notation key (e.g., 'sensor.motion.on')
 * @param {string|Object} fallbackOrParams - Either a fallback string or params object
 * @returns {string} Translated string, fallback, or key if not found
 * @example
 *   t('sensor.motion.on') // "Motion detected"
 *   t('sensor.motion.on', 'Default text') // Uses 'Default text' if key not found
 *   t('status.lights_on', { count: 3 }) // "3 lights on"
 */
export function t(key, fallbackOrParams = null) {
  // Determine if second arg is a fallback string or params object
  const isFallbackString = typeof fallbackOrParams === 'string';
  const fallback = isFallbackString ? fallbackOrParams : key;
  const params = isFallbackString ? {} : (fallbackOrParams || {});

  // Navigate to nested key
  const keys = key.split('.');
  let value = state.translations;

  // Debug: log first few translation lookups
  if (!window._dashviewI18nDebugCount) window._dashviewI18nDebugCount = 0;
  const shouldLog = window._dashviewI18nDebugCount < 5;
  if (shouldLog) {
    console.log(`[Dashview t()] key="${key}", translations has ${Object.keys(state.translations).length} keys`);
    window._dashviewI18nDebugCount++;
  }

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
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    return value.replace(/\{\{?(\w+)\}?\}/g, (match, paramName) => {
      return paramName in params ? String(params[paramName]) : match;
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
 * Get current active language
 * @returns {string} Language code ('en' or 'de')
 */
export function getCurrentLang() {
  return state.currentLang;
}
