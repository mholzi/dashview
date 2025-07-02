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
    
    // Test 2: Verify navigation buttons structure (without home button)
    function testNavigationButtonStructure() {
        const indexPath = path.join(__dirname, 'custom_components/dashview/www/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Verify no home button is present
        const hasHomeButton = indexContent.includes('data-hash="#home"');
        const hasHomeIcon = indexContent.includes('mdi-home');
        
        // Verify other navigation buttons are present
        const hasSecurityButton = indexContent.includes('data-hash="#security"');
        const hasCalendarButton = indexContent.includes('data-hash="#calendar"');
        
        if (!hasHomeButton && !hasHomeIcon && hasSecurityButton && hasCalendarButton) {
            console.log('✓ Navigation structure correct (no home button, other buttons present)');
            return true;
        } else {
            console.error('✗ Navigation structure incorrect');
            if (hasHomeButton) console.error('  Unexpected home button found');
            if (hasHomeIcon) console.error('  Unexpected mdi-home icon found');
            if (!hasSecurityButton) console.error('  Missing security button');
            if (!hasCalendarButton) console.error('  Missing calendar button');
            return false;
        }
    }
    
    // Test 3: Verify PopupManager active state handling
    function testPopupManagerActiveStateHandling() {
        const popupManagerPath = path.join(__dirname, 'custom_components/dashview/www/lib/ui/popup-manager.js');
        const popupManagerContent = fs.readFileSync(popupManagerPath, 'utf8');
        
        // Check that the activeButton logic is properly implemented
        const hasActiveButtonLogic = popupManagerContent.includes('const activeButton = this._shadowRoot.querySelector(`.nav-button[data-hash="${hash}"]`);');
        const hasAlwaysComment = popupManagerContent.includes('Always set active button based on current hash');
        const hasAddActiveClass = popupManagerContent.includes('activeButton.classList.add(\'active\')');
        
        if (hasActiveButtonLogic && hasAddActiveClass) {
            console.log('✓ PopupManager properly handles active state navigation');
            return true;
        } else {
            console.error('✗ PopupManager active state handling incomplete');
            if (!hasActiveButtonLogic) console.error('  Missing active button selection logic');
            if (!hasAddActiveClass) console.error('  Missing active class addition');
            return false;
        }
    }
    
    // Test 4: Verify navigation button set (without home)
    function testNavigationSet() {
        const indexPath = path.join(__dirname, 'custom_components/dashview/www/index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        const expectedButtons = [
            { hash: '#security', icon: 'mdi-security', name: 'Security' },
            { hash: '#calendar', icon: 'mdi-calendar', name: 'Calendar' },
            { hash: '#music', icon: 'mdi-music', name: 'Music' },
            { hash: '#admin', icon: 'mdi-cog', name: 'Admin' }
        ];
        
        // Verify home button is NOT present
        const hasHomeButton = indexContent.includes('data-hash="#home"');
        const hasHomeIcon = indexContent.includes('mdi-home');
        
        let allButtonsCorrect = !hasHomeButton && !hasHomeIcon;
        
        expectedButtons.forEach(button => {
            const hasHash = indexContent.includes(`data-hash="${button.hash}"`);
            const hasIcon = indexContent.includes(button.icon);
            
            if (hasHash && hasIcon) {
                console.log(`  ✓ ${button.name} button present`);
            } else {
                console.error(`  ✗ ${button.name} button missing or incomplete`);
                allButtonsCorrect = false;
            }
        });
        
        if (hasHomeButton || hasHomeIcon) {
            console.error('  ✗ Home button found (should be removed)');
            allButtonsCorrect = false;
        } else {
            console.log('  ✓ Home button correctly removed');
        }
        
        if (allButtonsCorrect) {
            console.log('✓ Navigation button set verified (no home button)');
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
        testNavigationButtonStructure(),
        testPopupManagerActiveStateHandling(),
        testNavigationSet(),
        testBackwardsCompatibility()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n[DashView] Navigation enhancement tests: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('✅ All navigation enhancement tests passed!');
        console.log('🎯 UX improvement successfully implemented:');
        console.log('   • Enhanced visual active states with background, shadow, and scale');
        console.log('   • Smooth transitions and hover effects');
        console.log('   • Visual indicator dot for active state');
        console.log('   • Proper hash-based navigation handling');
        console.log('   • Navigation without home button as requested');
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