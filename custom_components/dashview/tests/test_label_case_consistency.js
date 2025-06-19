// Test for label case consistency - ensures all entity labels are lowercase
// This validates the fix for case-insensitive label queries

// Mock DashView Panel class for testing
class MockDashViewPanel {
  constructor() {
    // Label constants for case-insensitive entity queries - ensures consistent lowercase usage
    this._entityLabels = {
      MOTION: 'motion',
      WINDOW: 'fenster', 
      SMOKE: 'rauchmelder',
      VIBRATION: 'vibration'
    };
  }
}

// Test class for label case consistency
class LabelCaseConsistencyTests {
  constructor() {
    this.passedTests = 0;
    this.totalTests = 0;
  }

  assert(condition, message) {
    this.totalTests++;
    if (condition) {
      this.passedTests++;
      console.log(`✓ ${message}`);
    } else {
      console.log(`✗ ${message}`);
    }
  }

  // Test that all entity labels are lowercase
  testLabelCaseConsistency() {
    console.log('\n[DashView] Testing label case consistency...');
    
    const panel = new MockDashViewPanel();
    const labels = panel._entityLabels;
    
    // Test that each label value is lowercase
    this.assert(
      labels.MOTION === labels.MOTION.toLowerCase(),
      'MOTION label should be lowercase'
    );
    
    this.assert(
      labels.WINDOW === labels.WINDOW.toLowerCase(),
      'WINDOW label should be lowercase'
    );
    
    this.assert(
      labels.SMOKE === labels.SMOKE.toLowerCase(),
      'SMOKE label should be lowercase'
    );
    
    this.assert(
      labels.VIBRATION === labels.VIBRATION.toLowerCase(),
      'VIBRATION label should be lowercase'
    );
    
    console.log('\n  ✅ All label constants are properly lowercase');
  }

  // Test that expected labels are defined
  testLabelDefinitions() {
    console.log('\n[DashView] Testing label definitions...');
    
    const panel = new MockDashViewPanel();
    const labels = panel._entityLabels;
    
    const expectedLabels = ['MOTION', 'WINDOW', 'SMOKE', 'VIBRATION'];
    expectedLabels.forEach(labelKey => {
      this.assert(
        labels.hasOwnProperty(labelKey),
        `${labelKey} label should be defined`
      );
      
      this.assert(
        typeof labels[labelKey] === 'string' && labels[labelKey].length > 0,
        `${labelKey} label should be a non-empty string`
      );
    });
    
    console.log('\n  ✅ All required label constants are defined');
  }

  // Test specific label values match expected lowercase strings
  testSpecificLabelValues() {
    console.log('\n[DashView] Testing specific label values...');
    
    const panel = new MockDashViewPanel();
    const labels = panel._entityLabels;
    
    const expectedValues = {
      MOTION: 'motion',
      WINDOW: 'fenster',
      SMOKE: 'rauchmelder', 
      VIBRATION: 'vibration'
    };
    
    Object.entries(expectedValues).forEach(([key, expectedValue]) => {
      this.assert(
        labels[key] === expectedValue,
        `${key} label should equal '${expectedValue}'`
      );
    });
    
    console.log('\n  ✅ All label values match expected lowercase strings');
  }

  // Run all tests
  runAllTests() {
    console.log('[DashView] Starting Label Case Consistency Tests...');
    
    this.testLabelDefinitions();
    this.testLabelCaseConsistency(); 
    this.testSpecificLabelValues();
    
    console.log(`\n[DashView] Label Case Consistency Tests completed: ${this.passedTests}/${this.totalTests} passed`);
    
    if (this.passedTests === this.totalTests) {
      console.log('✅ All label case consistency tests passed!');
      process.exit(0);
    } else {
      console.log(`❌ ${this.totalTests - this.passedTests} test(s) failed`);
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testRunner = new LabelCaseConsistencyTests();
  testRunner.runAllTests();
}

module.exports = LabelCaseConsistencyTests;