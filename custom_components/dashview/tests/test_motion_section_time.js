/**
 * Motion Section Time Display Test Suite
 * Tests the motion section time calculation functionality
 */

class MotionSectionTimeTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[MotionSectionTimeTests] ${message}`);
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

  // Mock DashviewPanel for testing
  createMockPanel() {
    return {
      _calculateTimeDifference: function(lastChanged) {
        const now = new Date();
        const diffSeconds = Math.floor((now - lastChanged) / 1000);
        
        if (diffSeconds < 60) {
          return 'Jetzt';
        } else if (diffSeconds < 3600) {
          const minutes = Math.floor(diffSeconds / 60);
          return `${minutes} Minuten`;
        } else if (diffSeconds < 86400) {
          const hours = Math.floor(diffSeconds / 3600);
          return `${hours} Stunden`;
        } else {
          const days = Math.floor(diffSeconds / 86400);
          return `${days} Tagen`;
        }
      }
    };
  }

  // Test time calculation for recent changes (< 60 seconds)
  testRecentTimeCalculation() {
    const testName = 'Recent Time Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const panel = this.createMockPanel();
      
      // Test for 30 seconds ago
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const result = panel._calculateTimeDifference(thirtySecondsAgo);
      this.assertEqual(result, 'Jetzt', 'Should return "Jetzt" for 30 seconds ago');

      // Test for 45 seconds ago
      const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000);
      const result2 = panel._calculateTimeDifference(fortyFiveSecondsAgo);
      this.assertEqual(result2, 'Jetzt', 'Should return "Jetzt" for 45 seconds ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test time calculation for minutes
  testMinutesTimeCalculation() {
    const testName = 'Minutes Time Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const panel = this.createMockPanel();
      
      // Test for 2 minutes ago
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result = panel._calculateTimeDifference(twoMinutesAgo);
      this.assertEqual(result, '2 Minuten', 'Should return "2 Minuten" for 2 minutes ago');

      // Test for 30 minutes ago
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result2 = panel._calculateTimeDifference(thirtyMinutesAgo);
      this.assertEqual(result2, '30 Minuten', 'Should return "30 Minuten" for 30 minutes ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test time calculation for hours
  testHoursTimeCalculation() {
    const testName = 'Hours Time Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const panel = this.createMockPanel();
      
      // Test for 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = panel._calculateTimeDifference(twoHoursAgo);
      this.assertEqual(result, '2 Stunden', 'Should return "2 Stunden" for 2 hours ago');

      // Test for 12 hours ago
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const result2 = panel._calculateTimeDifference(twelveHoursAgo);
      this.assertEqual(result2, '12 Stunden', 'Should return "12 Stunden" for 12 hours ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test time calculation for days
  testDaysTimeCalculation() {
    const testName = 'Days Time Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const panel = this.createMockPanel();
      
      // Test for 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = panel._calculateTimeDifference(twoDaysAgo);
      this.assertEqual(result, '2 Tagen', 'Should return "2 Tagen" for 2 days ago');

      // Test for 5 days ago
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result2 = panel._calculateTimeDifference(fiveDaysAgo);
      this.assertEqual(result2, '5 Tagen', 'Should return "5 Tagen" for 5 days ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test boundary conditions
  testBoundaryConditions() {
    const testName = 'Boundary Conditions';
    this.log(`Running test: ${testName}`);

    try {
      const panel = this.createMockPanel();
      
      // Test exactly 60 seconds ago (should return "1 Minuten")
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const result = panel._calculateTimeDifference(sixtySecondsAgo);
      this.assertEqual(result, '1 Minuten', 'Should return "1 Minuten" for exactly 60 seconds ago');

      // Test exactly 1 hour ago (should return "1 Stunden")
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result2 = panel._calculateTimeDifference(oneHourAgo);
      this.assertEqual(result2, '1 Stunden', 'Should return "1 Stunden" for exactly 1 hour ago');

      // Test exactly 1 day ago (should return "1 Tagen")
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result3 = panel._calculateTimeDifference(oneDayAgo);
      this.assertEqual(result3, '1 Tagen', 'Should return "1 Tagen" for exactly 1 day ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Motion Section Time Display Tests...');
    
    this.testRecentTimeCalculation();
    this.testMinutesTimeCalculation();
    this.testHoursTimeCalculation();
    this.testDaysTimeCalculation();
    this.testBoundaryConditions();

    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\n[MotionSectionTimeTests] Test Results: ${passedTests}/${totalTests} passed`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.name}`);
      if (!result.passed) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const success = passedTests === totalTests;
    if (success) {
      console.log('\n[MotionSectionTimeTests] All tests passed! ✅');
    } else {
      console.log('\n[MotionSectionTimeTests] Some tests failed! ❌');
    }

    return success;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MotionSectionTimeTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new MotionSectionTimeTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}