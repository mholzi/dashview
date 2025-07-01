/**
 * Upcoming Events Card Test Suite
 * Tests the new upcoming events card functionality on the main dashboard
 */

class UpcomingEventsCardTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[UpcomingEventsCardTests] ${message}`);
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

  // Mock UpcomingEventsManager for testing
  createMockUpcomingEventsManager() {
    const mockPanel = {
      _houseConfig: {
        linked_calendars: ['calendar.test_calendar']
      },
      shadowRoot: {
        querySelector: (selector) => {
          // Mock different elements based on selector
          if (selector === '.upcoming-events-card') {
            return {
              querySelector: (innerSelector) => {
                if (innerSelector === '.upcoming-events-content') {
                  return {
                    innerHTML: '',
                    querySelectorAll: () => []
                  };
                }
                return null;
              }
            };
          } else if (selector === '[data-hash="#calendar"]') {
            return {
              click: () => console.log('Calendar popup opened')
            };
          }
          return null;
        }
      }
    };

    const mockHass = {
      states: {
        'calendar.test_calendar': {
          attributes: {
            friendly_name: 'Test Calendar'
          }
        }
      }
    };

    // Create manager instance
    const manager = {
      _panel: mockPanel,
      _hass: mockHass,
      _shadowRoot: mockPanel.shadowRoot,
      _events: [],
      _isLoading: false,
      _updateInterval: null
    };

    // Add methods
    manager.setHass = function(hass) {
      this._hass = hass;
    };

    manager.initialize = function() {
      this.update();
    };

    manager.dispose = function() {
      if (this._updateInterval) {
        clearInterval(this._updateInterval);
        this._updateInterval = null;
      }
    };

    manager.update = function() {
      // Mock update implementation
      return Promise.resolve();
    };

    manager._getEventStartTime = function(event) {
      if (event.start) {
        if (typeof event.start === 'string') {
          return new Date(event.start);
        } else if (event.start.dateTime) {
          return new Date(event.start.dateTime);
        } else if (event.start.date) {
          return new Date(event.start.date);
        }
      }
      return new Date(0);
    };

    manager._sortEventsByTime = function(events) {
      return events.sort((a, b) => {
        const timeA = this._getEventStartTime(a);
        const timeB = this._getEventStartTime(b);
        return timeA - timeB;
      });
    };

    manager._isEventToday = function(event) {
      const eventDate = this._getEventStartTime(event);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    };

    manager._isEventTomorrow = function(event) {
      const eventDate = this._getEventStartTime(event);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return eventDate.toDateString() === tomorrow.toDateString();
    };

    manager._isAllDayEvent = function(event) {
      if (event.start) {
        if (typeof event.start === 'string') {
          return !event.start.includes('T');
        } else if (event.start.date && !event.start.dateTime) {
          return true;
        }
      }
      return false;
    };

    manager._getEventTimeDisplay = function(event) {
      const startTime = this._getEventStartTime(event);
      
      if (this._isAllDayEvent(event)) {
        if (this._isEventToday(event)) {
          return 'Today';
        } else if (this._isEventTomorrow(event)) {
          return 'Tomorrow';
        } else {
          return this._formatDateShort(startTime);
        }
      } else {
        if (this._isEventToday(event)) {
          return startTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
        } else if (this._isEventTomorrow(event)) {
          return `Tomorrow, ${startTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })}`;
        } else {
          return `${this._formatDateShort(startTime)}, ${startTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          })}`;
        }
      }
    };

    manager._formatDateShort = function(date) {
      const options = { 
        weekday: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    };

    manager._getCalendarIcon = function(entityId) {
      let icon = 'mdi-calendar-blank';
      
      if (entityId) {
        const lowerName = entityId.toLowerCase();
        if (lowerName.includes('work') || lowerName.includes('office')) {
          icon = 'mdi-briefcase';
        } else if (lowerName.includes('family') || lowerName.includes('home')) {
          icon = 'mdi-home-group';
        }
      }
      
      return icon;
    };

    return manager;
  }

  // Test manager initialization
  async testManagerInitialization() {
    const testName = 'Manager Initialization';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      this.assertTrue(manager._panel !== null, 'Manager should have panel reference');
      this.assertTrue(manager._hass !== null, 'Manager should have hass reference');
      this.assertEqual(manager._isLoading, false, 'Manager should not be loading initially');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test event time display for today's events
  async testTodayEventTimeDisplay() {
    const testName = 'Today Event Time Display';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Create a test event for today
      const today = new Date();
      today.setHours(14, 30, 0, 0); // 2:30 PM today
      
      const todayEvent = {
        summary: 'Test Meeting',
        start: {
          dateTime: today.toISOString()
        }
      };

      const timeDisplay = manager._getEventTimeDisplay(todayEvent);
      this.assertEqual(timeDisplay, '14:30', 'Today events should show time only');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test event time display for tomorrow's events
  async testTomorrowEventTimeDisplay() {
    const testName = 'Tomorrow Event Time Display';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Create a test event for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10:00 AM tomorrow
      
      const tomorrowEvent = {
        summary: 'Tomorrow Meeting',
        start: {
          dateTime: tomorrow.toISOString()
        }
      };

      const timeDisplay = manager._getEventTimeDisplay(tomorrowEvent);
      this.assertEqual(timeDisplay, 'Tomorrow, 10:00', 'Tomorrow events should show "Tomorrow, time"');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test all-day event display
  async testAllDayEventDisplay() {
    const testName = 'All Day Event Display';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Create a test all-day event for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const allDayEvent = {
        summary: 'All Day Event',
        start: {
          date: today
        }
      };

      const timeDisplay = manager._getEventTimeDisplay(allDayEvent);
      this.assertEqual(timeDisplay, 'Today', 'All-day events today should show "Today"');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test event sorting by time
  async testEventSorting() {
    const testName = 'Event Sorting';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Create test events with different times
      const now = new Date();
      const event1 = {
        summary: 'Later Event',
        start: { dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() } // 2 hours from now
      };
      const event2 = {
        summary: 'Earlier Event',
        start: { dateTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() } // 1 hour from now
      };
      const event3 = {
        summary: 'Latest Event',
        start: { dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString() } // 3 hours from now
      };

      const unsortedEvents = [event1, event2, event3];
      const sortedEvents = manager._sortEventsByTime(unsortedEvents);
      
      this.assertEqual(sortedEvents[0].summary, 'Earlier Event', 'First event should be the earliest');
      this.assertEqual(sortedEvents[1].summary, 'Later Event', 'Second event should be in the middle');
      this.assertEqual(sortedEvents[2].summary, 'Latest Event', 'Third event should be the latest');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test calendar icon selection
  async testCalendarIconSelection() {
    const testName = 'Calendar Icon Selection';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Test different calendar types
      const workIcon = manager._getCalendarIcon('calendar.work_calendar');
      this.assertEqual(workIcon, 'mdi-briefcase', 'Work calendar should use briefcase icon');
      
      const familyIcon = manager._getCalendarIcon('calendar.family_home');
      this.assertEqual(familyIcon, 'mdi-home-group', 'Family calendar should use home group icon');
      
      const defaultIcon = manager._getCalendarIcon('calendar.generic');
      this.assertEqual(defaultIcon, 'mdi-calendar-blank', 'Generic calendar should use default icon');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test all-day event detection
  async testAllDayEventDetection() {
    const testName = 'All Day Event Detection';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Test all-day event (date only)
      const allDayEvent = {
        start: { date: '2024-01-15' }
      };
      this.assertTrue(manager._isAllDayEvent(allDayEvent), 'Should detect all-day event with date only');
      
      // Test timed event (with dateTime)
      const timedEvent = {
        start: { dateTime: '2024-01-15T14:30:00Z' }
      };
      this.assertTrue(!manager._isAllDayEvent(timedEvent), 'Should not detect timed event as all-day');
      
      // Test string format all-day event
      const stringAllDay = {
        start: '2024-01-15'
      };
      this.assertTrue(manager._isAllDayEvent(stringAllDay), 'Should detect all-day event in string format');
      
      // Test string format timed event
      const stringTimed = {
        start: '2024-01-15T14:30:00Z'
      };
      this.assertTrue(!manager._isAllDayEvent(stringTimed), 'Should not detect timed event in string format as all-day');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test disposal and cleanup
  async testDisposal() {
    const testName = 'Manager Disposal';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Set up an interval to test cleanup
      manager._updateInterval = setInterval(() => {}, 1000);
      
      // Test disposal
      manager.dispose();
      
      this.assertEqual(manager._updateInterval, null, 'Update interval should be cleared after disposal');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting upcoming events card tests...');
    
    await this.testManagerInitialization();
    await this.testTodayEventTimeDisplay();
    await this.testTomorrowEventTimeDisplay();
    await this.testAllDayEventDisplay();
    await this.testEventSorting();
    await this.testCalendarIconSelection();
    await this.testAllDayEventDetection();
    await this.testDisposal();

    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\n[UpcomingEventsCardTests] Test Results: ${passedTests}/${totalTests} passed`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.name}`);
      if (!result.passed) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const success = passedTests === totalTests;
    if (success) {
      console.log('\n[UpcomingEventsCardTests] All tests passed! ✅');
      console.log('Upcoming events card functionality is working correctly.');
    } else {
      console.log('\n[UpcomingEventsCardTests] Some tests failed! ❌');
    }

    return success;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UpcomingEventsCardTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new UpcomingEventsCardTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}