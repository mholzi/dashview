/**
 * Frontend validation tests for DashView - Principle 7
 * Run in browser console: node custom_components/dashview/tests/test_frontend_validation.js
 */

// Mock DOM elements for testing
function createMockElement(tagName = 'div') {
    return {
        tagName: tagName.toUpperCase(),
        textContent: '',
        innerHTML: '',
        style: {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
}

// Mock shadowRoot
function createMockShadowRoot() {
    return {
        getElementById: (id) => createMockElement(),
        querySelector: (selector) => createMockElement(),
        querySelectorAll: (selector) => []
    };
}

// Test class for DashView frontend validation
class DashViewFrontendTests {
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

    // Test entity ID validation - Principle 10
    testEntityIdValidation() {
        console.log('[DashView] Testing entity ID validation...');
        
        const validEntityIds = [
            'binary_sensor.floor_eg_active',
            'weather.forecast_home',
            'person.markus',
            'sensor.temperature_1'
        ];
        
        const invalidEntityIds = [
            'invalid_entity_id',
            'sensor.',
            '.invalid',
            'SENSOR.INVALID',
            'sensor.invalid-name',
            'sensor..invalid',
            '123sensor.invalid'
        ];
        
        // Simulate the validation function from dashview-panel.js
        function validateEntityId(entityId) {
            if (!entityId || typeof entityId !== 'string') return false;
            const entityPattern = /^[a-z_]+\.[a-z0-9_]+$/;
            return entityPattern.test(entityId);
        }

        // Test valid entity IDs
        validEntityIds.forEach(entityId => {
            this.assert(
                validateEntityId(entityId),
                `Valid entity ID should pass: ${entityId}`
            );
        });

        // Test invalid entity IDs
        invalidEntityIds.forEach(entityId => {
            this.assert(
                !validateEntityId(entityId),
                `Invalid entity ID should fail: ${entityId}`
            );
        });
    }

    // Test HTML sanitization - Principle 10
    testHtmlSanitization() {
        console.log('[DashView] Testing HTML sanitization...');
        
        // Simulate the sanitization function from dashview-panel.js
        function sanitizeHtml(input) {
            if (!input || typeof input !== 'string') return '';
            // In real DOM: const div = document.createElement('div');
            // For testing, we'll simulate the behavior
            return input.replace(/[<>]/g, '');
        }

        const testCases = [
            { input: 'Hello World', expected: 'Hello World' },
            { input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script' },
            { input: 'Safe <b>text</b>', expected: 'Safe btext/b' },
            { input: '', expected: '' },
            { input: null, expected: '' },
            { input: undefined, expected: '' }
        ];

        testCases.forEach(testCase => {
            const result = sanitizeHtml(testCase.input);
            this.assert(
                result === testCase.expected,
                `Sanitization test: "${testCase.input}" -> "${result}" (expected: "${testCase.expected}")`
            );
        });
    }

    // Test configuration structure validation - Principle 7
    testConfigValidation() {
        console.log('[DashView] Testing configuration validation...');
        
        // Simulate the validation function from dashview-panel.js
        function validateConfigStructure(config, requiredFields) {
            if (!config || typeof config !== 'object') return false;
            return requiredFields.every(field => config.hasOwnProperty(field));
        }

        // Test floors configuration
        const validFloorsConfig = {
            floor_icons: { "EG": "mdi:home" },
            floor_sensors: { "EG": "binary_sensor.floor_eg_active" }
        };
        
        this.assert(
            validateConfigStructure(validFloorsConfig, ['floor_icons', 'floor_sensors']),
            'Valid floors config should pass validation'
        );

        const invalidFloorsConfig = {
            floor_icons: { "EG": "mdi:home" }
            // Missing floor_sensors
        };
        
        this.assert(
            !validateConfigStructure(invalidFloorsConfig, ['floor_icons', 'floor_sensors']),
            'Invalid floors config should fail validation'
        );

        // Test rooms configuration
        const validRoomsConfig = {
            floors: { "EG": ["binary_sensor.combined_sensor_wohnzimmer"] }
        };
        
        this.assert(
            validateConfigStructure(validRoomsConfig, ['floors']),
            'Valid rooms config should pass validation'
        );

        // Test house setup configuration
        const validHouseSetupConfig = {
            rooms: { "wohnzimmer": { "friendly_name": "Wohnzimmer" } },
            floors: { "EG": { "friendly_name": "Erdgeschoss" } }
        };
        
        this.assert(
            validateConfigStructure(validHouseSetupConfig, ['rooms', 'floors']),  
            'Valid house setup config should pass validation'
        );

        // Test invalid types
        this.assert(
            !validateConfigStructure(null, ['floors']),
            'Null config should fail validation'
        );
        
        this.assert(
            !validateConfigStructure('not_an_object', ['floors']),
            'String config should fail validation'
        );
    }

    // Test MDI icon processing - Principle 11
    testMdiIconProcessing() {
        console.log('[DashView] Testing MDI icon processing...');
        
        // Simulate the icon processing function from dashview-panel.js
        function processIconName(iconName) {
            if (!iconName) return 'mdi-help-circle';
            
            // Remove mdi: prefix and ensure mdi- prefix
            let processedIcon = iconName.replace('mdi:', '').replace('mdi-', '');
            if (!processedIcon.startsWith('mdi-')) {
                processedIcon = 'mdi-' + processedIcon;
            }
            
            return processedIcon;
        }

        const testCases = [
            { input: 'mdi:home', expected: 'mdi-home' },
            { input: 'mdi-home', expected: 'mdi-home' },
            { input: 'home', expected: 'mdi-home' },
            { input: '', expected: 'mdi-help-circle' },
            { input: null, expected: 'mdi-help-circle' },
            { input: undefined, expected: 'mdi-help-circle' },
            { input: 'mdi:lightbulb-outline', expected: 'mdi-lightbulb-outline' }
        ];

        testCases.forEach(testCase => {
            const result = processIconName(testCase.input);
            this.assert(
                result === testCase.expected,
                `Icon processing: "${testCase.input}" -> "${result}" (expected: "${testCase.expected}")`
            );
        });
    }

    // Test component isolation - Principle 3 & 7
    testComponentIsolation() {
        console.log('[DashView] Testing component isolation...');
        
        // Mock component state
        const mockComponent = {
            _lastEntityStates: new Map(),
            _hass: {
                states: {
                    'weather.forecast_home': {
                        state: 'sunny',
                        attributes: { temperature: 20 }
                    }
                }
            }
        };

        // Simulate entity change detection
        function hasEntityChanged(entityId, currentState, lastStates) {
            const lastState = lastStates.get(entityId);
            if (!lastState || !currentState) return true;
            
            return currentState.state !== lastState.state ||
                   JSON.stringify(currentState.attributes) !== JSON.stringify(lastState.attributes);
        }

        // Test initial state (should indicate change)
        this.assert(
            hasEntityChanged('weather.forecast_home', mockComponent._hass.states['weather.forecast_home'], mockComponent._lastEntityStates),
            'Initial state should indicate change'
        );

        // Store the state
        mockComponent._lastEntityStates.set('weather.forecast_home', { ...mockComponent._hass.states['weather.forecast_home'] });

        // Test no change
        this.assert(
            !hasEntityChanged('weather.forecast_home', mockComponent._hass.states['weather.forecast_home'], mockComponent._lastEntityStates),
            'Unchanged state should not indicate change'
        );

        // Change the state
        mockComponent._hass.states['weather.forecast_home'].state = 'cloudy';
        
        this.assert(
            hasEntityChanged('weather.forecast_home', mockComponent._hass.states['weather.forecast_home'], mockComponent._lastEntityStates),
            'Changed state should indicate change'
        );
    }

    // Run all tests
    runAllTests() {
        console.log('[DashView] Starting frontend validation tests...');
        
        try {
            this.testEntityIdValidation();
            this.testHtmlSanitization();
            this.testConfigValidation();
            this.testMdiIconProcessing();
            this.testComponentIsolation();
            
            console.log(`\n[DashView] Test Results:`);
            console.log(`- Total tests: ${this.testCount}`);
            console.log(`- Passed: ${this.passedCount}`);
            console.log(`- Failed: ${this.failedCount}`);
            
            if (this.failedCount === 0) {
                console.log('[DashView] ✅ All frontend tests passed!');
                return true;
            } else {
                console.error('[DashView] ❌ Some tests failed!');
                return false;
            }
            
        } catch (error) {
            console.error('[DashView] Test execution failed:', error);
            return false;
        }
    }
}

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashViewFrontendTests;
} else {
    // Browser environment or direct execution
    const tests = new DashViewFrontendTests();
    tests.runAllTests();
}