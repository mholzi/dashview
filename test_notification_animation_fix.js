#!/usr/bin/env node

/**
 * Test for notification animation fix
 * Validates that slide-in animations are removed from notification cards
 */

const fs = require('fs');
const path = require('path');

function testNotificationAnimationFix() {
    console.log('[DashView] Testing notification animation fix...');
    
    const cssPath = path.join(__dirname, 'custom_components/dashview/www/style.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test 1: Verify basic notification card has no slideInRight animation
    function testBasicNotificationCard() {
        const notificationCardRegex = /\.notification-card\s*{[^}]+}/g;
        const matches = cssContent.match(notificationCardRegex);
        
        if (!matches) {
            console.error('✗ No .notification-card CSS rule found');
            return false;
        }
        
        const basicCardRule = matches[0];
        const hasSlideInAnimation = basicCardRule.includes('slideInRight');
        
        if (hasSlideInAnimation) {
            console.error('✗ Basic notification card still has slideInRight animation');
            console.error('  Found rule:', basicCardRule.substring(0, 200) + '...');
            return false;
        }
        
        console.log('✓ Basic notification card has no slideInRight animation');
        return true;
    }
    
    // Test 2: Verify critical priority notification only has pulse animation
    function testCriticalNotificationCard() {
        const criticalCardRegex = /\.notification-card\[data-priority="critical"\]\s*{[^}]+}/g;
        const matches = cssContent.match(criticalCardRegex);
        
        if (!matches) {
            console.error('✗ No critical priority notification CSS rule found');
            return false;
        }
        
        const criticalCardRule = matches[0];
        const hasSlideInAnimation = criticalCardRule.includes('slideInRight');
        const hasPulseAnimation = criticalCardRule.includes('pulse');
        
        if (hasSlideInAnimation) {
            console.error('✗ Critical notification card still has slideInRight animation');
            console.error('  Found rule:', criticalCardRule);
            return false;
        }
        
        if (!hasPulseAnimation) {
            console.error('✗ Critical notification card is missing pulse animation');
            console.error('  Found rule:', criticalCardRule);
            return false;
        }
        
        // Verify it only has pulse, not slideInRight + pulse
        const animationMatch = criticalCardRule.match(/animation:\s*([^;]+);/);
        if (animationMatch) {
            const animationValue = animationMatch[1].trim();
            if (animationValue !== 'pulse 2s infinite') {
                console.error('✗ Critical notification animation should only be "pulse 2s infinite"');
                console.error('  Found:', animationValue);
                return false;
            }
        }
        
        console.log('✓ Critical notification card has only pulse animation');
        return true;
    }
    
    // Test 3: Verify slideOutRight animation is still present for dismissals
    function testSlideOutAnimation() {
        const hasSlideOutKeyframes = cssContent.includes('@keyframes slideOutRight');
        
        if (!hasSlideOutKeyframes) {
            console.error('✗ slideOutRight keyframes animation is missing');
            return false;
        }
        
        console.log('✓ slideOutRight animation is still available for dismissals');
        return true;
    }
    
    // Test 4: Verify slideInRight animation keyframes still exist (for other potential uses)
    function testSlideInKeyframes() {
        const hasSlideInKeyframes = cssContent.includes('@keyframes slideInRight');
        
        if (!hasSlideInKeyframes) {
            console.log('ℹ slideInRight keyframes removed (this is fine)');
        } else {
            console.log('ℹ slideInRight keyframes still exist (this is fine)');
        }
        
        return true;
    }
    
    // Run all tests
    const results = [
        testBasicNotificationCard(),
        testCriticalNotificationCard(), 
        testSlideOutAnimation(),
        testSlideInKeyframes()
    ];
    
    const allPassed = results.every(result => result);
    
    if (allPassed) {
        console.log('✅ All notification animation tests passed');
        console.log('🎯 Notifications will now appear stable without sliding in');
        return true;
    } else {
        console.error('❌ Some notification animation tests failed');
        return false;
    }
}

// Run the test
if (require.main === module) {
    const success = testNotificationAnimationFix();
    process.exit(success ? 0 : 1);
}

module.exports = { testNotificationAnimationFix };