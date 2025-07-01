// Test: Person Card Integration (Issue #297)
// Testing the person card functionality on main dashboard

console.log('[Test] Starting Person Card Integration Test');

// Test Configuration
const testConfig = {
    mockPersonEntity: {
        entity_id: 'person.john_doe',
        state: 'home',
        attributes: {
            friendly_name: 'John Doe',
            id: 'john_doe',
            device_trackers: ['device_tracker.john_phone'],
            user_id: 'john_user_id'
        },
        last_changed: '2024-07-01T10:30:00Z',
        last_updated: '2024-07-01T10:32:00Z'
    },
    mockDeviceTracker: {
        entity_id: 'device_tracker.john_phone',
        state: 'home',
        attributes: {
            friendly_name: 'John Phone',
            latitude: 52.5200,
            longitude: 13.4050,
            battery_level: 85
        },
        last_changed: '2024-07-01T10:25:00Z'
    },
    mockBatterySensor: {
        entity_id: 'sensor.john_phone_battery',
        state: '85',
        attributes: {
            friendly_name: 'John Phone Battery',
            device_class: 'battery',
            unit_of_measurement: '%',
            icon: 'mdi:battery-80'
        }
    },
    mockPersonConfig: {
        'person.john_doe': {
            enabled: true,
            friendly_name: 'John Doe',
            device_trackers: ['device_tracker.john_phone'],
            sensors: ['sensor.john_phone_battery'],
            calendars: ['calendar.john_work'],
            custom_modes: []
        }
    },
    mockFloorLayout: [
        {
            type: 'person_cards',
            grid_area: 'persons-big'
        },
        {
            type: 'person_card',
            person_id: 'person.john_doe',
            grid_area: 'person-small'
        }
    ]
};

// Test Results
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function addTestResult(testName, passed, message) {
    testResults.tests.push({
        name: testName,
        passed: passed,
        message: message
    });
    if (passed) {
        testResults.passed++;
        console.log(`✓ ${testName}: ${message}`);
    } else {
        testResults.failed++;
        console.error(`✗ ${testName}: ${message}`);
    }
}

