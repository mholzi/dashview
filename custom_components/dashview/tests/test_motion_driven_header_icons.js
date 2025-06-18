#!/usr/bin/env node

// Test Motion-Driven Header Icons - Motion 3 Implementation
// This test validates the new header icon logic that uses motion sensors exclusively

const assert = require('assert');

class MockDashviewPanel {
  constructor() {
    this._hass = {
      states: {}
    };
    this._houseConfig = {
      rooms: {},
      floors: {}
    };
  }

  // Mock the icon processing method (matches the actual implementation)
  _processIconName(iconName) {
    if (!iconName) return 'mdi-help-circle';
    
    // Remove mdi: prefix and ensure mdi- prefix
    let processedIcon = iconName.replace('mdi:', '').replace('mdi-', '');
    if (!processedIcon.startsWith('mdi-')) {
      processedIcon = 'mdi-' + processedIcon;
    }
    
    return processedIcon;
  }

  // The new motion-driven header button generation logic
  _generateHeaderButtonsFromHouseConfig() {
    let buttonsHTML = '';
    const rooms = this._houseConfig.rooms || {};
    const floors = this._houseConfig.floors || {};

    // 1. Group rooms by their assigned floor
    const roomsByFloor = {};
    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      const floorKey = roomConfig.floor;
      if (!roomsByFloor[floorKey]) {
        roomsByFloor[floorKey] = [];
      }
      roomsByFloor[floorKey].push({ key: roomKey, config: roomConfig });
    });

    // 2. Iterate through each floor to check for motion
    Object.entries(roomsByFloor).forEach(([floorKey, floorRooms]) => {
      const floorConfig = floors[floorKey];
      if (!floorConfig) return; // Skip if floor is not configured

      // 3. Find all rooms on this floor that have an active motion sensor
      const activeMotionRooms = floorRooms.filter(room => {
        // Find the motion sensor configured for this room in the admin panel
        if (!room.config.header_entities) return false;
        const motionEntityConfig = room.config.header_entities.find(e => e.entity_type === 'motion');
        if (!motionEntityConfig || !motionEntityConfig.entity) return false;

        // Check if the motion sensor's state is 'on'
        const sensorState = this._hass.states[motionEntityConfig.entity];
        return sensorState && sensorState.state === 'on';
      });

      // 4. If at least one room has active motion, display the floor and room icons
      if (activeMotionRooms.length > 0) {
        const floorIcon = this._processIconName(floorConfig.icon || 'mdi:help-circle-outline');

        // Add the floor icon button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorKey}">
            <i class="mdi ${floorIcon}"></i>
          </button>
        `;

        // Add the icon buttons ONLY for the rooms with active motion
        activeMotionRooms.forEach(room => {
          const roomConfig = room.config;
          const roomIcon = this._processIconName(roomConfig.icon || 'mdi:home-outline');
          buttonsHTML += `
              <button class="header-room-button" 
                      data-room="${room.key}" 
                      data-floor="${floorKey}"
                      data-navigation="#${room.key}"
                      title="${roomConfig.friendly_name}">
                <i class="mdi ${roomIcon}"></i>
              </button>
            `;
        });
      }
    });

    return buttonsHTML || 'No active rooms';
  }
}

// Test Suite
let testsPassed = 0;
let testsFailed = 0;

function assert_test(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`✗ ${message}`);
  }
}

function runMotionDrivenHeaderIconTests() {
  console.log('[DashView] Running Motion-Driven Header Icons tests...');

  // Test 1: No active motion sensors = no header icons
  const panel1 = new MockDashviewPanel();
  panel1._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity: 'binary_sensor.living_room_motion', entity_type: 'motion' }
        ]
      }
    }
  };
  panel1._hass.states = {
    'binary_sensor.living_room_motion': { state: 'off' }
  };

  const result1 = panel1._generateHeaderButtonsFromHouseConfig();
  assert_test(result1 === 'No active rooms', 'No icons when no motion sensors are active');

  // Test 2: One active motion sensor = floor icon + room icon
  const panel2 = new MockDashviewPanel();
  panel2._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity: 'binary_sensor.living_room_motion', entity_type: 'motion' }
        ]
      }
    }
  };
  panel2._hass.states = {
    'binary_sensor.living_room_motion': { state: 'on' }
  };

  const result2 = panel2._generateHeaderButtonsFromHouseConfig();
  assert_test(result2.includes('header-floor-button'), 'Floor button appears when room has active motion');
  assert_test(result2.includes('header-room-button'), 'Room button appears when motion sensor is active');
  assert_test(result2.includes('data-floor="ground_floor"'), 'Floor button has correct data attribute');
  assert_test(result2.includes('data-room="living_room"'), 'Room button has correct data attribute');
  assert_test(result2.includes('mdi-home'), 'Floor button has correct icon');
  assert_test(result2.includes('mdi-sofa'), 'Room button has correct icon');

  // Test 3: Multiple rooms, only some with active motion
  const panel3 = new MockDashviewPanel();
  panel3._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity: 'binary_sensor.living_room_motion', entity_type: 'motion' }
        ]
      },
      kitchen: {
        floor: 'ground_floor',
        friendly_name: 'Kitchen',
        icon: 'mdi:chef-hat',
        header_entities: [
          { entity: 'binary_sensor.kitchen_motion', entity_type: 'motion' }
        ]
      },
      bedroom: {
        floor: 'ground_floor',
        friendly_name: 'Bedroom',
        icon: 'mdi:bed',
        header_entities: [
          { entity: 'binary_sensor.bedroom_motion', entity_type: 'motion' }
        ]
      }
    }
  };
  panel3._hass.states = {
    'binary_sensor.living_room_motion': { state: 'on' },
    'binary_sensor.kitchen_motion': { state: 'off' },
    'binary_sensor.bedroom_motion': { state: 'on' }
  };

  const result3 = panel3._generateHeaderButtonsFromHouseConfig();
  assert_test(result3.includes('data-room="living_room"'), 'Living room button appears (motion active)');
  assert_test(!result3.includes('data-room="kitchen"'), 'Kitchen button does not appear (motion inactive)');
  assert_test(result3.includes('data-room="bedroom"'), 'Bedroom button appears (motion active)');
  assert_test(result3.includes('mdi-sofa'), 'Living room has correct icon');
  assert_test(result3.includes('mdi-bed'), 'Bedroom has correct icon');
  assert_test(!result3.includes('mdi-chef-hat'), 'Kitchen icon does not appear');

  // Test 4: Multiple floors, only some with active motion
  const panel4 = new MockDashviewPanel();
  panel4._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      },
      first_floor: {
        icon: 'mdi:home-floor-1',
        friendly_name: 'First Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity: 'binary_sensor.living_room_motion', entity_type: 'motion' }
        ]
      },
      bedroom: {
        floor: 'first_floor',
        friendly_name: 'Bedroom',
        icon: 'mdi:bed',
        header_entities: [
          { entity: 'binary_sensor.bedroom_motion', entity_type: 'motion' }
        ]
      }
    }
  };
  panel4._hass.states = {
    'binary_sensor.living_room_motion': { state: 'on' },
    'binary_sensor.bedroom_motion': { state: 'off' }
  };

  const result4 = panel4._generateHeaderButtonsFromHouseConfig();
  assert_test(result4.includes('data-floor="ground_floor"'), 'Ground floor button appears (has active motion)');
  assert_test(!result4.includes('data-floor="first_floor"'), 'First floor button does not appear (no active motion)');
  assert_test(result4.includes('data-room="living_room"'), 'Living room button appears');
  assert_test(!result4.includes('data-room="bedroom"'), 'Bedroom button does not appear');

  // Test 5: Room with no motion sensor configured = no button
  const panel5 = new MockDashviewPanel();
  panel5._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity: 'binary_sensor.living_room_window', entity_type: 'window' }
        ]
      }
    }
  };
  panel5._hass.states = {
    'binary_sensor.living_room_window': { state: 'on' }
  };

  const result5 = panel5._generateHeaderButtonsFromHouseConfig();
  assert_test(result5 === 'No active rooms', 'No buttons when room has no motion sensor configured');

  // Test 6: Room with motion sensor but no entity configured = no button
  const panel6 = new MockDashviewPanel();
  panel6._houseConfig = {
    floors: {
      ground_floor: {
        icon: 'mdi:home',
        friendly_name: 'Ground Floor'
      }
    },
    rooms: {
      living_room: {
        floor: 'ground_floor',
        friendly_name: 'Living Room',
        icon: 'mdi:sofa',
        header_entities: [
          { entity_type: 'motion' } // No entity field
        ]
      }
    }
  };

  const result6 = panel6._generateHeaderButtonsFromHouseConfig();
  assert_test(result6 === 'No active rooms', 'No buttons when motion sensor has no entity configured');

  console.log(`\n[DashView] Motion-Driven Header Icons tests completed: ${testsPassed} passed, ${testsFailed} failed`);
  return testsFailed === 0;
}

// Run the tests
const success = runMotionDrivenHeaderIconTests();
process.exit(success ? 0 : 1);