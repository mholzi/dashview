/**
 * Entity Initialization Tests for DashView - Issue #34
 * Test the entity loading initialization sequence to ensure HA entities are properly loaded
 */

// Mock DOM elements for testing
function createMockElement(tagName = 'div', id = null) {
    const element = {
        tagName: tagName.toUpperCase(),
        id: id || '',
        innerHTML: '',
        textContent: '',
        value: '',
        options: [],
        style: {},
        dataset: {},
        attributes: {},
        classList: {
            add: function(className) { this._classes = this._classes || []; if (!this._classes.includes(className)) this._classes.push(className); },
            remove: function(className) { this._classes = this._classes || []; this._classes = this._classes.filter(c => c !== className); },
            contains: function(className) { return (this._classes || []).includes(className); },
            _classes: []
        },
        appendChild: function(child) { this._children = this._children || []; this._children.push(child); },
        querySelector: function(selector) { return createMockElement('div'); },
        querySelectorAll: function(selector) { return []; },
        addEventListener: function() {},
        _children: []
    };
    
    if (tagName === 'option') {
        element.selected = false;
        element.disabled = false;
    }
    
    if (tagName === 'select') {
        element.options = [];
        element.appendChild = function(option) {
            this.options.push(option);
        };
    }
    
    return element;
}

// Mock HASS object with weather entities
function createMockHass() {
    return {
        states: {
            'weather.home': {
                state: 'sunny',
                attributes: { 
                    friendly_name: 'Home Weather',
                    temperature: 22.5
                },
                forecast: [{ temperature: 23.0 }]
            },
            'weather.forecast_home': {
                state: 'partly-cloudy',
                attributes: { 
                    friendly_name: 'Home Forecast',
                    temperature: 21.8
                },
                forecast: [{ temperature: 22.5 }]
            },
            'person.markus': {
                state: 'home',
                attributes: {
                    entity_picture: null,
                    friendly_name: 'Markus'
                }
            },
            'sensor.dashview_configured_weather': {
                state: 'weather.forecast_home',
                attributes: {
                    friendly_name: 'DashView Weather Config'
                }
            }
        },
        callService: function(domain, service, data) {
            return Promise.resolve();
        }
    };
}

// Mock DashView panel class for testing initialization
class MockDashViewPanel {
    constructor() {
        this._hass = null;
        this._contentReady = false;
        this._entitySubscriptions = new Map();
        this._lastEntityStates = new Map();
        this._updateComponentCallCount = 0;
        this._updateComponentCalls = [];
        
        // Mock shadow root
        this.shadowRoot = {
            getElementById: (id) => createMockElement('div', id),
            querySelector: (selector) => createMockElement('div'),
            querySelectorAll: (selector) => [],
            appendChild: () => {}
        };
    }

    // Copy the methods from the actual implementation
    set hass(hass) {
        this._hass = hass;
        if (this._contentReady) {
            this._handleHassUpdate();
        }
    }

    _handleHassUpdate() {
        if (!this._hass) return;
        this._checkEntityChanges();
    }

    _checkEntityChanges() {
        const weatherEntityId = this._getCurrentWeatherEntityId();
        const entitiesToWatch = [
            weatherEntityId,
            'person.markus',
            // Add more entities as needed for testing
        ];

        let hasChanges = false;
        for (const entityId of entitiesToWatch) {
            const currentState = this._hass.states[entityId];
            const lastState = this._lastEntityStates.get(entityId);
            
            if (!lastState || 
                !currentState || 
                currentState.state !== lastState.state ||
                JSON.stringify(currentState.attributes) !== JSON.stringify(lastState.attributes)) {
                
                this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
                this._updateComponentForEntity(entityId);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            this._updateHeaderButtonsIfNeeded();
        }
    }

    _getCurrentWeatherEntityId() {
        try {
            const weatherSensor = this._hass.states['sensor.dashview_configured_weather'];
            if (weatherSensor && weatherSensor.state && this._hass.states[weatherSensor.state]) {
                return weatherSensor.state;
            }
        } catch (error) {
            console.warn('[DashView] Could not get current weather entity from sensor:', error);
        }
        
        return 'weather.forecast_home';
    }

    _updateComponentForEntity(entityId) {
        this._updateComponentCallCount++;
        this._updateComponentCalls.push({
            entityId,
            timestamp: Date.now(),
            shadowRootReady: !!this.shadowRoot,
            contentReady: this._contentReady
        });
        
        // Simulate the actual component update logic that might fail
        const shadow = this.shadowRoot;
        if (!shadow) {
            throw new Error('Shadow DOM not ready for component update');
        }
        
        // Mock component updates based on entity type
        const weatherEntityId = this._getCurrentWeatherEntityId();
        switch (entityId) {
            case weatherEntityId:
                this._updateWeatherButton(shadow);
                break;
            case 'person.markus':
                this._updatePersonButton(shadow);
                break;
        }
    }

    _updateWeatherButton(shadow) {
        // Mock weather button update - this would fail if DOM isn't ready
        const weatherButton = shadow.querySelector('.weather-button');
        // In real implementation, this might fail if the weather button doesn't exist yet
    }

    _updatePersonButton(shadow) {
        // Mock person button update
        const personButton = shadow.querySelector('.person-button');
        // In real implementation, this might fail if the person button doesn't exist yet
    }

    _updateHeaderButtonsIfNeeded() {
        // Mock header buttons update
    }

    // Simulate content loading completion
    simulateContentReady() {
        this._contentReady = true;
        if (this._hass) {
            this._handleHassUpdate();
        }
    }
}

// Test class for entity initialization
class EntityInitializationTests {
    constructor() {
        this.passedTests = 0;
        this.totalTests = 0;
    }