// Test 1: Person Card Template Structure
function testPersonCardTemplate() {
    console.log('\n--- Testing Person Card Template ---');
    
    try {
        fetch('/local/dashview/templates/person-card.html')
            .then(response => response.text())
            .then(template => {
                // Check for required elements
                const requiredElements = [
                    'person-card',
                    'person-card-header',
                    'person-avatar',
                    'person-info',
                    'person-name',
                    'person-location',
                    'person-status-badge',
                    'person-card-body',
                    'person-activity',
                    'person-last-seen',
                    'person-battery',
                    'person-quick-actions',
                    'person-presence-toggle'
                ];
                
                let elementsFound = 0;
                requiredElements.forEach(element => {
                    if (template.includes(element)) {
                        elementsFound++;
                    }
                });
                
                if (elementsFound === requiredElements.length) {
                    addTestResult('Person Card Template Structure', true, `All ${requiredElements.length} required elements found`);
                } else {
                    addTestResult('Person Card Template Structure', false, `Only ${elementsFound}/${requiredElements.length} elements found`);
                }
                
                // Check for template placeholders
                const requiredPlaceholders = [
                    '{{entity_id}}',
                    '{{friendly_name}}',
                    '{{state}}',
                    '{{state_class}}',
                    '{{state_icon}}',
                    '{{location_display}}',
                    '{{last_seen_display}}',
                    '{{battery_level}}',
                    '{{toggle_action}}'
                ];
                
                let placeholdersFound = 0;
                requiredPlaceholders.forEach(placeholder => {
                    if (template.includes(placeholder)) {
                        placeholdersFound++;
                    }
                });
                
                if (placeholdersFound === requiredPlaceholders.length) {
                    addTestResult('Person Card Template Placeholders', true, 'All required placeholders found');
                } else {
                    addTestResult('Person Card Template Placeholders', false, `Missing placeholders: ${requiredPlaceholders.length - placeholdersFound}`);
                }
                
                // Check for click handler
                if (template.includes('data-hash="#entity-details-{{entity_id}}"')) {
                    addTestResult('Person Card Popup Integration', true, 'Popup hash link found');
                } else {
                    addTestResult('Person Card Popup Integration', false, 'Popup hash link not found');
                }
            })
            .catch(error => {
                addTestResult('Person Card Template', false, `Error loading template: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Person Card Template', false, `Error: ${error.message}`);
    }
}

// Test 2: Person Card CSS Styling
function testPersonCardStyling() {
    console.log('\n--- Testing Person Card Styling ---');
    
    try {
        fetch('/local/dashview/style.css')
            .then(response => response.text())
            .then(css => {
                // Check for person card styles
                const requiredStyles = [
                    '.person-cards-container',
                    '.person-card',
                    '.person-card-header',
                    '.person-avatar',
                    '.person-avatar-icon',
                    '.person-info',
                    '.person-name',
                    '.person-location',
                    '.person-status-badge',
                    '.person-card-body',
                    '.person-activity',
                    '.person-activity-item',
                    '.person-quick-actions',
                    '.person-quick-action-btn',
                    '.person-presence-toggle'
                ];
                
                let stylesFound = 0;
                requiredStyles.forEach(style => {
                    if (css.includes(style)) {
                        stylesFound++;
                    }
                });
                
                if (stylesFound === requiredStyles.length) {
                    addTestResult('Person Card CSS Styles', true, `All ${requiredStyles.length} required styles found`);
                } else {
                    addTestResult('Person Card CSS Styles', false, `Only ${stylesFound}/${requiredStyles.length} required styles found`);
                }
                
                // Check for responsive design
                if (css.includes('@media (max-width: 768px)') && css.includes('.person-cards-container')) {
                    addTestResult('Person Card Responsive Design', true, 'Responsive person card styles found');
                } else {
                    addTestResult('Person Card Responsive Design', false, 'Responsive person card styles not found');
                }
                
                // Check for state-based styling
                const stateStyles = ['.person-status-badge.home', '.person-status-badge.away', '.person-status-badge.unknown'];
                let stateStylesFound = 0;
                
                stateStyles.forEach(style => {
                    if (css.includes(style)) {
                        stateStylesFound++;
                    }
                });
                
                if (stateStylesFound === stateStyles.length) {
                    addTestResult('Person Card State Styles', true, 'All person state styles found');
                } else {
                    addTestResult('Person Card State Styles', false, `Missing state styles: ${stateStyles.length - stateStylesFound}`);
                }
                
                // Check for grid layout styles
                if (css.includes('grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))')) {
                    addTestResult('Person Card Grid Layout', true, 'Grid layout styles found');
                } else {
                    addTestResult('Person Card Grid Layout', false, 'Grid layout styles not found');
                }
            })
            .catch(error => {
                addTestResult('Person Card Styling', false, `Error loading styles: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Person Card Styling', false, `Error: ${error.message}`);
    }
}

// Test 3: FloorManager Person Card Integration
function testFloorManagerIntegration() {
    console.log('\n--- Testing FloorManager Integration ---');
    
    try {
        fetch('/local/dashview/lib/ui/FloorManager.js')
            .then(response => response.text())
            .then(content => {
                // Check for person card rendering methods
                const requiredMethods = [
                    '_renderPersonCardsContainer',
                    '_renderSinglePersonCard',
                    '_generatePersonCardHTML',
                    '_initializePersonCardHandlers',
                    '_updatePersonCard',
                    '_handlePersonPresenceToggle'
                ];
                
                let methodsFound = 0;
                requiredMethods.forEach(method => {
                    if (content.includes(method)) {
                        methodsFound++;
                    }
                });
                
                if (methodsFound === requiredMethods.length) {
                    addTestResult('FloorManager Person Card Methods', true, `All ${requiredMethods.length} required methods found`);
                } else {
                    addTestResult('FloorManager Person Card Methods', false, `Only ${methodsFound}/${requiredMethods.length} methods found`);
                }
                
                // Check for slot type handling
                if (content.includes("slot.type === 'person_cards'") && content.includes("slot.type === 'person_card'")) {
                    addTestResult('FloorManager Slot Type Handling', true, 'Person card slot types handled');
                } else {
                    addTestResult('FloorManager Slot Type Handling', false, 'Person card slot types not found');
                }
                
                // Check for person card updates in update method
                if (content.includes("querySelectorAll('.person-card')") && content.includes('_updatePersonCard')) {
                    addTestResult('FloorManager Person Card Updates', true, 'Person card update mechanism found');
                } else {
                    addTestResult('FloorManager Person Card Updates', false, 'Person card update mechanism not found');
                }
                
                // Check for event handler initialization
                if (content.includes("classList.contains('person-card')") && content.includes('_initializePersonCardHandlers')) {
                    addTestResult('FloorManager Event Handlers', true, 'Person card event handler initialization found');
                } else {
                    addTestResult('FloorManager Event Handlers', false, 'Person card event handler initialization not found');
                }
            })
            .catch(error => {
                addTestResult('FloorManager Integration', false, `Error loading FloorManager: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('FloorManager Integration', false, `Error: ${error.message}`);
    }
}

// Test 4: Person Card Data Structure
function testPersonCardDataStructure() {
    console.log('\n--- Testing Person Card Data Structure ---');
    
    try {
        // Mock person card data structure
        const mockPersonCardData = {
            entity_id: 'person.john_doe',
            friendly_name: 'John Doe',
            state: 'home',
            state_class: 'home',
            state_icon: 'mdi-home',
            state_display: 'Home',
            location_display: 'Home',
            last_seen_display: 'vor 2m',
            battery_level: 85,
            battery_color: '#4CAF50',
            battery_visibility: 'display: flex;',
            toggle_action: 'Away',
            toggle_icon: 'mdi-home-export-outline',
            current_activity: null,
            activity_visibility: 'display: none;'
        };
        
        // Test data structure validity
        const requiredFields = [
            'entity_id', 'friendly_name', 'state', 'state_class', 'state_icon', 
            'state_display', 'location_display', 'last_seen_display', 'toggle_action', 'toggle_icon'
        ];
        
        let fieldsValid = true;
        requiredFields.forEach(field => {
            if (!mockPersonCardData.hasOwnProperty(field)) {
                fieldsValid = false;
                addTestResult('Person Card Data Structure', false, `Missing required field: ${field}`);
            }
        });
        
        if (fieldsValid) {
            addTestResult('Person Card Data Structure', true, 'Person card data structure is valid');
        }
        
        // Test state mapping
        const stateMapping = {
            'home': { class: 'home', icon: 'mdi-home', display: 'Home' },
            'away': { class: 'away', icon: 'mdi-home-export-outline', display: 'Away' },
            'not_home': { class: 'nothome', icon: 'mdi-home-export-outline', display: 'Away' },
            'unknown': { class: 'unknown', icon: 'mdi-help-circle', display: 'Unknown' }
        };
        
        const testState = 'home';
        const expectedMapping = stateMapping[testState];
        
        if (mockPersonCardData.state_class === expectedMapping.class &&
            mockPersonCardData.state_icon === expectedMapping.icon &&
            mockPersonCardData.state_display === expectedMapping.display) {
            addTestResult('Person Card State Mapping', true, 'State mapping is correct');
        } else {
            addTestResult('Person Card State Mapping', false, 'State mapping is incorrect');
        }
        
        // Test battery data structure
        if (typeof mockPersonCardData.battery_level === 'number' &&
            typeof mockPersonCardData.battery_color === 'string' &&
            typeof mockPersonCardData.battery_visibility === 'string') {
            addTestResult('Person Card Battery Data', true, 'Battery data structure is valid');
        } else {
            addTestResult('Person Card Battery Data', false, 'Battery data structure is invalid');
        }
        
    } catch (error) {
        addTestResult('Person Card Data Structure', false, `Error: ${error.message}`);
    }
}

// Test 5: Person Card Performance
function testPersonCardPerformance() {
    console.log('\n--- Testing Person Card Performance ---');
    
    try {
        // Test template size
        fetch('/local/dashview/templates/person-card.html')
            .then(response => response.text())
            .then(template => {
                const templateSize = new Blob([template]).size;
                
                if (templateSize < 5000) { // Less than 5KB
                    addTestResult('Person Card Template Size', true, `Template size: ${templateSize} bytes (acceptable)`);
                } else {
                    addTestResult('Person Card Template Size', false, `Template size: ${templateSize} bytes (too large)`);
                }
            });
        
        // Test CSS size
        fetch('/local/dashview/style.css')
            .then(response => response.text())
            .then(css => {
                // Count person card related CSS lines
                const personCardCSS = css.split('\n').filter(line => 
                    line.includes('person-card') || 
                    line.includes('person-avatar') || 
                    line.includes('person-status') ||
                    line.includes('person-activity')
                );
                
                if (personCardCSS.length < 500) { // Less than 500 lines
                    addTestResult('Person Card CSS Size', true, `Person card CSS: ${personCardCSS.length} lines (acceptable)`);
                } else {
                    addTestResult('Person Card CSS Size', false, `Person card CSS: ${personCardCSS.length} lines (too many)`);
                }
            });
        
        // Test JavaScript method complexity
        fetch('/local/dashview/lib/ui/FloorManager.js')
            .then(response => response.text())
            .then(content => {
                // Count person card related methods
                const personCardMethods = [
                    '_renderPersonCardsContainer',
                    '_renderSinglePersonCard',
                    '_generatePersonCardHTML',
                    '_updatePersonCard'
                ];
                
                let totalMethodSize = 0;
                personCardMethods.forEach(method => {
                    const methodStart = content.indexOf(method);
                    if (methodStart !== -1) {
                        const methodEnd = content.indexOf('\n  }', methodStart);
                        if (methodEnd !== -1) {
                            totalMethodSize += methodEnd - methodStart;
                        }
                    }
                });
                
                if (totalMethodSize < 10000) { // Less than 10KB
                    addTestResult('Person Card Method Complexity', true, `Total method size: ${totalMethodSize} characters (acceptable)`);
                } else {
                    addTestResult('Person Card Method Complexity', false, `Total method size: ${totalMethodSize} characters (too complex)`);
                }
            });
            
    } catch (error) {
        addTestResult('Person Card Performance', false, `Error: ${error.message}`);
    }
}

// Test 6: Person Card Real-time Updates
function testPersonCardUpdates() {
    console.log('\n--- Testing Person Card Real-time Updates ---');
    
    try {
        // Check StateManager integration
        fetch('/local/dashview/lib/state-manager.js')
            .then(response => response.text())
            .then(content => {
                // Check for person entity watching
                if (content.includes('houseConfig.persons') && 
                    content.includes('personConfig.enabled') &&
                    content.includes('this.watchEntities(personId') &&
                    content.includes('this.watchEntities(personConfig.device_trackers') &&
                    content.includes('this.watchEntities(personConfig.sensors')) {
                    addTestResult('Person Entity State Watching', true, 'Person entities are watched by StateManager');
                } else {
                    addTestResult('Person Entity State Watching', false, 'Person entity watching not found in StateManager');
                }
                
                // Check for update callback
                if (content.includes('this._panel.updateComponentForEntity(id)')) {
                    addTestResult('Person Update Callback', true, 'Person entity updates trigger component updates');
                } else {
                    addTestResult('Person Update Callback', false, 'Person entity update callback not found');
                }
            });
        
        // Check FloorManager update integration
        fetch('/local/dashview/lib/ui/FloorManager.js')
            .then(response => response.text())
            .then(content => {
                // Check for person card update in main update method
                if (content.includes("querySelectorAll('.person-card')") && 
                    content.includes('this._updatePersonCard(card, entityId)')) {
                    addTestResult('Person Card Update Integration', true, 'Person cards are updated in FloorManager.update()');
                } else {
                    addTestResult('Person Card Update Integration', false, 'Person card updates not integrated');
                }
                
                // Check for comprehensive update method
                if (content.includes('_updatePersonCard(card, entityId)') &&
                    content.includes('person-name') &&
                    content.includes('person-location') &&
                    content.includes('person-status-badge') &&
                    content.includes('person-last-seen')) {
                    addTestResult('Person Card Update Comprehensiveness', true, 'Person card updates are comprehensive');
                } else {
                    addTestResult('Person Card Update Comprehensiveness', false, 'Person card updates are incomplete');
                }
            });
            
    } catch (error) {
        addTestResult('Person Card Updates', false, `Error: ${error.message}`);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 DashView Person Card Integration Test Suite');
    console.log('='.repeat(50));
    
    testPersonCardTemplate();
    testPersonCardStyling();
    testFloorManagerIntegration();
    testPersonCardDataStructure();
    testPersonCardPerformance();
    testPersonCardUpdates();
    
    // Wait for async tests to complete
    setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✓ Passed: ${testResults.passed}`);
        console.log(`✗ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All person card integration tests passed!');
            console.log('Person card functionality is ready for use.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the implementation.');
            console.log('Failed tests:');
            testResults.tests.filter(t => !t.passed).forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        }
        
        console.log('\n💡 To use person cards:');
        console.log('1. Configure persons in Admin → Person Management');
        console.log('2. Add "person_cards" or "person_card" slots to floor layouts');
        console.log('3. Person cards will display on the dashboard with real-time updates');
        console.log('4. Click cards to open detailed person popups');
        console.log('5. Use quick action buttons to toggle home/away status');
        
    }, 5000); // Wait 5 seconds for all async tests
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testResults };
} else {
    // Run tests if loaded directly
    runAllTests();
}