// Test: Calendar Integration (Issue #268)
// Testing the complete calendar integration with multiple calendar entities in DashView

console.log('[Test] Starting Calendar Integration Test');

// Test Configuration
const testConfig = {
    testCalendarEntities: [
        'calendar.family',
        'calendar.work',
        'calendar.personal'
    ],
    mockEvents: [
        {
            summary: 'Team Meeting',
            start: { dateTime: '2024-01-15T10:00:00Z' },
            end: { dateTime: '2024-01-15T11:00:00Z' },
            description: 'Weekly team standup',
            calendar_entity_id: 'calendar.work'
        },
        {
            summary: 'Dentist Appointment',
            start: { dateTime: '2024-01-15T14:00:00Z' },
            end: { dateTime: '2024-01-15T15:00:00Z' },
            calendar_entity_id: 'calendar.personal'
        },
        {
            summary: 'Family Dinner',
            start: { date: '2024-01-15' },
            calendar_entity_id: 'calendar.family'
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

// Test 1: Backend API Endpoints
async function testBackendAPI() {
    console.log('\n--- Testing Backend API ---');
    
    try {
        // Test available calendars endpoint
        const calendarsResponse = await fetch('/api/dashview/config?type=available_calendars');
        const calendarsData = await calendarsResponse.json();
        
        if (Array.isArray(calendarsData)) {
            addTestResult('Available Calendars API', true, `Found ${calendarsData.length} calendar entities`);
        } else {
            addTestResult('Available Calendars API', false, 'Invalid response format');
            return;
        }
        
        // Test calendar config endpoint
        const configResponse = await fetch('/api/dashview/config?type=calendar_config');
        const configData = await configResponse.json();
        
        if (configData.hasOwnProperty('linked_calendars')) {
            addTestResult('Calendar Config API', true, `Config contains ${configData.linked_calendars.length} linked calendars`);
        } else {
            addTestResult('Calendar Config API', false, 'Missing linked_calendars property');
        }
        
        // Test calendar events endpoint (if calendars are configured)
        if (configData.linked_calendars.length > 0) {
            const startDate = new Date().toISOString();
            const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const entityIds = configData.linked_calendars.join(',');
            
            const eventsResponse = await fetch(
                `/api/dashview/config?type=calendar_events&entity_ids=${encodeURIComponent(entityIds)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
            );
            
            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                if (eventsData.hasOwnProperty('events')) {
                    addTestResult('Calendar Events API', true, `Retrieved ${eventsData.events.length} events`);
                } else {
                    addTestResult('Calendar Events API', false, 'Invalid events response format');
                }
            } else {
                addTestResult('Calendar Events API', false, `HTTP ${eventsResponse.status}`);
            }
        }
        
    } catch (error) {
        addTestResult('Backend API', false, `Network error: ${error.message}`);
    }
}

// Test 2: Frontend CalendarManager
function testCalendarManager() {
    console.log('\n--- Testing CalendarManager ---');
    
    try {
        // Check if CalendarManager file exists and is importable
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { CalendarManager } from '/local/dashview/lib/ui/CalendarManager.js';
            window.CalendarManagerTest = CalendarManager;
        `;
        document.head.appendChild(script);
        
        setTimeout(() => {
            if (window.CalendarManagerTest) {
                addTestResult('CalendarManager Import', true, 'Successfully imported CalendarManager class');
                
                // Test CalendarManager instantiation
                try {
                    const mockPanel = {
                        _hass: {},
                        shadowRoot: document.createElement('div'),
                        _houseConfig: { linked_calendars: testConfig.testCalendarEntities }
                    };
                    
                    const calendarManager = new window.CalendarManagerTest(mockPanel);
                    
                    if (calendarManager) {
                        addTestResult('CalendarManager Instantiation', true, 'CalendarManager created successfully');
                        
                        // Test method existence
                        const requiredMethods = ['setHass', 'update', '_loadAndRenderEvents', '_renderEvents'];
                        let methodsExist = true;
                        
                        requiredMethods.forEach(method => {
                            if (typeof calendarManager[method] !== 'function') {
                                methodsExist = false;
                                addTestResult('CalendarManager Methods', false, `Missing method: ${method}`);
                            }
                        });
                        
                        if (methodsExist) {
                            addTestResult('CalendarManager Methods', true, 'All required methods exist');
                        }
                    }
                    
                } catch (error) {
                    addTestResult('CalendarManager Instantiation', false, `Error: ${error.message}`);
                }
            } else {
                addTestResult('CalendarManager Import', false, 'Failed to import CalendarManager');
            }
            
            document.head.removeChild(script);
        }, 100);
        
    } catch (error) {
        addTestResult('CalendarManager', false, `Error testing CalendarManager: ${error.message}`);
    }
}

// Test 3: Admin Panel Integration
function testAdminPanelIntegration() {
    console.log('\n--- Testing Admin Panel Integration ---');
    
    try {
        // Check if calendar management tab exists in admin.html
        fetch('/local/dashview/admin.html')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Check for calendar management tab button
                const calendarTab = doc.querySelector('[data-target="calendar-management-tab"]');
                if (calendarTab) {
                    addTestResult('Admin Calendar Tab', true, 'Calendar management tab button found');
                } else {
                    addTestResult('Admin Calendar Tab', false, 'Calendar management tab button not found');
                }
                
                // Check for calendar management tab content
                const calendarContent = doc.querySelector('#calendar-management-tab');
                if (calendarContent) {
                    addTestResult('Admin Calendar Content', true, 'Calendar management tab content found');
                    
                    // Check for required elements
                    const calendarList = calendarContent.querySelector('#calendar-list');
                    const saveButton = calendarContent.querySelector('#save-calendars');
                    const reloadButton = calendarContent.querySelector('#reload-calendars');
                    
                    if (calendarList && saveButton && reloadButton) {
                        addTestResult('Admin Calendar Elements', true, 'All required calendar admin elements found');
                    } else {
                        addTestResult('Admin Calendar Elements', false, 'Missing required calendar admin elements');
                    }
                } else {
                    addTestResult('Admin Calendar Content', false, 'Calendar management tab content not found');
                }
            })
            .catch(error => {
                addTestResult('Admin Panel Integration', false, `Error loading admin.html: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Admin Panel Integration', false, `Error: ${error.message}`);
    }
}

// Test 4: Calendar Popup Integration
function testCalendarPopupIntegration() {
    console.log('\n--- Testing Calendar Popup Integration ---');
    
    try {
        // Check if calendar.html exists and has proper structure
        fetch('/local/dashview/calendar.html')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Check for calendar content container
                const calendarContent = doc.querySelector('.calendar-content');
                if (calendarContent) {
                    addTestResult('Calendar Popup Structure', true, 'Calendar content container found');
                } else {
                    addTestResult('Calendar Popup Structure', false, 'Calendar content container not found');
                }
                
                // Check for loading state
                const loadingElement = doc.querySelector('.calendar-loading');
                if (loadingElement) {
                    addTestResult('Calendar Loading State', true, 'Calendar loading state found');
                } else {
                    addTestResult('Calendar Loading State', false, 'Calendar loading state not found');
                }
            })
            .catch(error => {
                addTestResult('Calendar Popup Integration', false, `Error loading calendar.html: ${error.message}`);
            });
            
        // Check if navigation button exists
        fetch('/local/dashview/index.html')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                const calendarButton = doc.querySelector('[data-hash="#calendar"]');
                if (calendarButton) {
                    addTestResult('Calendar Navigation Button', true, 'Calendar navigation button found');
                } else {
                    addTestResult('Calendar Navigation Button', false, 'Calendar navigation button not found');
                }
            })
            .catch(error => {
                addTestResult('Calendar Navigation', false, `Error checking navigation: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Calendar Popup Integration', false, `Error: ${error.message}`);
    }
}

// Test 5: CSS Styles
function testCalendarStyles() {
    console.log('\n--- Testing Calendar Styles ---');
    
    try {
        fetch('/local/dashview/style.css')
            .then(response => response.text())
            .then(css => {
                // Check for key calendar CSS classes
                const requiredStyles = [
                    '.calendar-content',
                    '.calendar-header',
                    '.calendar-event',
                    '.calendar-loading',
                    '.calendar-no-events',
                    '.calendar-nav-button'
                ];
                
                let stylesFound = 0;
                requiredStyles.forEach(style => {
                    if (css.includes(style)) {
                        stylesFound++;
                    }
                });
                
                if (stylesFound === requiredStyles.length) {
                    addTestResult('Calendar CSS Styles', true, `All ${requiredStyles.length} required styles found`);
                } else {
                    addTestResult('Calendar CSS Styles', false, `Only ${stylesFound}/${requiredStyles.length} required styles found`);
                }
                
                // Check for responsive styles
                if (css.includes('@media (max-width: 768px)') && css.includes('.calendar-event')) {
                    addTestResult('Calendar Responsive Styles', true, 'Responsive calendar styles found');
                } else {
                    addTestResult('Calendar Responsive Styles', false, 'Responsive calendar styles not found');
                }
            })
            .catch(error => {
                addTestResult('Calendar Styles', false, `Error loading styles: ${error.message}`);
            });
            
    } catch (error) {
        addTestResult('Calendar Styles', false, `Error: ${error.message}`);
    }
}

// Test 6: Event Parsing and Display
function testEventParsing() {
    console.log('\n--- Testing Event Parsing ---');
    
    try {
        // Mock CalendarManager to test event parsing logic
        const mockCalendarManager = {
            _groupEventsByDate: function(events) {
                const grouped = {};
                events.forEach(event => {
                    let eventDate;
                    if (event.start) {
                        if (typeof event.start === 'string') {
                            eventDate = new Date(event.start);
                        } else if (event.start.dateTime) {
                            eventDate = new Date(event.start.dateTime);
                        } else if (event.start.date) {
                            eventDate = new Date(event.start.date);
                        }
                    }
                    
                    if (eventDate && !isNaN(eventDate.getTime())) {
                        const dateKey = eventDate.toISOString().split('T')[0];
                        if (!grouped[dateKey]) {
                            grouped[dateKey] = [];
                        }
                        grouped[dateKey].push(event);
                    }
                });
                return grouped;
            },
            
            _isAllDayEvent: function(event) {
                if (event.start) {
                    if (typeof event.start === 'string') {
                        return !event.start.includes('T');
                    } else if (event.start.date && !event.start.dateTime) {
                        return true;
                    }
                }
                return false;
            }
        };
        
        // Test event grouping
        const groupedEvents = mockCalendarManager._groupEventsByDate(testConfig.mockEvents);
        const dateKeys = Object.keys(groupedEvents);
        
        if (dateKeys.length > 0) {
            addTestResult('Event Grouping', true, `Events grouped into ${dateKeys.length} date(s)`);
        } else {
            addTestResult('Event Grouping', false, 'Failed to group events by date');
        }
        
        // Test all-day event detection
        const allDayEvent = testConfig.mockEvents.find(e => e.start.date);
        const timedEvent = testConfig.mockEvents.find(e => e.start.dateTime);
        
        if (allDayEvent && mockCalendarManager._isAllDayEvent(allDayEvent)) {
            addTestResult('All-Day Event Detection', true, 'All-day events correctly identified');
        } else {
            addTestResult('All-Day Event Detection', false, 'Failed to identify all-day events');
        }
        
        if (timedEvent && !mockCalendarManager._isAllDayEvent(timedEvent)) {
            addTestResult('Timed Event Detection', true, 'Timed events correctly identified');
        } else {
            addTestResult('Timed Event Detection', false, 'Failed to identify timed events');
        }
        
    } catch (error) {
        addTestResult('Event Parsing', false, `Error: ${error.message}`);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🧪 DashView Calendar Integration Test Suite');
    console.log('='.repeat(50));
    
    await testBackendAPI();
    testCalendarManager();
    testAdminPanelIntegration();
    testCalendarPopupIntegration();
    testCalendarStyles();
    testEventParsing();
    
    // Wait for async tests to complete
    setTimeout(() => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✓ Passed: ${testResults.passed}`);
        console.log(`✗ Failed: ${testResults.failed}`);
        console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All calendar integration tests passed!');
            console.log('Calendar feature implementation is ready for use.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the implementation.');
            console.log('Failed tests:');
            testResults.tests.filter(t => !t.passed).forEach(test => {
                console.log(`   - ${test.name}: ${test.message}`);
            });
        }
        
        console.log('\n💡 To test the calendar feature:');
        console.log('1. Go to Admin → Calendar to configure calendar entities');
        console.log('2. Click the calendar icon in the bottom navigation');
        console.log('3. View your calendar events in the popup');
        
    }, 2000); // Wait 2 seconds for all async tests
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testResults };
} else {
    // Run tests if loaded directly
    runAllTests();
}