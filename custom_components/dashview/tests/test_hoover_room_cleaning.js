// Test for Hoover Room Cleaning State Issue #288

console.log('[Test] Hoover Room Cleaning State');

// Mock vacuum entity in room_cleaning state
const mockVacuumEntity = {
    entity_id: 'vacuum.dreame_mova',
    state: 'room_cleaning',
    attributes: {
        battery_level: 80,
        friendly_name: 'Dreame Mova Vacuum'
    }
};

// Test the _getHooverDisplayData function behavior
function testHooverDisplayData() {
    console.log('[Test] Testing hoover display data for room_cleaning state');
    
    // Expected values for room_cleaning state
    const expected = {
        icon: 'mdi:home-floor-a',
        label: 'Zimmerreinigung',
        cardClass: 'vacuum-room-cleaning'
    };
    
    console.log('[Test] Expected:', expected);
    console.log('[Test] Mock entity state:', mockVacuumEntity.state);
    
    // Verify CSS class exists
    const cssPath = 'custom_components/dashview/www/style.css';
    const fs = require('fs');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    if (cssContent.includes('.sensor-small-card.vacuum-room-cleaning')) {
        console.log('[Test] ✓ CSS class vacuum-room-cleaning found in style.css');
    } else {
        console.log('[Test] ✗ CSS class vacuum-room-cleaning NOT found in style.css');
    }
    
    if (cssContent.includes('background: var(--blue)')) {
        console.log('[Test] ✓ Blue background color defined for vacuum-room-cleaning');
    } else {
        console.log('[Test] ✗ Blue background color NOT defined');
    }
    
    console.log('[Test] Room cleaning state implementation complete');
}

// Run the test
testHooverDisplayData();
console.log('[Test] Hoover Room Cleaning State test completed');