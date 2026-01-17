/**
 * Mode Scheduler Service
 * Manages automatic time-based mode switching
 *
 * Features:
 * - Schedule modes by time of day
 * - Schedule by days of week
 * - Auto-revert to default mode
 * - Manual override takes precedence
 */

import { getSettingsStore } from '../stores/index.js';

/**
 * @typedef {Object} Schedule
 * @property {string} id - Unique schedule identifier
 * @property {string} modeId - Target mode to activate
 * @property {string} time - Activation time in HH:MM format (24-hour)
 * @property {string[]} days - Days of week ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
 * @property {string|null} revertAt - Time to revert to default (HH:MM or null)
 * @property {boolean} enabled - Whether schedule is active
 */

/**
 * Day of week mapping (JS Date.getDay() returns 0-6, Sunday first)
 */
export const DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Day labels for UI
 */
export const DAY_LABELS = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday'
};

/**
 * Preset day selections
 */
export const DAY_PRESETS = {
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  weekends: ['sat', 'sun'],
  everyday: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
};

/**
 * Mode Scheduler class
 * Manages scheduled mode activations
 */
export class ModeScheduler {
  constructor() {
    /** @type {Schedule[]} */
    this._schedules = [];
    /** @type {number|null} */
    this._checkInterval = null;
    /** @type {ModeStore|null} */
    this._modeStore = null;
    /** @type {Set<Function>} */
    this._listeners = new Set();
    /** @type {boolean} */
    this._loaded = false;
    /** @type {string|null} */
    this._lastTriggeredKey = null; // Prevents duplicate triggers
  }

  /**
   * Get all schedules
   * @returns {Schedule[]}
   */
  get schedules() {
    return this._schedules;
  }

  /**
   * Initialize the scheduler with the mode store
   * @param {ModeStore} modeStore - Mode store instance
   */
  init(modeStore) {
    this._modeStore = modeStore;
    this._loadSchedules();
  }

  /**
   * Validate time format (HH:MM, 24-hour)
   * @param {string} time - Time string to validate
   * @returns {boolean} True if valid
   * @private
   */
  _isValidTime(time) {
    if (!time || typeof time !== 'string') return false;
    const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    return match !== null;
  }

  /**
   * Validate day values
   * @param {string[]} days - Days array to validate
   * @returns {boolean} True if all days are valid
   * @private
   */
  _isValidDays(days) {
    if (!Array.isArray(days)) return false;
    return days.every(day => DAYS_OF_WEEK.includes(day));
  }

