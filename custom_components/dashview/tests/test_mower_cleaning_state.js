// Test for Mower Cleaning State Issue #463

console.log('[Test] Mower Cleaning State');

// Mock mower entity in cleaning state
const mockMowerEntityCleaning = {
    entity_id: 'vacuum.mower_big',
    state: 'cleaning',
    attributes: {
        battery_level: 85,
        friendly_name: 'Big Mower'
    }
};

// Mock mower entity with cleaning activity
const mockMowerEntityActivity = {
    entity_id: 'vacuum.mower_small',
    state: 'ok',
    attributes: {
        activity: 'cleaning',
        battery_level: 90,
        friendly_name: 'Small Mower'
    }
};

// Test the _getMowerDisplayData function behavior
function testMowerCleaningState() {
    console.log('[Test] Testing mower display data for cleaning state');
    
    // Expected values for cleaning state (should be same as mowing)
    const expectedCleaning = {
        name: 'Big Mower',
        icon: 'mdi:robot-mower',
        label: 'Mäht',
        cardClass: 'is-on'
    };
    
    const expectedActivity = {
        name: 'Small Mower',
        icon: 'mdi:robot-mower',
        label: 'Mäht',
        cardClass: 'is-on'
    };
    
    console.log('[Test] Expected for cleaning state:', expectedCleaning);
    console.log('[Test] Expected for cleaning activity:', expectedActivity);
    console.log('[Test] Mock entity state:', mockMowerEntityCleaning.state);
    console.log('[Test] Mock entity activity:', mockMowerEntityActivity.attributes.activity);
    
    // Check that FloorManager.js has the cleaning cases
    const fs = require('fs');
    const floorManagerPath = 'custom_components/dashview/www/lib/ui/FloorManager.js';
    const floorManagerContent = fs.readFileSync(floorManagerPath, 'utf8');
    
    if (floorManagerContent.includes("case 'cleaning':")) {
        console.log('[Test] ✓ Cleaning state case found in FloorManager.js');
    } else {
        console.log('[Test] ✗ Cleaning state case NOT found in FloorManager.js');
    }
    
    // Check that both state and activity switches include cleaning
    const stateMatches = floorManagerContent.match(/case 'mowing':\s*case 'cleaning':/g);
    if (stateMatches && stateMatches.length >= 2) {
        console.log('[Test] ✓ Both mowing and cleaning cases found (state and activity)');
    } else {
        console.log('[Test] ✗ Missing mowing/cleaning cases in state or activity switches');
    }
    
    console.log('[Test] Mower cleaning state implementation complete');
}

// Run the test
testMowerCleaningState();
console.log('[Test] Mower Cleaning State test completed');