/**
 * Tests for polyfills module
 * Validates structuredClone polyfill behavior
 */

import { structuredClonePolyfill, initPolyfills } from './polyfills.js';

describe('structuredClonePolyfill', () => {
  describe('primitives and null', () => {
    it('returns null as-is', () => {
      expect(structuredClonePolyfill(null)).toBe(null);
    });

    it('returns undefined as-is', () => {
      expect(structuredClonePolyfill(undefined)).toBe(undefined);
    });

    it('returns numbers as-is', () => {
      expect(structuredClonePolyfill(42)).toBe(42);
      expect(structuredClonePolyfill(3.14)).toBe(3.14);
      expect(structuredClonePolyfill(0)).toBe(0);
      expect(structuredClonePolyfill(-1)).toBe(-1);
    });

    it('returns strings as-is', () => {
      expect(structuredClonePolyfill('hello')).toBe('hello');
      expect(structuredClonePolyfill('')).toBe('');
    });

    it('returns booleans as-is', () => {
      expect(structuredClonePolyfill(true)).toBe(true);
      expect(structuredClonePolyfill(false)).toBe(false);
    });
  });

  describe('plain objects', () => {
    it('clones shallow objects', () => {
      const original = { a: 1, b: 2 };
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('clones nested objects', () => {
      const original = { a: { b: { c: 1 } } };
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.a.b).not.toBe(original.a.b);
    });

    it('does not mutate original when modifying clone', () => {
      const original = { a: 1, nested: { b: 2 } };
      const cloned = structuredClonePolyfill(original);

      cloned.a = 999;
      cloned.nested.b = 888;

      expect(original.a).toBe(1);
      expect(original.nested.b).toBe(2);
    });
  });

  describe('arrays', () => {
    it('clones shallow arrays', () => {
      const original = [1, 2, 3];
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('clones nested arrays', () => {
      const original = [[1, 2], [3, 4]];
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it('clones arrays with objects', () => {
      const original = [{ a: 1 }, { b: 2 }];
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned[0]).not.toBe(original[0]);
    });
  });

  describe('Date objects', () => {
    it('clones Date objects', () => {
      const original = new Date('2024-01-15T12:00:00Z');
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.getTime()).toBe(original.getTime());
    });

    it('cloned Date is independent', () => {
      const original = new Date('2024-01-15T12:00:00Z');
      const cloned = structuredClonePolyfill(original);

      cloned.setFullYear(2025);

      expect(original.getFullYear()).toBe(2024);
      expect(cloned.getFullYear()).toBe(2025);
    });
  });

  describe('RegExp objects', () => {
    it('clones RegExp objects', () => {
      const original = /test/gi;
      const cloned = structuredClonePolyfill(original);

      expect(cloned.source).toBe(original.source);
      expect(cloned.flags).toBe(original.flags);
      expect(cloned).not.toBe(original);
    });
  });

  describe('Map objects', () => {
    it('clones Map objects', () => {
      const original = new Map([['a', 1], ['b', 2]]);
      const cloned = structuredClonePolyfill(original);

      expect(cloned.get('a')).toBe(1);
      expect(cloned.get('b')).toBe(2);
      expect(cloned).not.toBe(original);
    });

    it('clones Map with object values', () => {
      const obj = { x: 1 };
      const original = new Map([['key', obj]]);
      const cloned = structuredClonePolyfill(original);

      expect(cloned.get('key')).toEqual(obj);
      expect(cloned.get('key')).not.toBe(obj);
    });
  });

  describe('Set objects', () => {
    it('clones Set objects', () => {
      const original = new Set([1, 2, 3]);
      const cloned = structuredClonePolyfill(original);

      expect(cloned.has(1)).toBe(true);
      expect(cloned.has(2)).toBe(true);
      expect(cloned.has(3)).toBe(true);
      expect(cloned).not.toBe(original);
    });
  });

  describe('mixed nested structures', () => {
    it('clones complex nested structures', () => {
      const original = {
        string: 'hello',
        number: 42,
        boolean: true,
        nullVal: null,
        array: [1, { nested: true }],
        object: { a: 1, b: [2, 3] },
        date: new Date('2024-01-15'),
      };
      const cloned = structuredClonePolyfill(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.array).not.toBe(original.array);
      expect(cloned.array[1]).not.toBe(original.array[1]);
      expect(cloned.object).not.toBe(original.object);
      expect(cloned.date).not.toBe(original.date);
    });
  });

  describe('circular reference detection', () => {
    it('throws DOMException on circular reference', () => {
      const obj = { a: 1 };
      obj.self = obj;

      expect(() => structuredClonePolyfill(obj)).toThrow(DOMException);
    });

    it('throws with DataCloneError name', () => {
      const obj = { a: 1 };
      obj.self = obj;

      try {
        structuredClonePolyfill(obj);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e.name).toBe('DataCloneError');
      }
    });

    it('throws on nested circular reference', () => {
      const obj = { a: { b: {} } };
      obj.a.b.circular = obj;

      expect(() => structuredClonePolyfill(obj)).toThrow(DOMException);
    });
  });
});

describe('initPolyfills', () => {
  it('exports initPolyfills function', () => {
    expect(typeof initPolyfills).toBe('function');
  });

  it('returns false when native structuredClone exists', () => {
    // In test environment, native structuredClone exists
    const result = initPolyfills();
    expect(result).toBe(false);
  });
});

describe('settings-store draft mode compatibility', () => {
  it('correctly clones settings-like objects', () => {
    // Simulate settings store draft mode usage
    const settings = {
      enabledRooms: { 'room-1': true, 'room-2': false },
      enabledLights: { 'light.kitchen': true },
      theme: 'dark',
      floorOrder: ['floor-1', 'floor-2'],
    };

    const originalValues = {};
    const keys = ['enabledRooms', 'theme'];

    // Simulate startDraft() behavior
    keys.forEach(key => {
      originalValues[key] = structuredClonePolyfill(settings[key]);
    });

    const draftValues = structuredClonePolyfill(originalValues);

    // Modify draft
    draftValues.enabledRooms['room-1'] = false;
    draftValues.theme = 'light';

    // Verify originals unchanged
    expect(settings.enabledRooms['room-1']).toBe(true);
    expect(settings.theme).toBe('dark');
    expect(originalValues.enabledRooms['room-1']).toBe(true);
    expect(originalValues.theme).toBe('dark');
  });
});

describe('dashview-panel.js polyfill sync check', () => {
  it('should have the inline polyfill in dashview-panel.js matching the canonical implementation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const panelPath = path.resolve(import.meta.dirname, '..', 'dashview-panel.js');
    const panelSrc = fs.readFileSync(panelPath, 'utf-8');

    // Both must contain the same core logic markers
    const coreSignatures = [
      'Circular reference detected',
      'DataCloneError',
      'instanceof Date',
      'instanceof RegExp',
      'instanceof Map',
      'instanceof Set',
      'Array.isArray',
      'Object.prototype.hasOwnProperty',
    ];

    for (const sig of coreSignatures) {
      expect(panelSrc).toContain(sig);
    }
  });
});
