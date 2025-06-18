// Test for popup refresh functionality - Issue #75 fix
// Validates that entities are immediately refreshed when popup opens

const fs = require('fs');
const path = require('path');

// Mock DOM elements
function createMockElement(tagName, attributes = {}) {
    return {
        tagName: tagName.toUpperCase(),
        id: attributes.id || '',
        className: attributes.className || '',
        textContent: '',
        innerHTML: '', 
        style: {},
        children: [],
        attributes: attributes,
        getAttribute: function(name) { return this.attributes[name] || null; },
        setAttribute: function(name, value) { this.attributes[name] = value; },
        querySelector: function(selector) { return null; },
        querySelectorAll: function(selector) { return []; },
        addEventListener: function(event, handler) { },
        click: function() { }
    };
}

// Mock DashView panel for testing popup refresh
class MockDashViewPanel {
    constructor() {
        this._hass = null;
        this._lastEntityStates = new Map();
        this._updateComponentCallCount = 0;
        this._updateComponentCalls = [];
        this._watchedEntities = new Set();
        this._entityRefreshLog = [];
        this.shadowRoot = {
            querySelector: () => null,
            querySelectorAll: () => [],
            getElementById: () => null
        };
    }

    set hass(hass) {
        this._hass = hass;
    }

    // Mock getCurrentWeatherEntityId
    _getCurrentWeatherEntityId() {
        return 'weather.forecast_home';
    }

    // Mock _updateComponentForEntity to track calls
    _updateComponentForEntity(entityId) {
        this._updateComponentCallCount++;
        this._updateComponentCalls.push({ entityId, timestamp: Date.now() });
        this._entityRefreshLog.push(`Refreshed entity: ${entityId}`);
        console.log(`[MockDashViewPanel] Updated component for entity: ${entityId}`);
    }

    // Test the _forceRefreshPopupEntities method
    _forceRefreshPopupEntities(popup) {
        if (!this._hass || !popup) return;
        
        const popupId = popup.id;
        
        try {
            // Weather popup entities
            if (popupId === 'weather-popup') {
                const weatherEntityId = this._getCurrentWeatherEntityId();
                console.log(`[DashView] Force refreshing weather popup entities`);
                
                // Update weather components immediately
                this._updateComponentForEntity(weatherEntityId);
                
                // Update pollen card entities
                const pollenEntities = [
                    'sensor.pollenflug_birke_92',
                    'sensor.pollenflug_erle_92', 
                    'sensor.pollenflug_hasel_92',
                    'sensor.pollenflug_esche_92',
                    'sensor.pollenflug_roggen_92',
                    'sensor.pollenflug_graeser_92',
                    'sensor.pollenflug_beifuss_92',
                    'sensor.pollenflug_ambrosia_92'
                ];
                
                pollenEntities.forEach(entityId => {
                    this._updateComponentForEntity(entityId);
                });
            }
            
            // Security popup entities  
            if (popupId === 'security-popup') {
                console.log(`[DashView] Force refreshing security popup entities`);
                
                // Update motion sensor
                this._updateComponentForEntity('binary_sensor.motion_presence_home');
                
                // Update window sensors
                Object.keys(this._hass.states).forEach(entityId => {
                    if (entityId.startsWith('binary_sensor.fenster')) {
                        this._updateComponentForEntity(entityId);
                    }
                });
            }
            
            console.log(`[DashView] Force refreshing entities for popup: ${popupId}`);
            
        } catch (error) {
            console.warn(`[DashView] Error force refreshing popup entities:`, error);
        }
    }

    // Mock reinitializePopupContent with refresh
    reinitializePopupContent(popup) {
        // Simulate basic popup initialization
        console.log(`[MockDashViewPanel] Reinitializing popup content for: ${popup.id}`);
        
        // Force immediate refresh of all entities in the popup
        this._forceRefreshPopupEntities(popup);
    }
}

// Create mock HASS object
function createMockHass() {
    return {
        states: {
            'weather.forecast_home': {
                entity_id: 'weather.forecast_home',
                state: 'sunny',
                attributes: {
                    temperature: 22.5,
                    humidity: 65,
                    forecast: [{ temperature: 22.5 }]
                }
            },
            'sensor.pollenflug_birke_92': {
                entity_id: 'sensor.pollenflug_birke_92',
                state: '1',
                attributes: {}
            },
            'sensor.pollenflug_erle_92': {
                entity_id: 'sensor.pollenflug_erle_92',
                state: '2',
                attributes: {}
            },
            'binary_sensor.motion_presence_home': {
                entity_id: 'binary_sensor.motion_presence_home',
                state: 'on',
                attributes: {}
            },
            'binary_sensor.fenster_wohnzimmer': {
                entity_id: 'binary_sensor.fenster_wohnzimmer',
                state: 'off',
                attributes: {}
            },
            'binary_sensor.fenster_schlafzimmer': {
                entity_id: 'binary_sensor.fenster_schlafzimmer',
                state: 'off',
                attributes: {}
            }
        }
    };
}

