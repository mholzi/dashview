import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestRegistry, getRequestRegistry, createRequestRegistry } from './request-registry.js';

describe('RequestRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new RequestRegistry();
  });

  describe('register()', () => {
    it('should return an AbortSignal', () => {
      const signal = registry.register('test-request');
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('should track the registered request', () => {
      registry.register('test-request');
      expect(registry.has('test-request')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('should abort existing request when re-registering same ID', () => {
      const signal1 = registry.register('test-request');
      const signal2 = registry.register('test-request');

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
      expect(registry.size).toBe(1);
    });

    it('should allow multiple different requests', () => {
      const signal1 = registry.register('request-1');
      const signal2 = registry.register('request-2');
      const signal3 = registry.register('request-3');

      expect(signal1.aborted).toBe(false);
      expect(signal2.aborted).toBe(false);
      expect(signal3.aborted).toBe(false);
      expect(registry.size).toBe(3);
    });
  });

  describe('abort()', () => {
    it('should abort a specific request', () => {
      const signal = registry.register('test-request');
      expect(signal.aborted).toBe(false);

      const result = registry.abort('test-request');

      expect(result).toBe(true);
      expect(signal.aborted).toBe(true);
      expect(registry.has('test-request')).toBe(false);
    });

    it('should return false for non-existent request', () => {
      const result = registry.abort('non-existent');
      expect(result).toBe(false);
    });

    it('should not affect other requests', () => {
      const signal1 = registry.register('request-1');
      const signal2 = registry.register('request-2');

      registry.abort('request-1');

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
      expect(registry.size).toBe(1);
    });

    it('should be safe to call multiple times', () => {
      registry.register('test-request');

      expect(registry.abort('test-request')).toBe(true);
      expect(registry.abort('test-request')).toBe(false);
    });
  });

  describe('abortAll()', () => {
    it('should abort all registered requests', () => {
      const signal1 = registry.register('request-1');
      const signal2 = registry.register('request-2');
      const signal3 = registry.register('request-3');

      registry.abortAll();

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(true);
      expect(registry.size).toBe(0);
    });

    it('should be safe to call when empty', () => {
      expect(() => registry.abortAll()).not.toThrow();
      expect(registry.size).toBe(0);
    });

    it('should clear the registry', () => {
      registry.register('request-1');
      registry.register('request-2');

      registry.abortAll();

      expect(registry.has('request-1')).toBe(false);
      expect(registry.has('request-2')).toBe(false);
    });
  });

  describe('has()', () => {
    it('should return true for registered request', () => {
      registry.register('test-request');
      expect(registry.has('test-request')).toBe(true);
    });

    it('should return false for non-existent request', () => {
      expect(registry.has('non-existent')).toBe(false);
    });

    it('should return false after request is aborted', () => {
      registry.register('test-request');
      registry.abort('test-request');
      expect(registry.has('test-request')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size).toBe(0);
    });

    it('should return correct count', () => {
      registry.register('request-1');
      expect(registry.size).toBe(1);

      registry.register('request-2');
      expect(registry.size).toBe(2);

      registry.abort('request-1');
      expect(registry.size).toBe(1);
    });
  });

  describe('complete()', () => {
    it('should remove request without aborting', () => {
      const signal = registry.register('test-request');

      const result = registry.complete('test-request');

      expect(result).toBe(true);
      expect(signal.aborted).toBe(false); // Not aborted, just removed
      expect(registry.has('test-request')).toBe(false);
    });

    it('should return false for non-existent request', () => {
      const result = registry.complete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('integration with fetch', () => {
    it('should work with fetch abort', async () => {
      const signal = registry.register('fetch-request');

      // Simulate what a fetch call would see
      const abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

      // Abort the request
      registry.abort('fetch-request');

      // The abort listener should have fired
      await expect(abortPromise).rejects.toThrow('Aborted');
    });

    it('should allow graceful abort handling', async () => {
      const signal = registry.register('fetch-request');
      let abortHandled = false;

      // Simulate abort handling pattern
      signal.addEventListener('abort', () => {
        abortHandled = true;
      });

      registry.abort('fetch-request');

      expect(abortHandled).toBe(true);
    });
  });

  describe('component lifecycle simulation', () => {
    it('should clean up on unmount pattern', () => {
      // Simulate component mount - start multiple requests
      const signal1 = registry.register('load-data');
      const signal2 = registry.register('load-user');
      const signal3 = registry.register('load-settings');

      expect(registry.size).toBe(3);

      // Simulate component unmount - abort all
      registry.abortAll();

      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(true);
      expect(signal3.aborted).toBe(true);
      expect(registry.size).toBe(0);
    });

    it('should handle re-mount after unmount', () => {
      // First mount
      const signal1 = registry.register('data');
      registry.abortAll();
      expect(signal1.aborted).toBe(true);

      // Re-mount
      const signal2 = registry.register('data');
      expect(signal2.aborted).toBe(false);
      expect(registry.size).toBe(1);
    });
  });
});

describe('getRequestRegistry singleton', () => {
  it('should return the same instance on multiple calls', () => {
    const instance1 = getRequestRegistry();
    const instance2 = getRequestRegistry();
    expect(instance1).toBe(instance2);
  });

  it('should return a RequestRegistry instance', () => {
    const instance = getRequestRegistry();
    expect(instance).toBeInstanceOf(RequestRegistry);
  });
});

describe('createRequestRegistry factory', () => {
  it('should return new instance each time', () => {
    const instance1 = createRequestRegistry();
    const instance2 = createRequestRegistry();
    expect(instance1).not.toBe(instance2);
  });

  it('should return isolated RequestRegistry instances', () => {
    const registry1 = createRequestRegistry();
    const registry2 = createRequestRegistry();

    registry1.register('test');

    expect(registry1.has('test')).toBe(true);
    expect(registry2.has('test')).toBe(false);
  });
});
