#!/usr/bin/env node

/**
 * Motion Sensor Key Consistency Test
 * Validates that motion sensor configuration uses consistent key names
 * for saving and reading configuration data.
 * 
 * Issue: When saving motion sensor config, it uses 'entity_id' key,
 * but when reading/checking config, it expects 'entity' key.
 * This causes sensors to not display correctly in Security tab.
 */

console.log('[DashView] Motion Sensor Key Consistency Test');

// Test 1: Validate _isMotionSensorConfigured function uses correct key
function testIsConfiguredUsesEntityKey() {
    const fs = require('fs');
    const path = require('path');
    
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Find the _isMotionSensorConfigured function
    const functionStart = jsContent.indexOf('_isMotionSensorConfigured(entityId, houseConfig)');
    if (functionStart === -1) {
        console.error('✗ Could not find _isMotionSensorConfigured function');
        return false;
    }
    
    const functionEnd = jsContent.indexOf('  }', functionStart);
    const functionContent = jsContent.substring(functionStart, functionEnd + 3);
    
    // Check if it uses 'entity' key (correct) instead of 'entity_id' (incorrect)
    const usesEntityKey = functionContent.includes('headerEntity.entity ===');
    const usesEntityIdKey = functionContent.includes('headerEntity.entity_id ===');
    
    if (usesEntityKey && !usesEntityIdKey) {
        console.log('✓ _isMotionSensorConfigured uses consistent "entity" key');
        return true;
    } else if (usesEntityIdKey && !usesEntityKey) {
        console.log('✗ _isMotionSensorConfigured uses inconsistent "entity_id" key - this causes the bug');
        return false;
    } else {
        console.error('✗ Unexpected key usage pattern in _isMotionSensorConfigured');
        return false;
    }
}

// Test 2: Validate saveMotionSensorConfig function uses correct key
function testSaveConfigUsesEntityKey() {
    const fs = require('fs');
    const path = require('path');
    
    const jsPath = path.join(__dirname, '../www/dashview-panel.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Find the saveMotionSensorConfig function
    const functionStart = jsContent.indexOf('async saveMotionSensorConfig()');
    if (functionStart === -1) {
        console.error('✗ Could not find saveMotionSensorConfig function');
        return false;
    }
    
    // Find the end of the function (next function or end of class)
    const nextFunctionStart = jsContent.indexOf('\n  async ', functionStart + 1);
    const nextMethodStart = jsContent.indexOf('\n  _', functionStart + 1);
    let functionEnd = Math.min(
        nextFunctionStart === -1 ? jsContent.length : nextFunctionStart,
        nextMethodStart === -1 ? jsContent.length : nextMethodStart
    );
    
    const functionContent = jsContent.substring(functionStart, functionEnd);
    
    // Check the object structure when pushing to header_entities
    const pushMatch = functionContent.match(/header_entities\.push\(\{[\s\S]*?\}\)/);
    if (!pushMatch) {
        console.error('✗ Could not find header_entities.push call in saveMotionSensorConfig');
        return false;
    }
    
    const pushContent = pushMatch[0];
    
    // Check if it uses 'entity' key (correct) instead of 'entity_id' (incorrect)
    const usesEntityKey = pushContent.includes('entity:');
    const usesEntityIdKey = pushContent.includes('entity_id:');
    
    if (usesEntityKey && !usesEntityIdKey) {
        console.log('✓ saveMotionSensorConfig uses consistent "entity" key');
        return true;
    } else if (usesEntityIdKey && !usesEntityKey) {
        console.log('✗ saveMotionSensorConfig uses inconsistent "entity_id" key - this causes the bug');
        return false;
    } else {
        console.error('✗ Unexpected key usage pattern in saveMotionSensorConfig');
        return false;
    }
}

// Test 3: Simulate the bug scenario - configuration mismatch
function testConfigurationMismatch() {
    // Mock configuration with mismatched keys
    const savedConfig = {
        rooms: {
            living_room: {
                header_entities: [
                    {
                        entity_id: 'binary_sensor.motion_living_room', // Saved with entity_id
                        entity_type: 'motion',
                        icon: 'mdi:motion-sensor'
                    }
                ]
            }
        }
    };
    
    // Mock the _isMotionSensorConfigured logic with current bug
    function isConfiguredWithBug(entityId, houseConfig) {
        if (!houseConfig || !houseConfig.rooms) return false;
        
        return Object.values(houseConfig.rooms).some(room => {
            return room.header_entities && room.header_entities.some(headerEntity => 
                headerEntity.entity_id === entityId && headerEntity.entity_type === 'motion'  // Uses entity_id
            );
        });
    }
    
    // Mock the _isMotionSensorConfigured logic with fix
    function isConfiguredWithFix(entityId, houseConfig) {
        if (!houseConfig || !houseConfig.rooms) return false;
        
        return Object.values(houseConfig.rooms).some(room => {
            return room.header_entities && room.header_entities.some(headerEntity => 
                headerEntity.entity === entityId && headerEntity.entity_type === 'motion'  // Uses entity
            );
        });
    }
    
    const testEntityId = 'binary_sensor.motion_living_room';
    
    // With the bug, this should return true because both save and read use entity_id
    const bugResult = isConfiguredWithBug(testEntityId, savedConfig);
    
    // Create a fixed config where save uses 'entity' key
    const fixedConfig = {
        rooms: {
            living_room: {
                header_entities: [
                    {
                        entity: 'binary_sensor.motion_living_room', // Saved with entity
                        entity_type: 'motion',
                        icon: 'mdi:motion-sensor'
                    }
                ]
            }
        }
    };
    
    const fixResult = isConfiguredWithFix(testEntityId, fixedConfig);
    
    if (bugResult === true && fixResult === true) {
        console.log('✓ Detected current bug state - both functions use entity_id consistently, but should use entity');
        return true;
    } else {
        console.error('✗ Unexpected results in configuration mismatch test');
        console.error(`  Bug result (should be true): ${bugResult}`);
        console.error(`  Fix result (should be true): ${fixResult}`);
        return false;
    }
}

// Run all tests
function runAllTests() {
    const tests = [
        testIsConfiguredUsesEntityKey,
        testSaveConfigUsesEntityKey,
        testConfigurationMismatch
    ];
    
    let passed = 0;
    let total = tests.length;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            }
        } catch (error) {
            console.error(`✗ Test failed with error: ${error.message}`);
        }
    });
    
    console.log(`\n[DashView] Motion Sensor Key Consistency Tests: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('🎉 All motion sensor key consistency tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some motion sensor key consistency tests failed - indicates the bug exists');
        process.exit(1);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testIsConfiguredUsesEntityKey,
    testSaveConfigUsesEntityKey,
    testConfigurationMismatch,
    runAllTests
};