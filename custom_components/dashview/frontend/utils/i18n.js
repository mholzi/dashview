/**
 * Lightweight i18n utility for Dashview
 * Singleton pattern with module-scoped state
 */

// Module-scoped state
let translations = {};
let currentLang = 'en';

/**
 * Initialize the i18n system with a language code
 * @param {string} lang - Language code ('en', 'de')
 * @returns {Promise<boolean>} - Success status
 */
export async function initI18n(lang = 'en') {
  try {
    const module = await import(`../locales/${lang}.json`, { with: { type: 'json' } });
    translations = module.default;
    currentLang = lang;
    console.log(`[Dashview i18n] Initialized with language: ${lang}`);
    return true;
  } catch (error) {
    console.warn(`[Dashview i18n] Translation file for ${lang} not found, using default`);
    // If fallback to 'en' fails too, continue with empty translations
    if (lang !== 'en') {
      return initI18n('en');
    }
    return false;
  }
}

/**
 * Translate a key with optional parameter substitution
 * @param {string} key - Dot-notation key (e.g., 'sensor.motion.on')
 * @param {Object} params - Optional parameters for substitution
 * @returns {string} Translated string or key if not found
 * @example
 *   t('sensor.motion.on') // "Motion detected"
 *   t('status.lights_on', { count: 3 }) // "3 lights on"
 */
export function t(key, params = {}) {
  // Navigate to nested key
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, return the key as fallback
      return key;
    }
  }

  // If we didn't find a string, return the key
  if (typeof value !== 'string') {
    return key;
  }

  // Parameter substitution: replace {paramName} with params.paramName
  if (params && typeof params === 'object') {
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
      return paramName in params ? String(params[paramName]) : match;
    });
  }

  return value;
}

/**
 * Get current active language
 * @returns {string} Language code ('en' or 'de')
 */
export function getCurrentLang() {
  return currentLang;
}
