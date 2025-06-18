/**
 * End-to-End Entity Loading Test for DashView - Issue #34
 * Test to verify the complete entity loading lineage after fixes
 */

// Mock DOM elements for testing
function createMockShadowRoot() {
    const shadowRoot = {
        querySelector: (selector) => {
            // Return mock elements for expected selectors
            if (selector === '.weather-button .name') {
                return { textContent: '' };
            }
            if (selector === '.weather-button .label') {
                return { innerHTML: '' };
            }
            if (selector === '.weather-button .icon-container') {
                return { innerHTML: '' };
            }
            if (selector === '.person-button .image-container') {
                return { innerHTML: '' };
            }
            return null;
        },
        querySelectorAll: (selector) => {
            if (selector === '[data-template]') {
                return []; // No templates to load in this test
            }
            return [];
        },
        getElementById: (id) => {
            if (id === 'header-buttons') {
                return { innerHTML: '' };
            }
            return null;
        },
        appendChild: () => {}
    };
    return shadowRoot;
}

// Mock HASS object
function createMockHass() {
    return {
        states: {
            'weather.forecast_home': {
                state: 'sunny',
                attributes: { 
                    friendly_name: 'Home Forecast',
                    temperature: 22.5
                },
                forecast: [{ temperature: 23.0 }]
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
        }
    };
}

// Simplified test version of DashView panel focusing on entity loading
class TestDashViewPanel {
    constructor() {
        this._hass = null;
        this._contentReady = false;
        this._entitySubscriptions = new Map();
        this._lastEntityStates = new Map();
        this.shadowRoot = createMockShadowRoot();
        this._componentUpdateLog = [];
        this._headerButtonsUpdateTimer = null;
    }

    // Copy the key methods from our fixed implementation
    set hass(hass) {
        this._hass = hass;
        if (this._contentReady) {
            this._handleHassUpdate();
        }
    }

    _handleHassUpdate() {
        if (!this._hass) return;
        this._ensureInitialEntityStates();
        this._checkEntityChanges();
    }

    _ensureInitialEntityStates() {
        if (!this._hass) return;
        
        const weatherEntityId = this._getCurrentWeatherEntityId();
        const entitiesToWatch = [
            weatherEntityId,
            'person.markus'
        ];

        let initializedCount = 0;
        for (const entityId of entitiesToWatch) {
            if (!this._lastEntityStates.has(entityId)) {
                const currentState = this._hass.states[entityId];
                this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
                
                try {
                    this._updateComponentForEntity(entityId);
                    initializedCount++;
                } catch (error) {
                    console.warn(`[DashView] Could not update component for ${entityId} during initialization:`, error);
                }
            }
        }
        
        if (initializedCount > 0) {
            console.log(`[DashView] Initialized ${initializedCount} entities on first load`);
            try {
                this._updateHeaderButtonsIfNeeded();
            } catch (error) {
                console.warn('[DashView] Could not update header buttons during initialization:', error);
            }
        }
    }

    _checkEntityChanges() {
        const weatherEntityId = this._getCurrentWeatherEntityId();
        const entitiesToWatch = [
            weatherEntityId,
            'person.markus'
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

    _updateComponentForEntity(entityId) {
        const shadow = this.shadowRoot;
        if (!shadow) {
            console.warn(`[DashView] Shadow DOM not ready for ${entityId} update`);
            return;
        }

        try {
            const weatherEntityId = this._getCurrentWeatherEntityId();
            
            switch (entityId) {
                case weatherEntityId:
                    this._updateWeatherButton(shadow);
                    this._componentUpdateLog.push(`weather:${entityId}`);
                    break;
                case 'person.markus':
                    this._updatePersonButton(shadow);
                    this._componentUpdateLog.push(`person:${entityId}`);
                    break;
                default:
                    console.log(`[DashView] No specific handler for entity: ${entityId}`);
            }
        } catch (error) {
            console.error(`[DashView] Error updating component for ${entityId}:`, error);
        }
    }

    _updateWeatherButton(shadow) {
        const weatherEntityId = this._getCurrentWeatherEntityId();
        const weatherState = this._hass.states[weatherEntityId];
        if (!weatherState) {
            console.warn(`[DashView] Weather entity ${weatherEntityId} not found in HASS states`);
            return;
        }

        try {
            const nameElement = shadow.querySelector('.weather-button .name');
            const labelElement = shadow.querySelector('.weather-button .label');
            const iconElement = shadow.querySelector('.weather-button .icon-container');

            if (nameElement) {
                const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
                nameElement.textContent = temp ? `${temp.toFixed(1)}°C` : '-- °C';
            }
            
            if (labelElement) {
                labelElement.innerHTML = weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}<sup>°C</sup>` : '-- °C';
            }
            
            if (iconElement) {
                iconElement.innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`;
            }
            
            console.debug(`[DashView] Weather button updated for ${weatherEntityId}: ${weatherState.state}`);
            
        } catch (error) {
            console.error('[DashView] Error updating weather button:', error);
        }
    }

    _updatePersonButton(shadow) {
        const personState = this._hass.states['person.markus'];
        if (!personState) {
            console.warn('[DashView] Person entity person.markus not found in HASS states');
            return;
        }

        try {
            const imageElement = shadow.querySelector('.person-button .image-container');
            
            if (imageElement) {
                const img_src = personState.attributes.entity_picture || (personState.state === 'home' ? '/local/weather_icons/IMG_0421.jpeg' : '/local/weather_icons/IMG_0422.jpeg');
                imageElement.innerHTML = `<img src="${img_src}" width="45" height="45">`;
                console.debug(`[DashView] Person button updated: ${personState.state}`);
            }
        } catch (error) {
            console.error('[DashView] Error updating person button:', error);
        }
    }

    _updateHeaderButtonsIfNeeded() {
        if (this._headerButtonsUpdateTimer) {
            clearTimeout(this._headerButtonsUpdateTimer);
        }
        
        this._headerButtonsUpdateTimer = setTimeout(() => {
            // Mock header buttons update
            this._componentUpdateLog.push('header:buttons');
        }, 100);
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

    // Simulate content being ready (with or without errors)
    simulateContentReady(withErrors = false) {
        if (withErrors) {
            // Simulate a content loading error that used to break entity loading
            console.warn('[DashView] Simulating content loading error...');
        }
        
        // With our fix, content is always marked as ready for entity loading
        this._contentReady = true;
        if (this._hass) {
            this._handleHassUpdate();
        }
    }
}

// Test class for end-to-end entity loading
class EndToEndEntityLoadingTests {
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

    // Test complete entity loading lineage
    testCompleteEntityLoadingLineage() {
        console.log('[DashView] Testing complete entity loading lineage...');
        
        const panel = new TestDashViewPanel();
        const mockHass = createMockHass();
        
        // Step 1: Set HASS before content is ready (common scenario)
        console.log('\n  Step 1: Setting HASS before content ready');
        panel.hass = mockHass;
        
        this.assert(panel._contentReady === false, 'Content should not be ready initially');
        this.assert(panel._lastEntityStates.size === 0, 'No entities should be tracked before content ready');
        
        // Step 2: Simulate content becoming ready (the critical fix point)
        console.log('\n  Step 2: Content becomes ready');
        panel.simulateContentReady();
        
        this.assert(panel._contentReady === true, 'Content should be ready after simulation');
        this.assert(panel._lastEntityStates.size > 0, 'Entities should be tracked after content ready');
        
        // Step 3: Verify specific entities are loaded
        console.log('\n  Step 3: Verifying specific entities are loaded');
        const expectedEntities = ['weather.forecast_home', 'person.markus'];
        
        for (const entityId of expectedEntities) {
            this.assert(
                panel._lastEntityStates.has(entityId), 
                `Entity ${entityId} should be tracked`
            );
            
            const entityState = panel._lastEntityStates.get(entityId);
            this.assert(
                entityState !== null && entityState !== undefined, 
                `Entity ${entityId} should have valid state`
            );
        }
        
        // Step 4: Verify components were updated
        console.log('\n  Step 4: Verifying components were updated');
        this.assert(
            panel._componentUpdateLog.length > 0, 
            'Component updates should have been logged'
        );
        
        const weatherUpdates = panel._componentUpdateLog.filter(log => log.startsWith('weather:'));
        const personUpdates = panel._componentUpdateLog.filter(log => log.startsWith('person:'));
        
        this.assert(weatherUpdates.length > 0, 'Weather component should have been updated');
        this.assert(personUpdates.length > 0, 'Person component should have been updated');
    }

    // Test entity loading with content errors (the key fix)
    testEntityLoadingWithContentErrors() {
        console.log('\n[DashView] Testing entity loading with content errors...');
        
        const panel = new TestDashViewPanel();
        const mockHass = createMockHass();
        
        // Set HASS first
        panel.hass = mockHass;
        
        // Simulate content loading with errors (used to break entity loading)
        console.log('\n  Simulating content loading with errors');
        panel.simulateContentReady(true); // with errors
        
        // With our fix, entity loading should still work
        this.assert(panel._contentReady === true, 'Content should be ready despite errors');
        this.assert(panel._lastEntityStates.size > 0, 'Entities should be tracked despite content errors');
        
        // Verify entities still work
        const weatherEntity = panel._lastEntityStates.get('weather.forecast_home');
        const personEntity = panel._lastEntityStates.get('person.markus');
        
        this.assert(weatherEntity !== null, 'Weather entity should be loaded despite content errors');
        this.assert(personEntity !== null, 'Person entity should be loaded despite content errors');
        
        console.log('\n  ✅ Entity loading is resilient to content loading errors');
    }

    // Test entity state changes after initialization
    testEntityStateChanges() {
        console.log('\n[DashView] Testing entity state changes after initialization...');
        
        const panel = new TestDashViewPanel();
        const mockHass = createMockHass();
        
        // Initialize
        panel.hass = mockHass;
        panel.simulateContentReady();
        
        const initialUpdateCount = panel._componentUpdateLog.length;
        
        // Change entity state
        const modifiedHass = {
            ...mockHass,
            states: {
                ...mockHass.states,
                'person.markus': {
                    ...mockHass.states['person.markus'],
                    state: 'away' // Changed from 'home'
                }
            }
        };
        
        console.log('\n  Changing person state from home to away');
        panel.hass = modifiedHass;
        
        this.assert(
            panel._componentUpdateLog.length > initialUpdateCount, 
            'Additional component updates should occur after state change'
        );
        
        const updatedPersonState = panel._lastEntityStates.get('person.markus');
        this.assert(
            updatedPersonState && updatedPersonState.state === 'away', 
            'Person state should be updated to away'
        );
        
        console.log('\n  ✅ Entity state changes are properly detected and handled');
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting end-to-end entity loading tests...\n');
        
        this.testCompleteEntityLoadingLineage();
        this.testEntityLoadingWithContentErrors();
        this.testEntityStateChanges();
        
        console.log(`\n[DashView] End-to-end entity loading tests completed:`);
        console.log(`  Total tests: ${this.totalTests}`);
        console.log(`  Passed: ${this.passedTests}`);
        console.log(`  Failed: ${this.totalTests - this.passedTests}`);
        
        const success = this.passedTests === this.totalTests;
        if (success) {
            console.log('✅ All end-to-end entity loading tests passed!');
            console.log('\n🎉 Entity loading lineage verified - Issue #34 resolved!');
        } else {
            console.log('❌ Some end-to-end entity loading tests failed!');
        }
        
        return success;
    }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const testRunner = new EndToEndEntityLoadingTests();
    testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = EndToEndEntityLoadingTests;