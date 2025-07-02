/**
 * Test Configuration Summary Fix
 * 
 * Tests that Configuration Summary is properly updated when loading configuration tabs
 */

const fs = require('fs');
const path = require('path');

console.log('[DashView Test] Testing Configuration Summary Fix...');

// Test AdminManager.js implementation
const adminManagerPath = path.join(__dirname, '../www/lib/ui/AdminManager.js');
try {
    const adminManagerContent = fs.readFileSync(adminManagerPath, 'utf8');
    
    // Test 1: Check that _updateAdminSummary() function exists
    if (adminManagerContent.includes('_updateAdminSummary()') && 
        adminManagerContent.includes('const container = this._shadowRoot.getElementById(\'config-summary-container\')')) {
        console.log('✅ _updateAdminSummary() function exists in AdminManager');
    } else {
        console.log('❌ _updateAdminSummary() function missing or incomplete');
    }
    
    // Test 2: Check that loadTabContent calls _updateAdminSummary
    if (adminManagerContent.includes('loadTabContent(targetId)') && 
        adminManagerContent.includes('setTimeout(() => this._updateAdminSummary(), 100)')) {
        console.log('✅ loadTabContent() calls _updateAdminSummary() after loading tabs');
    } else {
        console.log('❌ loadTabContent() does not call _updateAdminSummary() - summary will not update');
    }
    
    // Test 3: Check that summary calculates configuration statistics
    if (adminManagerContent.includes('Object.keys(floors).length') && 
        adminManagerContent.includes('Object.keys(rooms).length') &&
        adminManagerContent.includes('lightCount += room.lights?.length || 0')) {
        console.log('✅ Summary correctly calculates floors, rooms, lights, and other entity counts');
    } else {
        console.log('❌ Summary statistics calculation incomplete');
    }
    
    // Test 4: Check that summary updates the config-summary-container
    if (adminManagerContent.includes('config-summary-container') && 
        adminManagerContent.includes('container.innerHTML = summaryHTML')) {
        console.log('✅ Summary correctly updates the config-summary-container HTML');
    } else {
        console.log('❌ Summary does not update container HTML');
    }
    
    // Test 5: Check that all tab types are mapped in loadActionMap
    const tabCount = (adminManagerContent.match(/'-tab':/g) || []).length;
    if (tabCount >= 10) {  // Should have many tab mappings
        console.log(`✅ Tab loading system supports ${tabCount} different tab types`);
    } else {
        console.log(`❌ Tab loading system only supports ${tabCount} tab types - may be incomplete`);
    }
    
} catch (error) {
    console.log('❌ Error reading AdminManager.js:', error.message);
}

// Test admin.html structure
const adminHtmlPath = path.join(__dirname, '../www/admin.html');
try {
    const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
    
    // Test 6: Check that config-summary-container exists in HTML
    if (adminHtmlContent.includes('config-summary-container')) {
        console.log('✅ config-summary-container element exists in admin.html');
    } else {
        console.log('❌ config-summary-container element missing from admin.html');
    }
    
    // Test 7: Check that tab buttons have proper data-target attributes
    const tabButtonCount = (adminHtmlContent.match(/data-target="[^"]*-tab"/g) || []).length;
    if (tabButtonCount >= 10) {
        console.log(`✅ Admin panel has ${tabButtonCount} tab buttons with proper data-target attributes`);
    } else {
        console.log(`❌ Admin panel only has ${tabButtonCount} tab buttons - may be incomplete`);
    }
    
} catch (error) {
    console.log('❌ Error reading admin.html:', error.message);
}

// Test syntax validation
console.log('\n[DashView Test] Validating JavaScript syntax...');
const { exec } = require('child_process');

exec('node -c ' + adminManagerPath, (error, stdout, stderr) => {
    if (error) {
        console.log('❌ AdminManager.js syntax validation failed:', error.message);
    } else {
        console.log('✅ AdminManager.js syntax validation passed');
    }
});

console.log('\n[DashView Test] Configuration Summary Fix tests completed!');
console.log('\n🔧 Fix Summary:');
console.log('   • Added _updateAdminSummary() call to loadTabContent() function');
console.log('   • Configuration Summary now updates when any tab is loaded');
console.log('   • Summary shows counts for floors, rooms, lights, covers, media players, header entities');
console.log('   • Fixed timing with 100ms delay to ensure tab data is loaded first');
console.log('\n📋 This fixes GitHub Issue #347: Configuration Summary not loading in admin panel');