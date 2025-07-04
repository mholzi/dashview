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
        
        // Find the _generateMusicPopupContent function (updated function name)
        let start = jsContent.indexOf('_generateMusicPopupContent(popup) {');
        let musicPopupContentFunction = null;
        
        if (start !== -1) {
            let braceCount = 0;
            let inFunction = false;
            let end = start;
            
            for (let i = start; i < jsContent.length; i++) {
                if (jsContent[i] === '{') {
                    braceCount++;
                    inFunction = true;
                } else if (jsContent[i] === '}') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        end = i + 1;
                        break;
                    }
                }
            }
            
            musicPopupContentFunction = jsContent.substring(start, end);
        }
        
        if (musicPopupContentFunction) {
            
            // Test current state - should NOT contain media-room-header after fix
            const hasMediaRoomHeader = /media-room-header/.test(musicPopupContentFunction);
            const hasMediaRoomTitle = /media-room-title/.test(musicPopupContentFunction);
            
            // Check for room name in the media content area (ignore tab button friendly name usage)
            const contentHTMLPart = musicPopupContentFunction.replace(/tabContainer\.innerHTML[\s\S]*?join\('\'\);/, '');
            const hasRoomNameInContent = /\${.*?friendly_name.*?}/.test(contentHTMLPart);
            
            console.log(`Media room header present: ${hasMediaRoomHeader}`);
            console.log(`Media room title class present: ${hasMediaRoomTitle}`);
            console.log(`Room friendly name in content area: ${hasRoomNameInContent}`);
            
            // For the fix, we expect these to be false (room names should only be in tabs)
            if (!hasMediaRoomHeader && !hasMediaRoomTitle && !hasRoomNameInContent) {
                this.testResults.push({ name: 'Room name removed from music display', passed: true });
                console.log('✓ Room name successfully removed from music room display');
            } else {
                this.testResults.push({ name: 'Room name removed from music display', passed: false });
                console.log('❌ Room name still present in music room display');
            }
        } else {
            this.testResults.push({ name: 'Music popup content function exists', passed: false });
            console.log('❌ _generateMusicPopupContent function not found');
        }
    }

    testRoomNameNotInMediaDisplay() {
        const jsPath = path.join(__dirname, '../www/dashview-panel.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Find the _generateMusicPopupContent function  
        let start = jsContent.indexOf('_generateMusicPopupContent(popup) {');
        let musicPopupContentFunction = null;
        
        if (start !== -1) {
            let braceCount = 0;
            let inFunction = false;
            let end = start;
            
            for (let i = start; i < jsContent.length; i++) {
                if (jsContent[i] === '{') {
                    braceCount++;
                    inFunction = true;
                } else if (jsContent[i] === '}') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        end = i + 1;
                        break;
                    }
                }
            }
            
            musicPopupContentFunction = jsContent.substring(start, end);
        }
        
        if (musicPopupContentFunction) {
            
            // Check that the HTML structure contains essential media components
            // Look for media-player-card and media-player-container which are the core components
            const hasMediaPlayerCard = /media-player-card/.test(musicPopupContentFunction);
            const hasMediaPlayerContainer = /media-player-container/.test(musicPopupContentFunction);
            const hasMusicRoomContent = /music-room-content/.test(musicPopupContentFunction);
            
            // Check that media player manager is still initialized
            const hasMediaPlayerInit = /_mediaPlayerManager/.test(musicPopupContentFunction);
            
            if (hasMediaPlayerCard && hasMediaPlayerContainer && hasMusicRoomContent && hasMediaPlayerInit) {
                this.testResults.push({ name: 'Essential media components preserved', passed: true });
                console.log('✓ Essential media components (player card, container, room content, manager) are preserved');
            } else {
                this.testResults.push({ name: 'Essential media components preserved', passed: false });
                console.log('❌ Some essential media components are missing');
                console.log(`  Media player card: ${hasMediaPlayerCard}, Container: ${hasMediaPlayerContainer}, Room content: ${hasMusicRoomContent}, Manager init: ${hasMediaPlayerInit}`);
            }
        } else {
            this.testResults.push({ name: 'Essential media components preserved', passed: false });
            console.log('❌ _generateMusicPopupContent function not found');
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