    assert(condition, message) {
        this.totalTests++;
        if (condition) {
            this.passedTests++;
            console.log(`✓ ${message}`);
        } else {
            console.log(`✗ ${message}`);
        }
    }

    // Test the initialization sequence timing
    testInitializationSequenceTiming() {
        console.log('[DashView] Testing initialization sequence timing...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        
        // Test Case 1: HASS set before content ready (potential issue)
        console.log('\n  Case 1: HASS set before content ready');
        panel.hass = mockHass;
        
        this.assert(panel._updateComponentCallCount === 0, 'Should not update components when content not ready');
        this.assert(panel._lastEntityStates.size === 0, 'Should not store entity states when content not ready');
        
        // Now simulate content becoming ready
        panel.simulateContentReady();
        
        this.assert(panel._updateComponentCallCount > 0, 'Should update components after content becomes ready');
        this.assert(panel._lastEntityStates.size > 0, 'Should store entity states after content becomes ready');
        
        // Test Case 2: HASS set after content ready (normal flow)
        console.log('\n  Case 2: HASS set after content ready');
        const panel2 = new MockDashViewPanel();
        panel2._contentReady = true;
        panel2.hass = mockHass;
        
        this.assert(panel2._updateComponentCallCount > 0, 'Should immediately update components when content already ready');
        this.assert(panel2._lastEntityStates.size > 0, 'Should immediately store entity states when content already ready');
    }

    // Test that entities are properly detected as changed on initial load
    testInitialEntityDetection() {
        console.log('\n[DashView] Testing initial entity detection...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Check that all expected entities were processed
        const expectedEntities = ['weather.forecast_home', 'person.markus'];
        const processedEntities = panel._updateComponentCalls.map(call => call.entityId);
        
        for (const entityId of expectedEntities) {
            this.assert(
                processedEntities.includes(entityId), 
                `Should process entity ${entityId} on initial load`
            );
        }
        
        // Check that entities are stored in lastEntityStates
        for (const entityId of expectedEntities) {
            this.assert(
                panel._lastEntityStates.has(entityId), 
                `Should store ${entityId} in lastEntityStates`
            );
        }
    }

    // Test that subsequent updates only trigger for changed entities
    testSubsequentUpdates() {
        console.log('\n[DashView] Testing subsequent entity updates...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        const initialCallCount = panel._updateComponentCallCount;
        
        // Set the same hass object again (no changes)
        panel.hass = mockHass;
        
        this.assert(
            panel._updateComponentCallCount === initialCallCount, 
            'Should not update components when entity states have not changed'
        );
        
        // Now change an entity state
        const modifiedHass = {
            ...mockHass,
            states: {
                ...mockHass.states,
                'person.markus': {
                    ...mockHass.states['person.markus'],
                    state: 'away'  // Changed from 'home' to 'away'
                }
            }
        };
        
        panel.hass = modifiedHass;
        
        this.assert(
            panel._updateComponentCallCount > initialCallCount, 
            'Should update components when entity state changes'
        );
        
        // Verify only the changed entity was updated
        const recentCalls = panel._updateComponentCalls.slice(initialCallCount);
        const changedEntities = recentCalls.map(call => call.entityId);
        
        this.assert(
            changedEntities.includes('person.markus'), 
            'Should update person.markus component when its state changes'
        );
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting entity initialization tests...\n');
        
        this.testInitializationSequenceTiming();
        this.testInitialEntityDetection();
        this.testSubsequentUpdates();
        
        console.log(`\n[DashView] Entity initialization tests completed:`);
        console.log(`  Total tests: ${this.totalTests}`);
        console.log(`  Passed: ${this.passedTests}`);
        console.log(`  Failed: ${this.totalTests - this.passedTests}`);
        
        const success = this.passedTests === this.totalTests;
        if (success) {
            console.log('✅ All entity initialization tests passed!');
        } else {
            console.log('❌ Some entity initialization tests failed!');
        }
        
        return success;
    }
}

// Export for use in other test files or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EntityInitializationTests;
} else if (typeof window !== 'undefined') {
    window.EntityInitializationTests = EntityInitializationTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const testRunner = new EntityInitializationTests();
    testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}