  /**
   * Add a new schedule
   * @param {Object} schedule - Schedule data
   * @param {string} schedule.modeId - Target mode
   * @param {string} schedule.time - Activation time (HH:MM)
   * @param {string[]} schedule.days - Days of week
   * @param {string|null} [schedule.revertAt] - Revert time (HH:MM or null)
   * @returns {string|null} New schedule ID, or null if validation fails
   */
  addSchedule(schedule) {
    // Validate required fields
    if (!schedule.modeId || typeof schedule.modeId !== 'string') {
      console.warn('[Dashview] Invalid schedule: modeId is required');
      return null;
    }

    if (!this._isValidTime(schedule.time)) {
      console.warn('[Dashview] Invalid schedule: time must be in HH:MM format');
      return null;
    }

    const days = schedule.days || [];
    if (!this._isValidDays(days)) {
      console.warn('[Dashview] Invalid schedule: days must be valid day codes');
      return null;
    }

    // Validate optional revertAt
    if (schedule.revertAt && !this._isValidTime(schedule.revertAt)) {
      console.warn('[Dashview] Invalid schedule: revertAt must be in HH:MM format');
      return null;
    }

    const id = `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newSchedule = {
      id,
      modeId: schedule.modeId,
      time: schedule.time,
      days,
      revertAt: schedule.revertAt || null,
      enabled: true
    };

    this._schedules.push(newSchedule);
    this._persist();
    this._notifyListeners();
    return id;
  }

  /**
   * Update an existing schedule
   * @param {string} scheduleId - Schedule ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success
   */
  updateSchedule(scheduleId, updates) {
    const index = this._schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) {
      console.warn('[Dashview] Schedule not found:', scheduleId);
      return false;
    }

    this._schedules[index] = {
      ...this._schedules[index],
      ...updates
    };

    this._persist();
    this._notifyListeners();
    return true;
  }

  /**
   * Remove a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {boolean} Success
   */
  removeSchedule(scheduleId) {
    const initialLength = this._schedules.length;
    this._schedules = this._schedules.filter(s => s.id !== scheduleId);

    if (this._schedules.length === initialLength) {
      console.warn('[Dashview] Schedule not found:', scheduleId);
      return false;
    }

    this._persist();
    this._notifyListeners();
    return true;
  }

  /**
   * Get schedules for a specific mode
   * @param {string} modeId - Mode ID
   * @returns {Schedule[]}
   */
  getSchedulesForMode(modeId) {
    return this._schedules.filter(s => s.modeId === modeId);
  }

  /**
   * Toggle schedule enabled state
   * @param {string} scheduleId - Schedule ID
   * @returns {boolean} New enabled state
   */
  toggleSchedule(scheduleId) {
    const schedule = this._schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      console.warn('[Dashview] Schedule not found:', scheduleId);
      return false;
    }

    schedule.enabled = !schedule.enabled;
    this._persist();
    this._notifyListeners();
    return schedule.enabled;
  }

  /**
   * Start the scheduler
   * Checks schedules every minute
   */
  start() {
    if (this._checkInterval) return;

    // Check every minute (60000ms)
    this._checkInterval = setInterval(() => this._checkSchedules(), 60000);

    // Run initial check
    this._checkSchedules();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this._checkInterval) {
      clearInterval(this._checkInterval);
      this._checkInterval = null;
    }
  }

  /**
   * Check all schedules and trigger if conditions match
   * @private
   */
  _checkSchedules() {
    if (!this._modeStore) return;

    const now = new Date();
    const currentDay = DAYS_OF_WEEK[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentKey = `${currentDay}-${currentTime}`;

    // Prevent duplicate triggers within same minute
    if (this._lastTriggeredKey === currentKey) return;

    for (const schedule of this._schedules) {
      if (!schedule.enabled) continue;

      // Check activation time
      if (schedule.days.includes(currentDay) && schedule.time === currentTime) {
        if (!this._modeStore.isManualOverride) {
          this._modeStore.activateMode(schedule.modeId, false); // false = not manual
          this._lastTriggeredKey = currentKey;
        }
      }

      // Check revert time
      if (schedule.revertAt && schedule.days.includes(currentDay) && schedule.revertAt === currentTime) {
        if (!this._modeStore.isManualOverride) {
          this._modeStore.activateMode('default', false); // false = not manual
          this._lastTriggeredKey = currentKey;
        }
      }
    }

    // Clear the key after a minute to allow next trigger
    setTimeout(() => {
      if (this._lastTriggeredKey === currentKey) {
        this._lastTriggeredKey = null;
      }
    }, 61000);
  }

  /**
   * Subscribe to schedule changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners
   * @private
   */
  _notifyListeners() {
    this._listeners.forEach(listener => {
      try {
        listener(this._schedules);
      } catch (e) {
        console.error('[Dashview] Scheduler listener error:', e);
      }
    });
  }

  /**
   * Load schedules from settings
   * @private
   */
  _loadSchedules() {
    if (this._loaded) return;

    try {
      const settingsStore = getSettingsStore();
      const scheduleData = settingsStore.get('scheduleData');

      if (scheduleData?.schedules) {
        this._schedules = scheduleData.schedules;
      }

      this._loaded = true;
    } catch (e) {
      console.warn('[Dashview] Failed to load schedules:', e);
    }
  }

  /**
   * Persist schedules to settings
   * @private
   */
  _persist() {
    try {
      const settingsStore = getSettingsStore();
      settingsStore.update({
        scheduleData: {
          schedules: this._schedules
        }
      });
    } catch (e) {
      console.warn('[Dashview] Failed to persist schedules:', e);
    }
  }

  /**
   * Reset the scheduler (for testing)
   */
  reset() {
    this.stop();
    this._schedules = [];
    this._modeStore = null;
    this._loaded = false;
    this._lastTriggeredKey = null;
    this._listeners.clear();
  }
}

// Singleton instance
let schedulerInstance = null;

/**
 * Get the singleton scheduler instance
 * @returns {ModeScheduler}
 */
export function getModeScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new ModeScheduler();
  }
  return schedulerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetModeScheduler() {
  if (schedulerInstance) {
    schedulerInstance.reset();
  }
  schedulerInstance = null;
}

export default ModeScheduler;
