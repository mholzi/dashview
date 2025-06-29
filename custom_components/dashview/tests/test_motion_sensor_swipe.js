/**
 * Motion Sensor Swipe Functionality Test Suite
 * Tests the swipeable motion sensor cards functionality
 */

class MotionSensorSwipeTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[MotionSensorSwipeTests] ${message}`);
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

  // Mock FloorManager for testing
  createMockFloorManager() {
    return {
      _motionCardSwipeStates: new Map(),
      _hass: {
        states: {
          'binary_sensor.motion_wohnzimmer': {
            state: 'on',
            last_changed: '2025-06-29T10:30:00Z',
            attributes: {
              friendly_name: 'Motion Sensor Wohnzimmer'
            }
          },
          'binary_sensor.motion_schlafzimmer': {
            state: 'off',
            last_changed: '2025-06-29T08:15:00Z',
            attributes: {
              friendly_name: 'Motion Sensor Schlafzimmer'
            }
          }
        }
      },
      _calculateTimeDifference: function(lastChanged) {
        const now = new Date();
        const diffSeconds = Math.floor((now - new Date(lastChanged)) / 1000);
        if (diffSeconds < 60) return 'Jetzt';
        if (diffSeconds < 3600) return `vor ${Math.floor(diffSeconds / 60)}m`;
        if (diffSeconds < 86400) return `vor ${Math.floor(diffSeconds / 3600)}h`;
        return `vor ${Math.floor(diffSeconds / 86400)} Tagen`;
      },
      _getMotionCardLabel: function(entityId, type) {
        const entityState = this._hass.states[entityId];
        if (!entityState || type !== 'motion') {
          return 'N/A';
        }

        const showTime = this._motionCardSwipeStates.get(entityId) || false;
        if (showTime) {
          return this._calculateTimeDifference(entityState.last_changed);
        } else {
          return entityState.state === 'on' ? 'Erkannt' : 'Klar';
        }
      }
    };
  }

  // Test initial state display
  testInitialStateDisplay() {
    const testName = 'Initial State Display';
    this.log(`Running test: ${testName}`);

    try {
      const floorManager = this.createMockFloorManager();
      
      // Test motion detected state
      const detectedLabel = floorManager._getMotionCardLabel('binary_sensor.motion_wohnzimmer', 'motion');
      this.assertEqual(detectedLabel, 'Erkannt', 'Should show "Erkannt" for motion detected');

      // Test motion clear state
      const clearLabel = floorManager._getMotionCardLabel('binary_sensor.motion_schlafzimmer', 'motion');
      this.assertEqual(clearLabel, 'Klar', 'Should show "Klar" for motion clear');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test swipe state toggle
  testSwipeStateToggle() {
    const testName = 'Swipe State Toggle';
    this.log(`Running test: ${testName}`);

    try {
      const floorManager = this.createMockFloorManager();
      const entityId = 'binary_sensor.motion_wohnzimmer';
      
      // Initial state
      const initialLabel = floorManager._getMotionCardLabel(entityId, 'motion');
      this.assertEqual(initialLabel, 'Erkannt', 'Initial state should show motion state');

      // Toggle to time display
      floorManager._motionCardSwipeStates.set(entityId, true);
      const timeLabel = floorManager._getMotionCardLabel(entityId, 'motion');
      this.assertTrue(
        timeLabel.includes('vor') || timeLabel === 'Jetzt',
        'Should show time format after swipe'
      );

      // Toggle back to state display
      floorManager._motionCardSwipeStates.set(entityId, false);
      const backToStateLabel = floorManager._getMotionCardLabel(entityId, 'motion');
      this.assertEqual(backToStateLabel, 'Erkannt', 'Should show state again after second swipe');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test non-motion sensor handling
  testNonMotionSensorHandling() {
    const testName = 'Non-Motion Sensor Handling';
    this.log(`Running test: ${testName}`);

    try {
      const floorManager = this.createMockFloorManager();
      
      // Test with non-motion sensor type
      const temperatureLabel = floorManager._getMotionCardLabel('sensor.temperature', 'temperatur');
      this.assertEqual(temperatureLabel, 'N/A', 'Non-motion sensors should return N/A');

      // Test with null entity
      const nullLabel = floorManager._getMotionCardLabel(null, 'motion');
      this.assertEqual(nullLabel, 'N/A', 'Null entity should return N/A');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test time calculation format
  testTimeCalculationFormat() {
    const testName = 'Time Calculation Format';
    this.log(`Running test: ${testName}`);

    try {
      const floorManager = this.createMockFloorManager();
      
      // Test recent time (should be "Jetzt")
      const recentTime = new Date(Date.now() - 30 * 1000);
      const recentResult = floorManager._calculateTimeDifference(recentTime.toISOString());
      this.assertEqual(recentResult, 'Jetzt', 'Should return "Jetzt" for recent changes');

      // Test minutes format
      const minutesTime = new Date(Date.now() - 5 * 60 * 1000);
      const minutesResult = floorManager._calculateTimeDifference(minutesTime.toISOString());
      this.assertEqual(minutesResult, 'vor 5m', 'Should return "vor 5m" for 5 minutes ago');

      // Test hours format  
      const hoursTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const hoursResult = floorManager._calculateTimeDifference(hoursTime.toISOString());
      this.assertEqual(hoursResult, 'vor 3h', 'Should return "vor 3h" for 3 hours ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test swipe state persistence per entity
  testSwipeStatePersistence() {
    const testName = 'Swipe State Persistence';
    this.log(`Running test: ${testName}`);

    try {
      const floorManager = this.createMockFloorManager();
      const entity1 = 'binary_sensor.motion_wohnzimmer';
      const entity2 = 'binary_sensor.motion_schlafzimmer';
      
      // Set different swipe states for different entities
      floorManager._motionCardSwipeStates.set(entity1, true);
      floorManager._motionCardSwipeStates.set(entity2, false);

      // Verify independent state management
      const entity1Label = floorManager._getMotionCardLabel(entity1, 'motion');
      const entity2Label = floorManager._getMotionCardLabel(entity2, 'motion');

      this.assertTrue(
        entity1Label.includes('vor') || entity1Label === 'Jetzt',
        'Entity 1 should show time format'
      );
      this.assertEqual(entity2Label, 'Klar', 'Entity 2 should show state format');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Motion Sensor Swipe Tests...');
    
    this.testInitialStateDisplay();
    this.testSwipeStateToggle();
    this.testNonMotionSensorHandling();
    this.testTimeCalculationFormat();
    this.testSwipeStatePersistence();

    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\n[MotionSensorSwipeTests] Test Results: ${passedTests}/${totalTests} passed`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.name}`);
      if (!result.passed) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const success = passedTests === totalTests;
    if (success) {
      console.log('\n[MotionSensorSwipeTests] All tests passed! ✅');
    } else {
      console.log('\n[MotionSensorSwipeTests] Some tests failed! ❌');
    }

    return success;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MotionSensorSwipeTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new MotionSensorSwipeTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}