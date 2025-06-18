// Test for popup icon consistency with centralized configuration
class PopupIconConsistencyTests {
    constructor() {
        this.testResults = [];
    }

    assert(condition, message) {
        if (condition) {
            console.log(`✓ ${message}`);
            this.testResults.push({ test: message, passed: true });
        } else {
            console.error(`✗ ${message}`);
            this.testResults.push({ test: message, passed: false });
        }
    }

    // Test that popup icons use centralized house configuration for rooms
    testPopupIconsFromHouseConfig() {
        console.log('\n[DashView] Testing popup icons use house configuration...');
        
        const panel = new MockDashViewPanel();
        
        // Set up house configuration with different icons than hardcoded map
        panel._houseConfig = {
            rooms: {
                wohnzimmer: {
                    friendly_name: "Wohnzimmer",
                    icon: "mdi:couch", // Different from hardcoded "mdi-sofa"
                },
                buero: {
                    friendly_name: "Büro", 
                    icon: "mdi:desk", // Different from hardcoded "mdi-briefcase"
                },
                kueche: {
                    friendly_name: "Küche",
                    icon: "mdi:chef-hat", // Different from hardcoded "mdi-stove"
                }
            }
        };
        
        // Test room icons come from house config
        const wohnzimmerIcon = panel.getPopupIconForType('wohnzimmer');
        this.assert(
            wohnzimmerIcon === 'mdi-couch',
            `Wohnzimmer popup should use house config icon 'mdi-couch', got '${wohnzimmerIcon}'`
        );
        
        const bueroIcon = panel.getPopupIconForType('buero');
        this.assert(
            bueroIcon === 'mdi-desk',
            `Buero popup should use house config icon 'mdi-desk', got '${bueroIcon}'`
        );
        
        const kuecheIcon = panel.getPopupIconForType('kueche');
        this.assert(
            kuecheIcon === 'mdi-chef-hat',
            `Kueche popup should use house config icon 'mdi-chef-hat', got '${kuecheIcon}'`
        );
    }

    // Test that non-room popups still use fallback map
    testNonRoomPopupsFallbackMap() {
        console.log('\n[DashView] Testing non-room popups use fallback map...');
        
        const panel = new MockDashViewPanel();
        panel._houseConfig = { rooms: {} }; // Empty house config
        
        // Test system popups use fallback map
        const systemPopups = [
            { type: 'security', expected: 'mdi-security' },
            { type: 'weather', expected: 'mdi-weather-partly-cloudy' },
            { type: 'music', expected: 'mdi-music' },
            { type: 'admin', expected: 'mdi-cog' },
            { type: 'calendar', expected: 'mdi-calendar' },
            { type: 'bahn', expected: 'mdi-train' }
        ];
        
        systemPopups.forEach(testCase => {
            const actualIcon = panel.getPopupIconForType(testCase.type);
            this.assert(
                actualIcon === testCase.expected,
                `${testCase.type} popup should use fallback icon '${testCase.expected}', got '${actualIcon}'`
            );
        });
    }

    // Test that unknown popup types get default icon
    testUnknownPopupTypeDefault() {
        console.log('\n[DashView] Testing unknown popup types get default icon...');
        
        const panel = new MockDashViewPanel();
        panel._houseConfig = { rooms: {} };
        
        const unknownIcon = panel.getPopupIconForType('unknown_popup_type');
        this.assert(
            unknownIcon === 'mdi-help-circle',
            `Unknown popup type should get default icon 'mdi-help-circle', got '${unknownIcon}'`
        );
    }

    // Test that popup titles use house configuration for rooms
    testPopupTitlesFromHouseConfig() {
        console.log('\n[DashView] Testing popup titles use house configuration...');
        
        const panel = new MockDashViewPanel();
        
        // Set up house configuration with custom friendly names
        panel._houseConfig = {
            rooms: {
                wohnzimmer: {
                    friendly_name: "Living Room Custom",
                    icon: "mdi:couch"
                },
                buero: {
                    friendly_name: "Office Custom",
                    icon: "mdi:desk"
                }
            }
        };
        
        // Test room titles come from house config
        const wohnzimmerTitle = panel.getPopupTitleForType('wohnzimmer');
        this.assert(
            wohnzimmerTitle === 'Living Room Custom',
            `Wohnzimmer popup should use house config title 'Living Room Custom', got '${wohnzimmerTitle}'`
        );
        
        const bueroTitle = panel.getPopupTitleForType('buero');
        this.assert(
            bueroTitle === 'Office Custom',
            `Buero popup should use house config title 'Office Custom', got '${bueroTitle}'`
        );
    }

