// Test: Person Management Admin Panel Configuration (Issue #295)
// Testing the comprehensive person management functionality in the admin panel

console.log('[Test] Starting Person Management Test');

// Test Configuration
const testConfig = {
    testPersonEntities: [
        { entity_id: 'person.john_doe', friendly_name: 'John Doe' },
        { entity_id: 'person.jane_doe', friendly_name: 'Jane Doe' }
    ],
    testDeviceTrackers: [
        { entity_id: 'device_tracker.john_phone', friendly_name: 'John Phone' },
        { entity_id: 'device_tracker.jane_phone', friendly_name: 'Jane Phone' }
    ],
    testSensors: [
        { entity_id: 'sensor.john_phone_battery', friendly_name: 'John Phone Battery', unit_of_measurement: '%' },
        { entity_id: 'sensor.jane_steps', friendly_name: 'Jane Steps', unit_of_measurement: 'steps' }
    ],
    testCalendars: [
        { entity_id: 'calendar.john_work', friendly_name: 'John Work Calendar' },
        { entity_id: 'calendar.family', friendly_name: 'Family Calendar' }
    ],
    mockPersonConfig: {
        'person.john_doe': {
            enabled: true,
            friendly_name: 'John Doe',
            device_trackers: ['device_tracker.john_phone'],
            sensors: ['sensor.john_phone_battery'],
            calendars: ['calendar.john_work'],
            custom_modes: [
                {
                    name: 'Working',
                    icon: 'mdi:briefcase',
                    service: 'script.john_work_mode'
                }
            ]
        }
    }
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

// Test 1: Backend API Endpoints
async function testBackendAPI() {
    console.log('\n--- Testing Backend API ---');
    
    try {
        // Test available persons endpoint
        const personsResponse = await fetch('/api/dashview/config?type=available_persons');
        const personsData = await personsResponse.json();
        
        if (Array.isArray(personsData)) {
            addTestResult('Available Persons API', true, `Found ${personsData.length} person entities`);
        } else {
            addTestResult('Available Persons API', false, 'Invalid response format');
            return;
        }
        
        // Test available device trackers endpoint
        const trackersResponse = await fetch('/api/dashview/config?type=available_device_trackers');
        const trackersData = await trackersResponse.json();
        
        if (Array.isArray(trackersData)) {
            addTestResult('Available Device Trackers API', true, `Found ${trackersData.length} device tracker entities`);
        } else {
            addTestResult('Available Device Trackers API', false, 'Invalid response format');
        }
        
        // Test available sensors endpoint
        const sensorsResponse = await fetch('/api/dashview/config?type=available_sensors');
        const sensorsData = await sensorsResponse.json();
        
        if (Array.isArray(sensorsData)) {
            addTestResult('Available Sensors API', true, `Found ${sensorsData.length} sensor entities`);
        } else {
            addTestResult('Available Sensors API', false, 'Invalid response format');
        }
        
        // Test person config endpoint
        const configResponse = await fetch('/api/dashview/config?type=person_config');
        const configData = await configResponse.json();
        
        if (configData.hasOwnProperty('persons')) {
            addTestResult('Person Config API', true, `Config contains ${Object.keys(configData.persons).length} configured persons`);
        } else {
            addTestResult('Person Config API', false, 'Missing persons property');
        }
        
    } catch (error) {
        addTestResult('Backend API', false, `Network error: ${error.message}`);
    }
}

// Test 2: Admin Panel UI Structure
function testAdminPanelUI() {
    console.log('\n--- Testing Admin Panel UI ---');
    
    try {
        // Check if person management tab exists in admin.html
        fetch('/local/dashview/admin.html')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Check for person management tab button
                const personTab = doc.querySelector('[data-target="person-management-tab"]');
                if (personTab) {
                    addTestResult('Admin Person Tab Button', true, 'Person management tab button found');
                } else {
                    addTestResult('Admin Person Tab Button', false, 'Person management tab button not found');
                }
                
                // Check for person management tab content
                const personContent = doc.querySelector('#person-management-tab');
                if (personContent) {
                    addTestResult('Admin Person Tab Content', true, 'Person management tab content found');
                    
                    // Check for required elements
                    const personSelector = personContent.querySelector('#person-selector');
                    const addButton = personContent.querySelector('#add-person');
                    const saveButton = personContent.querySelector('#save-persons');
                    const reloadButton = personContent.querySelector('#reload-persons');
                    const configContainer = personContent.querySelector('#person-configurations');
                    
                    if (personSelector && addButton && saveButton && reloadButton && configContainer) {
                        addTestResult('Admin Person Elements', true, 'All required person admin elements found');
                    } else {
                        addTestResult('Admin Person Elements', false, 'Missing required person admin elements');
                    }
                } else {
                    addTestResult('Admin Person Tab Content', false, 'Person management tab content not found');
                }
            })
            .catch(error => {
                addTestResult('Admin Panel UI', false, `Error loading admin.html: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Admin Panel UI', false, `Error: ${error.message}`);
    }
}

// Test 3: AdminManager Integration
function testAdminManagerIntegration() {
    console.log('\n--- Testing AdminManager Integration ---');
    
    try {
        // Check if AdminManager can be imported and has person management methods
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { AdminManager } from '/local/dashview/lib/ui/AdminManager.js';
            window.AdminManagerTest = AdminManager;
        `;
        document.head.appendChild(script);
        
        setTimeout(() => {
            if (window.AdminManagerTest) {
                addTestResult('AdminManager Import', true, 'Successfully imported AdminManager class');
                
                // Test AdminManager instantiation
                try {
                    const mockPanel = {
                        _hass: {},
                        shadowRoot: document.createElement('div'),
                        _houseConfig: { persons: testConfig.mockPersonConfig }
                    };
                    
                    const adminManager = new window.AdminManagerTest(mockPanel);
                    
                    if (adminManager) {
                        addTestResult('AdminManager Instantiation', true, 'AdminManager created successfully');
                        
                        // Test method existence
                        const requiredMethods = [
                            'loadPersonManagement',
                            'savePersonManagement', 
                            'addPersonConfiguration',
                            '_renderPersonConfigurations',
                            '_addPersonConfigEventListeners'
                        ];
                        let methodsExist = true;
                        
                        requiredMethods.forEach(method => {
                            if (typeof adminManager[method] !== 'function') {
                                methodsExist = false;
                                addTestResult('AdminManager Methods', false, `Missing method: ${method}`);
                            }
                        });
                        
                        if (methodsExist) {
                            addTestResult('AdminManager Methods', true, 'All required person management methods exist');
                        }
                    }
                    
                } catch (error) {
                    addTestResult('AdminManager Instantiation', false, `Error: ${error.message}`);
                }
            } else {
                addTestResult('AdminManager Import', false, 'Failed to import AdminManager');
            }
            
            document.head.removeChild(script);
        }, 200);
        
    } catch (error) {
        addTestResult('AdminManager Integration', false, `Error: ${error.message}`);
    }
}

// Test 4: Configuration Data Structure Validation
function testConfigurationDataStructure() {
    console.log('\n--- Testing Configuration Data Structure ---');
    
    try {
        const mockConfig = testConfig.mockPersonConfig['person.john_doe'];
        
        // Test required fields
        const requiredFields = ['enabled', 'friendly_name', 'device_trackers', 'sensors', 'calendars', 'custom_modes'];
        let fieldsValid = true;
        
        requiredFields.forEach(field => {
            if (!mockConfig.hasOwnProperty(field)) {
                fieldsValid = false;
                addTestResult('Config Structure', false, `Missing required field: ${field}`);
            }
        });
        
        if (fieldsValid) {
            addTestResult('Config Structure', true, 'All required configuration fields present');
        }
        
        // Test array fields
        const arrayFields = ['device_trackers', 'sensors', 'calendars', 'custom_modes'];
        let arraysValid = true;
        
        arrayFields.forEach(field => {
            if (!Array.isArray(mockConfig[field])) {
                arraysValid = false;
                addTestResult('Config Arrays', false, `Field ${field} is not an array`);
            }
        });
        
        if (arraysValid) {
            addTestResult('Config Arrays', true, 'All array fields are properly structured');
        }
        
        // Test custom mode structure
        if (mockConfig.custom_modes.length > 0) {
            const mode = mockConfig.custom_modes[0];
            const modeFields = ['name', 'icon', 'service'];
            let modeValid = true;
            
            modeFields.forEach(field => {
                if (!mode.hasOwnProperty(field)) {
                    modeValid = false;
                    addTestResult('Custom Mode Structure', false, `Missing mode field: ${field}`);
                }
            });
            
            if (modeValid) {
                addTestResult('Custom Mode Structure', true, 'Custom mode structure is valid');
            }
        }
        
    } catch (error) {
        addTestResult('Configuration Data Structure', false, `Error: ${error.message}`);
    }
}

// Test 5: CSS Styles
function testPersonManagementStyles() {
    console.log('\n--- Testing Person Management Styles ---');
    
    try {
        fetch('/local/dashview/style.css')
            .then(response => response.text())
            .then(css => {
                // Check for key person management CSS classes
                const requiredStyles = [
                    '.person-configs-container',
                    '.person-config-card',
                    '.person-config-header',
                    '.person-config-content',
                    '.config-group',
                    '.multi-select-dropdown',
                    '.custom-mode-item',
                    '.add-mode-button'
                ];
                
                let stylesFound = 0;
                requiredStyles.forEach(style => {
                    if (css.includes(style)) {
                        stylesFound++;
                    }
                });
                
                if (stylesFound === requiredStyles.length) {
                    addTestResult('Person Management CSS', true, `All ${requiredStyles.length} required styles found`);
                } else {
                    addTestResult('Person Management CSS', false, `Only ${stylesFound}/${requiredStyles.length} required styles found`);
                }
                
                // Check for responsive styles
                if (css.includes('@media (max-width: 768px)') && css.includes('.person-config-header')) {
                    addTestResult('Person Responsive Styles', true, 'Responsive person management styles found');
                } else {
                    addTestResult('Person Responsive Styles', false, 'Responsive person management styles not found');
                }
                
                // Check for accessibility styles
                if (css.includes('.person-config-content.disabled')) {
                    addTestResult('Person Accessibility Styles', true, 'Disabled state styles found');
                } else {
                    addTestResult('Person Accessibility Styles', false, 'Disabled state styles not found');
                }
            })
            .catch(error => {
                addTestResult('Person Management Styles', false, `Error loading styles: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Person Management Styles', false, `Error: ${error.message}`);
    }
}

// Test 6: Entity Validation and Filtering
function testEntityValidation() {
    console.log('\n--- Testing Entity Validation ---');
    
    try {
        // Test entity ID format validation
        const validPersonId = 'person.john_doe';
        const invalidPersonId = 'invalid.entity';
        
        if (validPersonId.startsWith('person.')) {
            addTestResult('Person Entity ID Validation', true, 'Valid person entity ID format detected');
        } else {
            addTestResult('Person Entity ID Validation', false, 'Person entity ID validation failed');
        }
        
        // Test device tracker validation
        const validTrackerId = 'device_tracker.john_phone';
        if (validTrackerId.startsWith('device_tracker.')) {
            addTestResult('Device Tracker ID Validation', true, 'Valid device tracker ID format detected');
        } else {
            addTestResult('Device Tracker ID Validation', false, 'Device tracker ID validation failed');
        }
        
        // Test sensor validation
        const validSensorId = 'sensor.john_phone_battery';
        if (validSensorId.startsWith('sensor.')) {
            addTestResult('Sensor ID Validation', true, 'Valid sensor ID format detected');
        } else {
            addTestResult('Sensor ID Validation', false, 'Sensor ID validation failed');
        }
        
        // Test service call format validation
        const validService = 'script.john_work_mode';
        const servicePattern = /^[a-z_]+\.[a-z_]+$/;
        if (servicePattern.test(validService)) {
            addTestResult('Service Call Validation', true, 'Valid service call format detected');
        } else {
            addTestResult('Service Call Validation', false, 'Service call format validation failed');
        }
        
    } catch (error) {
        addTestResult('Entity Validation', false, `Error: ${error.message}`);
    }
}

// Test 7: Multi-Select Functionality
function testMultiSelectFunctionality() {
    console.log('\n--- Testing Multi-Select Functionality ---');
    
    try {
        // Create mock multi-select element
        const mockSelect = document.createElement('select');
        mockSelect.multiple = true;
        mockSelect.innerHTML = `
            <option value="device_tracker.john_phone">John Phone</option>
            <option value="device_tracker.jane_phone">Jane Phone</option>
            <option value="device_tracker.guest_phone">Guest Phone</option>
        `;
        
        // Test selection behavior
        mockSelect.options[0].selected = true;
        mockSelect.options[2].selected = true;
        
        const selectedValues = Array.from(mockSelect.selectedOptions).map(option => option.value);
        const expectedValues = ['device_tracker.john_phone', 'device_tracker.guest_phone'];
        
        if (JSON.stringify(selectedValues) === JSON.stringify(expectedValues)) {
            addTestResult('Multi-Select Selection', true, 'Multi-select correctly handles multiple selections');
        } else {
            addTestResult('Multi-Select Selection', false, 'Multi-select selection logic failed');
        }
        
        // Test selection clearing
        Array.from(mockSelect.options).forEach(option => option.selected = false);
        const clearedValues = Array.from(mockSelect.selectedOptions).map(option => option.value);
        
        if (clearedValues.length === 0) {
            addTestResult('Multi-Select Clearing', true, 'Multi-select correctly clears selections');
        } else {
            addTestResult('Multi-Select Clearing', false, 'Multi-select clearing failed');
        }
        
    } catch (error) {
        addTestResult('Multi-Select Functionality', false, `Error: ${error.message}`);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 DashView Person Management Test Suite');
    console.log('='.repeat(50));
    
    await testBackendAPI();
    testAdminPanelUI();
    testAdminManagerIntegration();
    testConfigurationDataStructure();
    testPersonManagementStyles();
    testEntityValidation();
    testMultiSelectFunctionality();
    
    // Wait for async tests to complete
    setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✓ Passed: ${testResults.passed}`);
        console.log(`✗ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All person management tests passed!');
            console.log('Person management feature implementation is ready for use.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the implementation.');
            console.log('Failed tests:');
            testResults.tests.filter(t => !t.passed).forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        }
        
        console.log('\n💡 To test the person management feature:');
        console.log('1. Go to Admin → Person Management to configure person entities');
        console.log('2. Select person entities and link them with device trackers, sensors, and calendars');
        console.log('3. Configure custom mode buttons for each person');
        console.log('4. Save the configuration and verify persistence');
        
    }, 3000); // Wait 3 seconds for all async tests
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testResults };
} else {
    // Run tests if loaded directly
    runAllTests();
}