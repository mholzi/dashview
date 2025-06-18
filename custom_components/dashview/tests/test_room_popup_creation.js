// Test for room popup creation fix - Issue #105
// Validates that room popups are created dynamically without attempting to fetch HTML files

const fs = require('fs');
const path = require('path');

class RoomPopupCreationTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing room popup creation behavior...');
        this.testHandleHashChangeRoomLogic();
        this.testRoomDetectionLogic();
        this.testSystemPageFetchLogic();
        this.reportResults();
    }

    testHandleHashChangeRoomLogic() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that handleHashChange function has the new room detection logic
        const handleHashChangeFunction = jsContent.match(/const handleHashChange = async.*?};/s);
        if (handleHashChangeFunction) {
            const functionText = handleHashChangeFunction[0];
            
            // Should check for rooms before attempting fetch
            const hasRoomCheck = /const isRoom = this\._houseConfig && this\._houseConfig\.rooms && this\._houseConfig\.rooms\[popupType\]/.test(functionText);
            
            // Should create room popups with empty content
            const hasRoomCreation = /targetPopup = this\.createPopupFromTemplate\(popupId, popupType, ''\)/.test(functionText);
            
            // Should have separate system page logic
            const hasSystemPageLogic = /It's a system page.*Try to fetch its HTML file/.test(functionText);
            
            if (hasRoomCheck && hasRoomCreation && hasSystemPageLogic) {
                this.testResults.push({ name: 'handleHashChange has room detection logic', passed: true });
                console.log('✓ handleHashChange function correctly detects rooms vs system pages');
            } else {
                this.testResults.push({ name: 'handleHashChange has room detection logic', passed: false });
                console.log('❌ handleHashChange function missing proper room detection logic');
                console.log(`  Room check: ${hasRoomCheck}, Room creation: ${hasRoomCreation}, System logic: ${hasSystemPageLogic}`);
            }
        } else {
            this.testResults.push({ name: 'handleHashChange has room detection logic', passed: false });
            console.log('❌ Could not find handleHashChange function');
        }
    }

    testRoomDetectionLogic() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that room popups are created without fetch attempts
        const hasRoomBranch = /if \(isRoom\) {[\s\S]*?targetPopup = this\.createPopupFromTemplate\(popupId, popupType, ''\)/.test(jsContent);
        
        if (hasRoomBranch) {
            this.testResults.push({ name: 'Room popups created without fetch', passed: true });
            console.log('✓ Room popups are created dynamically without fetch attempts');
        } else {
            this.testResults.push({ name: 'Room popups created without fetch', passed: false });
            console.log('❌ Room popups still attempting fetch operations');
        }
    }

    testSystemPageFetchLogic() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that system pages still use fetch logic in else branch
        const hasSystemPageFetch = /} else {[\s\S]*?fetch\(`\/local\/dashview\/\${popupType}\.html`\)/.test(jsContent);
        
        if (hasSystemPageFetch) {
            this.testResults.push({ name: 'System pages still use fetch logic', passed: true });
            console.log('✓ System pages (admin, security, etc.) still use fetch logic');
        } else {
            this.testResults.push({ name: 'System pages still use fetch logic', passed: false });
            console.log('❌ System pages missing fetch logic');
        }
    }

    reportResults() {
        console.log('\n--- Room Popup Creation Test Results ---');
        const passed = this.testResults.filter(result => result.passed).length;
        const total = this.testResults.length;
        console.log(`Tests passed: ${passed}/${total}`);
        
        if (passed === total) {
            console.log('✅ All room popup creation tests passed!');
        } else {
            console.log('❌ Some room popup creation tests failed');
            this.testResults.forEach(result => {
                if (!result.passed) {
                    console.log(`  ❌ ${result.name}`);
                }
            });
        }
    }
}

module.exports = RoomPopupCreationTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new RoomPopupCreationTests();
    testRunner.runAllTests();
}