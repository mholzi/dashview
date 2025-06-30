// custom_components/dashview/www/lib/utils/time-utils.js

/**
 * Time Difference Calculation Utilities
 * 
 * Provides standardized functions for calculating and formatting time differences
 * in human-readable German format.
 */

/**
 * Calculate time difference and return human-readable German string
 * @param {string|Date} lastChanged - The timestamp of the last change
 * @param {string} format - Format style: 'short' (vor 5m) or 'long' (5 Minuten)
 * @returns {string} Human-readable time difference in German
 */
export function calculateTimeDifference(lastChanged, format = 'long') {
  const now = new Date();
  const diffSeconds = Math.floor((now - new Date(lastChanged)) / 1000);
  
  if (diffSeconds < 60) {
    return 'Jetzt';
  }
  
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return format === 'short' ? `vor ${minutes}m` : `${minutes} Minuten`;
  }
  
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return format === 'short' ? `vor ${hours}h` : `${hours} Stunden`;
  }
  
  const days = Math.floor(diffSeconds / 86400);
  return format === 'short' ? `vor ${days} Tagen` : `${days} Tagen`;
}

/**
 * Calculate time difference with short format (legacy FloorManager style)
 * @param {string|Date} lastChanged - The timestamp of the last change
 * @returns {string} Human-readable time difference in short format
 */
export function calculateTimeDifferenceShort(lastChanged) {
  return calculateTimeDifference(lastChanged, 'short');
}

/**
 * Calculate time difference with long format (legacy InfoCardManager style)
 * @param {string|Date} lastChanged - The timestamp of the last change
 * @returns {string} Human-readable time difference in long format
 */
export function calculateTimeDifferenceLong(lastChanged) {
  return calculateTimeDifference(lastChanged, 'long');
}

/**
 * Calculate time difference and return human-readable English string (for header displays)
 * @param {string|Date} lastChanged - The timestamp of the last change
 * @returns {string} Human-readable time difference in English format
 */
export function calculateTimeDifferenceEnglish(lastChanged) {
  const now = new Date();
  const diffSeconds = Math.floor((now - new Date(lastChanged)) / 1000);
  
  if (diffSeconds < 60) {
    return 'now';
  }
  
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes}m ago`;
  }
  
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}