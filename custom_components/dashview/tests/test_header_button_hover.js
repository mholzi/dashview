// Test for header button hover effects
// Validates that floor buttons don't have hover effects while room buttons do

const fs = require('fs');
const path = require('path');

class HeaderButtonHoverTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing header button hover effects...');
        
        this.testFloorButtonNoHover();
        this.testRoomButtonHasHover();
        this.testCSSValidSyntax();
        
        this.reportResults();
        return this.testResults.every(result => result.passed);
    }

    testFloorButtonNoHover() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that floor buttons don't have hover effects (should not be in any hover rule with transform)
        const floorHoverInCombinedRule = /\.header-floor-button:hover\s*,\s*\.header-room-button:hover\s*\{[^}]*transform[^}]*\}/s.test(cssContent);
        const floorHoverInSeparateRule = /\.header-floor-button:hover\s*\{[^}]*transform[^}]*\}/s.test(cssContent);
        const hasFloorHover = floorHoverInCombinedRule || floorHoverInSeparateRule;
        
        if (!hasFloorHover) {
            this.testResults.push({ name: 'Floor buttons have no hover transform effect', passed: true });
            console.log('✓ Floor buttons correctly have no hover transform effect');
        } else {
            this.testResults.push({ name: 'Floor buttons have no hover transform effect', passed: false });
            console.log('❌ Floor buttons still have hover transform effect');
        }
    }

    testRoomButtonHasHover() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check that room buttons have hover effects (either in combined rule or separate rule)
        const roomHoverInCombinedRule = /\.header-floor-button:hover\s*,\s*\.header-room-button:hover\s*\{[^}]*transform[^}]*\}/s.test(cssContent);
        const roomHoverInSeparateRule = /\.header-room-button:hover\s*\{[^}]*transform[^}]*\}/s.test(cssContent);
        const hasRoomHover = roomHoverInCombinedRule || roomHoverInSeparateRule;
        
        if (hasRoomHover) {
            this.testResults.push({ name: 'Room buttons maintain hover transform effect', passed: true });
            console.log('✓ Room buttons correctly maintain hover transform effect');
        } else {
            this.testResults.push({ name: 'Room buttons maintain hover transform effect', passed: false });
            console.log('❌ Room buttons are missing hover transform effect');
        }
    }

    testCSSValidSyntax() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Validate CSS syntax around header buttons
        let braceCount = 0;
        const lines = cssContent.split('\n');
        let hasValidSyntax = true;
        let errorLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            braceCount += openBraces - closeBraces;
            
            if (braceCount < 0) {
                hasValidSyntax = false;
                errorLine = i + 1;
                break;
            }
        }
        
        if (braceCount !== 0) {
            hasValidSyntax = false;
        }
        
        if (hasValidSyntax) {
            this.testResults.push({ name: 'CSS syntax is valid after changes', passed: true });
            console.log('✓ CSS syntax is valid');
        } else {
            this.testResults.push({ name: 'CSS syntax is valid after changes', passed: false });
            if (errorLine > -1) {
                console.log(`❌ CSS syntax error at line ${errorLine}`);
            } else {
                console.log('❌ CSS syntax error: unmatched braces');
            }
        }
    }

    reportResults() {
        console.log('\n[DashView] Header Button Hover Test Results:');
        console.log('==========================================');
        
        let passCount = 0;
        this.testResults.forEach(result => {
            const status = result.passed ? '✓ PASS' : '❌ FAIL';
            console.log(`${status}: ${result.name}`);
            if (result.passed) passCount++;
        });
        
        console.log(`\nSummary: ${passCount}/${this.testResults.length} tests passed`);
        
        if (passCount === this.testResults.length) {
            console.log('🎉 All header button hover tests passed!');
        } else {
            console.log('❌ Some header button hover tests failed.');
        }
    }
}

module.exports = HeaderButtonHoverTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new HeaderButtonHoverTests();
    testRunner.runAllTests();
}