/**
 * Cover Scene Functionality Test Suite
 * Tests the new cover scene features (room-specific and global)
 */

class CoverScenesTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[CoverScenesTests] ${message}`);
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

  // Mock AutoSceneGenerator for testing
  createMockAutoSceneGenerator() {
    return {
      _config: {
        rooms: {
          wohnzimmer: {
            friendly_name: 'Wohnzimmer',
            covers: ['cover.wohnzimmer_1', 'cover.wohnzimmer_2']
          },
          schlafzimmer: {
            friendly_name: 'Schlafzimmer', 
            covers: ['cover.schlafzimmer_1']
          },
          küche: {
            friendly_name: 'Küche',
            lights: ['light.kueche_1'] // No covers
          }
        },
        auto_scenes: {
          enabled: true,
          global_covers_enabled: true
        }
      },
      _hass: {
        states: {
          'cover.wohnzimmer_1': { attributes: { current_position: 80 } },
          'cover.wohnzimmer_2': { attributes: { current_position: 60 } },
          'cover.schlafzimmer_1': { attributes: { current_position: 20 } }
        }
      },
      _createRoomCoversScene: function(roomKey, roomConfig) {
        if (!roomConfig.covers || roomConfig.covers.length === 0) {
          return null;
        }

        const validCoverEntities = roomConfig.covers.filter(entityId => {
          return this._hass?.states?.[entityId] !== undefined;
        });

        if (validCoverEntities.length === 0) {
          return null;
        }

        const roomName = roomConfig.friendly_name || roomKey;
        
        return {
          id: `dashview_auto_${roomKey}_covers`,
          name: `${roomName} - Rollos`,
          icon: 'mdi:window-shutter',
          type: 'auto_room_covers',
          entities: validCoverEntities,
          room_key: roomKey,
          auto_generated: true,
          description: `Automatically generated scene to control all covers in ${roomName}`
        };
      },
      _createGlobalCoverScene: function() {
        const allCoverEntities = [];
        Object.values(this._config.rooms).forEach(roomConfig => {
          if (roomConfig.covers && roomConfig.covers.length > 0) {
            allCoverEntities.push(...roomConfig.covers);
          }
        });

        if (allCoverEntities.length === 0) return null;

        const validCoverEntities = allCoverEntities.filter(entityId => {
          return this._hass?.states?.[entityId] !== undefined;
        });

        if (validCoverEntities.length === 0) return null;

        return {
          id: 'dashview_auto_global_covers',
          name: 'Alle Rollos',
          icon: 'mdi:window-shutter',
          type: 'auto_global_covers',
          entities: validCoverEntities,
          auto_generated: true,
          description: 'Automatically generated scene to control all covers in the house'
        };
      },
      _getGlobalCoverSceneEnabled: function() {
        return this._config?.auto_scenes?.global_covers_enabled !== false;
      }
    };
  }

  // Mock SceneManager for testing
  createMockSceneManager() {
    return {
      _hass: {
        states: {
          'cover.wohnzimmer_1': { attributes: { current_position: 80 } },
          'cover.wohnzimmer_2': { attributes: { current_position: 60 } },
          'cover.schlafzimmer_1': { attributes: { current_position: 20 } }
        }
      },
      _calculateAverageCoverPosition: function(entities) {
        if (!this._hass || !entities || entities.length === 0) return 50;
        
        const positions = entities
          .map(entityId => {
            const state = this._hass.states[entityId];
            const pos = state?.attributes?.current_position;
            return typeof pos === 'number' ? pos : 50;
          })
          .filter(pos => pos !== null);
        
        if (positions.length === 0) return 50;
        
        return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
      },
      _getButtonName: function(scene) {
        if (scene.type === 'auto_room_covers') {
          const avgPosition = this._calculateAverageCoverPosition(scene.entities || []);
          return avgPosition < 30 ? 'Rollos hoch' : 'Rollos runter';
        }
        if (scene.type === 'auto_global_covers') {
          const globalAvgPosition = this._calculateAverageCoverPosition(scene.entities || []);
          return globalAvgPosition < 30 ? 'Alle Rollos hoch' : 'Alle Rollos runter';
        }
        return scene.name;
      },
      _getTapAction: function(scene) {
        if (scene.type === 'auto_room_covers' || scene.type === 'auto_global_covers') {
          const avgPosition = this._calculateAverageCoverPosition(scene.entities || []);
          return {
            service: avgPosition < 30 ? 'cover.open_cover' : 'cover.close_cover',
            service_data: { entity_id: scene.entities }
          };
        }
        return { service: 'script.turn_on', service_data: { entity_id: scene.entities } };
      }
    };
  }

  // Test room cover scene creation
  testRoomCoverSceneCreation() {
    const testName = 'Room Cover Scene Creation';
    this.log(`Running test: ${testName}`);

    try {
      const autoSceneGenerator = this.createMockAutoSceneGenerator();
      
      // Test creating scene for room with covers
      const wohnzimmerScene = autoSceneGenerator._createRoomCoversScene('wohnzimmer', 
        autoSceneGenerator._config.rooms.wohnzimmer);
      
      this.assertTrue(!!wohnzimmerScene, 'Should create scene for room with covers');
      this.assertEqual(wohnzimmerScene.type, 'auto_room_covers', 'Should have correct type');
      this.assertEqual(wohnzimmerScene.room_key, 'wohnzimmer', 'Should have correct room key');
      this.assertEqual(wohnzimmerScene.entities.length, 2, 'Should include all cover entities');
      
      // Test no scene for room without covers
      const kücheScene = autoSceneGenerator._createRoomCoversScene('küche', 
        autoSceneGenerator._config.rooms.küche);
      
      this.assertTrue(kücheScene === null, 'Should not create scene for room without covers');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test global cover scene creation
  testGlobalCoverSceneCreation() {
    const testName = 'Global Cover Scene Creation';
    this.log(`Running test: ${testName}`);

    try {
      const autoSceneGenerator = this.createMockAutoSceneGenerator();
      
      const globalScene = autoSceneGenerator._createGlobalCoverScene();
      
      this.assertTrue(!!globalScene, 'Should create global cover scene');
      this.assertEqual(globalScene.type, 'auto_global_covers', 'Should have correct type');
      this.assertEqual(globalScene.id, 'dashview_auto_global_covers', 'Should have correct ID');
      this.assertEqual(globalScene.entities.length, 3, 'Should include all cover entities from all rooms');
      this.assertTrue(globalScene.entities.includes('cover.wohnzimmer_1'), 'Should include wohnzimmer covers');
      this.assertTrue(globalScene.entities.includes('cover.schlafzimmer_1'), 'Should include schlafzimmer covers');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test cover position calculation
  testCoverPositionCalculation() {
    const testName = 'Cover Position Calculation';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      
      // Test average calculation for wohnzimmer (80% + 60% = 70% average)
      const wohnzimmerAvg = sceneManager._calculateAverageCoverPosition(['cover.wohnzimmer_1', 'cover.wohnzimmer_2']);
      this.assertEqual(wohnzimmerAvg, 70, 'Should calculate correct average for wohnzimmer');
      
      // Test single cover (20%)
      const schlafzimmerAvg = sceneManager._calculateAverageCoverPosition(['cover.schlafzimmer_1']);
      this.assertEqual(schlafzimmerAvg, 20, 'Should return correct position for single cover');
      
      // Test empty array
      const emptyAvg = sceneManager._calculateAverageCoverPosition([]);
      this.assertEqual(emptyAvg, 50, 'Should return 50% for empty array');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test scene button names
  testSceneButtonNames() {
    const testName = 'Scene Button Names';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      
      // Test room scene with high average position (70% > 30%)
      const roomSceneHigh = {
        type: 'auto_room_covers',
        entities: ['cover.wohnzimmer_1', 'cover.wohnzimmer_2'] // 70% average
      };
      const roomNameHigh = sceneManager._getButtonName(roomSceneHigh);
      this.assertEqual(roomNameHigh, 'Rollos runter', 'Should show "Rollos runter" for high position');
      
      // Test room scene with low average position (20% < 30%)
      const roomSceneLow = {
        type: 'auto_room_covers',
        entities: ['cover.schlafzimmer_1'] // 20% position
      };
      const roomNameLow = sceneManager._getButtonName(roomSceneLow);
      this.assertEqual(roomNameLow, 'Rollos hoch', 'Should show "Rollos hoch" for low position');
      
      // Test global scene
      const globalScene = {
        type: 'auto_global_covers',
        entities: ['cover.wohnzimmer_1', 'cover.wohnzimmer_2', 'cover.schlafzimmer_1'] // ~53% average
      };
      const globalName = sceneManager._getButtonName(globalScene);
      this.assertEqual(globalName, 'Alle Rollos runter', 'Should show "Alle Rollos runter" for global scene');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test scene tap actions
  testSceneTapActions() {
    const testName = 'Scene Tap Actions';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      
      // Test room scene with low position (should open)
      const roomSceneLow = {
        type: 'auto_room_covers',
        entities: ['cover.schlafzimmer_1'] // 20% position
      };
      const actionLow = sceneManager._getTapAction(roomSceneLow);
      this.assertEqual(actionLow.service, 'cover.open_cover', 'Should open covers for low position');
      
      // Test room scene with high position (should close)
      const roomSceneHigh = {
        type: 'auto_room_covers',
        entities: ['cover.wohnzimmer_1', 'cover.wohnzimmer_2'] // 70% average
      };
      const actionHigh = sceneManager._getTapAction(roomSceneHigh);
      this.assertEqual(actionHigh.service, 'cover.close_cover', 'Should close covers for high position');
      
      // Test global scene
      const globalScene = {
        type: 'auto_global_covers',
        entities: ['cover.wohnzimmer_1', 'cover.wohnzimmer_2', 'cover.schlafzimmer_1']
      };
      const globalAction = sceneManager._getTapAction(globalScene);
      this.assertEqual(globalAction.service, 'cover.close_cover', 'Should close covers for global scene');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test global cover scene enabled status
  testGlobalCoverSceneEnabled() {
    const testName = 'Global Cover Scene Enabled Status';
    this.log(`Running test: ${testName}`);

    try {
      const autoSceneGenerator = this.createMockAutoSceneGenerator();
      
      // Test default enabled
      const enabled = autoSceneGenerator._getGlobalCoverSceneEnabled();
      this.assertTrue(enabled, 'Should be enabled by default');
      
      // Test when explicitly disabled
      autoSceneGenerator._config.auto_scenes.global_covers_enabled = false;
      const disabled = autoSceneGenerator._getGlobalCoverSceneEnabled();
      this.assertTrue(!disabled, 'Should respect disabled setting');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Cover Scenes Tests...');
    
    this.testRoomCoverSceneCreation();
    this.testGlobalCoverSceneCreation();
    this.testCoverPositionCalculation();
    this.testSceneButtonNames();
    this.testSceneTapActions();
    this.testGlobalCoverSceneEnabled();

    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\n[CoverScenesTests] Test Results: ${passedTests}/${totalTests} passed`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.name}`);
      if (!result.passed) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const success = passedTests === totalTests;
    if (success) {
      console.log('\n[CoverScenesTests] All tests passed! ✅');
    } else {
      console.log('\n[CoverScenesTests] Some tests failed! ❌');
    }

    return success;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoverScenesTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new CoverScenesTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}