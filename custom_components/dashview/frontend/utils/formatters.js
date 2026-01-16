/**
 * Formatting Utilities
 * Functions for formatting dates, times, and other values
 */

import { calculateTimeDifference } from './helpers.js';
import { t } from './i18n.js';

/**
 * Format garage last changed time for display
 * Uses i18n for localized output
 * @param {string} lastChanged - ISO date string of last change
 * @returns {string} Formatted relative time string
 */
export function formatGarageLastChanged(lastChanged) {
  if (!lastChanged) return "";
  const last = new Date(lastChanged);
  if (isNaN(last.getTime())) return "";

  const now = new Date();
  const diff = now - last;
  const { days, hours, minutes } = calculateTimeDifference(diff);

  if (days >= 2) return t('time.days_ago', { count: days }, `${days} days ago`);
  if (days >= 1) return t('time.yesterday', 'Yesterday');
  if (hours >= 1) return t('time.hours_ago', { count: hours }, `${hours}h ago`);
  return t('time.minutes_ago', { count: minutes }, `${minutes}m ago`);
}

/**
 * Format date in user's locale
 * @returns {string} Formatted date string
 */
export function formatDate() {
  const now = new Date();
  // Use the browser's locale for date formatting
  const locale = navigator.language || 'en-US';
  return now.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format last changed time for display
 * Uses i18n for localized output
 * @param {string} lastChanged - ISO date string
 * @returns {string} Formatted relative time
 */
export function formatLastChanged(lastChanged) {
  if (!lastChanged) return "";

  const last = new Date(lastChanged);
  if (isNaN(last.getTime())) return "";

  const now = new Date();
  const diff = now - last;

  if (isNaN(diff) || diff < 0) return "";

  const { days, hours, minutes } = calculateTimeDifference(diff);

  if (isNaN(minutes)) return "";

  // Use i18n for localized time strings
  if (days >= 2) return t('time.days_ago', { count: days }, `${days} days ago`);
  if (days >= 1) return t('time.yesterday', 'Yesterday');
  if (hours >= 1) return t('time.hours_ago', { count: hours }, `${hours}h ago`);
  if (minutes < 1) return t('time.just_now', 'Just now');
  return t('time.minutes_ago', { count: minutes }, `${minutes}m ago`);
}

/**
 * Format absolute timestamp for tooltip display
 * @param {string} lastChanged - ISO date string
 * @returns {string} Formatted absolute time (e.g., "Jan 15, 2026 at 14:32")
 */
export function formatAbsoluteTime(lastChanged) {
  if (!lastChanged) return "";

  const date = new Date(lastChanged);
  if (isNaN(date.getTime())) return "";

  const locale = navigator.language || 'en-US';
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse garbage sensor state to get days until pickup
 * @param {string} raw - Raw sensor state value
 * @returns {{days: number, label: string}} Days count and display label
 */
export function parseGarbageState(raw) {
  let days;
  let label;

  if (raw.toLowerCase() === 'heute' || raw.toLowerCase() === 'today') {
    days = 0;
    label = 'Heute';
  } else if (raw.toLowerCase() === 'morgen' || raw.toLowerCase() === 'tomorrow') {
    days = 1;
    label = 'Morgen';
  } else {
    const match = raw.match(/(\d+)/);
    days = match ? parseInt(match[1], 10) : 99;
    if (days === 0) {
      label = 'Heute';
    } else if (days === 1) {
      label = 'Morgen';
    } else {
      label = `in ${days} Tagen`;
    }
  }

  return { days, label };
}
