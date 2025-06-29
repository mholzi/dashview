/**
 * Room Scene Buttons Test Suite
 * Tests the scene buttons in room popups functionality
 */

class RoomSceneButtonsTests {
  constructor() {
    this.testResults = [];
    this.verbose = process.env.TEST_VERBOSE === 'true';
  }

  log(message) {
    if (this.verbose) {
      console.log(`[RoomSceneButtonsTests] ${message}`);
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

  // Mock PopupManager for testing
  createMockPopupManager() {
    return {
      _config: {
        scenes: [
          {
            id: 'dashview_auto_wohnzimmer_lights_off',
            name: 'Wohnzimmer - Lichter aus',
            icon: 'mdi:lightbulb-off',
            type: 'auto_room_lights_off',
            entities: ['light.wohnzimmer_1', 'light.wohnzimmer_2'],
            room_key: 'wohnzimmer',
            auto_generated: true
          },
          {
            id: 'manual_scene_test',
            name: 'Test Scene',
            entities: ['light.wohnzimmer_1'],
            type: 'manual'
          },
          {
            id: 'other_room_scene',
            name: 'Kitchen Scene',
            entities: ['light.kitchen'],
            room_key: 'kitchen',
            auto_generated: true
          }
        ]
      },
      _hasRoomScenes: function(roomConfig, roomKey) {
        const scenes = this._config?.scenes || [];
        return scenes.some(scene => {
            // Check if it's an auto-generated scene for this room
            if (scene.auto_generated && scene.room_key === roomKey) {
                return true;
            }
            // Check if it's a manual scene that includes entities from this room
            if (scene.entities) {
                const roomEntities = [
                    ...(roomConfig.lights || []),
                    ...(roomConfig.covers || []),
                    ...(roomConfig.media_players?.map(mp => mp.entity) || [])
                ];
                return scene.entities.some(entity => roomEntities.includes(entity));
            }
            return false;
        });
      }
    };
  }

  // Mock SceneManager for testing
  createMockSceneManager() {
    return {
      _config: {
        scenes: [
          {
            id: 'dashview_auto_wohnzimmer_lights_off',
            name: 'Wohnzimmer - Lichter aus',
            icon: 'mdi:lightbulb-off',
            type: 'auto_room_lights_off',
            entities: ['light.wohnzimmer_1', 'light.wohnzimmer_2'],
            room_key: 'wohnzimmer',
            auto_generated: true
          },
          {
            id: 'manual_scene_test',
            name: 'Test Scene',
            entities: ['light.wohnzimmer_1'],
            type: 'manual'
          }
        ]
      },
      _getRoomScenes: function(roomKey, roomConfig) {
        const scenes = this._config?.scenes || [];
        return scenes.filter(scene => {
            // Include auto-generated scenes for this room
            if (scene.auto_generated && scene.room_key === roomKey) {
                return true;
            }
            // Include manual scenes that control entities in this room
            if (scene.entities) {
                const roomEntities = [
                    ...(roomConfig.lights || []),
                    ...(roomConfig.covers || []),
                    ...(roomConfig.media_players?.map(mp => mp.entity) || [])
                ];
                return scene.entities.some(entity => roomEntities.includes(entity));
            }
            return false;
        });
      }
    };
  }

  // Test room scene detection
  testRoomSceneDetection() {
    const testName = 'Room Scene Detection';
    this.log(`Running test: ${testName}`);

    try {
      const popupManager = this.createMockPopupManager();
      const roomConfig = {
        lights: ['light.wohnzimmer_1', 'light.wohnzimmer_2'],
        covers: [],
        media_players: []
      };
      
      // Test room with auto-generated scene
      const hasScenes = popupManager._hasRoomScenes(roomConfig, 'wohnzimmer');
      this.assertTrue(hasScenes, 'Should detect scenes for room with auto-generated scene');

      // Test room without scenes
      const hasNoScenes = popupManager._hasRoomScenes({ lights: [], covers: [] }, 'bedroom');
      this.assertTrue(!hasNoScenes, 'Should not detect scenes for room without scenes');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test scene filtering for rooms
  testSceneFiltering() {
    const testName = 'Scene Filtering for Rooms';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      const roomConfig = {
        lights: ['light.wohnzimmer_1', 'light.wohnzimmer_2'],
        covers: [],
        media_players: []
      };
      
      const roomScenes = sceneManager._getRoomScenes('wohnzimmer', roomConfig);
      
      // Should include both auto-generated and manual scenes for this room
      this.assertEqual(roomScenes.length, 2, 'Should find 2 scenes for wohnzimmer');
      
      const autoScene = roomScenes.find(s => s.auto_generated);
      this.assertTrue(!!autoScene, 'Should include auto-generated scene');
      
      const manualScene = roomScenes.find(s => !s.auto_generated);
      this.assertTrue(!!manualScene, 'Should include manual scene with room entities');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test room without matching scenes
  testRoomWithoutScenes() {
    const testName = 'Room Without Scenes';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      const roomConfig = {
        lights: ['light.bedroom_1'],
        covers: [],
        media_players: []
      };
      
      const roomScenes = sceneManager._getRoomScenes('bedroom', roomConfig);
      
      this.assertEqual(roomScenes.length, 0, 'Should find no scenes for bedroom');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Test auto-generated scene identification
  testAutoGeneratedSceneIdentification() {
    const testName = 'Auto-Generated Scene Identification';
    this.log(`Running test: ${testName}`);

    try {
      const sceneManager = this.createMockSceneManager();
      const roomConfig = {
        lights: ['light.wohnzimmer_1'],
        covers: [],
        media_players: []
      };
      
      const roomScenes = sceneManager._getRoomScenes('wohnzimmer', roomConfig);
      const autoScene = roomScenes.find(s => s.id === 'dashview_auto_wohnzimmer_lights_off');
      
      this.assertTrue(!!autoScene, 'Should find auto-generated scene');
      this.assertEqual(autoScene.type, 'auto_room_lights_off', 'Should have correct type');
      this.assertEqual(autoScene.room_key, 'wohnzimmer', 'Should have correct room key');

      this.testResults.push({ name: testName, passed: true });
    } catch (error) {
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting Room Scene Buttons Tests...');
    
    this.testRoomSceneDetection();
    this.testSceneFiltering();
    this.testRoomWithoutScenes();
    this.testAutoGeneratedSceneIdentification();

    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log(`\n[RoomSceneButtonsTests] Test Results: ${passedTests}/${totalTests} passed`);
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      console.log(`  ${status} ${result.name}`);
      if (!result.passed) {
        console.log(`    Error: ${result.error}`);
      }
    });

    const success = passedTests === totalTests;
    if (success) {
      console.log('\n[RoomSceneButtonsTests] All tests passed! ✅');
    } else {
      console.log('\n[RoomSceneButtonsTests] Some tests failed! ❌');
    }

    return success;
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoomSceneButtonsTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new RoomSceneButtonsTests();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}