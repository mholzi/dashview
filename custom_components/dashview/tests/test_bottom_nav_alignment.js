const fs = require('fs');
const path = require('path');

class BottomNavAlignmentTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing bottom navigation alignment...');
        
        this.testBottomNavCentering();
        this.testBottomNavMaxWidth();
        this.testDashboardContainerAlignment();
        this.reportResults();
    }

    testBottomNavCentering() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check if .bottom-nav uses proper centering
        const bottomNavSection = cssContent.match(/\.bottom-nav\s*{[^}]*}/s);
        if (bottomNavSection) {
            const sectionText = bottomNavSection[0];
            
            // Check if it uses left/right positioning that doesn't properly center
            const hasLeftRightPositioning = /left:\s*8px[^}]*right:\s*8px/.test(sectionText);
            
            // Check if it has proper centering approach (left: 50% + transform or just margin centering)
            const hasProperCentering = /left:\s*50%/.test(sectionText) || (!hasLeftRightPositioning && /margin:\s*0\s+auto/.test(sectionText));
            
            if (hasProperCentering && !hasLeftRightPositioning) {
                this.testResults.push({ name: 'Bottom nav uses proper centering', passed: true });
                console.log('✓ Bottom navigation uses proper centering approach');
            } else {
                this.testResults.push({ name: 'Bottom nav uses proper centering', passed: false });
                console.log('❌ Bottom navigation does not use proper centering - uses left/right positioning');
            }
        } else {
            this.testResults.push({ name: 'Bottom nav uses proper centering', passed: false });
            console.log('❌ Could not find .bottom-nav CSS section');
        }
    }

    testBottomNavMaxWidth() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check if .bottom-nav has same max-width as dashboard container
        const bottomNavSection = cssContent.match(/\.bottom-nav\s*{[^}]*}/s);
        const dashboardSection = cssContent.match(/\.dashboard-container\s*{[^}]*}/s);
        
        if (bottomNavSection && dashboardSection) {
            const bottomNavMaxWidth = bottomNavSection[0].match(/max-width:\s*500px/);
            const dashboardMaxWidth = dashboardSection[0].match(/max-width:\s*500px/);
            
            if (bottomNavMaxWidth && dashboardMaxWidth) {
                this.testResults.push({ name: 'Bottom nav and dashboard have matching max-width', passed: true });
                console.log('✓ Bottom navigation and dashboard container have matching max-width: 500px');
            } else {
                this.testResults.push({ name: 'Bottom nav and dashboard have matching max-width', passed: false });
                console.log('❌ Bottom navigation and dashboard container do not have matching max-width');
            }
        } else {
            this.testResults.push({ name: 'Bottom nav and dashboard have matching max-width', passed: false });
            console.log('❌ Could not find both .bottom-nav and .dashboard-container CSS sections');
        }
    }

    testDashboardContainerAlignment() {
        const cssPath = path.join(__dirname, '../www/style.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Verify dashboard container uses proper centering
        const dashboardSection = cssContent.match(/\.dashboard-container\s*{[^}]*}/s);
        if (dashboardSection) {
            const sectionText = dashboardSection[0];
            const hasProperCentering = /margin:\s*0\s+auto/.test(sectionText) && /max-width:\s*500px/.test(sectionText);
            
            if (hasProperCentering) {
                this.testResults.push({ name: 'Dashboard container uses proper centering', passed: true });
                console.log('✓ Dashboard container uses proper centering with margin: 0 auto');
            } else {
                this.testResults.push({ name: 'Dashboard container uses proper centering', passed: false });
                console.log('❌ Dashboard container does not use proper centering');
            }
        } else {
            this.testResults.push({ name: 'Dashboard container uses proper centering', passed: false });
            console.log('❌ Could not find .dashboard-container CSS section');
        }
    }

    reportResults() {
        const passed = this.testResults.filter(result => result.passed).length;
        const total = this.testResults.length;
        
        console.log(`\n[DashView] Bottom Navigation Alignment Tests: ${passed}/${total} passed`);
        
        if (passed === total) {
            console.log('✅ All bottom navigation alignment tests passed!');
        } else {
            console.log('❌ Some bottom navigation alignment tests failed');
            this.testResults.forEach(result => {
                if (!result.passed) {
                    console.log(`  ❌ ${result.name}`);
                }
            });
        }
        
        return passed === total;
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new BottomNavAlignmentTests();
    tester.runAllTests();
}

module.exports = BottomNavAlignmentTests;