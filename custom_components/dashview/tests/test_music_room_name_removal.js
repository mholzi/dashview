// Test for music room name removal from cover image area
// Validates that room names are not displayed above the media cover image

const fs = require('fs');
const path = require('path');

class MusicRoomNameRemovalTests {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('[DashView] Testing music room name removal from cover image area...');
        this.testCurrentMusicRoomHTML();
        this.testRoomNameNotInMediaDisplay();
        this.reportResults();
    }

    testCurrentMusicRoomHTML() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Find the _generateMusicRoomHTML function
        const musicRoomHTMLMatch = jsContent.match(/_generateMusicRoomHTML\s*\([^)]+\)\s*{[\s\S]*?return `[\s\S]*?`[\s\S]*?}/);
        
        if (musicRoomHTMLMatch) {
            const musicRoomHTMLContent = musicRoomHTMLMatch[0];
            
            // Test current state - should NOT contain media-room-header after fix
            const hasMediaRoomHeader = /media-room-header/.test(musicRoomHTMLContent);
            const hasMediaRoomTitle = /media-room-title/.test(musicRoomHTMLContent);
            const hasRoomFriendlyName = /\${room\.friendly_name}/.test(musicRoomHTMLContent);
            
            console.log(`Media room header present: ${hasMediaRoomHeader}`);
            console.log(`Media room title class present: ${hasMediaRoomTitle}`);
            console.log(`Room friendly name interpolation present: ${hasRoomFriendlyName}`);
            
            // For the fix, we expect these to be false
            if (!hasMediaRoomHeader && !hasMediaRoomTitle && !hasRoomFriendlyName) {
                this.testResults.push({ name: 'Room name removed from music display', passed: true });
                console.log('✓ Room name successfully removed from music room display');
            } else {
                this.testResults.push({ name: 'Room name removed from music display', passed: false });
                console.log('❌ Room name still present in music room display');
            }
        } else {
            this.testResults.push({ name: 'Music room HTML function exists', passed: false });
            console.log('❌ _generateMusicRoomHTML function not found');
        }
    }

    testRoomNameNotInMediaDisplay() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Find the _generateMusicRoomHTML function
        const musicRoomHTMLMatch = jsContent.match(/_generateMusicRoomHTML\s*\([^)]+\)\s*{[\s\S]*?return `[\s\S]*?`[\s\S]*?}/);
        
        if (musicRoomHTMLMatch) {
            const musicRoomHTMLContent = musicRoomHTMLMatch[0];
            
            // Check that the HTML structure is still valid
            const hasMediaDisplay = /media-display/.test(musicRoomHTMLContent);
            const hasMediaCover = /media-cover/.test(musicRoomHTMLContent);
            const hasMediaControls = /media-controls/.test(musicRoomHTMLContent);
            const hasMediaPresets = /media-presets/.test(musicRoomHTMLContent);
            
            if (hasMediaDisplay && hasMediaCover && hasMediaControls && hasMediaPresets) {
                this.testResults.push({ name: 'Essential media components preserved', passed: true });
                console.log('✓ Essential media components (display, cover, controls, presets) are preserved');
            } else {
                this.testResults.push({ name: 'Essential media components preserved', passed: false });
                console.log('❌ Some essential media components are missing');
                console.log(`  Media display: ${hasMediaDisplay}, Cover: ${hasMediaCover}, Controls: ${hasMediaControls}, Presets: ${hasMediaPresets}`);
            }
        }
    }

    reportResults() {
        console.log('\n--- Test Results ---');
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            if (result.passed) {
                console.log(`✅ ${result.name}`);
                passed++;
            } else {
                console.log(`❌ ${result.name}`);
                failed++;
            }
        });
        
        console.log(`\nSummary: ${passed}/${passed + failed} tests passed`);
        
        if (failed === 0) {
            console.log('🎉 All music room name removal tests passed!');
        } else {
            console.log('❌ Some tests failed');
            process.exit(1);
        }
    }
}

// Mock classes for testing (minimal implementation)
class MockDashViewPanel {
    constructor() {
        this._hass = {
            states: {
                'media_player.echo_buero': {
                    attributes: { friendly_name: 'Echo Büro' }
                }
            }
        };
    }
    
    _generateMusicRoomHTML(room) {
        // This would be replaced by the actual implementation during testing
        return '';
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tests = new MusicRoomNameRemovalTests();
    tests.runAllTests();
}

module.exports = MusicRoomNameRemovalTests;