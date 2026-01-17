/**
 * Mode Scheduler Tests
 * Tests for automatic mode scheduling functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ModeScheduler,
  getModeScheduler,
  resetModeScheduler,
  DAYS_OF_WEEK,
  DAY_LABELS,
  DAY_PRESETS
} from './mode-scheduler.js';

// Mock stores
vi.mock('../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    get: vi.fn((key) => {
      if (key === 'scheduleData') return null;
      return null;
    }),
    update: vi.fn()
  })),
  getModeStore: vi.fn(() => ({
    isManualOverride: false,
    activateMode: vi.fn(() => true)
  }))
}));

describe('Mode Scheduler', () => {
  let scheduler;

  beforeEach(() => {
    resetModeScheduler();
    scheduler = getModeScheduler();
  });

  afterEach(() => {
    resetModeScheduler();
  });

  describe('Constants', () => {
    it('should export DAYS_OF_WEEK array', () => {
      expect(DAYS_OF_WEEK).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    });

    it('should export DAY_LABELS object', () => {
      expect(DAY_LABELS.mon).toBe('Monday');
      expect(DAY_LABELS.sun).toBe('Sunday');
    });

    it('should export DAY_PRESETS', () => {
      expect(DAY_PRESETS.weekdays).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
      expect(DAY_PRESETS.weekends).toEqual(['sat', 'sun']);
      expect(DAY_PRESETS.everyday).toHaveLength(7);
    });
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const scheduler1 = getModeScheduler();
      const scheduler2 = getModeScheduler();
      expect(scheduler1).toBe(scheduler2);
    });

    it('should start with empty schedules', () => {
      expect(scheduler.schedules).toEqual([]);
    });
  });

  describe('addSchedule', () => {
    it('should add a new schedule with unique ID', () => {
      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri']
      });

      expect(id).toMatch(/^sched_\d+_[a-z0-9]+$/);
      expect(scheduler.schedules).toHaveLength(1);
    });

    it('should set schedule properties correctly', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon', 'tue'],
        revertAt: '07:00'
      });

      const schedule = scheduler.schedules[0];
      expect(schedule.modeId).toBe('night_mode');
      expect(schedule.time).toBe('22:00');
      expect(schedule.days).toEqual(['mon', 'tue']);
      expect(schedule.revertAt).toBe('07:00');
      expect(schedule.enabled).toBe(true);
    });

    it('should default revertAt to null', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(scheduler.schedules[0].revertAt).toBeNull();
    });

    it('should default days to empty array', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00'
      });

      expect(scheduler.schedules[0].days).toEqual([]);
    });

    it('should return null for missing modeId', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const id = scheduler.addSchedule({
        time: '22:00',
        days: ['mon']
      });

      expect(id).toBeNull();
      expect(scheduler.schedules).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('should return null for invalid time format', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '25:00',
        days: ['mon']
      });

      expect(id).toBeNull();
      expect(scheduler.schedules).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('should return null for invalid time string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: 'invalid',
        days: ['mon']
      });

      expect(id).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should return null for invalid day values', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['monday', 'tuesday']
      });

      expect(id).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should return null for invalid revertAt format', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon'],
        revertAt: 'invalid'
      });

      expect(id).toBeNull();
      consoleSpy.mockRestore();
    });

    it('should accept valid time formats', () => {
      const id1 = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '00:00',
        days: ['mon']
      });
      const id2 = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '23:59',
        days: ['tue']
      });
      const id3 = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '9:05',
        days: ['wed']
      });

      expect(id1).not.toBeNull();
      expect(id2).not.toBeNull();
      expect(id3).not.toBeNull();
      expect(scheduler.schedules).toHaveLength(3);
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule properties', () => {
      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      scheduler.updateSchedule(id, {
        time: '23:00',
        days: ['mon', 'tue', 'wed']
      });

      const schedule = scheduler.schedules[0];
      expect(schedule.time).toBe('23:00');
      expect(schedule.days).toEqual(['mon', 'tue', 'wed']);
    });

    it('should return false for non-existent schedule', () => {
      const result = scheduler.updateSchedule('non_existent', { time: '23:00' });
      expect(result).toBe(false);
    });

    it('should return true on success', () => {
      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      const result = scheduler.updateSchedule(id, { time: '23:00' });
      expect(result).toBe(true);
    });
  });

  describe('removeSchedule', () => {
    it('should remove a schedule', () => {
      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(scheduler.schedules).toHaveLength(1);

      const result = scheduler.removeSchedule(id);
      expect(result).toBe(true);
      expect(scheduler.schedules).toHaveLength(0);
    });

    it('should return false for non-existent schedule', () => {
      const result = scheduler.removeSchedule('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('getSchedulesForMode', () => {
    it('should return schedules for specific mode', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });
      scheduler.addSchedule({
        modeId: 'day_mode',
        time: '07:00',
        days: ['mon']
      });
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '23:00',
        days: ['sat']
      });

      const nightSchedules = scheduler.getSchedulesForMode('night_mode');
      expect(nightSchedules).toHaveLength(2);
      expect(nightSchedules.every(s => s.modeId === 'night_mode')).toBe(true);
    });

    it('should return empty array if no schedules for mode', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      const schedules = scheduler.getSchedulesForMode('away_mode');
      expect(schedules).toEqual([]);
    });
  });

  describe('toggleSchedule', () => {
    it('should toggle schedule enabled state', () => {
      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(scheduler.schedules[0].enabled).toBe(true);

      const result = scheduler.toggleSchedule(id);
      expect(result).toBe(false);
      expect(scheduler.schedules[0].enabled).toBe(false);

      const result2 = scheduler.toggleSchedule(id);
      expect(result2).toBe(true);
      expect(scheduler.schedules[0].enabled).toBe(true);
    });

    it('should return false for non-existent schedule', () => {
      const result = scheduler.toggleSchedule('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start interval when started', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      scheduler.start();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    });

    it('should not start multiple intervals', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      scheduler.start();
      scheduler.start();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear interval when stopped', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      scheduler.start();
      scheduler.stop();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on schedule add', () => {
      const listener = vi.fn();
      scheduler.subscribe(listener);

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(listener).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = scheduler.subscribe(listener);

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      scheduler.addSchedule({
        modeId: 'day_mode',
        time: '07:00',
        days: ['mon']
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => { throw new Error('Test error'); });
      const goodListener = vi.fn();

      scheduler.subscribe(errorListener);
      scheduler.subscribe(goodListener);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should reset to initial state', () => {
      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });
      scheduler.start();

      scheduler.reset();

      expect(scheduler.schedules).toEqual([]);
    });

    it('should clear interval when reset', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      scheduler.start();
      scheduler.reset();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('resetModeScheduler', () => {
    it('should reset the singleton instance', () => {
      const scheduler1 = getModeScheduler();
      scheduler1.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: ['mon']
      });

      resetModeScheduler();

      const scheduler2 = getModeScheduler();
      expect(scheduler2).not.toBe(scheduler1);
      expect(scheduler2.schedules).toEqual([]);
    });
  });

  describe('init', () => {
    it('should set mode store reference', () => {
      const mockModeStore = { activateMode: vi.fn(), isManualOverride: false };
      scheduler.init(mockModeStore);

      expect(scheduler._modeStore).toBe(mockModeStore);
    });

    it('should load schedules on init', () => {
      const mockModeStore = { activateMode: vi.fn(), isManualOverride: false };
      scheduler.init(mockModeStore);

      expect(scheduler._loaded).toBe(true);
    });
  });

  describe('_checkSchedules integration', () => {
    let mockModeStore;

    beforeEach(() => {
      vi.useFakeTimers();
      mockModeStore = {
        activateMode: vi.fn(() => true),
        isManualOverride: false
      };
      scheduler.init(mockModeStore);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger mode activation when schedule matches', () => {
      // Set up a schedule for current time
      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: currentTime,
        days: [currentDay]
      });

      // Manually call _checkSchedules
      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).toHaveBeenCalledWith('night_mode', false);
    });

    it('should not trigger when schedule is disabled', () => {
      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const id = scheduler.addSchedule({
        modeId: 'night_mode',
        time: currentTime,
        days: [currentDay]
      });

      scheduler.toggleSchedule(id); // Disable it

      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).not.toHaveBeenCalled();
    });

    it('should not trigger when manual override is active', () => {
      mockModeStore.isManualOverride = true;

      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: currentTime,
        days: [currentDay]
      });

      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).not.toHaveBeenCalled();
    });

    it('should not trigger when day does not match', () => {
      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const otherDay = currentDay === 'mon' ? 'tue' : 'mon';
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: currentTime,
        days: [otherDay]
      });

      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).not.toHaveBeenCalled();
    });

    it('should trigger revert to default at revertAt time', () => {
      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: '22:00',
        days: [currentDay],
        revertAt: currentTime
      });

      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).toHaveBeenCalledWith('default', false);
    });

    it('should prevent duplicate triggers within same minute', () => {
      const now = new Date();
      const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      scheduler.addSchedule({
        modeId: 'night_mode',
        time: currentTime,
        days: [currentDay]
      });

      scheduler._checkSchedules();
      scheduler._checkSchedules();
      scheduler._checkSchedules();

      expect(mockModeStore.activateMode).toHaveBeenCalledTimes(1);
    });
  });
});
