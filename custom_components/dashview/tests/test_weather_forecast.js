/**
 * Weather Forecast Tests for DashView - Principle 7
 * Test the weather forecast functionality and data fetching
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
        classList: {
            add: function(className) { this.classes = this.classes || []; this.classes.push(className); },
            remove: function(className) { this.classes = this.classes || []; this.classes = this.classes.filter(c => c !== className); },
            contains: function(className) { return (this.classes || []).includes(className); }
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        appendChild: function(child) {
            this.children = this.children || [];
            this.children.push(child);
            return child;
        },
        click: function() { if (this.clickHandler) this.clickHandler(); }
    };
    
    return element;
}

// Mock HASS object with weather functionality
function createMockHass() {
    return {
        states: {
            'weather.home': {
                state: 'sunny',
                attributes: {
                    friendly_name: 'Home Weather',
                    temperature: 22,
                    apparent_temperature: 24,
                    humidity: 65,
                    wind_speed: 5
                }
            }
        },
        callService: function(domain, service, data, returnResponse = false) {
            // Extract entity_id from either old format (data.entity_id) or new format (data.target.entity_id)
            const entityId = data.target?.entity_id || data.entity_id;
            console.log(`[Test] Mock service call: ${domain}.${service} for ${entityId} type ${data.type}`);
            
            if (domain === 'weather' && service === 'get_forecasts') {
                const mockForecasts = {
                    [entityId]: {
                        forecast: data.type === 'daily' ? [
                            { datetime: '2023-12-01T12:00:00Z', condition: 'sunny', temperature: 22, templow: 15 },
                            { datetime: '2023-12-02T12:00:00Z', condition: 'cloudy', temperature: 18, templow: 12 },
                            { datetime: '2023-12-03T12:00:00Z', condition: 'rainy', temperature: 16, templow: 10 }
                        ] : [
                            { datetime: '2023-12-01T13:00:00Z', condition: 'sunny', temperature: 22 },
                            { datetime: '2023-12-01T14:00:00Z', condition: 'sunny', temperature: 23 },
                            { datetime: '2023-12-01T15:00:00Z', condition: 'partly-cloudy', temperature: 21 }
                        ]
                    }
                };
                
                if (returnResponse) {
                    return Promise.resolve(mockForecasts);
                }
                return Promise.resolve();
            }
            
            return Promise.resolve();
        },
        callWS: function(message) {
            console.log(`[Test] Mock WebSocket call: ${message.type} for ${message.entity_id} forecast_type ${message.forecast_type}`);
            
            if (message.type === 'weather/subscribe_forecast') {
                const mockForecast = message.forecast_type === 'daily' ? [
                    { datetime: '2023-12-01T12:00:00Z', condition: 'sunny', temperature: 22, templow: 15 },
                    { datetime: '2023-12-02T12:00:00Z', condition: 'cloudy', temperature: 18, templow: 12 },
                    { datetime: '2023-12-03T12:00:00Z', condition: 'rainy', temperature: 16, templow: 10 }
                ] : [
                    { datetime: '2023-12-01T13:00:00Z', condition: 'sunny', temperature: 22 },
                    { datetime: '2023-12-01T14:00:00Z', condition: 'sunny', temperature: 23 },
                    { datetime: '2023-12-01T15:00:00Z', condition: 'partly-cloudy', temperature: 21 }
                ];
                
                return Promise.resolve({
                    forecast: mockForecast
                });
            }
            
            return Promise.resolve({});
        }
    };
}

// Mock DashView panel class for testing
class MockDashViewPanel {
    constructor() {
        this._hass = createMockHass();
        this._weatherEntityId = 'weather.home';
        this._weatherForecasts = { daily: null, hourly: null };
    }

    _getCurrentWeatherEntityId() {
        return this._weatherEntityId || 'weather.home';
    }

    async _fetchWeatherForecasts() {
        if (!this._hass) return;

        const entityId = this._getCurrentWeatherEntityId();
        if (!entityId) return;

        try {
            console.log(`[DashView] Fetching daily and hourly forecasts for ${entityId} using callWS`);

            // Fetch daily forecast using the correct hass.callWS method
            const dailyForecasts = await this._hass.callWS({
                type: 'weather/subscribe_forecast',
                forecast_type: 'daily',
                entity_id: entityId
            });

            // Fetch hourly forecast using the correct hass.callWS method
            const hourlyForecasts = await this._hass.callWS({
                type: 'weather/subscribe_forecast',
                forecast_type: 'hourly',
                entity_id: entityId
            });
            
            // Store the forecasts from the response
            this._weatherForecasts.daily = dailyForecasts.forecast || [];
            this._weatherForecasts.hourly = hourlyForecasts.forecast || [];

            console.log('[DashView] Forecasts updated successfully via callWS');
        } catch (error) {
            console.error(`[DashView] Error fetching weather forecasts for ${entityId}:`, error);
            this._weatherForecasts.daily = [];
            this._weatherForecasts.hourly = [];
        }
    }

    translateWeatherCondition(condition) {
        const translations = {
            sunny: 'Sonnig',
            cloudy: 'Bewölkt',
            rainy: 'Regnerisch',
            'partly-cloudy': 'Teilweise bewölkt'
        };
        return translations[condition] || condition;
    }
}

// Test class for weather forecast functionality
class WeatherForecastTests {
    constructor() {
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    assert(condition, message) {
        if (condition) {
            this.testsPassed++;
            console.log(`✓ ${message}`);
        } else {
            this.testsFailed++;
            console.error(`✗ ${message}`);
        }
    }

    // Test weather forecast fetching
    async testWeatherForecastFetching() {
        console.log('[DashView] Testing weather forecast fetching...');
        
        const panel = new MockDashViewPanel();
        
        // Initially forecasts should be null
        this.assert(panel._weatherForecasts.daily === null, 'Daily forecasts should be null initially');
        this.assert(panel._weatherForecasts.hourly === null, 'Hourly forecasts should be null initially');
        
        // Fetch forecasts
        await panel._fetchWeatherForecasts();
        
        // Check that forecasts are now populated
        this.assert(Array.isArray(panel._weatherForecasts.daily), 'Daily forecasts should be an array after fetching');
        this.assert(Array.isArray(panel._weatherForecasts.hourly), 'Hourly forecasts should be an array after fetching');
        this.assert(panel._weatherForecasts.daily.length > 0, 'Daily forecasts should contain data');
        this.assert(panel._weatherForecasts.hourly.length > 0, 'Hourly forecasts should contain data');
        
        // Check forecast structure
        const dailyForecast = panel._weatherForecasts.daily[0];
        this.assert(dailyForecast.datetime !== undefined, 'Daily forecast should have datetime');
        this.assert(dailyForecast.condition !== undefined, 'Daily forecast should have condition');
        this.assert(dailyForecast.temperature !== undefined, 'Daily forecast should have temperature');
        
        const hourlyForecast = panel._weatherForecasts.hourly[0];
        this.assert(hourlyForecast.datetime !== undefined, 'Hourly forecast should have datetime');
        this.assert(hourlyForecast.condition !== undefined, 'Hourly forecast should have condition');
        this.assert(hourlyForecast.temperature !== undefined, 'Hourly forecast should have temperature');
    }

    // Test weather condition translation
    testWeatherConditionTranslation() {
        console.log('[DashView] Testing weather condition translation...');
        
        const panel = new MockDashViewPanel();
        
        this.assert(panel.translateWeatherCondition('sunny') === 'Sonnig', 'Should translate sunny to Sonnig');
        this.assert(panel.translateWeatherCondition('cloudy') === 'Bewölkt', 'Should translate cloudy to Bewölkt');
        this.assert(panel.translateWeatherCondition('rainy') === 'Regnerisch', 'Should translate rainy to Regnerisch');
        this.assert(panel.translateWeatherCondition('unknown') === 'unknown', 'Should return unknown conditions as-is');
    }

    // Test forecast property structure
    testForecastStructure() {
        console.log('[DashView] Testing forecast data structure...');
        
        const panel = new MockDashViewPanel();
        
        // Check initial structure
        this.assert(typeof panel._weatherForecasts === 'object', 'Weather forecasts should be an object');
        this.assert(panel._weatherForecasts.hasOwnProperty('daily'), 'Should have daily property');
        this.assert(panel._weatherForecasts.hasOwnProperty('hourly'), 'Should have hourly property');
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting weather forecast tests...');
        
        this.testForecastStructure();
        this.testWeatherConditionTranslation();
        await this.testWeatherForecastFetching();
        
        console.log(`[DashView] Weather forecast tests completed. Passed: ${this.testsPassed}, Failed: ${this.testsFailed}`);
        
        if (this.testsFailed > 0) {
            console.error(`[DashView] ${this.testsFailed} weather forecast tests failed!`);
            process.exit(1);
        } else {
            console.log('[DashView] All weather forecast tests passed!');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new WeatherForecastTests();
    tests.runAllTests().then(() => {
        console.log('[DashView] Weather forecast test suite completed successfully');
        process.exit(0);
    }).catch(error => {
        console.error('[DashView] Weather forecast test suite failed:', error);
        process.exit(1);
    });
}

module.exports = WeatherForecastTests;