    // Test icon processing with mdi: prefixes
    testIconProcessing() {
        console.log('\n[DashView] Testing icon name processing...');
        
        const panel = new MockDashViewPanel();
        
        // Test various icon formats are processed correctly
        const testCases = [
            { input: 'mdi:home', expected: 'mdi-home' },
            { input: 'mdi-home', expected: 'mdi-home' },
            { input: 'home', expected: 'mdi-home' },
            { input: '', expected: 'mdi-help-circle' },
            { input: null, expected: 'mdi-help-circle' }
        ];
        
        testCases.forEach(testCase => {
            const processed = panel._processIconName(testCase.input);
            this.assert(
                processed === testCase.expected,
                `Icon '${testCase.input}' should process to '${testCase.expected}', got '${processed}'`
            );
        });
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running popup icon consistency tests...');
        
        this.testPopupIconsFromHouseConfig();
        this.testNonRoomPopupsFallbackMap();
        this.testUnknownPopupTypeDefault();
        this.testPopupTitlesFromHouseConfig();
        this.testIconProcessing();
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Popup icon consistency tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All popup icon consistency tests passed!');
        } else {
            console.log('❌ Some popup icon consistency tests failed');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}`);
            });
        }
        
        return passedTests === totalTests;
    }
}

// Mock DashView Panel for testing with current implementation
class MockDashViewPanel {
    constructor() {
        this._houseConfig = {};
    }

    // Fixed implementation - uses house config for rooms
    getPopupIconForType(popupType) {
        // For rooms, the icon MUST come from the house config - Principle 13
        if (this._houseConfig && this._houseConfig.rooms && this._houseConfig.rooms[popupType]) {
            return this._processIconName(this._houseConfig.rooms[popupType].icon);
        }

        // Keep a fallback map ONLY for non-room popups (e.g., system views)
        const iconMap = {
            'security': 'mdi-security',
            'weather': 'mdi-weather-partly-cloudy',
            'music': 'mdi-music',
            'admin': 'mdi-cog',
            'calendar': 'mdi-calendar',
            'settings': 'mdi-cog',
            'bahn': 'mdi-train'
        };
        return iconMap[popupType] || 'mdi-help-circle';
    }

    // Fixed implementation - uses house config for rooms
    getPopupTitleForType(popupType) {
        // For rooms, the title MUST come from the house config - Principle 13
        if (this._houseConfig && this._houseConfig.rooms && this._houseConfig.rooms[popupType]) {
            return this._houseConfig.rooms[popupType].friendly_name;
        }

        // Keep a fallback map ONLY for non-room popups (e.g., system views)
        const titleMap = {
            'security': 'Sicherheit',
            'weather': 'Wetter',
            'music': 'Medien',
            'admin': 'Admin View',
            'calendar': 'Kalender',
            'settings': 'Einstellungen',
            'bahn': 'Bahn'
        };
        return titleMap[popupType] || popupType.charAt(0).toUpperCase() + popupType.slice(1);
    }

    _processIconName(iconName) {
        if (!iconName) return 'mdi-help-circle';
        
        // Remove mdi: prefix and ensure mdi- prefix
        let processedIcon = iconName.replace('mdi:', '').replace('mdi-', '');
        if (!processedIcon.startsWith('mdi-')) {
            processedIcon = 'mdi-' + processedIcon;
        }
        
        return processedIcon;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopupIconConsistencyTests, MockDashViewPanel };
} else if (typeof window !== 'undefined') {
    window.PopupIconConsistencyTests = PopupIconConsistencyTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new PopupIconConsistencyTests();
    tests.runAllTests();
}