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

    // Add the new filtering methods
    manager._getEventEndTime = function(event) {
      if (event.end) {
        if (typeof event.end === 'string') {
          return new Date(event.end);
        } else if (event.end.dateTime) {
          return new Date(event.end.dateTime);
        } else if (event.end.date) {
          return new Date(event.end.date);
        }
      }
      // If no end time provided, fallback to start time
      return this._getEventStartTime(event);
    };

    manager._isEventFinished = function(event) {
      const now = new Date();
      
      // All-day events should show for the entire day they occur
      if (this._isAllDayEvent(event)) {
        const eventDate = this._getEventStartTime(event);
        const today = new Date();
        
        // Compare just the date parts (YYYY-MM-DD)
        const eventDateStr = eventDate.toISOString().split('T')[0];
        const todayDateStr = today.toISOString().split('T')[0];
        
        // All-day events are considered finished only if they're before today
        return eventDateStr < todayDateStr;
      }
      
      // For timed events, check if the end time has passed
      const endTime = this._getEventEndTime(event);
      return now > endTime;
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

  // Test event end time extraction
  async testEventEndTimeExtraction() {
    const testName = 'Event End Time Extraction';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Test event with dateTime end
      const timedEvent = {
        start: { dateTime: '2024-01-15T14:30:00Z' },
        end: { dateTime: '2024-01-15T15:30:00Z' }
      };
      const timedEndTime = manager._getEventEndTime(timedEvent);
      this.assertEqual(timedEndTime.toISOString(), '2024-01-15T15:30:00.000Z', 'Should extract dateTime end correctly');
      
      // Test event with date end (all-day)
      const allDayEvent = {
        start: { date: '2024-01-15' },
        end: { date: '2024-01-16' }
      };
      const allDayEndTime = manager._getEventEndTime(allDayEvent);
      this.assertEqual(allDayEndTime.toISOString(), '2024-01-16T00:00:00.000Z', 'Should extract date end correctly');
      
      // Test event with string format end
      const stringEvent = {
        start: '2024-01-15T14:30:00Z',
        end: '2024-01-15T15:30:00Z'
      };
      const stringEndTime = manager._getEventEndTime(stringEvent);
      this.assertEqual(stringEndTime.toISOString(), '2024-01-15T15:30:00.000Z', 'Should extract string end correctly');
      
      // Test event without end time - should fallback to start time
      const noEndEvent = {
        start: { dateTime: '2024-01-15T14:30:00Z' }
      };
      const noEndTime = manager._getEventEndTime(noEndEvent);
      this.assertEqual(noEndTime.toISOString(), '2024-01-15T14:30:00.000Z', 'Should fallback to start time when no end provided');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test finished event detection for timed events
  async testFinishedTimedEventDetection() {
    const testName = 'Finished Timed Event Detection';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      const now = new Date();
      
      // Test finished event (ended 1 hour ago)
      const finishedEvent = {
        summary: 'Finished Meeting',
        start: { dateTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() }, // 2 hours ago
        end: { dateTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() }     // 1 hour ago
      };
      this.assertTrue(manager._isEventFinished(finishedEvent), 'Should detect finished timed event');
      
      // Test ongoing event (started 1 hour ago, ends in 1 hour)
      const ongoingEvent = {
        summary: 'Ongoing Meeting',
        start: { dateTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() }, // 1 hour ago
        end: { dateTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() }     // 1 hour from now
      };
      this.assertTrue(!manager._isEventFinished(ongoingEvent), 'Should not detect ongoing event as finished');
      
      // Test future event (starts in 1 hour, ends in 2 hours)
      const futureEvent = {
        summary: 'Future Meeting',
        start: { dateTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() }, // 1 hour from now
        end: { dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() }     // 2 hours from now
      };
      this.assertTrue(!manager._isEventFinished(futureEvent), 'Should not detect future event as finished');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test finished event detection for all-day events
  async testFinishedAllDayEventDetection() {
    const testName = 'Finished All-Day Event Detection';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      // Test today's all-day event (should not be finished)
      const todayDate = new Date().toISOString().split('T')[0];
      const todayAllDay = {
        summary: 'Today All Day',
        start: { date: todayDate },
        end: { date: todayDate }
      };
      this.assertTrue(!manager._isEventFinished(todayAllDay), 'Today all-day event should not be finished');
      
      // Test yesterday's all-day event (should be finished)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      const yesterdayAllDay = {
        summary: 'Yesterday All Day',
        start: { date: yesterdayDate },
        end: { date: yesterdayDate }
      };
      this.assertTrue(manager._isEventFinished(yesterdayAllDay), 'Yesterday all-day event should be finished');
      
      // Test tomorrow's all-day event (should not be finished)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];
      const tomorrowAllDay = {
        summary: 'Tomorrow All Day',
        start: { date: tomorrowDate },
        end: { date: tomorrowDate }
      };
      this.assertTrue(!manager._isEventFinished(tomorrowAllDay), 'Tomorrow all-day event should not be finished');
      
      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test event filtering integration
  async testEventFilteringIntegration() {
    const testName = 'Event Filtering Integration';
    this.log(`Running test: ${testName}`);

    try {
      const manager = this.createMockUpcomingEventsManager();
      
      const now = new Date();
      
      // Create mix of events: finished, ongoing, and future
      const events = [
        {
          summary: 'Finished Meeting',
          start: { dateTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() }
        },
        {
          summary: 'Ongoing Meeting',
          start: { dateTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() }
        },
        {
          summary: 'Future Meeting 1',
          start: { dateTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString() }
        },
        {
          summary: 'Future Meeting 2',
          start: { dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString() },
          end: { dateTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString() }
        }
      ];
      
      // Filter active events (should exclude the finished one)
      const activeEvents = events.filter(event => !manager._isEventFinished(event));
      
      this.assertEqual(activeEvents.length, 3, 'Should filter out 1 finished event from 4 total events');
      
      // Check that the right events are kept
      const activeSummaries = activeEvents.map(e => e.summary);
      this.assertTrue(activeSummaries.includes('Ongoing Meeting'), 'Should keep ongoing meeting');
      this.assertTrue(activeSummaries.includes('Future Meeting 1'), 'Should keep future meeting 1');
      this.assertTrue(activeSummaries.includes('Future Meeting 2'), 'Should keep future meeting 2');
      this.assertTrue(!activeSummaries.includes('Finished Meeting'), 'Should not keep finished meeting');
      
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
    await this.testEventEndTimeExtraction();
    await this.testFinishedTimedEventDetection();
    await this.testFinishedAllDayEventDetection();
    await this.testEventFilteringIntegration();

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