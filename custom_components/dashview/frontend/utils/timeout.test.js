/**
 * Tests for timeout.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withTimeout,
  withAbortableTimeout,
  createCancellableTimeout,
  TIMEOUT_DEFAULTS
} from './timeout.js';

describe('timeout utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000, 'Test');
      expect(result).toBe('success');
    });

    it('should reject when promise rejects before timeout', async () => {
      const promise = Promise.reject(new Error('Original error'));
      await expect(withTimeout(promise, 1000, 'Test')).rejects.toThrow('Original error');
    });

    it('should reject with timeout error when promise takes too long', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

      const timeoutPromise = withTimeout(slowPromise, 1000, 'Slow operation');

      // Advance time past the timeout
      vi.advanceTimersByTime(1001);

      await expect(timeoutPromise).rejects.toThrow('Slow operation timed out after 1000ms');
    });

    it('should clear timeout after promise resolves', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.resolve('done');

      await withTimeout(promise, 1000, 'Test');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should clear timeout after promise rejects', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const promise = Promise.reject(new Error('Error'));

      try {
        await withTimeout(promise, 1000, 'Test');
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should use default timeout of 30000ms', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(resolve, 35000);
      });

      const timeoutPromise = withTimeout(slowPromise, undefined, 'Default test');

      vi.advanceTimersByTime(30001);

      await expect(timeoutPromise).rejects.toThrow('Default test timed out after 30000ms');
    });

    it('should use default operation name', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

      const timeoutPromise = withTimeout(slowPromise, 1000);

      vi.advanceTimersByTime(1001);

      await expect(timeoutPromise).rejects.toThrow('Operation timed out after 1000ms');
    });
  });

  describe('withAbortableTimeout', () => {
    it('should pass AbortSignal to async function', async () => {
      const asyncFn = vi.fn().mockImplementation((signal) => {
        expect(signal).toBeInstanceOf(AbortSignal);
        return Promise.resolve('success');
      });

      const result = await withAbortableTimeout(asyncFn, 1000, 'Test');

      expect(result).toBe('success');
      expect(asyncFn).toHaveBeenCalled();
    });

    it('should abort and reject on timeout', async () => {
      let capturedSignal;
      const asyncFn = vi.fn().mockImplementation((signal) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      });

      const timeoutPromise = withAbortableTimeout(asyncFn, 1000, 'Abortable');

      vi.advanceTimersByTime(1001);

      await expect(timeoutPromise).rejects.toThrow('Abortable timed out after 1000ms');
      expect(capturedSignal.aborted).toBe(true);
    });

    it('should resolve before timeout', async () => {
      const asyncFn = vi.fn().mockImplementation(() => Promise.resolve('quick'));

      const result = await withAbortableTimeout(asyncFn, 1000, 'Quick');

      expect(result).toBe('quick');
    });
  });

  describe('createCancellableTimeout', () => {
    it('should return promise and cancel function', () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 5000));
      const result = createCancellableTimeout(promise, 1000, 'Test');

      expect(result).toHaveProperty('promise');
      expect(result).toHaveProperty('cancel');
      expect(typeof result.cancel).toBe('function');
    });

    it('should resolve when promise completes', async () => {
      const promise = Promise.resolve('completed');
      const { promise: wrappedPromise } = createCancellableTimeout(promise, 1000, 'Test');

      const result = await wrappedPromise;
      expect(result).toBe('completed');
    });

    it('should reject on timeout', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      const { promise: wrappedPromise } = createCancellableTimeout(slowPromise, 1000, 'Slow');

      vi.advanceTimersByTime(1001);

      await expect(wrappedPromise).rejects.toThrow('Slow timed out after 1000ms');
    });

    it('should not reject if cancelled before timeout', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve('late'), 5000));
      const { promise: wrappedPromise, cancel } = createCancellableTimeout(slowPromise, 1000, 'Cancellable');

      // Cancel before timeout
      cancel();

      // Advance past timeout
      vi.advanceTimersByTime(1500);

      // Now advance to promise resolution
      vi.advanceTimersByTime(5000);

      // The original promise should resolve
      const result = await wrappedPromise;
      expect(result).toBe('late');
    });
  });

  describe('TIMEOUT_DEFAULTS', () => {
    it('should have correct default values', () => {
      expect(TIMEOUT_DEFAULTS.FILE_READ).toBe(10000);
      expect(TIMEOUT_DEFAULTS.PHOTO_UPLOAD).toBe(30000);
      expect(TIMEOUT_DEFAULTS.WS_CALL).toBe(15000);
      expect(TIMEOUT_DEFAULTS.HISTORY_FETCH).toBe(20000);
      expect(TIMEOUT_DEFAULTS.SERVICE_CALL).toBe(10000);
    });
  });
});
