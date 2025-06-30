/**
 * Time Utils Test Suite
 * Tests the generalized time difference calculation utilities
 */

class TimeUtilsTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[TimeUtilsTests] ${message}`);
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

  // Test basic time difference calculation function
  async testBasicTimeDifference() {
    const testName = 'Basic Time Difference Function';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifference } = await import('/local/dashview/lib/utils/time-utils.js');
      
      // Test recent time (< 60 seconds)
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const result1 = calculateTimeDifference(thirtySecondsAgo, 'long');
      this.assertEqual(result1, 'Jetzt', 'Should return "Jetzt" for 30 seconds ago');

      // Test minutes (long format)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result2 = calculateTimeDifference(twoMinutesAgo, 'long');
      this.assertEqual(result2, '2 Minuten', 'Should return "2 Minuten" for 2 minutes ago in long format');

      // Test minutes (short format)
      const result3 = calculateTimeDifference(twoMinutesAgo, 'short');
      this.assertEqual(result3, 'vor 2m', 'Should return "vor 2m" for 2 minutes ago in short format');

      // Test hours (long format)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result4 = calculateTimeDifference(twoHoursAgo, 'long');
      this.assertEqual(result4, '2 Stunden', 'Should return "2 Stunden" for 2 hours ago in long format');

      // Test hours (short format)
      const result5 = calculateTimeDifference(twoHoursAgo, 'short');
      this.assertEqual(result5, 'vor 2h', 'Should return "vor 2h" for 2 hours ago in short format');

      // Test days
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result6 = calculateTimeDifference(twoDaysAgo, 'long');
      this.assertEqual(result6, '2 Tagen', 'Should return "2 Tagen" for 2 days ago in long format');

      const result7 = calculateTimeDifference(twoDaysAgo, 'short');
      this.assertEqual(result7, 'vor 2 Tagen', 'Should return "vor 2 Tagen" for 2 days ago in short format');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test short format helper function
  async testShortFormatHelper() {
    const testName = 'Short Format Helper Function';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifferenceShort } = await import('/local/dashview/lib/utils/time-utils.js');
      
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result = calculateTimeDifferenceShort(twoMinutesAgo);
      this.assertEqual(result, 'vor 2m', 'Short helper should return "vor 2m" for 2 minutes ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test long format helper function
  async testLongFormatHelper() {
    const testName = 'Long Format Helper Function';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifferenceLong } = await import('/local/dashview/lib/utils/time-utils.js');
      
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result = calculateTimeDifferenceLong(twoMinutesAgo);
      this.assertEqual(result, '2 Minuten', 'Long helper should return "2 Minuten" for 2 minutes ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test English format function
  async testEnglishFormat() {
    const testName = 'English Format Function';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifferenceEnglish } = await import('/local/dashview/lib/utils/time-utils.js');
      
      // Test recent time
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const result1 = calculateTimeDifferenceEnglish(thirtySecondsAgo);
      this.assertEqual(result1, 'now', 'Should return "now" for 30 seconds ago');

      // Test minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const result2 = calculateTimeDifferenceEnglish(twoMinutesAgo);
      this.assertEqual(result2, '2m ago', 'Should return "2m ago" for 2 minutes ago');

      // Test hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result3 = calculateTimeDifferenceEnglish(twoHoursAgo);
      this.assertEqual(result3, '2h ago', 'Should return "2h ago" for 2 hours ago');

      // Test days
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result4 = calculateTimeDifferenceEnglish(twoDaysAgo);
      this.assertEqual(result4, '2d ago', 'Should return "2d ago" for 2 days ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test string input handling
  async testStringInput() {
    const testName = 'String Input Handling';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifference } = await import('/local/dashview/lib/utils/time-utils.js');
      
      // Test with ISO string input
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const isoString = twoMinutesAgo.toISOString();
      const result = calculateTimeDifference(isoString, 'long');
      this.assertEqual(result, '2 Minuten', 'Should handle ISO string input correctly');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Test edge cases
  async testEdgeCases() {
    const testName = 'Edge Cases';
    this.log(`Running test: ${testName}`);

    try {
      const { calculateTimeDifference } = await import('/local/dashview/lib/utils/time-utils.js');
      
      // Test exactly 1 minute ago
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const result1 = calculateTimeDifference(oneMinuteAgo, 'long');
      this.assertEqual(result1, '1 Minuten', 'Should return "1 Minuten" for exactly 1 minute ago');

      // Test exactly 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result2 = calculateTimeDifference(oneHourAgo, 'long');
      this.assertEqual(result2, '1 Stunden', 'Should return "1 Stunden" for exactly 1 hour ago');

      // Test exactly 1 day ago
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result3 = calculateTimeDifference(oneDayAgo, 'long');
      this.assertEqual(result3, '1 Tagen', 'Should return "1 Tagen" for exactly 1 day ago');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting time utils tests...');
    
    try {
      await this.testBasicTimeDifference();
      await this.testShortFormatHelper();
      await this.testLongFormatHelper();
      await this.testEnglishFormat();
      await this.testStringInput();
      await this.testEdgeCases();
      
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      
      console.log(`[TimeUtilsTests] Tests completed: ${passedTests}/${totalTests} passed`);
      
      if (passedTests === totalTests) {
        console.log('[TimeUtilsTests] ✓ All time utils tests PASSED');
        return true;
      } else {
        console.error('[TimeUtilsTests] ✗ Some tests FAILED');
        this.testResults.filter(r => !r.passed).forEach(r => {
          console.error(`  - ${r.name}: ${r.error}`);
        });
        return false;
      }
      
    } catch (error) {
      console.error('[TimeUtilsTests] Test suite failed:', error.message);
      return false;
    }
  }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimeUtilsTests;
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  const testSuite = new TimeUtilsTests();
  testSuite.runAllTests();
}