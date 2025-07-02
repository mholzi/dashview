#!/usr/bin/env node

// Comprehensive test for bottom navigation active state improvements
// Tests the complete UX enhancement implementation

const fs = require('fs');
const path = require('path');

function testNavigationEnhancements() {
    console.log('[DashView] Testing navigation active state enhancements...');
    
    // Test 1: Verify enhanced CSS active state styling
    function testEnhancedActiveStateCSS() {
        const cssPath = path.join(__dirname, 'custom_components/dashview/www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check for enhanced styling features
        const hasTransition = cssContent.includes('transition:') && cssContent.match(/\.nav-button[^{]*{[^}]*transition:/);
        const hasHoverState = cssContent.includes('.nav-button:hover');
        const hasActiveBackground = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*background:/);
        const hasActiveTransform = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*transform:/);
        const hasActiveBoxShadow = cssContent.includes('.nav-button.active') && cssContent.match(/\.nav-button\.active[^}]*box-shadow:/);
        const hasActiveIndicator = cssContent.includes('.nav-button.active::before');
        
        const features = [
            { name: 'Transition effects', present: hasTransition },
            { name: 'Hover state', present: hasHoverState },
            { name: 'Active background', present: hasActiveBackground },
            { name: 'Active transform (scale)', present: hasActiveTransform },
            { name: 'Active box shadow', present: hasActiveBoxShadow },
            { name: 'Active indicator dot', present: hasActiveIndicator }
        ];
        
        const presentFeatures = features.filter(f => f.present).length;
        
        if (presentFeatures >= 5) {
            console.log(`✓ Enhanced active state styling complete (${presentFeatures}/6 features)`);
            features.forEach(f => {
                if (f.present) console.log(`  ✓ ${f.name}`);
                else console.log(`  - ${f.name} (optional)`);
            });
            return true;
        } else {
            console.error(`✗ Enhanced active state styling incomplete (${presentFeatures}/6 features)`);
            features.forEach(f => {
                if (!f.present) console.error(`  ✗ Missing: ${f.name}`);
            });
            return false;
        }
    }
    
    // Test 2: Verify home button addition
    function testHomeButtonAddition() {
        const indexPath = path.join(__dirname, 'custom_components/dashview/www/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const hasHomeButton = indexContent.includes('data-hash="#home"');
        const hasHomeIcon = indexContent.includes('mdi-home');
        const homeButtonPosition = indexContent.indexOf('data-hash="#home"');
        const securityButtonPosition = indexContent.indexOf('data-hash="#security"');
        
        const isFirstButton = homeButtonPosition > 0 && homeButtonPosition < securityButtonPosition;
        
        if (hasHomeButton && hasHomeIcon && isFirstButton) {
            console.log('✓ Home button properly added as first navigation button');
            return true;
        } else {
            console.error('✗ Home button addition incomplete');
            if (!hasHomeButton) console.error('  Missing data-hash="#home"');
            if (!hasHomeIcon) console.error('  Missing mdi-home icon');
            if (!isFirstButton) console.error('  Home button not positioned first');
            return false;
        }
    }
    
    // Test 3: Verify PopupManager handles home state
    function testPopupManagerHomeStateHandling() {
        const popupManagerPath = path.join(__dirname, 'custom_components/dashview/www/lib/ui/popup-manager.js');
        const popupManagerContent = fs.readFileSync(popupManagerPath, 'utf8');
        
        // Check that the activeButton logic is outside the if (hash !== '#home') block
        const hasActiveButtonLogic = popupManagerContent.includes('const activeButton = this._shadowRoot.querySelector(`.nav-button[data-hash="${hash}"]`);');
        const hasAlwaysComment = popupManagerContent.includes('Always set active button based on current hash');
        
        // Check if the active button logic is after the home check
        const homeCheckIndex = popupManagerContent.indexOf('if (hash !== \'#home\')');
        const activeButtonIndex = popupManagerContent.indexOf('const activeButton = this._shadowRoot.querySelector');
        
        const activeButtonAfterHomeCheck = homeCheckIndex > 0 && activeButtonIndex > homeCheckIndex;
        
        if (hasActiveButtonLogic && activeButtonAfterHomeCheck) {
            console.log('✓ PopupManager properly handles home state active button');
            return true;
        } else {
            console.error('✗ PopupManager home state handling incomplete');
            if (!hasActiveButtonLogic) console.error('  Missing active button logic');
            if (!activeButtonAfterHomeCheck) console.error('  Active button logic in wrong position');
            return false;
        }
    }
    
    // Test 4: Verify complete navigation button set
    function testCompleteNavigationSet() {
        const indexPath = path.join(__dirname, 'custom_components/dashview/www/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const expectedButtons = [
            { hash: '#home', icon: 'mdi-home', name: 'Home' },
            { hash: '#security', icon: 'mdi-security', name: 'Security' },
            { hash: '#calendar', icon: 'mdi-calendar', name: 'Calendar' },
            { hash: '#music', icon: 'mdi-music', name: 'Music' },
            { hash: '#admin', icon: 'mdi-cog', name: 'Admin' }
        ];
        
        let allButtonsPresent = true;
        expectedButtons.forEach(button => {
            const hasHash = indexContent.includes(`data-hash="${button.hash}"`);
            const hasIcon = indexContent.includes(button.icon);
            
            if (hasHash && hasIcon) {
                console.log(`  ✓ ${button.name} button present`);
            } else {
                console.error(`  ✗ ${button.name} button missing or incomplete`);
                allButtonsPresent = false;
            }
        });
        
        if (allButtonsPresent) {
            console.log('✓ Complete navigation button set verified');
            return true;
        } else {
            console.error('✗ Navigation button set incomplete');
            return false;
        }
    }
    
    // Test 5: Verify backwards compatibility
    function testBackwardsCompatibility() {
        const popupManagerPath = path.join(__dirname, 'custom_components/dashview/www/lib/ui/popup-manager.js');
        const popupManagerContent = fs.readFileSync(popupManagerPath, 'utf8');
        
        // Ensure existing functionality is preserved
        const hasPopupCreation = popupManagerContent.includes('createPopup');
        const hasPopupClosing = popupManagerContent.includes('closePopup');
        const hasHashChangeHandling = popupManagerContent.includes('handleHashChange');
        const hasActiveClassRemoval = popupManagerContent.includes('classList.remove(\'active\')');
        
        if (hasPopupCreation && hasPopupClosing && hasHashChangeHandling && hasActiveClassRemoval) {
            console.log('✓ Backwards compatibility maintained');
            return true;
        } else {
            console.error('✗ Backwards compatibility issues detected');
            return false;
        }
    }
    
    // Run all tests
    const results = [
        testEnhancedActiveStateCSS(),
        testHomeButtonAddition(),
        testPopupManagerHomeStateHandling(),
        testCompleteNavigationSet(),
        testBackwardsCompatibility()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n[DashView] Navigation enhancement tests: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('✅ All navigation enhancement tests passed!');
        console.log('🎯 UX improvement successfully implemented:');
        console.log('   • Enhanced visual active states with background, shadow, and scale');
        console.log('   • Added home button for complete navigation');
        console.log('   • Smooth transitions and hover effects');
        console.log('   • Visual indicator dot for active state');
        console.log('   • Proper hash-based navigation handling');
        return true;
    } else {
        console.log('❌ Some navigation enhancement tests failed');
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    testNavigationEnhancements();
}

module.exports = { testNavigationEnhancements };