/**
 * Formatting Utilities
 * Functions for formatting dates, times, and other values
 */

import { calculateTimeDifference } from './helpers.js';

/**
 * Format garage last changed time for display
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

  if (days >= 2) return `${days} days ago`;
  if (days >= 1) return `Yesterday`;
  if (hours >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
}

/**
 * Format date in German locale
 * @returns {string} Formatted date string
 */
export function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format last changed time for display
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

  if (days >= 2) return `${days} days ago`;
  if (days >= 1) return `Yesterday`;
  if (hours >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
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
