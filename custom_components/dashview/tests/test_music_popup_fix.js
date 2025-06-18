// Test for music popup fix - Issue #167
// Validates that the music popup properly shows configured media players

const fs = require('fs');
const path = require('path');

class MusicPopupFixTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing music popup fix for Issue #167...');
        this.testMusicPopupMethodsExist();
        this.testMediaContainerInitializerUpdated();
        this.testMusicPopupContentGeneration();
        this.reportResults();
    }

    testMusicPopupMethodsExist() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the new music popup methods exist
        const hasGenerateContent = /_generateMusicPopupContent\s*\(popup\)/.test(jsContent);
        const hasGenerateRoomHTML = /_generateMusicRoomHTML\s*\(room\)/.test(jsContent);
        const hasSetupTabSwitching = /_setupMusicTabSwitching\s*\(popup\)/.test(jsContent);
        
        if (hasGenerateContent && hasGenerateRoomHTML && hasSetupTabSwitching) {
            this.testResults.push({ name: 'Music popup methods exist', passed: true });
            console.log('✓ Music popup methods properly added');
        } else {
            this.testResults.push({ name: 'Music popup methods exist', passed: false });
            console.log('❌ Music popup methods not found');
            console.log(`  Generate content: ${hasGenerateContent}, Generate room HTML: ${hasGenerateRoomHTML}, Setup tab switching: ${hasSetupTabSwitching}`);
        }
    }

    testMediaContainerInitializerUpdated() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the media container initializer handles music popup specially
        const componentInitializersMatch = jsContent.match(/_componentInitializers\s*=\s*{[\s\S]*?};/);
        if (componentInitializersMatch) {
            const initializersContent = componentInitializersMatch[0];
            
            // Should call _generateMusicPopupContent for music popup
            const callsGenerateContent = /_generateMusicPopupContent\(popup\)/.test(initializersContent);
            // Should have the conditional logic
            const hasConditional = /if\s*\(\s*popup\s*&&\s*popup\.id\s*===\s*['"']music-popup['"]/.test(initializersContent);
            
            if (callsGenerateContent && hasConditional) {
                this.testResults.push({ name: 'Media container initializer updated', passed: true });
                console.log('✓ Media container initializer properly handles music popup');
            } else {
                this.testResults.push({ name: 'Media container initializer updated', passed: false });
                console.log('❌ Media container initializer not properly updated');
                console.log(`  Calls generate content: ${callsGenerateContent}, Has conditional: ${hasConditional}`);
            }
        } else {
            this.testResults.push({ name: 'Media container initializer updated', passed: false });
            console.log('❌ Component initializers not found');
        }
    }

    testMusicPopupContentGeneration() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check that the _generateMusicPopupContent method has the expected logic
        const generateContentMatch = jsContent.match(/_generateMusicPopupContent\(popup\)\s*{[\s\S]*?(?=\n\s*_\w+|$)/);
        if (generateContentMatch) {
            const methodContent = generateContentMatch[0];
            
            // Should check for room configuration
            const checksRoomConfig = /this\._houseConfig\?\.rooms/.test(methodContent);
            // Should find rooms with media players
            const findsMediaPlayerRooms = /media_players\s*&&\s*Array\.isArray\(.*media_players\)/.test(methodContent);
            // Should generate tabs and content
            const generatesTabs = /music-tab-chip/.test(methodContent);
            const generatesContent = /music-room-content/.test(methodContent);
            // Should setup tab switching
            const setupsTabSwitching = /_setupMusicTabSwitching\(popup\)/.test(methodContent);
            
            const allChecks = checksRoomConfig && findsMediaPlayerRooms && generatesTabs && generatesContent && setupsTabSwitching;
            
            if (allChecks) {
                this.testResults.push({ name: 'Music popup content generation logic', passed: true });
                console.log('✓ Music popup content generation logic is correct');
            } else {
                this.testResults.push({ name: 'Music popup content generation logic', passed: false });
                console.log('❌ Music popup content generation logic incomplete');
                console.log(`  Room config: ${checksRoomConfig}, Media player rooms: ${findsMediaPlayerRooms}, Tabs: ${generatesTabs}, Content: ${generatesContent}, Tab switching: ${setupsTabSwitching}`);
            }
        } else {
            this.testResults.push({ name: 'Music popup content generation logic', passed: false });
            console.log('❌ _generateMusicPopupContent method not found');
        }
    }

    reportResults() {
        console.log('\n--- Test Results ---');
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
        });

        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\nSummary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All music popup fix tests passed!');
        } else {
            console.log('❌ Some music popup fix tests failed!');
            process.exit(1);
        }
    }
}

module.exports = MusicPopupFixTests;

// Run tests if called directly
if (require.main === module) {
    const testRunner = new MusicPopupFixTests();
    testRunner.runAllTests();
}