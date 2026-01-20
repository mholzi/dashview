/**
 * Anomaly Detector Service
 * Rate-of-change detection for temperature and humidity sensors
 *
 * Provides rapid change alerts when climate values change faster than
 * configured thresholds, helping identify HVAC issues or open windows.
 */

/**
 * @typedef {Object} HistoryPoint
 * @property {number} time - Timestamp in milliseconds
 * @property {number} value - Sensor value at that time
 */

/**
 * @typedef {Object} RateOfChangeResult
 * @property {number} change - Absolute change in value
 * @property {number} duration - Duration in minutes
 * @property {'rising'|'falling'} direction - Direction of change
 */

/**
 * @typedef {Object} AnomalyResult
 * @property {boolean} detected - Whether an anomaly was detected
 * @property {number} change - Absolute change in value
 * @property {number} duration - Duration in minutes
 * @property {'rising'|'falling'} direction - Direction of change
 * @property {string} formattedDuration - Human-readable duration (e.g., "1 hour", "30 minutes")
 */

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1 hour", "30 minutes", "1.5 hours")
 */
export function formatDuration(minutes) {
  if (minutes >= 60) {
    const hours = minutes / 60;
    if (hours === 1) {
      return '1 hour';
    }
    // Check if it's a whole number of hours
    if (Number.isInteger(hours)) {
      return `${hours} hours`;
    }
    return `${hours.toFixed(1)} hours`;
  }
  const roundedMinutes = Math.round(minutes);
  return roundedMinutes === 1 ? '1 minute' : `${roundedMinutes} minutes`;
}

/**
 * Calculate rate of change from history data within a time window
 *
 * @param {HistoryPoint[]} history - Array of {time, value} objects, sorted by time ascending
 * @param {number} windowMinutes - Time window in minutes to analyze
 * @returns {RateOfChangeResult|null} Rate of change result or null if insufficient data
 */
export function calculateRateOfChange(history, windowMinutes) {
  if (!history || history.length < 2) {
    return null;
  }

  const now = Date.now();
  const windowStart = now - (windowMinutes * 60 * 1000);

  // Filter history to only include points within the window
  const windowData = history.filter(h => h.time >= windowStart);

  if (windowData.length < 2) {
    return null;
  }

  // Get oldest and newest values within window
  const oldest = windowData[0];
  const newest = windowData[windowData.length - 1];

  const change = newest.value - oldest.value;
  const duration = (newest.time - oldest.time) / 60000; // Convert to minutes

  // Need at least some duration to calculate rate
  if (duration < 1) {
    return null;
  }

  return {
    change: Math.abs(change),
    duration: Math.round(duration),
    direction: change >= 0 ? 'rising' : 'falling',
  };
}

/**
 * Detect temperature anomaly (rapid change)
 *
 * @param {HistoryPoint[]} history - Temperature history data
 * @param {number} thresholdDegrees - Change threshold in degrees (e.g., 5 for 5°C)
 * @param {number} windowMinutes - Time window in minutes (e.g., 60 for 1 hour)
 * @returns {AnomalyResult|null} Anomaly result if detected, null otherwise
 */
export function detectTemperatureAnomaly(history, thresholdDegrees, windowMinutes) {
  const rateOfChange = calculateRateOfChange(history, windowMinutes);

  if (!rateOfChange) {
    return null;
  }

  // Check if change exceeds threshold
  if (rateOfChange.change >= thresholdDegrees) {
    return {
      detected: true,
      change: rateOfChange.change,
      duration: rateOfChange.duration,
      direction: rateOfChange.direction,
      formattedDuration: formatDuration(rateOfChange.duration),
    };
  }

  return null;
}

/**
 * Detect humidity anomaly (rapid change)
 *
 * @param {HistoryPoint[]} history - Humidity history data
 * @param {number} thresholdPercent - Change threshold in percent (e.g., 20 for 20%)
 * @param {number} windowMinutes - Time window in minutes (e.g., 30)
 * @returns {AnomalyResult|null} Anomaly result if detected, null otherwise
 */
export function detectHumidityAnomaly(history, thresholdPercent, windowMinutes) {
  const rateOfChange = calculateRateOfChange(history, windowMinutes);

  if (!rateOfChange) {
    return null;
  }

  // Check if change exceeds threshold
  if (rateOfChange.change >= thresholdPercent) {
    return {
      detected: true,
      change: rateOfChange.change,
      duration: rateOfChange.duration,
      direction: rateOfChange.direction,
      formattedDuration: formatDuration(rateOfChange.duration),
    };
  }

  return null;
}

export default {
  formatDuration,
  calculateRateOfChange,
  detectTemperatureAnomaly,
  detectHumidityAnomaly,
};
