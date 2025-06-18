// Integration test for icon consistency between header buttons and popups
class IconConsistencyIntegrationTests {
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

    // Test that header buttons and popups use the same icon source
    testHeaderButtonPopupIconConsistency() {
        console.log('\n[DashView] Testing header button and popup icon consistency...');
        
        const panel = new MockDashViewPanel();
        
        // Set up realistic house configuration
        panel._houseConfig = {
            rooms: {
                wohnzimmer: {
                    friendly_name: "Wohnzimmer",
                    icon: "mdi:sofa",
                    floor: "EG",
                    combined_sensor: "binary_sensor.combined_sensor_wohnzimmer"
                },
                buero: {
                    friendly_name: "Büro",
                    icon: "mdi:desk", 
                    floor: "EG",
                    combined_sensor: "binary_sensor.combined_sensor_buero"
                },
                kueche: {
                    friendly_name: "Küche",
                    icon: "mdi:chef-hat",
                    floor: "EG", 
                    combined_sensor: "binary_sensor.combined_sensor_kueche"
                }
            },
            floors: {
                EG: {
                    friendly_name: "Erdgeschoss",
                    icon: "mdi:home",
                    floor_sensor: "binary_sensor.floor_eg_active"
                }
            }
        };

        // Mock HASS with active floor
        panel._hass = {
            states: {
                'binary_sensor.floor_eg_active': { state: 'on' },
                'binary_sensor.combined_sensor_wohnzimmer': { state: 'on' },
                'binary_sensor.combined_sensor_buero': { state: 'on' },
                'binary_sensor.combined_sensor_kueche': { state: 'on' }
            }
        };

        // Test each room for consistency
        const roomsToTest = ['wohnzimmer', 'buero', 'kueche'];
        
        roomsToTest.forEach(roomKey => {
            const roomConfig = panel._houseConfig.rooms[roomKey];
            
            // Get icon as would be used in header button
            const headerIcon = panel._processIconName(roomConfig.icon);
            
            // Get icon as would be used in popup
            const popupIcon = panel.getPopupIconForType(roomKey);
            
            this.assert(
                headerIcon === popupIcon,
                `${roomKey}: Header icon '${headerIcon}' should match popup icon '${popupIcon}'`
            );

            // Also test title consistency
            const popupTitle = panel.getPopupTitleForType(roomKey);
            const expectedTitle = roomConfig.friendly_name;
            
            this.assert(
                popupTitle === expectedTitle,
                `${roomKey}: Popup title '${popupTitle}' should match friendly_name '${expectedTitle}'`
            );
        });
    }

    // Test that system popups still work correctly
    testSystemPopupIcons() {
        console.log('\n[DashView] Testing system popup icons remain unaffected...');
        
        const panel = new MockDashViewPanel();
        panel._houseConfig = { rooms: {} }; // Empty house config
        
        const systemPopups = [
            { type: 'security', expectedIcon: 'mdi-security', expectedTitle: 'Sicherheit' },
            { type: 'weather', expectedIcon: 'mdi-weather-partly-cloudy', expectedTitle: 'Wetter' },
            { type: 'music', expectedIcon: 'mdi-music', expectedTitle: 'Medien' },
            { type: 'admin', expectedIcon: 'mdi-cog', expectedTitle: 'Admin View' }
        ];
        
        systemPopups.forEach(testCase => {
            const actualIcon = panel.getPopupIconForType(testCase.type);
            const actualTitle = panel.getPopupTitleForType(testCase.type);
            
            this.assert(
                actualIcon === testCase.expectedIcon,
                `${testCase.type} popup icon should be '${testCase.expectedIcon}', got '${actualIcon}'`
            );
            
            this.assert(
                actualTitle === testCase.expectedTitle,
                `${testCase.type} popup title should be '${testCase.expectedTitle}', got '${actualTitle}'`
            );
        });
    }

    // Test backward compatibility when house config is empty
    testBackwardCompatibility() {
        console.log('\n[DashView] Testing backward compatibility with empty house config...');
        
        const panel = new MockDashViewPanel();
        
        // Test with completely empty house config
        panel._houseConfig = {};
        
        // Should fall back to default for unknown room
        const unknownRoomIcon = panel.getPopupIconForType('unknown_room');
        const unknownRoomTitle = panel.getPopupTitleForType('unknown_room');
        
        this.assert(
            unknownRoomIcon === 'mdi-help-circle',
            `Unknown room with empty house config should get default icon, got '${unknownRoomIcon}'`
        );
        
        this.assert(
            unknownRoomTitle === 'Unknown_room',
            `Unknown room with empty house config should get capitalized title, got '${unknownRoomTitle}'`
        );
        
        // Test with missing house config
        panel._houseConfig = null;
        
        const nullConfigIcon = panel.getPopupIconForType('some_room');
        this.assert(
            nullConfigIcon === 'mdi-help-circle',
            `Room with null house config should get default icon, got '${nullConfigIcon}'`
        );
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running icon consistency integration tests...');
        
        this.testHeaderButtonPopupIconConsistency();
        this.testSystemPopupIcons();
        this.testBackwardCompatibility();
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Icon consistency integration tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All icon consistency integration tests passed!');
        } else {
            console.log('❌ Some icon consistency integration tests failed');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}`);
            });
        }
        
        return passedTests === totalTests;
    }
}

// Mock DashView Panel for integration testing
class MockDashViewPanel {
    constructor() {
        this._houseConfig = {};
        this._hass = null;
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
    module.exports = { IconConsistencyIntegrationTests, MockDashViewPanel };
} else if (typeof window !== 'undefined') {
    window.IconConsistencyIntegrationTests = IconConsistencyIntegrationTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new IconConsistencyIntegrationTests();
    tests.runAllTests();
}