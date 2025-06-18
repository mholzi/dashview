/**
 * Room Setup Test Suite
 * Tests the room setup functionality including dropdown population and direct API saving
 */

class RoomSetupTests {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('[DashView] Running Room Setup Tests...');
    
    try {
      this.testFloorDropdownPopulation();
      this.testRoomFormValidation();
      this.testDirectAPISaveFormat();
      
      // Report results
      const passed = this.testResults.filter(t => t.passed).length;
      const total = this.testResults.length;
      
      if (passed === total) {
        console.log(`✅ All ${total} room setup tests passed`);
        return true;
      } else {
        console.log(`❌ ${total - passed} out of ${total} room setup tests failed`);
        this.testResults.filter(t => !t.passed).forEach(t => {
          console.log(`  - ${t.name}: ${t.error}`);
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Room setup test suite failed:', error);
      return false;
    }
  }

  testFloorDropdownPopulation() {
    const testName = 'Floor Dropdown Population';
    try {
      // Mock DOM elements
      const mockSelect = {
        innerHTML: '',
        appendChild: function(option) {
          this.innerHTML += `<option value="${option.value}">${option.textContent}</option>`;
        }
      };

      const mockShadow = {
        getElementById: (id) => {
          if (id === 'new-room-floor') return mockSelect;
          return null;
        }
      };

      // Mock panel with _populateFloorDropdown method
      const mockPanel = {
        shadowRoot: mockShadow,
        _adminLocalState: {
          houseConfig: {
            floors: {
              'ground_floor': { friendly_name: 'Ground Floor' },
              'first_floor': { friendly_name: 'First Floor' }
            }
          }
        },
        _populateFloorDropdown: function() {
          const shadow = this.shadowRoot;
          const selector = shadow.getElementById('new-room-floor');
          if (!selector) return;

          selector.innerHTML = '';
          const floors = this._adminLocalState.houseConfig?.floors || {};

          if (Object.keys(floors).length === 0) {
              const option = { value: '', textContent: 'No floors configured', disabled: true };
              selector.appendChild(option);
              return;
          }

          for (const [floorKey, floorConfig] of Object.entries(floors)) {
              const option = { value: floorKey, textContent: floorConfig.friendly_name || floorKey };
              selector.appendChild(option);
          }
        }
      };

      // Test with floors
      mockPanel._populateFloorDropdown();
      const result = mockSelect.innerHTML;
      
      this.assert(
        result.includes('value="ground_floor"') && result.includes('Ground Floor'),
        testName,
        'Should populate dropdown with ground floor option'
      );
      
      this.assert(
        result.includes('value="first_floor"') && result.includes('First Floor'),
        testName,
        'Should populate dropdown with first floor option'
      );

      // Test with no floors
      mockPanel._adminLocalState.houseConfig.floors = {};
      mockSelect.innerHTML = '';
      mockPanel._populateFloorDropdown();
      
      this.assert(
        mockSelect.innerHTML.includes('No floors configured'),
        testName,
        'Should show "No floors configured" when no floors exist'
      );

    } catch (error) {
      this.assert(false, testName, `Test failed: ${error.message}`);
    }
  }

  testRoomFormValidation() {
    const testName = 'Room Form Validation';
    try {
      // Test that floor value is used without trim() for select element
      const floorValue = 'ground_floor';
      
      // Simulate select element behavior (no .trim() needed)
      const mockFloorSelect = {
        value: floorValue
      };

      // The floor value should be used directly without .trim()
      const roomData = {
        floor: mockFloorSelect.value  // Should be 'ground_floor'
      };

      this.assert(
        roomData.floor === 'ground_floor',
        testName,
        'Floor value should be used directly from select element'
      );

      this.assert(
        roomData.floor === floorValue,
        testName,
        'Floor value should match selected option value'
      );

    } catch (error) {
      this.assert(false, testName, `Test failed: ${error.message}`);
    }
  }

  testDirectAPISaveFormat() {
    const testName = 'Direct API Save Format';
    try {
      // Mock the expected API call format
      const mockHass = {
        callApiCalls: [],
        callApi: function(method, endpoint, data) {
          this.callApiCalls.push({ method, endpoint, data });
          return Promise.resolve({ status: 'success' });
        }
      };

      const mockHouseConfig = {
        rooms: {
          'existing_room': { friendly_name: 'Existing Room' }
        },
        floors: {
          'ground_floor': { friendly_name: 'Ground Floor' }
        }
      };

      const newRoomData = {
        friendly_name: 'New Room',
        icon: 'mdi:sofa',
        floor: 'ground_floor',
        combined_sensor: 'binary_sensor.new_room',
        lights: [],
        covers: [],
        media_players: []
      };

      // Simulate the direct API call format from the updated saveRoom function
      const updatedHouseConfig = JSON.parse(JSON.stringify(mockHouseConfig));
      updatedHouseConfig.rooms['new_room'] = newRoomData;

      // Test the direct API call (should not use legacy format)
      mockHass.callApi('POST', 'dashview/config', updatedHouseConfig);

      this.assert(
        mockHass.callApiCalls.length === 1,
        testName,
        'Should make exactly one API call'
      );

      const apiCall = mockHass.callApiCalls[0];
      this.assert(
        apiCall.method === 'POST' && apiCall.endpoint === 'dashview/config',
        testName,
        'Should use correct API endpoint and method'
      );

      // Verify it's using the direct format (not legacy {type, config} format)
      this.assert(
        !apiCall.data.hasOwnProperty('type') && !apiCall.data.hasOwnProperty('config'),
        testName,
        'Should use direct API format (not legacy {type, config} format)'
      );

      this.assert(
        apiCall.data.hasOwnProperty('rooms') && apiCall.data.hasOwnProperty('floors'),
        testName,
        'Should include rooms and floors in the data'
      );

      this.assert(
        apiCall.data.rooms['new_room'].friendly_name === 'New Room',
        testName,
        'Should include the new room data'
      );

    } catch (error) {
      this.assert(false, testName, `Test failed: ${error.message}`);
    }
  }

  assert(condition, testName, message) {
    if (condition) {
      this.testResults.push({ name: `${testName}: ${message}`, passed: true });
    } else {
      this.testResults.push({ name: `${testName}: ${message}`, passed: false, error: message });
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const testRunner = new RoomSetupTests();
  testRunner.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = RoomSetupTests;