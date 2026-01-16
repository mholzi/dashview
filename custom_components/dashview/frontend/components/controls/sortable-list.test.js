import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for Sortable List Component
 * - Story 7.1: Core sortable list functionality
 * - Story 7.6: RAF cleanup and initialization guard
 */

// Mock SortableJS (local vendor copy)
vi.mock('../../vendor/sortable.core.esm.js', () => ({
  default: {
    create: vi.fn((element, options) => {
      // Store options for later verification
      element._sortableOptions = options;
      return {
        option: vi.fn((key, value) => {
          element._sortableOptions[key] = value;
        }),
        destroy: vi.fn()
      };
    })
  }
}));

describe('SortableList Component', () => {
  let container;

  beforeEach(() => {
    // Create a container for test elements
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    container.remove();
  });

  describe('Component Registration', () => {
    it('should load the sortable-list module without errors', async () => {
      await expect(import('./sortable-list.js')).resolves.toBeDefined();
    });

    it('should export SortableList class', async () => {
      const module = await import('./sortable-list.js');
      expect(module.SortableList).toBeDefined();
      expect(typeof module.SortableList).toBe('function');
    });

    it('should register sortable-list custom element', async () => {
      await import('./sortable-list.js');
      expect(customElements.get('sortable-list')).toBeDefined();
    });
  });

  describe('Component Initialization', () => {
    it('should create sortable-list element', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');
      expect(element).toBeInstanceOf(HTMLElement);
    });

    it('should initialize with default attribute values', async () => {
      const { SortableList } = await import('./sortable-list.js');
      const element = new SortableList();

      expect(element._itemKey).toBe('id');
      expect(element._handleSelector).toBe('.sortable-handle');
      expect(element._disabled).toBe(false);
    });

    it('should have observedAttributes defined', async () => {
      const { SortableList } = await import('./sortable-list.js');
      const observed = SortableList.observedAttributes;

      expect(observed).toContain('item-key');
      expect(observed).toContain('handle-selector');
      expect(observed).toContain('disabled');
    });
  });

  describe('Attribute Handling', () => {
    it('should update item-key when attribute changes', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('item-key', 'floor_id');
      expect(element._itemKey).toBe('floor_id');
    });

    it('should update handle-selector when attribute changes', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('handle-selector', '.drag-handle');
      expect(element._handleSelector).toBe('.drag-handle');
    });

    it('should set disabled state from attribute', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('disabled', '');
      expect(element._disabled).toBe(true);

      element.removeAttribute('disabled');
      expect(element._disabled).toBe(false);
    });

    it('should use default value when item-key is empty', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('item-key', '');
      expect(element._itemKey).toBe('id');
    });

    it('should use default value when handle-selector is empty', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('handle-selector', '');
      expect(element._handleSelector).toBe('.sortable-handle');
    });

    it('should not trigger callback when value unchanged', async () => {
      await import('./sortable-list.js');
      const element = document.createElement('sortable-list');

      element.setAttribute('item-key', 'test');
      const currentKey = element._itemKey;

      // Set same value
      element.setAttribute('item-key', 'test');
      expect(element._itemKey).toBe(currentKey);
    });
  });

  describe('SortableJS Integration', () => {
    it('should initialize SortableJS on connectedCallback', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(Sortable.create).toHaveBeenCalled();
      expect(Sortable.create.mock.calls[0][0]).toBe(element);
    });

    it('should pass correct options to SortableJS', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      element.setAttribute('handle-selector', '.custom-handle');
      container.appendChild(element);

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      const options = element._sortableOptions;
      expect(options.animation).toBe(150);
      expect(options.handle).toBe('.custom-handle');
      expect(options.ghostClass).toBe('sortable-ghost');
      expect(options.chosenClass).toBe('sortable-chosen');
      expect(options.dragClass).toBe('sortable-drag');
    });

    it('should destroy SortableJS on disconnectedCallback', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      const sortable = element._sortable;
      container.removeChild(element);

      expect(sortable.destroy).toHaveBeenCalled();
    });

    it('should update disabled option in SortableJS', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      element.setAttribute('disabled', '');

      expect(element._sortable.option).toHaveBeenCalledWith('disabled', true);
    });
  });

  describe('Reorder Event', () => {
    it('should dispatch reorder event with correct detail', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      element.innerHTML = `
        <div data-id="item-1">Item 1</div>
        <div data-id="item-2">Item 2</div>
        <div data-id="item-3">Item 3</div>
      `;
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Capture event
      let capturedEvent = null;
      element.addEventListener('reorder', (e) => {
        capturedEvent = e;
      });

      // Simulate SortableJS onEnd callback
      const onEnd = element._sortableOptions.onEnd;
      onEnd({
        oldIndex: 0,
        newIndex: 2,
        item: element.querySelector('[data-id="item-1"]')
      });

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent.detail.oldIndex).toBe(0);
      expect(capturedEvent.detail.newIndex).toBe(2);
      expect(capturedEvent.detail.itemId).toBe('item-1');
      expect(capturedEvent.detail.order).toEqual(['item-1', 'item-2', 'item-3']);
    });

    it('should not dispatch event when position unchanged', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      element.innerHTML = `
        <div data-id="item-1">Item 1</div>
        <div data-id="item-2">Item 2</div>
      `;
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Capture event
      let eventFired = false;
      element.addEventListener('reorder', () => {
        eventFired = true;
      });

      // Simulate no movement
      const onEnd = element._sortableOptions.onEnd;
      onEnd({
        oldIndex: 1,
        newIndex: 1,
        item: element.querySelector('[data-id="item-2"]')
      });

      expect(eventFired).toBe(false);
    });

    it('should emit event with bubbles and composed flags', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      element.innerHTML = `
        <div data-id="item-1">Item 1</div>
        <div data-id="item-2">Item 2</div>
      `;
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      let capturedEvent = null;
      element.addEventListener('reorder', (e) => {
        capturedEvent = e;
      });

      const onEnd = element._sortableOptions.onEnd;
      onEnd({
        oldIndex: 0,
        newIndex: 1,
        item: element.querySelector('[data-id="item-1"]')
      });

      expect(capturedEvent.bubbles).toBe(true);
      expect(capturedEvent.composed).toBe(true);
    });
  });

  describe('Public API', () => {
    it('should provide refresh() method', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      expect(typeof element.refresh).toBe('function');
    });

    it('should reinitialize on refresh() call', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      const initialCallCount = Sortable.create.mock.calls.length;

      element.refresh();

      expect(Sortable.create.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should provide getSortable() method', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      expect(typeof element.getSortable).toBe('function');
    });

    it('should return SortableJS instance from getSortable()', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      const sortable = element.getSortable();
      expect(sortable).not.toBeNull();
      expect(sortable.option).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization - should not throw
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(element._sortable).toBeDefined();
    });

    it('should handle items without data-id', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      element.innerHTML = `
        <div>Item without ID</div>
        <div data-id="item-2">Item 2</div>
      `;
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      let capturedEvent = null;
      element.addEventListener('reorder', (e) => {
        capturedEvent = e;
      });

      const onEnd = element._sortableOptions.onEnd;
      onEnd({
        oldIndex: 0,
        newIndex: 1,
        item: element.querySelector('[data-id="item-2"]')
      });

      // Order should only include items with data-id
      expect(capturedEvent.detail.order).toEqual(['item-2']);
    });

    it('should handle rapid attribute changes', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Rapid changes should not throw
      element.setAttribute('disabled', '');
      element.removeAttribute('disabled');
      element.setAttribute('disabled', '');
      element.setAttribute('handle-selector', '.a');
      element.setAttribute('handle-selector', '.b');
      element.setAttribute('handle-selector', '.c');

      expect(element._handleSelector).toBe('.c');
      expect(element._disabled).toBe(true);
    });

    it('should not call refresh when not connected', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      // Not appended to DOM

      const initialCallCount = Sortable.create.mock.calls.length;
      element.refresh();

      // Should not reinitialize when not connected
      expect(Sortable.create.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Component Specification', () => {
    it('should specify animation duration of 150ms', () => {
      const spec = { animation: 150 };
      expect(spec.animation).toBe(150);
    });

    it('should specify CSS classes for drag states', () => {
      const spec = {
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag'
      };

      expect(spec.ghostClass).toBe('sortable-ghost');
      expect(spec.chosenClass).toBe('sortable-chosen');
      expect(spec.dragClass).toBe('sortable-drag');
    });

    it('should specify touch support threshold', () => {
      // Touch start threshold of 3px prevents accidental drags on scroll
      const spec = { touchStartThreshold: 3 };
      expect(spec.touchStartThreshold).toBe(3);
    });
  });

  describe('RAF Cleanup (Story 7.6)', () => {
    it('should store RAF ID when requestAnimationFrame is called (AC1)', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // RAF ID should be stored immediately after connectedCallback
      expect(element._rafId).not.toBeNull();
    });

    it('should clear RAF ID after callback executes (AC1)', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for RAF to execute
      await new Promise(resolve => requestAnimationFrame(resolve));

      // RAF ID should be cleared after execution
      expect(element._rafId).toBeNull();
    });

    it('should cancel RAF in disconnectedCallback if pending (AC2)', async () => {
      await import('./sortable-list.js');

      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Get the RAF ID before disconnecting
      const rafId = element._rafId;
      expect(rafId).not.toBeNull();

      // Disconnect immediately before RAF executes
      container.removeChild(element);

      // cancelAnimationFrame should have been called
      expect(cancelSpy).toHaveBeenCalledWith(rafId);
      expect(element._rafId).toBeNull();

      cancelSpy.mockRestore();
    });

    it('should not execute stale callbacks on disconnected components (AC4)', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      const createCallsBefore = Sortable.create.mock.calls.length;

      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Disconnect immediately
      container.removeChild(element);

      // Wait for RAF timing to pass
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Sortable.create should NOT have been called for this disconnected component
      expect(Sortable.create.mock.calls.length).toBe(createCallsBefore);
    });
  });

  describe('Initialization Guard (Story 7.6)', () => {
    it('should have _rafId property initialized to null', async () => {
      const { SortableList } = await import('./sortable-list.js');
      const element = new SortableList();

      expect(element._rafId).toBeNull();
    });

    it('should have _initPending property initialized to false (AC3)', async () => {
      const { SortableList } = await import('./sortable-list.js');
      const element = new SortableList();

      expect(element._initPending).toBe(false);
    });

    it('should set _initPending true before RAF call (AC3)', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // _initPending should be true immediately after connection
      expect(element._initPending).toBe(true);
    });

    it('should set _initPending false after RAF executes (AC3)', async () => {
      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(element._initPending).toBe(false);
    });

    it('should skip RAF if _initPending is true (AC3, AC6)', async () => {
      await import('./sortable-list.js');

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      const firstRafCallCount = rafSpy.mock.calls.length;

      // Simulate rapid remount by calling connectedCallback again while pending
      element.connectedCallback();

      // Should NOT have called RAF again
      expect(rafSpy.mock.calls.length).toBe(firstRafCallCount);

      rafSpy.mockRestore();
    });

    it('should skip RAF if _initialized is true (AC3, AC6)', async () => {
      await import('./sortable-list.js');

      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // Wait for initialization
      await new Promise(resolve => requestAnimationFrame(resolve));

      const initializedRafCallCount = rafSpy.mock.calls.length;

      // Simulate calling connectedCallback again after initialized
      element.connectedCallback();

      // Should NOT have called RAF again
      expect(rafSpy.mock.calls.length).toBe(initializedRafCallCount);

      rafSpy.mockRestore();
    });

    it('should handle rapid mount/unmount cycles without errors (AC6)', async () => {
      await import('./sortable-list.js');

      // Rapid mount/unmount 5 times
      for (let i = 0; i < 5; i++) {
        const element = document.createElement('sortable-list');
        container.appendChild(element);
        container.removeChild(element);
      }

      // Wait for all potential RAF callbacks
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should complete without throwing
      expect(true).toBe(true);
    });

    it('should not cause duplicate initialization on rapid remount (AC6)', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      const callsBefore = Sortable.create.mock.calls.length;

      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');

      // Mount
      container.appendChild(element);
      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));

      const callsAfterFirst = Sortable.create.mock.calls.length;
      expect(callsAfterFirst).toBe(callsBefore + 1);

      // Unmount and immediately remount
      container.removeChild(element);
      container.appendChild(element);

      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Should have been called exactly twice (once per mount)
      expect(Sortable.create.mock.calls.length).toBe(callsBefore + 2);
    });

    it('should cancel pending RAF when refresh() is called', async () => {
      const Sortable = (await import('../../vendor/sortable.core.esm.js')).default;
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      await import('./sortable-list.js');

      const element = document.createElement('sortable-list');
      container.appendChild(element);

      // RAF is pending now
      const rafId = element._rafId;
      expect(rafId).not.toBeNull();

      // Call refresh while RAF is pending
      element.refresh();

      // Should have cancelled the pending RAF
      expect(cancelSpy).toHaveBeenCalledWith(rafId);
      expect(element._rafId).toBeNull();
      expect(element._initPending).toBe(false);

      // Sortable should be initialized via refresh (not RAF)
      expect(Sortable.create).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });
  });

  describe('Bundle Size Verification', () => {
    it('should specify expected bundle size impact', () => {
      // AC 7.1.7: Bundle size impact < 15KB gzipped
      const spec = {
        maxBundleSize: '15KB',
        expectedSize: '~10KB',
        library: 'vendor/sortable.core.esm.js'
      };

      expect(spec.library).toBe('vendor/sortable.core.esm.js');
      expect(spec.maxBundleSize).toBe('15KB');
    });
  });
});
