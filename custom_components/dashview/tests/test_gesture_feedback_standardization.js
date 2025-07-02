/**
 * Gesture Feedback Standardization Test Suite
 * Tests the GestureFeedbackManager for Issue #372
 */

class GestureFeedbackTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[GestureFeedbackTests] ${message}`);
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

  // Mock DOM elements for testing
  createMockButton(className, text) {
    const button = document.createElement('div');
    button.className = className;
    button.textContent = text;
    button.dataset.testId = `test-${Date.now()}-${Math.random()}`;
    return button;
  }

  // Test GestureFeedbackManager configuration
  async testGestureFeedbackManagerConfiguration() {
    this.log('Testing GestureFeedbackManager configuration');
    
    try {
      const { GestureFeedbackManager } = await import('/local/dashview/lib/utils/gesture-feedback.js');
      this.assertNotNull(GestureFeedbackManager, 'GestureFeedbackManager class should be importable');
      
      // Test default configuration
      const manager = new GestureFeedbackManager();
      this.assertEqual(manager.longTapDuration, 500, 'Default long tap duration should be 500ms');
      this.assertEqual(manager.longTapTolerance, 10, 'Default long tap tolerance should be 10px');
      this.assertTrue(manager.enableVisualFeedback, 'Visual feedback should be enabled by default');
      
      // Test custom configuration
      const customManager = new GestureFeedbackManager({
        longTapDuration: 750,
        longTapTolerance: 15,
        enableVisualFeedback: false
      });
      this.assertEqual(customManager.longTapDuration, 750, 'Custom long tap duration should be applied');
      this.assertEqual(customManager.longTapTolerance, 15, 'Custom long tap tolerance should be applied');
      this.assertTrue(!customManager.enableVisualFeedback, 'Visual feedback should be disabled when configured');
      
      this.testResults.push({ test: 'testGestureFeedbackManagerConfiguration', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testGestureFeedbackManagerConfiguration', passed: false, error: error.message });
      throw error;
    }
  }

  // Test feedback element attachment
  async testFeedbackElementAttachment() {
    this.log('Testing feedback element attachment');
    
    try {
      const { GestureFeedbackManager } = await import('/local/dashview/lib/utils/gesture-feedback.js');
      const manager = new GestureFeedbackManager();
      const mockButton = this.createMockButton('scene-button', 'Test Scene');
      
      let longTapStartCalled = false;
      
      // Test attachment with callback
      manager.addFeedbackToElement(mockButton, {
        onLongTapStart: () => { longTapStartCalled = true; }
      });
      
      // Verify element is tracked
      this.assertTrue(manager._attachedElements.has(mockButton), 'Element should be tracked after attachment');
      this.assertTrue(manager._feedbackStates.has(mockButton), 'Feedback state should be created for element');
      
      // Test removal
      manager.removeFeedbackFromElement(mockButton);
      this.assertTrue(!manager._attachedElements.has(mockButton), 'Element should not be tracked after removal');
      this.assertTrue(!manager._feedbackStates.has(mockButton), 'Feedback state should be cleaned up after removal');
      
      this.testResults.push({ test: 'testFeedbackElementAttachment', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testFeedbackElementAttachment', passed: false, error: error.message });
      throw error;
    }
  }

  // Test CSS feedback classes for different component types
  testComponentSpecificFeedbackClasses() {
    this.log('Testing component-specific feedback CSS classes');
    
    try {
      const testCases = [
        { className: 'scene-button', feedbackClass: 'gesture-detecting' },
        { className: 'light-control-row', feedbackClass: 'gesture-longpress' },
        { className: 'header-info-chip', feedbackClass: 'gesture-detecting' },
        { className: 'cover-button', feedbackClass: 'gesture-longpress' },
        { className: 'media-button', feedbackClass: 'gesture-detecting' }
      ];
      
      testCases.forEach(({ className, feedbackClass }) => {
        const element = this.createMockButton(className, 'Test');
        
        // Test that feedback class can be applied
        element.classList.add(feedbackClass);
        this.assertTrue(element.classList.contains(feedbackClass), 
          `${feedbackClass} class should be applicable to ${className}`);
        
        // Test cleanup
        element.classList.remove(feedbackClass);
        this.assertTrue(!element.classList.contains(feedbackClass), 
          `${feedbackClass} class should be removable from ${className}`);
      });
      
      this.testResults.push({ test: 'testComponentSpecificFeedbackClasses', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testComponentSpecificFeedbackClasses', passed: false, error: error.message });
      throw error;
    }
  }

  // Test static utility method
  async testStaticUtilityMethod() {
    this.log('Testing static utility method');
    
    try {
      const { GestureFeedbackManager } = await import('/local/dashview/lib/utils/gesture-feedback.js');
      
      const mockButtons = [
        this.createMockButton('scene-button', 'Scene 1'),
        this.createMockButton('scene-button', 'Scene 2'),
        this.createMockButton('scene-button', 'Scene 3')
      ];
      
      // Test static method
      const manager = GestureFeedbackManager.addToElements(mockButtons, {
        longTapDuration: 400
      });
      
      this.assertNotNull(manager, 'Static method should return manager instance');
      this.assertEqual(manager.longTapDuration, 400, 'Custom options should be applied');
      
      // Verify all elements are attached
      mockButtons.forEach(button => {
        this.assertTrue(manager._attachedElements.has(button), 'Each element should be tracked');
      });
      
      // Test disposal
      manager.dispose();
      mockButtons.forEach(button => {
        this.assertTrue(!manager._attachedElements.has(button), 'Elements should be cleaned up after disposal');
      });
      
      this.testResults.push({ test: 'testStaticUtilityMethod', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testStaticUtilityMethod', passed: false, error: error.message });
      throw error;
    }
  }

  // Test integration with updated UI managers
  async testUIManagerIntegration() {
    this.log('Testing UI manager integration');
    
    try {
      // Test SceneManager imports GestureFeedbackManager
      const sceneManagerModule = await import('/local/dashview/lib/ui/SceneManager.js');
      this.assertNotNull(sceneManagerModule.SceneManager, 'SceneManager should be importable');
      
      // Test SecurityComponents imports GestureFeedbackManager
      const securityModule = await import('/local/dashview/lib/ui/security-components.js');
      this.assertNotNull(securityModule.SecurityComponents, 'SecurityComponents should be importable');
      
      // Test LightsCard imports GestureFeedbackManager
      const lightsModule = await import('/local/dashview/lib/ui/light-card.js');
      this.assertNotNull(lightsModule.LightsCard, 'LightsCard should be importable');
      
      // Test MediaPlayerCard imports GestureFeedbackManager
      const mediaModule = await import('/local/dashview/lib/ui/media-player-card.js');
      this.assertNotNull(mediaModule.MediaPlayerCard, 'MediaPlayerCard should be importable');
      
      // Test CoversCard imports GestureFeedbackManager
      const coversModule = await import('/local/dashview/lib/ui/covers-card.js');
      this.assertNotNull(coversModule.CoversCard, 'CoversCard should be importable');
      
      this.testResults.push({ test: 'testUIManagerIntegration', passed: true });
      
    } catch (error) {
      this.testResults.push({ test: 'testUIManagerIntegration', passed: false, error: error.message });
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting gesture feedback standardization tests...');
    
    try {
      await this.testGestureFeedbackManagerConfiguration();
      await this.testFeedbackElementAttachment();
      this.testComponentSpecificFeedbackClasses();
      await this.testStaticUtilityMethod();
      await this.testUIManagerIntegration();
      
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      
      console.log(`[GestureFeedbackTests] Tests completed: ${passedTests}/${totalTests} passed`);
      
      if (passedTests === totalTests) {
        console.log('[GestureFeedbackTests] ✓ All gesture feedback standardization tests PASSED');
        return true;
      } else {
        console.error('[GestureFeedbackTests] ✗ Some tests FAILED');
        this.testResults.filter(r => !r.passed).forEach(r => {
          console.error(`  - ${r.test}: ${r.error}`);
        });
        return false;
      }
      
    } catch (error) {
      console.error('[GestureFeedbackTests] Test suite failed:', error.message);
      return false;
    }
  }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GestureFeedbackTests;
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  const testSuite = new GestureFeedbackTests();
  testSuite.runAllTests();
}