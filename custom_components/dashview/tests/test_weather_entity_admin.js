/**
 * Weather Entity Admin Tests for DashView - Principle 7
 * Test the weather entity dropdown functionality in admin interface
 */

// Mock DOM elements for testing
function createMockElement(tagName = 'div', id = null) {
    const element = {
        tagName: tagName.toUpperCase(),
        id: id,
        textContent: '',
        innerHTML: '',
        style: {},
        value: '',
        options: [],
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        appendChild: function(child) {
            this.options.push(child);
            return child;
        }
    };
    
    if (tagName === 'option') {
        element.selected = false;
        element.disabled = false;
    }
    
    return element;
}

// Mock HASS object with weather entities
function createMockHass() {
    return {
        states: {
            'weather.home': {
                attributes: { friendly_name: 'Home Weather' }
            },
            'weather.forecast_home': {
                attributes: { friendly_name: 'Home Forecast' }
            },
            'weather.openweathermap': {
                attributes: { friendly_name: 'OpenWeatherMap' }
            },
            'sensor.dashview_configured_weather': {
                state: 'weather.forecast_home'
            },
            'sensor.temperature': {
                state: '20'
            }
        },
        callService: function(domain, service, data) {
            return Promise.resolve();
        }
    };
}

// Mock DashView panel class for testing
class MockDashViewPanel {
    constructor() {
        this._hass = createMockHass();
        this._adminLocalState = {
            floorsConfig: null,
            roomsConfig: null,
            weatherEntity: null,
            isLoaded: false
        };
        this.shadowRoot = {
            getElementById: (id) => createMockElement('div', id),
            querySelector: (selector) => createMockElement('div')
        };
    }

    // Copy the methods from the actual implementation
    _getWeatherEntities() {
        if (!this._hass) return [];
        
        const weatherEntities = [];
        for (const entityId in this._hass.states) {
            if (entityId.startsWith('weather.')) {
                const entity = this._hass.states[entityId];
                weatherEntities.push({
                    entityId: entityId,
                    friendlyName: entity.attributes.friendly_name || entityId
                });
            }
        }
        
        return weatherEntities.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
    }

    async _getCurrentWeatherEntity() {
        try {
            const weatherSensor = this._hass.states['sensor.dashview_configured_weather'];
            if (weatherSensor && weatherSensor.state) {
                return weatherSensor.state;
            }
        } catch (error) {
            console.warn('[DashView] Could not get current weather entity from sensor:', error);
        }
        
        return 'weather.home';
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

    _populateWeatherEntityDropdown(selector, weatherEntities, currentEntity) {
        selector.innerHTML = '';
        
        if (weatherEntities.length === 0) {
            const option = createMockElement('option');
            option.value = '';
            option.textContent = 'No weather entities found';
            option.disabled = true;
            selector.appendChild(option);
            return;
        }
        
        weatherEntities.forEach(entity => {
            const option = createMockElement('option');
            option.value = entity.entityId;
            option.textContent = entity.friendlyName;
            option.selected = entity.entityId === currentEntity;
            selector.appendChild(option);
        });
    }
}

// Test class for weather entity admin functionality
class WeatherEntityAdminTests {
    constructor() {
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }

    assert(condition, message) {
        this.testCount++;
        if (condition) {
            console.log(`✓ ${message}`);
            this.passedCount++;
        } else {
            console.error(`✗ ${message}`);
            this.failedCount++;
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // Test weather entity retrieval
    testGetWeatherEntities() {
        console.log('[DashView] Testing weather entity retrieval...');
        
        const panel = new MockDashViewPanel();
        const entities = panel._getWeatherEntities();
        
        this.assert(entities.length === 3, 'Should find 3 weather entities');
        this.assert(entities[0].entityId === 'weather.forecast_home', 'First entity should be forecast_home (alphabetical)');
        this.assert(entities[0].friendlyName === 'Home Forecast', 'Should have correct friendly name');
        this.assert(entities[1].entityId === 'weather.home', 'Second entity should be home');
        this.assert(entities[2].entityId === 'weather.openweathermap', 'Third entity should be openweathermap');
    }

    // Test current weather entity retrieval
    async testGetCurrentWeatherEntity() {
        console.log('[DashView] Testing current weather entity retrieval...');
        
        const panel = new MockDashViewPanel();
        const currentEntity = await panel._getCurrentWeatherEntity();
        
        this.assert(currentEntity === 'weather.forecast_home', 'Should return configured weather entity from sensor');
        
        // Test the synchronous version used by the panel
        const currentEntityId = panel._getCurrentWeatherEntityId();
        this.assert(currentEntityId === 'weather.forecast_home', 'Should return configured weather entity ID synchronously');
    }

    // Test dropdown population
    async testPopulateWeatherEntityDropdown() {
        console.log('[DashView] Testing weather entity dropdown population...');
        
        const panel = new MockDashViewPanel();
        const selector = createMockElement('select');
        const entities = panel._getWeatherEntities();
        const currentEntity = panel._getCurrentWeatherEntityId();
        
        panel._populateWeatherEntityDropdown(selector, entities, currentEntity);
        
        this.assert(selector.options.length === 3, 'Should have 3 options in dropdown');
        this.assert(selector.options[0].value === 'weather.forecast_home', 'First option should be forecast_home');
        this.assert(selector.options[0].selected === true, 'Current entity should be selected');
        this.assert(selector.options[1].selected === false, 'Other entities should not be selected');
    }

    // Test dropdown with no weather entities
    testPopulateDropdownNoEntities() {
        console.log('[DashView] Testing dropdown with no weather entities...');
        
        const panel = new MockDashViewPanel();
        // Mock empty weather entities
        panel._hass.states = {};
        
        const selector = createMockElement('select');
        const entities = panel._getWeatherEntities();
        
        panel._populateWeatherEntityDropdown(selector, entities, 'weather.home');
        
        this.assert(selector.options.length === 1, 'Should have 1 option when no entities');
        this.assert(selector.options[0].textContent === 'No weather entities found', 'Should show no entities message');
        this.assert(selector.options[0].disabled === true, 'Option should be disabled');
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting weather entity admin tests...\n');
        
        try {
            this.testGetWeatherEntities();
            await this.testGetCurrentWeatherEntity();
            await this.testPopulateWeatherEntityDropdown();
            this.testPopulateDropdownNoEntities();
            
            console.log(`\n[DashView] Weather entity admin tests completed:`);
            console.log(`  Total tests: ${this.testCount}`);
            console.log(`  Passed: ${this.passedCount}`);
            console.log(`  Failed: ${this.failedCount}`);
            
            if (this.failedCount === 0) {
                console.log('✅ All weather entity admin tests passed!');
                return true;
            } else {
                console.log('❌ Some weather entity admin tests failed!');
                return false;
            }
        } catch (error) {
            console.error('[DashView] Weather entity admin test error:', error);
            return false;
        }
    }
}

// Export for use in other test files or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherEntityAdminTests;
} else if (typeof window !== 'undefined') {
    window.WeatherEntityAdminTests = WeatherEntityAdminTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const testRunner = new WeatherEntityAdminTests();
    testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}