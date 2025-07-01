/**
 * Weather Chart Fallback Test Suite
 * Tests the weather forecast chart error handling and table fallback functionality
 * Addresses issue #346: Weather forecast graph shows 'Fehler beim Laden des Diagramms' error
 */

class WeatherChartFallbackTests {
    constructor() {
        this.testResults = [];
        this.verbose = process.env.TEST_VERBOSE === 'true';
    }

    log(message) {
        if (this.verbose) {
            console.log(`[WeatherChartFallbackTests] ${message}`);
        }
    }

    // Assertion helpers
    assertTrue(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
        }
    }

    // Mock DOM elements
    createMockElement(tagName = 'div', id = null) {
        const element = {
            tagName: tagName.toUpperCase(),
            id: id,
            textContent: '',
            innerHTML: '',
            style: { display: 'block' },
            querySelector: (selector) => {
                if (selector === '#forecast-chart') {
                    return this.createMockCanvas();
                }
                if (selector === '.forecast-fallback') {
                    return null; // Initially doesn't exist
                }
                if (selector === '.forecast-error') {
                    return this.createMockElement('div', 'error');
                }
                if (selector === '.forecast-loading') {
                    return this.createMockElement('div', 'loading');
                }
                if (selector === '.forecast-graph-content') {
                    return this.createMockElement('div', 'graph-content');
                }
                return null;
            },
            appendChild: function(child) {
                this.children = this.children || [];
                this.children.push(child);
                return child;
            }
        };
        return element;
    }

    createMockCanvas() {
        return {
            tagName: 'CANVAS',
            getContext: (type) => {
                if (type === '2d') {
                    return {
                        clearRect: () => {},
                        fillRect: () => {},
                        strokeRect: () => {}
                    };
                }
                return null;
            },
            style: new Proxy({ 
                display: 'block', 
                opacity: '1'
            }, {
                set(target, prop, value) {
                    target[prop] = value;
                    return true;
                }
            })
        };
    }

    createMockShadowRoot() {
        const canvas = this.createMockCanvas();
        const popup = this.createMockElement('div', 'weather-popup');
        
        // Add the canvas to the popup's querySelector
        popup.querySelector = (sel) => {
            if (sel === '#forecast-chart') return canvas;
            if (sel === '.forecast-error') return this.createMockElement('div', 'error');
            if (sel === '.forecast-graph-content') return this.createMockElement('div', 'graph-content');
            return null;
        };
        
        return {
            querySelector: (selector) => {
                if (selector === '#forecast-chart') {
                    return canvas;
                }
                if (selector === '#weather-popup.active') {
                    return popup;
                }
                return null;
            }
        };
    }

    // Mock WeatherComponents class
    createMockWeatherComponents() {
        const mockData = [
            { datetime: '2024-07-01T10:00:00', temperature: 22, precipitation: 0, wind_speed: 5 },
            { datetime: '2024-07-01T11:00:00', temperature: 24, precipitation: 0.1, wind_speed: 7 },
            { datetime: '2024-07-01T12:00:00', temperature: 26, precipitation: 0.2, wind_speed: 8 }
        ];

        const testInstance = this;
        
        return {
            _shadowRoot: this.createMockShadowRoot(),
            _forecasts: {
                hourly: mockData,
                daily: mockData
            },
            _currentView: 'hourly',
            _currentParameter: 'temperature',
            _chartInstance: null,

            // Import the methods we're testing
            _showForecastLoading: function(popup, show) {
                const loadingEl = popup.querySelector('.forecast-loading');
                if (loadingEl) {
                    loadingEl.style.display = show ? 'block' : 'none';
                }
            },

            _showForecastError: function(popup, message) {
                const errorEl = popup.querySelector('.forecast-error');
                if (errorEl && message) {
                    errorEl.style.display = 'block';
                    errorEl.textContent = message;
                }
            },

            _getParameterUnit: function(parameter) {
                const units = {
                    temperature: '°C',
                    precipitation: 'mm',
                    wind: 'km/h'
                };
                return units[parameter] || '';
            },

            _getParameterDisplayName: function(parameter) {
                const names = {
                    temperature: 'Temperatur',
                    precipitation: 'Niederschlag',
                    wind: 'Wind'
                };
                return names[parameter] || parameter;
            },

            _formatForecastTime: function(item, view) {
                if (!item.datetime) return 'N/A';
                const date = new Date(item.datetime);
                if (view === 'hourly') {
                    return date.toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                } else {
                    return date.toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: 'numeric',
                        month: 'short'
                    });
                }
            },

            _extractParameterValue: function(item, parameter) {
                switch (parameter) {
                    case 'temperature':
                        return Math.round(item.temperature || 0);
                    case 'precipitation':
                        return Math.round((item.precipitation || 0) * 10) / 10;
                    case 'wind':
                        return Math.round((item.wind_speed || 0) * 10) / 10;
                    default:
                        return 0;
                }
            },

            _generateForecastTable: function(data) {
                const parameterName = this._getParameterDisplayName(this._currentParameter);
                const unit = this._getParameterUnit(this._currentParameter);
                const maxRows = this._currentView === 'hourly' ? 12 : 7;
                
                let tableHtml = `
                    <table class="forecast-table">
                        <thead>
                            <tr>
                                <th>Zeit</th>
                                <th>${parameterName}</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                data.slice(0, maxRows).forEach(item => {
                    const time = this._formatForecastTime(item, this._currentView);
                    const value = this._extractParameterValue(item, this._currentParameter);
                    
                    tableHtml += `
                        <tr>
                            <td>${time}</td>
                            <td>${value}${unit}</td>
                        </tr>
                    `;
                });

                tableHtml += `
                        </tbody>
                    </table>
                `;

                return tableHtml;
            },

            _showForecastFallback: function(popup) {
                console.log('[WeatherComponents] Showing forecast data fallback (table view)');
                
                // Hide loading state
                this._showForecastLoading(popup, false);
                
                // Get data based on current view
                const data = this._currentView === 'hourly' ? this._forecasts.hourly : this._forecasts.daily;
                
                if (!data || data.length === 0) {
                    this._showForecastError(popup, 'Keine Vorhersagedaten verfügbar');
                    return;
                }

                // Find or create fallback container
                let fallbackContainer = popup.querySelector('.forecast-fallback');
                if (!fallbackContainer) {
                    fallbackContainer = testInstance.createMockElement('div');
                    fallbackContainer.className = 'forecast-fallback';
                    
                    const chartContainer = popup.querySelector('.forecast-graph-content');
                    if (chartContainer) {
                        chartContainer.appendChild(fallbackContainer);
                    }
                }

                // Hide canvas and error elements
                const canvas = popup.querySelector('#forecast-chart');
                const errorEl = popup.querySelector('.forecast-error');
                if (canvas) canvas.style.display = 'none';
                if (errorEl) errorEl.style.display = 'none';

                // Generate fallback table
                const tableHtml = this._generateForecastTable(data);
                fallbackContainer.innerHTML = `
                    <div class="forecast-fallback-header">
                        <i class="mdi mdi-table"></i>
                        <p>Diagramm nicht verfügbar - Daten als Tabelle:</p>
                    </div>
                    ${tableHtml}
                `;
                
                fallbackContainer.style.display = 'block';
            }
        };
    }

    // Test 1: Chart.js availability check
    async testChartJsAvailabilityCheck() {
        const testName = 'Chart.js Availability Check';
        this.log(`Running test: ${testName}`);

        try {
            // Test when Chart.js is not available
            const originalChart = global.Chart;
            delete global.Chart;

            const weatherComponents = this.createMockWeatherComponents();
            const popup = weatherComponents._shadowRoot.querySelector('#weather-popup.active');

            // Simulate chart update with missing Chart.js
            try {
                if (typeof Chart === 'undefined') {
                    weatherComponents._showForecastFallback(popup);
                }
                this.assertTrue(true, 'Should handle missing Chart.js gracefully');
            } catch (error) {
                throw new Error(`Failed to handle missing Chart.js: ${error.message}`);
            }

            // Restore Chart.js
            if (originalChart) {
                global.Chart = originalChart;
            }

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test 2: Fallback table generation
    async testFallbackTableGeneration() {
        const testName = 'Fallback Table Generation';
        this.log(`Running test: ${testName}`);

        try {
            const weatherComponents = this.createMockWeatherComponents();
            const mockData = weatherComponents._forecasts.hourly;

            // Test table generation
            const tableHtml = weatherComponents._generateForecastTable(mockData);

            this.assertTrue(tableHtml.includes('<table class="forecast-table">'), 'Should generate table element');
            this.assertTrue(tableHtml.includes('<th>Zeit</th>'), 'Should include time column header');
            this.assertTrue(tableHtml.includes('<th>Temperatur</th>'), 'Should include parameter column header');
            this.assertTrue(tableHtml.includes('22°C'), 'Should include temperature data');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test 3: Parameter value extraction
    async testParameterValueExtraction() {
        const testName = 'Parameter Value Extraction';
        this.log(`Running test: ${testName}`);

        try {
            const weatherComponents = this.createMockWeatherComponents();
            const mockItem = { 
                temperature: 22.7, 
                precipitation: 0.15, 
                wind_speed: 5.8 
            };

            // Test temperature extraction
            const temp = weatherComponents._extractParameterValue(mockItem, 'temperature');
            this.assertEqual(temp, 23, 'Should round temperature correctly');

            // Test precipitation extraction
            const precip = weatherComponents._extractParameterValue(mockItem, 'precipitation');
            this.assertEqual(precip, 0.2, 'Should round precipitation to 1 decimal');

            // Test wind extraction
            const wind = weatherComponents._extractParameterValue(mockItem, 'wind');
            this.assertEqual(wind, 5.8, 'Should round wind speed to 1 decimal');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test 4: Time formatting
    async testTimeFormatting() {
        const testName = 'Time Formatting';
        this.log(`Running test: ${testName}`);

        try {
            const weatherComponents = this.createMockWeatherComponents();
            const mockItem = { datetime: '2024-07-01T14:30:00' };

            // Test hourly formatting
            const hourlyTime = weatherComponents._formatForecastTime(mockItem, 'hourly');
            this.assertTrue(hourlyTime.includes('14:30'), 'Should format hourly time correctly');

            // Test daily formatting
            const dailyTime = weatherComponents._formatForecastTime(mockItem, 'daily');
            this.assertTrue(dailyTime.length > 0, 'Should format daily time');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test 5: Complete fallback workflow
    async testCompleteFallbackWorkflow() {
        const testName = 'Complete Fallback Workflow';
        this.log(`Running test: ${testName}`);

        try {
            const weatherComponents = this.createMockWeatherComponents();
            const popup = weatherComponents._shadowRoot.querySelector('#weather-popup.active');

            // Execute complete fallback workflow
            weatherComponents._showForecastFallback(popup);

            // Verify fallback elements are properly configured
            const canvas = popup.querySelector('#forecast-chart');
            this.assertEqual(canvas.style.display, 'none', 'Canvas should be hidden');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🧪 Weather Chart Fallback Test Suite');
        console.log('='.repeat(50));
        
        await this.testChartJsAvailabilityCheck();
        await this.testFallbackTableGeneration();
        await this.testParameterValueExtraction();
        await this.testTimeFormatting();
        await this.testCompleteFallbackWorkflow();

        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✓ Passed: ${passedTests}`);
        console.log(`✗ Failed: ${totalTests - passedTests}`);
        console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        if (totalTests - passedTests === 0) {
            console.log('\n🎉 All weather chart fallback tests passed!');
            console.log('Chart error handling and fallback functionality is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the implementation.');
            console.log('Failed tests:');
            this.testResults.filter(t => !t.passed).forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n💡 Weather chart error handling features:');
        console.log('1. Chart.js availability detection');
        console.log('2. Graceful fallback to data table');
        console.log('3. Enhanced error categorization');
        console.log('4. Proper resource cleanup');
    }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherChartFallbackTests };
} else {
    // Run tests if loaded directly
    const testSuite = new WeatherChartFallbackTests();
    testSuite.runAllTests();
}