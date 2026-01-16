/**
 * Tests for error-boundary.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeHandler, safeHandlerSync, createSafeServiceCaller } from './error-boundary.js';

describe('error-boundary', () => {
  let consoleWarnSpy;
  let dispatchEventSpy;
  let capturedEvents;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    capturedEvents = [];
    dispatchEventSpy = vi.spyOn(document, 'dispatchEvent').mockImplementation((event) => {
      capturedEvents.push(event);
      return true;
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });

  describe('safeHandler', () => {
    it('should execute function successfully and return result', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = safeHandler(fn, { source: 'test' });

      const result = await wrapped('arg1', 'arg2');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(capturedEvents).toHaveLength(0);
    });

    it('should catch async errors and log them', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(fn, { source: 'room-popup:toggleLights' });

      const result = await wrapped();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Dashview] Handler error in room-popup:toggleLights:',
        'Test error'
      );
    });

    it('should dispatch dashview-error event on error', async () => {
      const error = new Error('Service failed');
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = safeHandler(fn, {
        source: 'room-popup:toggleLights',
        entityId: 'light.living_room'
      });

      await wrapped();

      expect(capturedEvents).toHaveLength(1);
      const event = capturedEvents[0];
      expect(event.type).toBe('dashview-error');
      expect(event.detail.source).toBe('room-popup:toggleLights');
      expect(event.detail.entityId).toBe('light.living_room');
      expect(event.detail.error.message).toBe('Service failed');
      expect(event.detail.timestamp).toBeGreaterThan(0);
    });

    it('should call onError callback when error occurs', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const wrapped = safeHandler(fn, { source: 'test', onError });

      await wrapped();

      expect(onError).toHaveBeenCalledWith(error);
    });

    it('should handle onError callback throwing', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const wrapped = safeHandler(fn, { source: 'test', onError });

      // Should not throw even if onError throws
      await expect(wrapped()).resolves.toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Dashview] Error in onError callback:',
        'Callback error'
      );
    });

    it('should handle sync functions', async () => {
      const fn = vi.fn().mockReturnValue('sync-result');
      const wrapped = safeHandler(fn, { source: 'test' });

      const result = await wrapped();

      expect(result).toBe('sync-result');
    });

    it('should catch sync errors', async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      const wrapped = safeHandler(fn, { source: 'test' });

      const result = await wrapped();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('safeHandlerSync', () => {
    it('should execute function successfully', () => {
      const fn = vi.fn().mockReturnValue('result');
      const wrapped = safeHandlerSync(fn, { source: 'test' });

      const result = wrapped('arg1');

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledWith('arg1');
    });

    it('should catch sync errors and dispatch event', () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      const wrapped = safeHandlerSync(fn, { source: 'slider:drag' });

      const result = wrapped();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].detail.source).toBe('slider:drag');
    });

    it('should call onError callback', () => {
      const error = new Error('Test');
      const fn = vi.fn().mockImplementation(() => { throw error; });
      const onError = vi.fn();
      const wrapped = safeHandlerSync(fn, { source: 'test', onError });

      wrapped();

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('createSafeServiceCaller', () => {
    it('should call hass.callService successfully', async () => {
      const mockHass = {
        callService: vi.fn().mockResolvedValue({ success: true })
      };
      const safeCaller = createSafeServiceCaller(mockHass, 'room-popup');

      const result = await safeCaller('light', 'turn_on', { entity_id: 'light.test' });

      expect(result).toEqual({ success: true });
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', { entity_id: 'light.test' });
    });

    it('should handle missing hass gracefully', async () => {
      const safeCaller = createSafeServiceCaller(null, 'test');

      const result = await safeCaller('light', 'turn_on', {});

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Dashview] Cannot call service light.turn_on: hass not available'
      );
    });

    it('should catch service call errors and dispatch event', async () => {
      const mockHass = {
        callService: vi.fn().mockRejectedValue(new Error('Network error'))
      };
      const safeCaller = createSafeServiceCaller(mockHass, 'room-popup');

      const result = await safeCaller('climate', 'set_hvac_mode', {
        entity_id: 'climate.living_room',
        hvac_mode: 'heat'
      });

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Dashview] Service call failed in room-popup:',
        'Network error'
      );
      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].detail.source).toBe('room-popup:climate.set_hvac_mode');
      expect(capturedEvents[0].detail.entityId).toBe('climate.living_room');
    });

    it('should call onError callback on service failure', async () => {
      const mockHass = {
        callService: vi.fn().mockRejectedValue(new Error('Error'))
      };
      const onError = vi.fn();
      const safeCaller = createSafeServiceCaller(mockHass, 'test');

      await safeCaller('light', 'turn_on', { entity_id: 'light.x' }, onError);

      expect(onError).toHaveBeenCalled();
    });
  });
});
