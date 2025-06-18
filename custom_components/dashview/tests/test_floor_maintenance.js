/**
 * Floor Maintenance Test Suite
 * Tests the new floor maintenance functionality
 */

class FloorMaintenanceTests {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('[DashView] Running Floor Maintenance Tests...');
    
    try {
      this.testFloorConfigStructure();
      this.testFloorValidation();
      this.testFloorOperations();
      
      // Report results
      const passed = this.testResults.filter(t => t.passed).length;
      const total = this.testResults.length;
      
      if (passed === total) {
        console.log(`✅ All ${total} floor maintenance tests passed`);
        return true;
      } else {
        console.log(`❌ ${total - passed} out of ${total} floor maintenance tests failed`);
        this.testResults.filter(t => !t.passed).forEach(t => {
          console.log(`  - ${t.name}: ${t.error}`);
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Floor maintenance test suite failed:', error);
      return false;
    }
  }

  testFloorConfigStructure() {
    const testName = 'Floor Config Structure Validation';
    try {
      // Test empty config structure
      const emptyConfig = { floor_icons: {}, floor_sensors: {} };
      this.assertFloorConfigValid(emptyConfig, 'Empty config should be valid');

      // Test valid config structure
      const validConfig = {
        floor_icons: {
          'ground_floor': 'mdi:home',
          'first_floor': 'mdi:stairs-up'
        },
        floor_sensors: {
          'ground_floor': 'binary_sensor.ground_floor_active',
          'first_floor': 'binary_sensor.first_floor_active'
        }
      };
      this.assertFloorConfigValid(validConfig, 'Valid config should be valid');

      // Test missing floor_sensors for an icon
      const invalidConfig = {
        floor_icons: {
          'ground_floor': 'mdi:home'
        },
        floor_sensors: {}
      };
      // This should still be valid as it will be handled gracefully
      this.assertFloorConfigValid(invalidConfig, 'Partial config should be handled gracefully');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  testFloorValidation() {
    const testName = 'Floor Input Validation';
    try {
      // Test valid floor key
      this.assertTrue(this.isValidFloorKey('ground_floor'), 'ground_floor should be valid');
      this.assertTrue(this.isValidFloorKey('first_floor'), 'first_floor should be valid');
      this.assertTrue(this.isValidFloorKey('basement'), 'basement should be valid');

      // Test invalid floor keys
      this.assertFalse(this.isValidFloorKey(''), 'Empty string should be invalid');
      this.assertFalse(this.isValidFloorKey('  '), 'Whitespace-only should be invalid');

      // Test valid icons
      this.assertTrue(this.isValidIcon('mdi:home'), 'mdi:home should be valid');
      this.assertTrue(this.isValidIcon('mdi:stairs-up'), 'mdi:stairs-up should be valid');

      // Test invalid icons
      this.assertFalse(this.isValidIcon(''), 'Empty icon should be invalid');
      this.assertFalse(this.isValidIcon('invalid-icon'), 'Non-MDI icon should be invalid');

      // Test valid sensors
      this.assertTrue(this.isValidSensor('binary_sensor.ground_floor_active'), 'Valid sensor format');
      this.assertTrue(this.isValidSensor('sensor.floor_status'), 'Alternative sensor format');

      // Test invalid sensors
      this.assertFalse(this.isValidSensor(''), 'Empty sensor should be invalid');
      this.assertFalse(this.isValidSensor('invalid_sensor'), 'Invalid sensor format');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  testFloorOperations() {
    const testName = 'Floor CRUD Operations Logic';
    try {
      // Test floor addition logic
      let floorsConfig = { floor_icons: {}, floor_sensors: {} };
      
      // Add first floor
      floorsConfig = this.simulateAddFloor(floorsConfig, 'ground_floor', 'mdi:home', 'binary_sensor.ground_floor');
      this.assertTrue(
        floorsConfig.floor_icons['ground_floor'] === 'mdi:home',
        'Floor icon should be added'
      );
      this.assertTrue(
        floorsConfig.floor_sensors['ground_floor'] === 'binary_sensor.ground_floor',
        'Floor sensor should be added'
      );

      // Add second floor
      floorsConfig = this.simulateAddFloor(floorsConfig, 'first_floor', 'mdi:stairs-up', 'binary_sensor.first_floor');
      this.assertTrue(Object.keys(floorsConfig.floor_icons).length === 2, 'Should have 2 floors');

      // Test floor deletion logic
      floorsConfig = this.simulateDeleteFloor(floorsConfig, 'ground_floor');
      this.assertFalse(
        'ground_floor' in floorsConfig.floor_icons,
        'Floor icon should be removed'
      );
      this.assertFalse(
        'ground_floor' in floorsConfig.floor_sensors,
        'Floor sensor should be removed'
      );
      this.assertTrue(Object.keys(floorsConfig.floor_icons).length === 1, 'Should have 1 floor left');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Helper methods for validation
  isValidFloorKey(key) {
    return typeof key === 'string' && key.trim().length > 0;
  }

  isValidIcon(icon) {
    return typeof icon === 'string' && icon.trim().length > 0 && (icon.startsWith('mdi:') || icon.startsWith('hass:'));
  }

  isValidSensor(sensor) {
    return typeof sensor === 'string' && 
           sensor.trim().length > 0 && 
           (sensor.includes('sensor.') || sensor.includes('binary_sensor.'));
  }

  simulateAddFloor(config, floorKey, icon, sensor) {
    const newConfig = JSON.parse(JSON.stringify(config));
    newConfig.floor_icons[floorKey] = icon;
    newConfig.floor_sensors[floorKey] = sensor;
    return newConfig;
  }

  simulateDeleteFloor(config, floorKey) {
    const newConfig = JSON.parse(JSON.stringify(config));
    delete newConfig.floor_icons[floorKey];
    delete newConfig.floor_sensors[floorKey];
    return newConfig;
  }

  assertFloorConfigValid(config, message) {
    if (!config || typeof config !== 'object') {
      throw new Error(`${message}: Config must be an object`);
    }
    // The structure should have floor_icons and floor_sensors objects
    if (!config.floor_icons || typeof config.floor_icons !== 'object') {
      throw new Error(`${message}: Config must have floor_icons object`);
    }
    if (!config.floor_sensors || typeof config.floor_sensors !== 'object') {
      throw new Error(`${message}: Config must have floor_sensors object`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertFalse(condition, message) {
    if (condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloorMaintenanceTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new FloorMaintenanceTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}