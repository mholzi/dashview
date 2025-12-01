/**
 * Lightweight i18n utility for Dashview
 * Singleton pattern with module-scoped state
 */

// Module-scoped state
let translations = {};
let currentLang = 'en';
let initialized = false;

/**
 * Initialize the i18n system with a language code
 * Uses fetch() for broader browser compatibility (Safari doesn't support import assertions)
 * @param {string} lang - Language code ('en', 'de')
 * @returns {Promise<boolean>} - Success status
 */
export async function initI18n(lang = 'en') {
  try {
    // Get the base URL from the current script location
    const scriptUrl = import.meta.url;
    const baseUrl = scriptUrl.substring(0, scriptUrl.lastIndexOf('/utils/'));
    const localeUrl = `${baseUrl}/locales/${lang}.json`;

    const response = await fetch(localeUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    translations = await response.json();
    currentLang = lang;
    initialized = true;
    console.log(`[Dashview i18n] Initialized with language: ${lang}`);
    return true;
  } catch (error) {
    console.warn(`[Dashview i18n] Translation file for ${lang} not found: ${error.message}`);
    // If fallback to 'en' fails too, continue with empty translations
    if (lang !== 'en') {
      return initI18n('en');
    }
    initialized = true; // Mark as initialized even on failure to prevent loops
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
  let value = translations;

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

  // Parameter substitution: replace {paramName} with params.paramName
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
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
  return initialized;
}

/**
 * Get current active language
 * @returns {string} Language code ('en' or 'de')
 */
export function getCurrentLang() {
  return currentLang;
}
