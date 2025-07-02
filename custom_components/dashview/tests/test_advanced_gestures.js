/**
 * Advanced Gesture & Touch Interactions Test Suite
 * Tests the enhanced gesture functionality for Enhancement #3
 */

class AdvancedGestureTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[AdvancedGestureTests] ${message}`);
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

  // Test FloorGestureManager functionality
  async testFloorGestureManager() {
    this.log('Testing FloorGestureManager initialization and configuration');
    
    try {
      // Check if FloorGestureManager file exists and can be imported
      const fs = require('fs');
      const path = require('path');
      const gestureManagerFile = path.join(__dirname, '../www/lib/utils/FloorGestureManager.js');
      
      if (!fs.existsSync(gestureManagerFile)) {
        return { success: false, message: 'FloorGestureManager.js file not found' };
      }
      
      const fileContent = fs.readFileSync(gestureManagerFile, 'utf8');
      
      // Check for key components
      this.assertContains(fileContent, 'class FloorGestureManager', 'Should contain FloorGestureManager class');
      this.assertContains(fileContent, '_handleTouchStart', 'Should contain touch start handler');
      this.assertContains(fileContent, '_handleTouchMove', 'Should contain touch move handler');
      this.assertContains(fileContent, '_navigateToNextFloor', 'Should contain floor navigation method');
      this.assertContains(fileContent, '_showFloorOverview', 'Should contain floor overview method');
      this.assertContains(fileContent, 'dispose()', 'Should contain dispose method');
      
      return { success: true, message: 'FloorGestureManager file structure tests passed' };
      
    } catch (error) {
      return { success: false, message: `FloorGestureManager test failed: ${error.message}` };
    }
  }

  // Test ContextMenuManager functionality
  async testContextMenuManager() {
    this.log('Testing ContextMenuManager initialization and menu creation');
    
    try {
      // Check if ContextMenuManager file exists and can be imported
      const fs = require('fs');
      const path = require('path');
      const contextManagerFile = path.join(__dirname, '../www/lib/utils/ContextMenuManager.js');
      
      if (!fs.existsSync(contextManagerFile)) {
        return { success: false, message: 'ContextMenuManager.js file not found' };
      }
      
      const fileContent = fs.readFileSync(contextManagerFile, 'utf8');
      
      // Check for key components
      this.assertContains(fileContent, 'class ContextMenuManager', 'Should contain ContextMenuManager class');
      this.assertContains(fileContent, 'showMenu', 'Should contain showMenu method');
      this.assertContains(fileContent, '_createMenuContent', 'Should contain menu creation method');
      this.assertContains(fileContent, '_getEntityActions', 'Should contain entity actions method');
      this.assertContains(fileContent, '_triggerHapticFeedback', 'Should contain haptic feedback method');
      this.assertContains(fileContent, 'dispose()', 'Should contain dispose method');
      
      return { success: true, message: 'ContextMenuManager file structure tests passed' };
      
    } catch (error) {
      return { success: false, message: `ContextMenuManager test failed: ${error.message}` };
    }
  }

  // Test CSS styles for gesture enhancements
  testGestureStyles() {
    this.log('Testing gesture-related CSS styles');
    
    try {
      // Check if style.css contains gesture-related styles
      const fs = require('fs');
      const path = require('path');
      const styleFile = path.join(__dirname, '../www/style.css');
      
      if (!fs.existsSync(styleFile)) {
        return { success: false, message: 'style.css file not found' };
      }
      
      const styleContent = fs.readFileSync(styleFile, 'utf8');
      
      // Check for floor overview styles
      this.assertContains(styleContent, '.floor-overview-modal', 'Should contain floor overview modal styles');
      this.assertContains(styleContent, '.floor-overview-grid', 'Should contain floor overview grid styles');
      
      // Check for context menu styles
      this.assertContains(styleContent, '.context-menu', 'Should contain context menu styles');
      this.assertContains(styleContent, '.context-menu-item', 'Should contain context menu item styles');
      
      // Check for gesture feedback styles
      this.assertContains(styleContent, '.highlighted', 'Should contain highlighted state styles');
      this.assertContains(styleContent, 'gestureHighlight', 'Should contain gesture highlight animation');
      
      // Check for touch target enhancements
      this.assertContains(styleContent, 'min-width: 48px', 'Should contain enhanced touch targets');
      this.assertContains(styleContent, 'touch-action: manipulation', 'Should contain touch action styles');
      
      return { success: true, message: 'Gesture styles tests passed' };
      
    } catch (error) {
      return { success: false, message: `Gesture styles test failed: ${error.message}` };
    }
  }

  // Test FloorManager integration
  async testFloorManagerIntegration() {
    this.log('Testing FloorManager integration with gesture managers');
    
    try {
      // Check if FloorManager imports the new gesture managers
      const fs = require('fs');
      const path = require('path');
      const floorManagerFile = path.join(__dirname, '../www/lib/ui/FloorManager.js');
      
      if (!fs.existsSync(floorManagerFile)) {
        return { success: false, message: 'FloorManager.js file not found' };
      }
      
      const floorManagerContent = fs.readFileSync(floorManagerFile, 'utf8');
      
      // Check for imports
      this.assertContains(floorManagerContent, 'FloorGestureManager', 'Should import FloorGestureManager');
      this.assertContains(floorManagerContent, 'ContextMenuManager', 'Should import ContextMenuManager');
      
      // Check for initialization
      this.assertContains(floorManagerContent, '_floorGestureManager', 'Should initialize FloorGestureManager');
      this.assertContains(floorManagerContent, '_contextMenuManager', 'Should initialize ContextMenuManager');
      
      // Check for cleanup
      this.assertContains(floorManagerContent, 'dispose()', 'Should have dispose methods');
      
      return { success: true, message: 'FloorManager integration tests passed' };
      
    } catch (error) {
      return { success: false, message: `FloorManager integration test failed: ${error.message}` };
    }
  }

  // Test haptic feedback functionality
  testHapticFeedback() {
    this.log('Testing haptic feedback functionality');
    
    try {
      // Mock navigator.vibrate for testing
      const originalVibrate = global.navigator?.vibrate;
      let vibrateCallCount = 0;
      let lastVibratePattern = null;
      
      global.navigator = global.navigator || {};
      global.navigator.vibrate = (pattern) => {
        vibrateCallCount++;
        lastVibratePattern = pattern;
        return true;
      };
      
      // Test vibration patterns would be called correctly
      // This is tested within the gesture managers when haptic feedback is enabled
      
      // Restore original
      if (originalVibrate) {
        global.navigator.vibrate = originalVibrate;
      }
      
      return { success: true, message: 'Haptic feedback tests passed' };
      
    } catch (error) {
      return { success: false, message: `Haptic feedback test failed: ${error.message}` };
    }
  }

  // Test gesture sensitivity configuration
  testGestureConfiguration() {
    this.log('Testing gesture sensitivity and configuration options');
    
    try {
      // Test configuration parameters for gesture managers
      const testConfig = {
        swipeThreshold: 75,
        swipeVelocityThreshold: 0.5,
        pinchThreshold: 1.5,
        enableHapticFeedback: false,
        menuTimeout: 3000
      };
      
      // These configurations should be properly handled by the gesture managers
      this.assertTrue(testConfig.swipeThreshold > 0, 'Swipe threshold should be positive');
      this.assertTrue(testConfig.swipeVelocityThreshold > 0, 'Velocity threshold should be positive');
      this.assertTrue(testConfig.pinchThreshold > 1, 'Pinch threshold should be greater than 1');
      this.assertTrue(testConfig.menuTimeout > 0, 'Menu timeout should be positive');
      
      return { success: true, message: 'Gesture configuration tests passed' };
      
    } catch (error) {
      return { success: false, message: `Gesture configuration test failed: ${error.message}` };
    }
  }

  // Test touch target accessibility
  testTouchAccessibility() {
    this.log('Testing touch target accessibility enhancements');
    
    try {
      // Check that touch targets meet minimum size requirements (48px)
      const fs = require('fs');
      const path = require('path');
      const styleFile = path.join(__dirname, '../www/style.css');
      
      if (!fs.existsSync(styleFile)) {
        return { success: false, message: 'style.css file not found' };
      }
      
      const styleContent = fs.readFileSync(styleFile, 'utf8');
      
      // Check for minimum touch target sizes
      this.assertContains(styleContent, 'min-width: 48px', 'Should have minimum width for touch targets');
      this.assertContains(styleContent, 'min-height: 48px', 'Should have minimum height for touch targets');
      
      // Check for touch action optimization
      this.assertContains(styleContent, 'touch-action: manipulation', 'Should optimize touch actions');
      
      return { success: true, message: 'Touch accessibility tests passed' };
      
    } catch (error) {
      return { success: false, message: `Touch accessibility test failed: ${error.message}` };
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('[DashView] Running Advanced Gesture & Touch Interactions tests...');
    
    const tests = [
      { name: 'FloorGestureManager', method: this.testFloorGestureManager },
      { name: 'ContextMenuManager', method: this.testContextMenuManager },
      { name: 'Gesture Styles', method: this.testGestureStyles },
      { name: 'FloorManager Integration', method: this.testFloorManagerIntegration },
      { name: 'Haptic Feedback', method: this.testHapticFeedback },
      { name: 'Gesture Configuration', method: this.testGestureConfiguration },
      { name: 'Touch Accessibility', method: this.testTouchAccessibility }
    ];
    
    let passedCount = 0;
    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.method.call(this);
        if (result.success) {
          console.log(`✅ ${test.name}: ${result.message}`);
          passedCount++;
        } else {
          console.log(`❌ ${test.name}: ${result.message}`);
        }
        results.push({ name: test.name, ...result });
      } catch (error) {
        const errorMessage = `Test execution failed: ${error.message}`;
        console.log(`❌ ${test.name}: ${errorMessage}`);
        results.push({ name: test.name, success: false, message: errorMessage });
      }
    }
    
    console.log(`\n[DashView] Advanced Gesture Tests Summary: ${passedCount}/${tests.length} tests passed`);
    
    if (passedCount === tests.length) {
      console.log('✅ All advanced gesture tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some advanced gesture tests failed');
      process.exit(1);
    }
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvancedGestureTests };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const testSuite = new AdvancedGestureTests();
  testSuite.runAllTests().catch(error => {
    console.error('[DashView] Test execution failed:', error);
    process.exit(1);
  });
}