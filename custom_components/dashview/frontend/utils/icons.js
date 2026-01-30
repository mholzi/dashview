/**
 * Icon Utilities
 * Functions for getting icons for entities, areas, floors, and weather
 */

import { t } from './i18n.js';

/**
 * Get icon for an area (room)
 * @param {Object} area - Area object from Home Assistant
 * @returns {string} MDI icon string
 */
export function getAreaIcon(area) {
  // Use the icon from the area registry, fallback to generic home icon
  return area?.icon || "mdi:home-outline";
}

/**
 * Get floor icon based on level
 * @param {Object} floor - Floor object
 * @returns {string} MDI icon string
 */
export function getFloorIcon(floor) {
  if (floor.icon) return floor.icon;
  const level = floor.level ?? 0;
  if (level < 0) return 'mdi:home-floor-negative-1';
  if (level === 0 || level === 1) return 'mdi:home';
  if (level === 2) return 'mdi:home-floor-1';
  if (level === 3) return 'mdi:home-roof';
  return 'mdi:home-floor-0';
}

/**
 * Get short label for floor name
 * @param {Object} floor - Floor object
 * @returns {string} Short floor label
 */
export function getFloorLabel(floor) {
  const name = floor.name.toLowerCase();
  if (name.includes('erdgeschoss') || name.includes('ground')) return 'EG';
  if (name.includes('1. stock') || name.includes('first')) return '1.OG';
  if (name.includes('obergeschoss') || name.includes('upper')) return 'OG';
  if (name.includes('dachgeschoss') || name.includes('attic')) return 'DG';
  if (name.includes('keller') || name.includes('basement')) return 'UG';
  if (name.includes('garten') || name.includes('garden')) return 'Garten';
  // Return first 6 characters as fallback
  return floor.name.substring(0, 6);
}

/**
 * Get weather icon for condition
 * @param {string} state - Weather condition state
 * @returns {string} MDI icon string
 */
export function getWeatherIcon(state) {
  const iconMap = {
    "clear-night": "mdi:weather-night",
    cloudy: "mdi:weather-cloudy",
    fog: "mdi:weather-fog",
    hail: "mdi:weather-hail",
    lightning: "mdi:weather-lightning",
    "lightning-rainy": "mdi:weather-lightning-rainy",
    partlycloudy: "mdi:weather-partly-cloudy",
    pouring: "mdi:weather-pouring",
    rainy: "mdi:weather-rainy",
    snowy: "mdi:weather-snowy",
    "snowy-rainy": "mdi:weather-snowy-rainy",
    sunny: "mdi:weather-sunny",
    windy: "mdi:weather-windy",
    "windy-variant": "mdi:weather-windy-variant",
    exceptional: "mdi:alert-circle-outline",
  };
  return iconMap[state] || "mdi:weather-partly-cloudy";
}

/**
 * Translate weather condition using i18n
 * @param {string} state - Weather condition state
 * @returns {string} Translated condition string
 */
export function translateWeatherCondition(state) {
  return t(`weather.conditions.${state}`, state);
}