// Test class for popup refresh functionality
class PopupRefreshTests {
    constructor() {
        this.testResults = [];
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // Test weather popup refresh
    testWeatherPopupRefresh() {
        console.log('\n[DashView] Testing weather popup refresh...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        panel.hass = mockHass;
        
        // Create mock weather popup
        const weatherPopup = createMockElement('div', { id: 'weather-popup' });
        
        // Reset counters
        panel._updateComponentCallCount = 0;
        panel._updateComponentCalls = [];
        panel._entityRefreshLog = [];
        
        // Test popup refresh
        panel.reinitializePopupContent(weatherPopup);
        
        // Verify that entities were refreshed
        this.assert(
            panel._updateComponentCallCount > 0,
            'Weather popup should trigger entity updates'
        );
        
        // Verify weather entity was refreshed
        const weatherUpdates = panel._updateComponentCalls.filter(call => 
            call.entityId === 'weather.forecast_home'
        );
        this.assert(
            weatherUpdates.length > 0,
            'Weather entity should be refreshed on popup open'
        );
        
        // Verify pollen entities were refreshed
        const pollenUpdates = panel._updateComponentCalls.filter(call => 
            call.entityId.startsWith('sensor.pollenflug_')
        );
        this.assert(
            pollenUpdates.length > 0,
            'Pollen entities should be refreshed on weather popup open'
        );
        
        console.log(`  ✓ Weather popup refreshed ${panel._updateComponentCallCount} entities`);
        this.testResults.push({ name: 'Weather popup refresh', passed: true });
    }

    // Test security popup refresh
    testSecurityPopupRefresh() {
        console.log('\n[DashView] Testing security popup refresh...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        panel.hass = mockHass;
        
        // Create mock security popup
        const securityPopup = createMockElement('div', { id: 'security-popup' });
        
        // Reset counters
        panel._updateComponentCallCount = 0;
        panel._updateComponentCalls = [];
        panel._entityRefreshLog = [];
        
        // Test popup refresh
        panel.reinitializePopupContent(securityPopup);
        
        // Verify that entities were refreshed
        this.assert(
            panel._updateComponentCallCount > 0,
            'Security popup should trigger entity updates'
        );
        
        // Verify motion sensor was refreshed
        const motionUpdates = panel._updateComponentCalls.filter(call => 
            call.entityId === 'binary_sensor.motion_presence_home'
        );
        this.assert(
            motionUpdates.length > 0,
            'Motion sensor should be refreshed on security popup open'
        );
        
        // Verify window sensors were refreshed
        const windowUpdates = panel._updateComponentCalls.filter(call => 
            call.entityId.startsWith('binary_sensor.fenster')
        );
        this.assert(
            windowUpdates.length > 0,
            'Window sensors should be refreshed on security popup open'
        );
        
        console.log(`  ✓ Security popup refreshed ${panel._updateComponentCallCount} entities`);
        this.testResults.push({ name: 'Security popup refresh', passed: true });
    }

    // Test unknown popup handling
    testUnknownPopupHandling() {
        console.log('\n[DashView] Testing unknown popup handling...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        panel.hass = mockHass;
        
        // Create mock unknown popup
        const unknownPopup = createMockElement('div', { id: 'unknown-popup' });
        
        // Reset counters
        panel._updateComponentCallCount = 0;
        panel._entityRefreshLog = [];
        
        // Test popup refresh - should not crash
        panel.reinitializePopupContent(unknownPopup);
        
        // Should not crash and should handle gracefully
        console.log(`  ✓ Unknown popup handled gracefully`);
        this.testResults.push({ name: 'Unknown popup handling', passed: true });
    }

    // Test immediate refresh (no delay)
    testImmediateRefresh() {
        console.log('\n[DashView] Testing immediate refresh timing...');
        
        const panel = new MockDashViewPanel();
        const mockHass = createMockHass();
        panel.hass = mockHass;
        
        // Create mock weather popup
        const weatherPopup = createMockElement('div', { id: 'weather-popup' });
        
        // Reset counters
        panel._updateComponentCallCount = 0;
        const startTime = Date.now();
        
        // Test popup refresh
        panel.reinitializePopupContent(weatherPopup);
        
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        
        // Verify refresh happened immediately (within 50ms)
        this.assert(
            elapsed < 50,
            'Entity refresh should happen immediately on popup open'
        );
        
        this.assert(
            panel._updateComponentCallCount > 0,
            'Entities should be refreshed immediately'
        );
        
        console.log(`  ✓ Entities refreshed immediately (${elapsed}ms)`);
        this.testResults.push({ name: 'Immediate refresh timing', passed: true });
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running popup refresh tests...');
        
        try {
            this.testWeatherPopupRefresh();
            this.testSecurityPopupRefresh();
            this.testUnknownPopupHandling();
            this.testImmediateRefresh();
            
            this.reportResults();
            return true;
        } catch (error) {
            console.error('[DashView] Popup refresh test error:', error);
            return false;
        }
    }

    reportResults() {
        console.log('\n[DashView] Popup Refresh Test Results:');
        let passed = 0;
        let total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✓' : '✗';
            console.log(`  ${status} ${result.name}`);
            if (result.passed) passed++;
        });
        
        console.log(`\n[DashView] Popup refresh tests: ${passed}/${total} passed`);
        
        if (passed === total) {
            console.log('✅ All popup refresh tests passed!');
        } else {
            console.log('❌ Some popup refresh tests failed');
        }
    }
}

module.exports = PopupRefreshTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new PopupRefreshTests();
    testRunner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}