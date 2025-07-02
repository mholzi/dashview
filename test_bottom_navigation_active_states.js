#!/usr/bin/env node

// Test bottom navigation active state functionality
// Tests the UX improvement for bottom navigation active indicators

const fs = require('fs');
const path = require('path');

function testBottomNavigationActiveStates() {
    console.log('[DashView] Testing bottom navigation active states...');
    
    // Test 1: Verify CSS active state styling exists
    function testCSSActiveStateExists() {
        const cssPath = path.join(__dirname, 'custom_components/dashview/www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        const hasBottomNavCSS = cssContent.includes('.bottom-nav');
        const hasNavButtonCSS = cssContent.includes('.nav-button');
        const hasActiveStateCSS = cssContent.includes('.nav-button.active');
        
        if (hasBottomNavCSS && hasNavButtonCSS && hasActiveStateCSS) {
            console.log('✓ Basic navigation CSS structure exists');
            return true;
        } else {
            console.error('✗ Missing basic navigation CSS structure');
            return false;
        }
    }
    
    // Test 2: Verify PopupManager handles active states
    function testPopupManagerHandlesActiveStates() {
        const popupManagerPath = path.join(__dirname, 'custom_components/dashview/www/lib/ui/popup-manager.js');
        const popupManagerContent = fs.readFileSync(popupManagerPath, 'utf8');
        
        const hasActiveClassRemoval = popupManagerContent.includes('classList.remove(\'active\')');
        const hasActiveClassAddition = popupManagerContent.includes('classList.add(\'active\')');
        const hasHashChangeHandler = popupManagerContent.includes('handleHashChange');
        
        if (hasActiveClassRemoval && hasActiveClassAddition && hasHashChangeHandler) {
            console.log('✓ PopupManager handles active state management');
            return true;
        } else {
            console.error('✗ PopupManager missing active state management');
            return false;
        }
    }
    
    // Test 3: Verify navigation buttons have proper data attributes
    function testNavigationButtonsHaveDataAttributes() {
        const indexPath = path.join(__dirname, 'custom_components/dashview/www/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const expectedButtons = ['#home', '#security', '#calendar', '#music', '#admin'];
        let foundButtons = 0;
        
        expectedButtons.forEach(hash => {
            if (indexContent.includes(`data-hash="${hash}"`)) {
                foundButtons++;
            }
        });
        
        if (foundButtons === expectedButtons.length) {
            console.log('✓ All navigation buttons have proper data-hash attributes');
            return true;
        } else {
            console.error(`✗ Missing data-hash attributes. Found ${foundButtons}/${expectedButtons.length}`);
            return false;
        }
    }
    
    // Test 4: Check for visual enhancement opportunities
    function testVisualEnhancementNeeds() {
        const cssPath = path.join(__dirname, 'custom_components/dashview/www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Look for enhanced active state styling
        const hasBackgroundActiveState = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*background/);
        const hasTransformActiveState = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*transform/);
        const hasBoxShadowActiveState = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*box-shadow/);
        
        let enhancementNeeded = 0;
        if (!hasBackgroundActiveState) enhancementNeeded++;
        if (!hasTransformActiveState) enhancementNeeded++;
        if (!hasBoxShadowActiveState) enhancementNeeded++;
        
        if (enhancementNeeded > 1) {
            console.log('! Visual enhancement needed - current active state only changes color');
            return false;
        } else {
            console.log('✓ Active state has good visual enhancement');
            return true;
        }
    }
    
    // Run all tests
    const results = [
        testCSSActiveStateExists(),
        testPopupManagerHandlesActiveStates(),
        testNavigationButtonsHaveDataAttributes(),
        testVisualEnhancementNeeds()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n[DashView] Bottom navigation tests: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('✓ All bottom navigation tests passed');
        return true;
    } else {
        console.log('! Some tests failed - improvements needed');
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    testBottomNavigationActiveStates();
}

module.exports = { testBottomNavigationActiveStates };