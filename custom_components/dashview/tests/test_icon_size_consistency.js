// Test for icon size consistency across the DashView interface
// Validates that all interactive icons use a consistent 24px size

const fs = require('fs');
const path = require('path');

class IconSizeConsistencyTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing icon size consistency...');
        
        this.testNavigationIconSize();
        this.testKioskButtonIconSize();
        this.testHeaderButtonIconSize();
        this.testIconSizeConsistency();
        
        this.reportResults();
        return this.testResults.every(result => result.passed);
    }

    testNavigationIconSize() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that navigation buttons use 40px icons
        const navButtonRule = /\.nav-button\s*\{[^}]*font-size:\s*40px[^}]*\}/s.test(cssContent);
        
        if (navButtonRule) {
            this.testResults.push({ name: 'Navigation buttons use 40px icons', passed: true });
            console.log('✓ Navigation buttons correctly use 40px icons');
        } else {
            this.testResults.push({ name: 'Navigation buttons use 40px icons', passed: false });
            console.log('❌ Navigation buttons do not use 40px icons');
        }
    }

    testKioskButtonIconSize() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that kiosk button uses 24px icons
        const kioskButtonRule = /\.kiosk-button\s+\.icon\s*\{[^}]*font-size:\s*24px[^}]*\}/s.test(cssContent);
        
        if (kioskButtonRule) {
            this.testResults.push({ name: 'Kiosk button uses 24px icons', passed: true });
            console.log('✓ Kiosk button correctly uses 24px icons');
        } else {
            this.testResults.push({ name: 'Kiosk button uses 24px icons', passed: false });
            console.log('❌ Kiosk button does not use 24px icons');
        }
    }

    testHeaderButtonIconSize() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that header floor and room button icons use 24px
        const headerButtonRule = /\.header-floor-button\s+i\s*,\s*\.header-room-button\s+i\s*\{[^}]*font-size:\s*24px[^}]*width:\s*24px[^}]*height:\s*24px[^}]*\}/s.test(cssContent);
        
        if (headerButtonRule) {
            this.testResults.push({ name: 'Header buttons use 24px icons', passed: true });
            console.log('✓ Header buttons correctly use 24px icons');
        } else {
            this.testResults.push({ name: 'Header buttons use 24px icons', passed: false });
            console.log('❌ Header buttons do not use 24px icons');
        }
    }

    testIconSizeConsistency() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Extract all icon-related font-size values for interactive elements
        const iconSizeMatches = [
            ...cssContent.matchAll(/\.nav-button\s*\{[^}]*font-size:\s*(\d+px)[^}]*\}/gs),
            ...cssContent.matchAll(/\.kiosk-button\s+\.icon\s*\{[^}]*font-size:\s*(\d+px)[^}]*\}/gs),
            ...cssContent.matchAll(/\.header-floor-button\s+i\s*,\s*\.header-room-button\s+i\s*\{[^}]*font-size:\s*(\d+px)[^}]*\}/gs)
        ];
        
        const iconSizes = iconSizeMatches.map(match => match[1]).filter(Boolean);
        const uniqueSizes = [...new Set(iconSizes)];
        
        // Check if all interactive icons use the same size
        if (uniqueSizes.length === 1 && uniqueSizes[0] === '24px') {
            this.testResults.push({ name: 'All interactive icons have consistent 24px size', passed: true });
            console.log('✓ All interactive icons use consistent 24px sizing');
        } else {
            this.testResults.push({ name: 'All interactive icons have consistent 24px size', passed: false });
            console.log(`❌ Icon sizes are inconsistent: ${uniqueSizes.join(', ')}`);
        }
    }

    reportResults() {
        console.log('\n[DashView] Icon Size Consistency Test Results:');
        console.log('==============================================');
        
        let passCount = 0;
        this.testResults.forEach(result => {
            const status = result.passed ? '✓ PASS' : '❌ FAIL';
            console.log(`${status}: ${result.name}`);
            if (result.passed) passCount++;
        });
        
        console.log(`\nSummary: ${passCount}/${this.testResults.length} tests passed`);
        
        if (passCount === this.testResults.length) {
            console.log('🎉 All icon size consistency tests passed!');
        } else {
            console.log('❌ Some icon size consistency tests failed.');
        }
    }
}

module.exports = IconSizeConsistencyTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new IconSizeConsistencyTests();
    const success = testRunner.runAllTests();
    process.exit(success ? 0 : 1);
}