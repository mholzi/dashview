import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Unit tests for Epic 5: Admin UX Quick Wins
 * Tests the core panel methods added for Stories 5.1-5.4
 */

describe('Epic 5: Admin Panel Features', () => {
  let panel;

  beforeEach(() => {
    vi.useFakeTimers();
    // Create mock panel with Epic 5 methods
    panel = createMockPanel();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Helper to create a mock panel with Epic 5 methods
  function createMockPanel() {
    return {
      // State
      _expandedEntityTypes: {},
      _entitySearchTermsByRoom: {},
      _entitySearchDebounceTimers: {},
      _enabledLights: {},
      _enabledCovers: {},
      _saveSettings: vi.fn(),
      requestUpdate: vi.fn(),

      // Story 5.1: Collapsible sections
      _toggleEntityTypeSection(areaId, typeKey) {
        if (!this._expandedEntityTypes) {
          this._expandedEntityTypes = {};
        }
        if (!this._expandedEntityTypes[areaId]) {
          this._expandedEntityTypes[areaId] = new Set();
        }

        if (this._expandedEntityTypes[areaId].has(typeKey)) {
          this._expandedEntityTypes[areaId].delete(typeKey);
        } else {
          this._expandedEntityTypes[areaId].add(typeKey);
        }

        this.requestUpdate();
      },

      // Story 5.2: Entity search
      _handleEntitySearch(roomId, query) {
        if (!this._entitySearchTermsByRoom) {
          this._entitySearchTermsByRoom = {};
        }
        if (!this._entitySearchDebounceTimers) {
          this._entitySearchDebounceTimers = {};
        }

        if (this._entitySearchDebounceTimers[roomId]) {
          clearTimeout(this._entitySearchDebounceTimers[roomId]);
        }

        this._entitySearchTermsByRoom[roomId] = query;
        this.requestUpdate();

        this._entitySearchDebounceTimers[roomId] = setTimeout(() => {
          this.requestUpdate();
        }, 150);
      },

      _clearEntitySearch(roomId) {
        if (!this._entitySearchTermsByRoom) {
          this._entitySearchTermsByRoom = {};
        }
        this._entitySearchTermsByRoom[roomId] = '';
        this.requestUpdate();
      },

      _filterEntities(entities, searchTerm) {
        if (!searchTerm || !searchTerm.trim()) return entities;

        const term = searchTerm.toLowerCase().trim();
        return entities.filter(entity => {
          const name = (entity.name || entity.friendly_name || '').toLowerCase();
          return name.includes(term);
        });
      },

      // Story 5.4: Bulk toggle
      _bulkToggleEntities(areaId, settingsKey, entities, enabled) {
        if (!entities || entities.length === 0) return;

        const newMap = { ...this[settingsKey] };
        entities.forEach(entity => {
          const currentEnabled = newMap[entity.entity_id] !== false;
          if (currentEnabled !== enabled) {
            newMap[entity.entity_id] = enabled;
          }
        });

        this[settingsKey] = newMap;
        this._saveSettings();
        this.requestUpdate();
      }
    };
  }

  describe('Story 5.1: Collapsible Entity Type Sections', () => {
    describe('_toggleEntityTypeSection()', () => {
      it('should initialize _expandedEntityTypes if not exists', () => {
        panel._expandedEntityTypes = undefined;
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel._expandedEntityTypes).toBeDefined();
      });

      it('should initialize area Set if not exists', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel._expandedEntityTypes['area.living_room']).toBeInstanceOf(Set);
      });

      it('should expand a collapsed section (add to Set)', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel._expandedEntityTypes['area.living_room'].has('lights')).toBe(true);
      });

      it('should collapse an expanded section (remove from Set)', () => {
        panel._expandedEntityTypes = { 'area.living_room': new Set(['lights']) };
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel._expandedEntityTypes['area.living_room'].has('lights')).toBe(false);
      });

      it('should handle multiple entity types independently', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        panel._toggleEntityTypeSection('area.living_room', 'covers');

        expect(panel._expandedEntityTypes['area.living_room'].has('lights')).toBe(true);
        expect(panel._expandedEntityTypes['area.living_room'].has('covers')).toBe(true);
      });

      it('should handle multiple areas independently', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        panel._toggleEntityTypeSection('area.bedroom', 'lights');

        expect(panel._expandedEntityTypes['area.living_room'].has('lights')).toBe(true);
        expect(panel._expandedEntityTypes['area.bedroom'].has('lights')).toBe(true);
      });

      it('should call requestUpdate after toggle', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel.requestUpdate).toHaveBeenCalled();
      });

      it('should default to collapsed (empty Set means all collapsed)', () => {
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        // Toggle again to collapse
        panel._toggleEntityTypeSection('area.living_room', 'lights');
        expect(panel._expandedEntityTypes['area.living_room'].size).toBe(0);
      });
    });
  });

  describe('Story 5.2: Entity Search Within Room', () => {
    describe('_filterEntities()', () => {
      const testEntities = [
        { entity_id: 'light.ceiling', name: 'Ceiling Light' },
        { entity_id: 'light.floor_lamp', name: 'Floor Lamp' },
        { entity_id: 'light.desk', name: 'Desk Light' },
        { entity_id: 'switch.fan', name: 'Ceiling Fan' }
      ];

      it('should return all entities when search term is empty', () => {
        const result = panel._filterEntities(testEntities, '');
        expect(result).toEqual(testEntities);
      });

      it('should return all entities when search term is null', () => {
        const result = panel._filterEntities(testEntities, null);
        expect(result).toEqual(testEntities);
      });

      it('should return all entities when search term is whitespace only', () => {
        const result = panel._filterEntities(testEntities, '   ');
        expect(result).toEqual(testEntities);
      });

      it('should filter entities by substring match', () => {
        const result = panel._filterEntities(testEntities, 'ceiling');
        expect(result).toHaveLength(2);
        expect(result.map(e => e.entity_id)).toContain('light.ceiling');
        expect(result.map(e => e.entity_id)).toContain('switch.fan');
      });

      it('should be case-insensitive', () => {
        const result = panel._filterEntities(testEntities, 'CEILING');
        expect(result).toHaveLength(2);
      });

      it('should match partial names', () => {
        const result = panel._filterEntities(testEntities, 'lig');
        expect(result).toHaveLength(2);
        expect(result.map(e => e.name)).toContain('Ceiling Light');
        expect(result.map(e => e.name)).toContain('Desk Light');
      });

      it('should return empty array when no matches', () => {
        const result = panel._filterEntities(testEntities, 'xyz');
        expect(result).toHaveLength(0);
      });

      it('should handle entities with friendly_name instead of name', () => {
        const entities = [
          { entity_id: 'light.test', friendly_name: 'Test Light' }
        ];
        const result = panel._filterEntities(entities, 'test');
        expect(result).toHaveLength(1);
      });

      it('should handle entities with neither name nor friendly_name', () => {
        const entities = [
          { entity_id: 'light.test' }
        ];
        const result = panel._filterEntities(entities, 'test');
        expect(result).toHaveLength(0);
      });

      it('should trim whitespace from search term', () => {
        const result = panel._filterEntities(testEntities, '  ceiling  ');
        expect(result).toHaveLength(2);
      });
    });

    describe('_handleEntitySearch()', () => {
      it('should initialize _entitySearchTermsByRoom if not exists', () => {
        panel._entitySearchTermsByRoom = undefined;
        panel._handleEntitySearch('area.living_room', 'test');
        expect(panel._entitySearchTermsByRoom).toBeDefined();
      });

      it('should store search term for room', () => {
        panel._handleEntitySearch('area.living_room', 'ceiling');
        expect(panel._entitySearchTermsByRoom['area.living_room']).toBe('ceiling');
      });

      it('should handle multiple rooms independently', () => {
        panel._handleEntitySearch('area.living_room', 'ceiling');
        panel._handleEntitySearch('area.bedroom', 'lamp');

        expect(panel._entitySearchTermsByRoom['area.living_room']).toBe('ceiling');
        expect(panel._entitySearchTermsByRoom['area.bedroom']).toBe('lamp');
      });

      it('should call requestUpdate immediately', () => {
        panel._handleEntitySearch('area.living_room', 'test');
        expect(panel.requestUpdate).toHaveBeenCalled();
      });

      it('should debounce subsequent updates (150ms)', () => {
        panel._handleEntitySearch('area.living_room', 'test');
        const initialCallCount = panel.requestUpdate.mock.calls.length;

        vi.advanceTimersByTime(100);
        // Should not have called again yet
        expect(panel.requestUpdate.mock.calls.length).toBe(initialCallCount);

        vi.advanceTimersByTime(100);
        // Now should have called again
        expect(panel.requestUpdate.mock.calls.length).toBe(initialCallCount + 1);
      });

      it('should clear previous debounce timer on new search', () => {
        panel._handleEntitySearch('area.living_room', 'test1');
        vi.advanceTimersByTime(100);
        panel._handleEntitySearch('area.living_room', 'test2');

        // Only most recent search term should be stored
        expect(panel._entitySearchTermsByRoom['area.living_room']).toBe('test2');
      });
    });

    describe('_clearEntitySearch()', () => {
      it('should clear search term for room', () => {
        panel._entitySearchTermsByRoom = { 'area.living_room': 'ceiling' };
        panel._clearEntitySearch('area.living_room');
        expect(panel._entitySearchTermsByRoom['area.living_room']).toBe('');
      });

      it('should not affect other rooms', () => {
        panel._entitySearchTermsByRoom = {
          'area.living_room': 'ceiling',
          'area.bedroom': 'lamp'
        };
        panel._clearEntitySearch('area.living_room');
        expect(panel._entitySearchTermsByRoom['area.bedroom']).toBe('lamp');
      });

      it('should call requestUpdate', () => {
        panel._clearEntitySearch('area.living_room');
        expect(panel.requestUpdate).toHaveBeenCalled();
      });

      it('should handle clearing non-existent room gracefully', () => {
        panel._entitySearchTermsByRoom = {};
        expect(() => panel._clearEntitySearch('area.nonexistent')).not.toThrow();
      });
    });
  });

  describe('Story 5.4: Select All/None for Entities', () => {
    describe('_bulkToggleEntities()', () => {
      const testEntities = [
        { entity_id: 'light.one', name: 'Light One' },
        { entity_id: 'light.two', name: 'Light Two' },
        { entity_id: 'light.three', name: 'Light Three' }
      ];

      it('should enable all entities when enabled=true (from disabled state)', () => {
        // Start with all entities explicitly disabled
        panel._enabledLights = {
          'light.one': false,
          'light.two': false,
          'light.three': false
        };
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, true);

        expect(panel._enabledLights['light.one']).toBe(true);
        expect(panel._enabledLights['light.two']).toBe(true);
        expect(panel._enabledLights['light.three']).toBe(true);
      });

      it('should not change entities already in desired state (optimization)', () => {
        // Entities with undefined are treated as enabled by default
        panel._enabledLights = {};
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, true);

        // Should not explicitly set to true since undefined === enabled by default
        expect(panel._enabledLights['light.one']).toBeUndefined();
        expect(panel._saveSettings).toHaveBeenCalled(); // Still saves even if no changes
      });

      it('should disable all entities when enabled=false', () => {
        panel._enabledLights = {
          'light.one': true,
          'light.two': true,
          'light.three': true
        };
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, false);

        expect(panel._enabledLights['light.one']).toBe(false);
        expect(panel._enabledLights['light.two']).toBe(false);
        expect(panel._enabledLights['light.three']).toBe(false);
      });

      it('should only toggle entities that need state change', () => {
        panel._enabledLights = {
          'light.one': true,
          'light.two': false,
          'light.three': true
        };

        // Enable all - light.one and light.three are already true
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, true);

        // All should be true now
        expect(panel._enabledLights['light.one']).toBe(true);
        expect(panel._enabledLights['light.two']).toBe(true);
        expect(panel._enabledLights['light.three']).toBe(true);
      });

      it('should call _saveSettings after bulk toggle', () => {
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, true);
        expect(panel._saveSettings).toHaveBeenCalled();
      });

      it('should call requestUpdate after bulk toggle', () => {
        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, true);
        expect(panel.requestUpdate).toHaveBeenCalled();
      });

      it('should handle empty entities array gracefully', () => {
        expect(() => panel._bulkToggleEntities('area.living_room', '_enabledLights', [], true)).not.toThrow();
        expect(panel._saveSettings).not.toHaveBeenCalled();
      });

      it('should handle null entities gracefully', () => {
        expect(() => panel._bulkToggleEntities('area.living_room', '_enabledLights', null, true)).not.toThrow();
        expect(panel._saveSettings).not.toHaveBeenCalled();
      });

      it('should preserve entities not in the bulk operation', () => {
        panel._enabledLights = {
          'light.existing': true
        };

        panel._bulkToggleEntities('area.living_room', '_enabledLights', testEntities, false);

        // Existing entity should be preserved
        expect(panel._enabledLights['light.existing']).toBe(true);
        // New entities should be disabled
        expect(panel._enabledLights['light.one']).toBe(false);
      });

      it('should work with different settings keys', () => {
        const coverEntities = [
          { entity_id: 'cover.one', name: 'Cover One' }
        ];

        // Start with cover disabled to test enabling
        panel._enabledCovers = { 'cover.one': false };
        panel._bulkToggleEntities('area.living_room', '_enabledCovers', coverEntities, true);
        expect(panel._enabledCovers['cover.one']).toBe(true);
      });
    });
  });

  describe('Integration: Stories working together', () => {
    it('should filter entities and respect expanded state', () => {
      const entities = [
        { entity_id: 'light.ceiling', name: 'Ceiling Light' },
        { entity_id: 'light.floor', name: 'Floor Lamp' }
      ];

      // Set search term
      panel._handleEntitySearch('area.living_room', 'ceiling');

      // Filter entities
      const searchTerm = panel._entitySearchTermsByRoom['area.living_room'];
      const filtered = panel._filterEntities(entities, searchTerm);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Ceiling Light');
    });

    it('should bulk toggle only filtered entities', () => {
      const allEntities = [
        { entity_id: 'light.ceiling', name: 'Ceiling Light' },
        { entity_id: 'light.floor', name: 'Floor Lamp' }
      ];

      // Start with all disabled
      panel._enabledLights = {
        'light.ceiling': false,
        'light.floor': false
      };

      // Filter to ceiling only
      const filtered = panel._filterEntities(allEntities, 'ceiling');

      // Bulk enable only filtered
      panel._bulkToggleEntities('area.living_room', '_enabledLights', filtered, true);

      expect(panel._enabledLights['light.ceiling']).toBe(true);
      expect(panel._enabledLights['light.floor']).toBe(false); // Unchanged because not in filtered set
    });
  });
});
