/**
 * Suggestion Engine
 * Evaluates context-aware rules against current HA state and returns actionable suggestions.
 *
 * Rules are stateless condition checks evaluated against hass.states.
 * Each rule has its own cooldown period and can be dismissed per session.
 *
 * Suggestion shape:
 * { id, icon, title, description, actionText, actionType, actionData, dismissable, priority, level }
 *
 * actionType: 'service' | 'popup' | 'navigate'
 * level: 'info' | 'warning'
 */

import { t } from '../utils/i18n.js';
import { getEnabledEntityIds, filterEntitiesByState } from '../utils/helpers.js';

// ============================================================================
// Cooldown & Dismissal Persistence (localStorage)
// ============================================================================

const COOLDOWN_STORAGE_KEY = 'dashview_suggestion_cooldowns';
const DISMISSED_STORAGE_KEY = 'dashview_suggestion_dismissed';

/**
 * Load cooldown timestamps from localStorage
 * @returns {Object} Map of ruleId -> timestamp (ms)
 */
function loadCooldowns() {
  try {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save a cooldown timestamp for a rule
 * @param {string} ruleId - Rule identifier
 * @param {number} timestamp - Cooldown start time (ms)
 */
function saveCooldown(ruleId, timestamp) {
  try {
    const cooldowns = loadCooldowns();
    cooldowns[ruleId] = timestamp;
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
  } catch {
    // Silently fail — localStorage not available
  }
}

/**
 * Load session-dismissed rules from sessionStorage
 * @returns {Object} Map of ruleId -> true
 */
function loadDismissed() {
  try {
    const stored = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Dismiss a suggestion for this session and set its cooldown
 * @param {string} ruleId - Rule identifier
 * @param {number} cooldownMs - Cooldown duration in ms
 */
export function dismissSuggestion(ruleId, cooldownMs) {
  try {
    // Session dismiss
    const dismissed = loadDismissed();
    dismissed[ruleId] = true;
    sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(dismissed));

    // Set cooldown
    saveCooldown(ruleId, Date.now());
  } catch {
    // Silently fail
  }
}

/**
 * Record that a suggestion action was taken (sets cooldown)
 * @param {string} ruleId - Rule identifier
 */
export function recordSuggestionAction(ruleId) {
  saveCooldown(ruleId, Date.now());
}

// ============================================================================
// Built-in Rules
// ============================================================================

/**
 * Rule 1: Lights Left On (Late Night)
 * Trigger: After 23:00, 2+ lights still on
 */
function evaluateLightsLeftOn(hass, context) {
  const now = new Date();
  const hour = now.getHours();

  // Only trigger after 23:00 (configurable via threshold in future)
  if (hour < 23) return null;

  // Get enabled light entity IDs
  const lightLabelId = context.labelIds?.light;
  const enabledLights = context.enabledMaps?.enabledLights || {};
  let lightIds = getEnabledEntityIds(enabledLights);

  // Filter by label if available
  if (lightLabelId && context.entityHasLabel) {
    lightIds = lightIds.filter(id => context.entityHasLabel(id, lightLabelId));
  }

  // Exclude non-light domains
  lightIds = lightIds.filter(id => {
    const domain = id.split('.')[0];
    return !['automation', 'script', 'scene'].includes(domain);
  });

  if (lightIds.length === 0) return null;

  // Find lights that are on
  const lightsOn = filterEntitiesByState(lightIds, hass, 'on');

  if (lightsOn.length < 2) return null;

  return {
    id: 'lights-left-on',
    icon: '💡',
    title: t('smartSuggestions.lightsLeftOn.title'),
    description: t('smartSuggestions.lightsLeftOn.desc', { count: lightsOn.length }),
    actionText: t('smartSuggestions.lightsLeftOn.action'),
    actionType: 'service',
    actionData: {
      domain: 'light',
      service: 'turn_off',
      entityIds: lightsOn,
    },
    dismissable: true,
    priority: 50,
    level: 'info',
  };
}

/**
 * Rule 2: AC/Windows Conflict
 * Trigger: Climate entity in heating/cooling AND window sensor is open
 */
function evaluateACWindowsConflict(hass, context) {
  const climateLabelId = context.labelIds?.climate;
  const windowLabelId = context.labelIds?.window;
  const enabledClimates = context.enabledMaps?.enabledClimates || {};
  const enabledWindows = context.enabledMaps?.enabledWindows || {};

  // Get climate entities
  let climateIds = getEnabledEntityIds(enabledClimates);
  if (climateLabelId && context.entityHasLabel) {
    climateIds = climateIds.filter(id => context.entityHasLabel(id, climateLabelId));
  }

  // Get window entities
  let windowIds = getEnabledEntityIds(enabledWindows);
  if (windowLabelId && context.entityHasLabel) {
    windowIds = windowIds.filter(id => context.entityHasLabel(id, windowLabelId));
  }

  if (climateIds.length === 0 || windowIds.length === 0) return null;

  // Find active climate entities (heating, cooling, heat_cool, auto)
  const activeClimateStates = ['cool', 'heat', 'heat_cool', 'auto', 'heating', 'cooling'];
  const activeClimates = climateIds.filter(id => {
    const state = hass.states[id];
    return state && activeClimateStates.includes(state.state);
  });

  if (activeClimates.length === 0) return null;

  // Find open windows (binary_sensor: 'on' = open)
  const openWindows = filterEntitiesByState(windowIds, hass, 'on');

  if (openWindows.length === 0) return null;

  return {
    id: 'ac-windows-conflict',
    icon: '⚠️',
    title: t('smartSuggestions.acConflict.title'),
    description: t('smartSuggestions.acConflict.desc'),
    actionText: t('smartSuggestions.acConflict.action'),
    actionType: 'popup',
    actionData: {
      popup: 'security',
      tab: 'windows',
    },
    dismissable: true,
    priority: 80,
    level: 'warning',
  };
}

/**
 * Rule 3: Sunset Lights
 * Trigger: Sun below horizon AND no lights are on
 */
function evaluateSunsetLights(hass, context) {
  const sun = hass.states['sun.sun'];
  if (!sun) return null;

  // Only trigger when sun is below horizon
  if (sun.state !== 'below_horizon') return null;

  // Get enabled light entity IDs
  const lightLabelId = context.labelIds?.light;
  const enabledLights = context.enabledMaps?.enabledLights || {};
  let lightIds = getEnabledEntityIds(enabledLights);

  // Filter by label if available
  if (lightLabelId && context.entityHasLabel) {
    lightIds = lightIds.filter(id => context.entityHasLabel(id, lightLabelId));
  }

  // Exclude non-light domains
  lightIds = lightIds.filter(id => {
    const domain = id.split('.')[0];
    return !['automation', 'script', 'scene'].includes(domain);
  });

  if (lightIds.length === 0) return null;

  // Check if any lights are already on
  const lightsOn = filterEntitiesByState(lightIds, hass, 'on');

  // If some lights are already on, no suggestion needed
  if (lightsOn.length > 0) return null;

  return {
    id: 'sunset-lights',
    icon: '🌅',
    title: t('smartSuggestions.sunset.title'),
    description: t('smartSuggestions.sunset.desc'),
    actionText: t('smartSuggestions.sunset.action'),
    actionType: 'popup',
    actionData: {
      popup: 'lights',
    },
    dismissable: true,
    priority: 30,
    level: 'info',
  };
}

// ============================================================================
// Rules Registry
// ============================================================================

const RULES = [
  {
    id: 'lights-left-on',
    cooldownMs: 60 * 60 * 1000, // 60 minutes
    evaluate: evaluateLightsLeftOn,
  },
  {
    id: 'ac-windows-conflict',
    cooldownMs: 30 * 60 * 1000, // 30 minutes
    evaluate: evaluateACWindowsConflict,
  },
  {
    id: 'sunset-lights',
    cooldownMs: 120 * 60 * 1000, // 120 minutes
    evaluate: evaluateSunsetLights,
  },
];

// ============================================================================
// Room-Specific Evaluation Function
// ============================================================================

/**
 * Evaluate suggestion rules against current state, filtered for a specific room
 * @param {Object} hass - Home Assistant instance  
 * @param {Object} context - Evaluation context
 * @param {Object} context.enabledMaps - Maps of enabled entity IDs
 * @param {Object} context.labelIds - Label IDs for each entity category
 * @param {Function} context.entityHasLabel - Function to check if entity has label
 * @param {Function} context.getAreaIdForEntity - Function to get area ID for an entity
 * @param {string} areaId - Area ID to filter suggestions for
 * @returns {Array} Array of active suggestions for this room, sorted by priority (highest first), max 2
 */
export function evaluateRoomSuggestions(hass, context, areaId) {
  if (!hass || !hass.states || !areaId) return [];

  const suggestions = [];
  const now = Date.now();

  // Load persistence state
  const cooldowns = loadCooldowns();
  const dismissed = loadDismissed();

  RULES.forEach(rule => {
    // Skip if in cooldown
    if (cooldowns[rule.id] && (now - cooldowns[rule.id]) < rule.cooldownMs) return;

    // Skip if dismissed this session
    if (dismissed[rule.id]) return;

    try {
      const suggestion = rule.evaluate(hass, context);
      if (suggestion) {
        // Filter suggestion based on whether its triggering entities are in this room
        const filteredSuggestion = filterSuggestionForRoom(suggestion, hass, context, areaId);
        if (filteredSuggestion) {
          suggestions.push(filteredSuggestion);
        }
      }
    } catch (e) {
      console.warn(`[Dashview] Room suggestion rule "${rule.id}" error:`, e);
    }
  });

  // Sort by priority (highest first), limit to 2 visible
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 2);
}

/**
 * Filter a suggestion to only include entities relevant to the given room
 * @param {Object} suggestion - The suggestion object
 * @param {Object} hass - Home Assistant instance
 * @param {Object} context - Evaluation context
 * @param {string} areaId - Area ID to filter for
 * @returns {Object|null} Filtered suggestion or null if no relevant entities
 */
function filterSuggestionForRoom(suggestion, hass, context, areaId) {
  if (!suggestion.actionData || suggestion.actionType !== 'service') {
    // For non-service suggestions (like popup actions), show in all rooms
    return suggestion;
  }

  const { entityIds } = suggestion.actionData;
  if (!entityIds || !Array.isArray(entityIds)) {
    // No specific entities to filter, show suggestion as-is
    return suggestion;
  }

  // Filter entityIds to only include those in this room
  const roomEntityIds = entityIds.filter(entityId => {
    return context.getAreaIdForEntity && context.getAreaIdForEntity(entityId) === areaId;
  });

  // If no entities are in this room, don't show the suggestion
  if (roomEntityIds.length === 0) {
    return null;
  }

  // Return a modified suggestion with only room-relevant entities
  const filteredSuggestion = {
    ...suggestion,
    id: `${suggestion.id}-${areaId}`, // Make ID unique per room
    actionData: {
      ...suggestion.actionData,
      entityIds: roomEntityIds,
    },
  };

  // Update description to reflect the filtered count
  if (suggestion.id === 'lights-left-on') {
    filteredSuggestion.description = t('smartSuggestions.lightsLeftOn.desc', { count: roomEntityIds.length });
  }

  return filteredSuggestion;
}

// ============================================================================
// Main Evaluation Function
// ============================================================================

/**
 * Evaluate all suggestion rules against current state
 * @param {Object} hass - Home Assistant instance
 * @param {Object} context - Evaluation context
 * @param {Object} context.enabledMaps - Maps of enabled entity IDs
 * @param {Object} context.labelIds - Label IDs for each entity category
 * @param {Function} context.entityHasLabel - Function to check if entity has label
 * @returns {Array} Array of active suggestions, sorted by priority (highest first), max 2
 */
export function evaluateSuggestions(hass, context) {
  if (!hass || !hass.states) return [];

  const suggestions = [];
  const now = Date.now();

  // Load persistence state
  const cooldowns = loadCooldowns();
  const dismissed = loadDismissed();

  RULES.forEach(rule => {
    // Skip if in cooldown
    if (cooldowns[rule.id] && (now - cooldowns[rule.id]) < rule.cooldownMs) return;

    // Skip if dismissed this session
    if (dismissed[rule.id]) return;

    try {
      const suggestion = rule.evaluate(hass, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    } catch (e) {
      console.warn(`[Dashview] Suggestion rule "${rule.id}" error:`, e);
    }
  });

  // Sort by priority (highest first), limit to 2 visible
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 2);
}
