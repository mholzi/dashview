/**
 * Gesture Detection Test Suite
 * Tests the long-tap gesture detection functionality for Issue #289
 */

class GestureDetectionTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[GestureDetectionTests] ${message}`);
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

  assertNotNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`Assertion failed: ${message}. Value was null or undefined`);
    }
  }

  assertContains(haystack, needle, message) {
    if (!haystack.includes(needle)) {
      throw new Error(`Assertion failed: ${message}. "${needle}" not found in "${haystack}"`);
    }
  }

  // Mock DOM elements for testing
  createMockSensorCard(entityId, type = 'motion') {
    const card = document.createElement('div');
    card.className = 'sensor-small-card';
    card.dataset.entityId = entityId;
    card.dataset.type = type;
    
    // Add required child elements
    const iconCell = document.createElement('div');
    iconCell.className = 'sensor-small-icon-cell';
    const icon = document.createElement('i');
    icon.className = 'mdi mdi-motion-sensor';
    iconCell.appendChild(icon);
    
    const label = document.createElement('div');
    label.className = 'sensor-small-label';
    label.textContent = 'Motion Sensor';
    
    card.appendChild(iconCell);
    card.appendChild(label);
    
    return card;
  }

  // Test gesture detection configuration
  async testGestureDetectorConfiguration() {
    this.log('Testing GestureDetector configuration');
    
    try {
      // Test that GestureDetector can be imported and instantiated
      const { GestureDetector } = await import('/local/dashview/lib/utils/GestureDetector.js');
      this.assertNotNull(GestureDetector, 'GestureDetector class should be importable');
      
      // Test default configuration
      const detector = new GestureDetector();
      this.assertEqual(detector.longTapDuration, 500, 'Default long tap duration should be 500ms');
      this.assertEqual(detector.longTapTolerance, 10, 'Default long tap tolerance should be 10px');
      this.assertTrue(detector.enableVisualFeedback, 'Visual feedback should be enabled by default');
      
      // Test custom configuration
      const customDetector = new GestureDetector({
        longTapDuration: 750,
        longTapTolerance: 15,
        enableVisualFeedback: false
      });
      this.assertEqual(customDetector.longTapDuration, 750, 'Custom long tap duration should be applied');
      this.assertEqual(customDetector.longTapTolerance, 15, 'Custom long tap tolerance should be applied');
      this.assertTrue(!customDetector.enableVisualFeedback, 'Visual feedback should be disabled when configured');
      
      this.testResults.push({ test: 'testGestureDetectorConfiguration', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testGestureDetectorConfiguration', passed: false, error: error.message });
      throw error;
    }
  }

  // Test gesture detection element attachment
  async testElementAttachment() {
    this.log('Testing element attachment functionality');
    
    try {
      const { GestureDetector } = await import('/local/dashview/lib/utils/GestureDetector.js');
      const detector = new GestureDetector();
      const mockCard = this.createMockSensorCard('binary_sensor.motion_sensor');
      
      let tapCalled = false;
      let longTapCalled = false;
      
      // Test attachment with callbacks
      detector.attachToElement(mockCard, {
        onTap: () => { tapCalled = true; },
        onLongTap: () => { longTapCalled = true; }
      });
      
      // Verify element is tracked
      this.assertTrue(detector._attachedElements.has(mockCard), 'Element should be tracked after attachment');
      this.assertTrue(detector._gestureStates.has(mockCard), 'Gesture state should be created for element');
      
      // Test detachment
      detector.detachFromElement(mockCard);
      this.assertTrue(!detector._attachedElements.has(mockCard), 'Element should not be tracked after detachment');
      this.assertTrue(!detector._gestureStates.has(mockCard), 'Gesture state should be cleaned up after detachment');
      
      this.testResults.push({ test: 'testElementAttachment', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testElementAttachment', passed: false, error: error.message });
      throw error;
    }
  }

  // Test visual feedback CSS classes
  testVisualFeedbackClasses() {
    this.log('Testing visual feedback CSS classes');
    
    try {
      const mockCard = this.createMockSensorCard('binary_sensor.motion_sensor');
      
      // Test gesture-detecting class can be applied
      mockCard.classList.add('gesture-detecting');
      this.assertTrue(mockCard.classList.contains('gesture-detecting'), 'gesture-detecting class should be applicable');
      
      // Test gesture-longpress class can be applied
      mockCard.classList.remove('gesture-detecting');
      mockCard.classList.add('gesture-longpress');
      this.assertTrue(mockCard.classList.contains('gesture-longpress'), 'gesture-longpress class should be applicable');
      
      // Test cleanup
      mockCard.classList.remove('gesture-detecting', 'gesture-longpress');
      this.assertTrue(!mockCard.classList.contains('gesture-detecting'), 'gesture-detecting class should be removable');
      this.assertTrue(!mockCard.classList.contains('gesture-longpress'), 'gesture-longpress class should be removable');
      
      this.testResults.push({ test: 'testVisualFeedbackClasses', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testVisualFeedbackClasses', passed: false, error: error.message });
      throw error;
    }
  }

  // Test FloorManager integration
  async testFloorManagerIntegration() {
    this.log('Testing FloorManager integration');
    
    try {
      // Test that FloorManager imports GestureDetector
      const floorManagerModule = await import('/local/dashview/lib/ui/FloorManager.js');
      this.assertNotNull(floorManagerModule.FloorManager, 'FloorManager should be importable');
      
      // Mock dependencies for FloorManager
      const mockPanel = {
        _hass: { states: {} },
        _houseConfig: { floors: {}, rooms: {} },
        shadowRoot: document.createElement('div'),
        _processIconName: (icon) => icon,
        _entityLabels: { MOTION: 'motion', LIGHT: 'light' }
      };
      
      const floorManager = new floorManagerModule.FloorManager(mockPanel);
      
      // Test that gesture detector is initialized
      this.assertNotNull(floorManager._gestureDetector, 'FloorManager should initialize GestureDetector');
      
      // Test dispose method exists and works
      this.assertTrue(typeof floorManager.dispose === 'function', 'FloorManager should have dispose method');
      floorManager.dispose();
      this.assertEqual(floorManager._gestureDetector, null, 'GestureDetector should be cleaned up on dispose');
      
      this.testResults.push({ test: 'testFloorManagerIntegration', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testFloorManagerIntegration', passed: false, error: error.message });
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting gesture detection tests...');
    
    try {
      await this.testGestureDetectorConfiguration();
      await this.testElementAttachment();
      this.testVisualFeedbackClasses();
      await this.testFloorManagerIntegration();
      
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      
      console.log(`[GestureDetectionTests] Tests completed: ${passedTests}/${totalTests} passed`);
      
      if (passedTests === totalTests) {
        console.log('[GestureDetectionTests] ✓ All gesture detection tests PASSED');
        return true;
      } else {
        console.error('[GestureDetectionTests] ✗ Some tests FAILED');
        this.testResults.filter(r => !r.passed).forEach(r => {
          console.error(`  - ${r.test}: ${r.error}`);
        });
        return false;
      }
      
    } catch (error) {
      console.error('[GestureDetectionTests] Test suite failed:', error.message);
      return false;
    }
  }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GestureDetectionTests;
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  const testSuite = new GestureDetectionTests();
  testSuite.runAllTests();
}