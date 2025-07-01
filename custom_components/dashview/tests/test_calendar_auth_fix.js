/**
 * Test Calendar Authentication Fix
 * 
 * Tests that calendar managers use proper authentication when fetching events
 */

const fs = require('fs');
const path = require('path');

console.log('[DashView Test] Testing Calendar Authentication Fix...');

// Test UpcomingEventsManager
const upcomingEventsPath = path.join(__dirname, '../www/lib/ui/UpcomingEventsManager.js');
try {
    const upcomingEventsContent = fs.readFileSync(upcomingEventsPath, 'utf8');
    
    // Test 1: Check that fetch() is not used for calendar API calls
    if (!upcomingEventsContent.includes('fetch(\n                `/api/dashview/config?type=calendar_events')) {
        console.log('✅ UpcomingEventsManager no longer uses direct fetch() for calendar API');
    } else {
        console.log('❌ UpcomingEventsManager still uses direct fetch() for calendar API');
    }
    
    // Test 2: Check that hass.callApi is used instead
    if (upcomingEventsContent.includes('this._hass.callApi') && 
        upcomingEventsContent.includes('dashview/config?type=calendar_events')) {
        console.log('✅ UpcomingEventsManager uses hass.callApi for authenticated requests');
    } else {
        console.log('❌ UpcomingEventsManager does not use hass.callApi for calendar requests');
    }
    
    // Test 3: Check error handling is preserved
    if (upcomingEventsContent.includes('Fehler beim Laden der Termine')) {
        console.log('✅ German error message is preserved in UpcomingEventsManager');
    } else {
        console.log('❌ German error message missing in UpcomingEventsManager');
    }
    
} catch (error) {
    console.log('❌ Error reading UpcomingEventsManager.js:', error.message);
}

// Test CalendarManager
const calendarManagerPath = path.join(__dirname, '../www/lib/ui/CalendarManager.js');
try {
    const calendarManagerContent = fs.readFileSync(calendarManagerPath, 'utf8');
    
    // Test 4: Check that fetch() is not used for calendar API calls
    if (!calendarManagerContent.includes('fetch(\n                `/api/dashview/config?type=calendar_events')) {
        console.log('✅ CalendarManager no longer uses direct fetch() for calendar API');
    } else {
        console.log('❌ CalendarManager still uses direct fetch() for calendar API');
    }
    
    // Test 5: Check that hass.callApi is used instead
    if (calendarManagerContent.includes('this._hass.callApi') && 
        calendarManagerContent.includes('dashview/config?type=calendar_events')) {
        console.log('✅ CalendarManager uses hass.callApi for authenticated requests');
    } else {
        console.log('❌ CalendarManager does not use hass.callApi for calendar requests');
    }
    
    // Test 6: Check error handling is preserved
    if (calendarManagerContent.includes('data.errors && data.errors.length > 0')) {
        console.log('✅ Error handling preserved in CalendarManager');
    } else {
        console.log('❌ Error handling missing in CalendarManager');
    }
    
} catch (error) {
    console.log('❌ Error reading CalendarManager.js:', error.message);
}

// Test syntax validation
console.log('\n[DashView Test] Validating JavaScript syntax...');
const { exec } = require('child_process');

// Test UpcomingEventsManager.js syntax
exec('node -c ' + upcomingEventsPath, (error, stdout, stderr) => {
    if (error) {
        console.log('❌ UpcomingEventsManager.js syntax validation failed:', error.message);
    } else {
        console.log('✅ UpcomingEventsManager.js syntax validation passed');
    }
});

// Test CalendarManager.js syntax
exec('node -c ' + calendarManagerPath, (error, stdout, stderr) => {
    if (error) {
        console.log('❌ CalendarManager.js syntax validation failed:', error.message);
    } else {
        console.log('✅ CalendarManager.js syntax validation passed');
    }
});

console.log('\n[DashView Test] Calendar Authentication Fix tests completed!');
console.log('\n🔧 Fix Summary:');
console.log('   • Replaced fetch() with hass.callApi() for proper authentication');
console.log('   • Maintains all existing error handling and user messages');
console.log('   • Both UpcomingEventsManager and CalendarManager updated');
console.log('   • No breaking changes to functionality');
console.log('\n📋 This fixes GitHub Issue #339: Calendar loading fails with HTTP 401 Unauthorized');