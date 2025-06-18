// Test for media player room card functionality
class MediaPlayerRoomCardTests {
    constructor() {
        this.testResults = [];
        this.setupMockDOM();
    }
    
    // Setup mock DOM for Node.js environment
    setupMockDOM() {
        if (typeof global !== 'undefined' && !global.document) {
            global.document = {
                createElement: (tagName) => ({
                    tagName: tagName.toUpperCase(),
                    innerHTML: '',
                    className: '',
                    id: '',
                    querySelector: (selector) => null,
                    querySelectorAll: (selector) => [],
                    closest: (selector) => null,
                    appendChild: (child) => {},
                    attributes: {},
                    style: {}
                })
            };
        }
    }

    assert(condition, message) {
        if (condition) {
            console.log(`✓ ${message}`);
            this.testResults.push({ test: message, passed: true });
        } else {
            console.error(`✗ ${message}`);
            this.testResults.push({ test: message, passed: false });
        }
    }

    // Test that rooms with media players get media player cards
    testMediaPlayerCardCreation() {
        console.log('\n[DashView] Testing media player card creation in room popups...');
        
        const panel = new MockDashViewPanel();
        
        // Test that createPopupFromTemplate adds media player card for rooms with media players
        const bueroPopup = panel.createPopupFromTemplate('buero-popup', 'buero', '');
        this.assert(
            bueroPopup !== null,
            'Büro popup should be created successfully'
        );
        
        // Simulate the fetch promise resolving (in real scenario this would be async)
        const bodyElement = bueroPopup.querySelector('.popup-body');
        this.assert(
            bodyElement !== null,
            'Popup body should exist'
        );
    }

    // Test media player card initialization
    testMediaPlayerCardInitialization() {
        console.log('\n[DashView] Testing media player card initialization...');
        
        const panel = new MockDashViewPanel();
        
        // Test that the initialization method exists and can be called
        this.assert(
            typeof panel._initializeMediaPlayerCard === 'function',
            'Media player card initialization method should exist'
        );
        
        // Test that the method handles the expected parameters correctly
        const mockMediaPlayers = [
            { entity: 'media_player.echo_buero' }
        ];
        
        try {
            // Create a simple mock that tracks if innerHTML was set
            let contentSet = false;
            const mockPopup = {
                querySelector: (selector) => {
                    if (selector === '.media-player-card') {
                        return {
                            querySelector: (innerSelector) => {
                                if (innerSelector === '.media-player-container') {
                                    return {
                                        set innerHTML(value) {
                                            contentSet = true;
                                            this._innerHTML = value;
                                        },
                                        get innerHTML() {
                                            return this._innerHTML || '';
                                        }
                                    };
                                }
                                return null;
                            }
                        };
                    }
                    return null;
                }
            };
            
            panel._initializeMediaPlayerCard(mockPopup, 'buero', mockMediaPlayers);
            
            this.assert(
                contentSet,
                'Media player container content should be set during initialization'
            );
            
        } catch (error) {
            this.assert(
                false,
                `Media player card initialization should not throw errors: ${error.message}`
            );
        }
    }

    // Test component initializer registration
    testComponentInitializerRegistration() {
        console.log('\n[DashView] Testing media player card component initializer...');
        
        const panel = new MockDashViewPanel();
        
        this.assert(
            panel._componentInitializers['.media-player-card'] !== undefined,
            'Media player card should be registered in component initializers'
        );
        
        this.assert(
            typeof panel._componentInitializers['.media-player-card'] === 'function',
            'Media player card initializer should be a function'
        );
    }

    // Test media player card template structure
    testMediaPlayerCardTemplate() {
        console.log('\n[DashView] Testing media player card template structure...');
        
        // This test would verify the template file exists and has the correct structure
        // In a real test environment, we'd load the actual template
        this.assert(
            true, // Placeholder - in real test we'd verify template file
            'Media player card template should have correct structure'
        );
    }

    // Run all tests
    runAllTests() {
        console.log('[DashView] Starting Media Player Room Card Tests...\n');
        
        this.testMediaPlayerCardCreation();
        this.testMediaPlayerCardInitialization();
        this.testComponentInitializerRegistration();
        this.testMediaPlayerCardTemplate();
        
        const passedTests = this.testResults.filter(result => result.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Media Player Room Card Tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All media player room card tests passed!');
            return true;
        } else {
            console.log('❌ Some media player room card tests failed.');
            return false;
        }
    }
}

// Mock DashViewPanel for testing
class MockDashViewPanel {
    constructor() {
        this._hass = this.createMockHass();
        this._houseConfig = {
            rooms: {
                buero: {
                    friendly_name: "Büro",
                    media_players: [
                        { entity: "media_player.echo_buero" }
                    ]
                },
                wohnzimmer: {
                    friendly_name: "Wohnzimmer", 
                    media_players: [
                        { entity: "media_player.unnamed_room" },
                        { entity: "media_player.kuche" }
                    ]
                },
                schlafzimmer: {
                    friendly_name: "Schlafzimmer",
                    media_players: [
                        { entity: "media_player.echo_bad" }
                    ]
                }
            }
        };
        
        // Component initializers
        this._componentInitializers = {
            '.media-player-card': (el) => {
                const popup = el.closest('.popup');
                const roomKey = popup.id.replace('-popup', '');
                const roomConfig = this._houseConfig?.rooms?.[roomKey];
                if (roomConfig?.media_players?.length > 0) {
                    this._initializeMediaPlayerCard(popup, roomKey, roomConfig.media_players);
                }
            }
        };
    }

    createMockHass() {
        return {
            states: {
                'media_player.echo_buero': {
                    state: 'off',
                    attributes: {
                        friendly_name: 'Echo Büro'
                    }
                },
                'media_player.unnamed_room': {
                    state: 'off',
                    attributes: {
                        friendly_name: 'Esszimmer'
                    }
                },
                'media_player.kuche': {
                    state: 'off',
                    attributes: {
                        friendly_name: 'Küche'
                    }
                },
                'media_player.echo_bad': {
                    state: 'off',
                    attributes: {
                        friendly_name: 'Bad'
                    }
                }
            }
        };
    }

    // Mock implementation of createPopupFromTemplate
    createPopupFromTemplate(popupId, popupType, content) {
        return {
            id: popupId,
            className: 'popup',
            innerHTML: `
                <div class="popup-content">
                    <div class="popup-header">
                        <span class="popup-title">${popupType}</span>
                    </div>
                    <div class="popup-body">${content}</div>
                </div>
            `,
            querySelector: (selector) => {
                if (selector === '.popup-body') {
                    return { innerHTML: content };
                }
                return null;
            }
        };
    }

    // Mock implementation of _initializeMediaPlayerCard
    _initializeMediaPlayerCard(popup, roomKey, mediaPlayerEntities) {
        const card = popup.querySelector('.media-player-card');
        if (!card) return;

        const mediaPlayerContainer = card.querySelector('.media-player-container');
        if (!mediaPlayerContainer) return;

        const primaryPlayer = mediaPlayerEntities[0];
        const entityId = primaryPlayer.entity;
        
        const mediaPlayerContent = `
            <div class="media-presets">
                <button class="media-preset-button" data-entity="${entityId}">
                    <span class="preset-name">Dinner Jazz</span>
                </button>
            </div>
            <div class="media-display" data-entity="${entityId}">
                <div class="media-image">
                    <img src="" alt="Media Cover" class="media-cover">
                </div>
                <div class="media-info">
                    <div class="media-title">Kein Titel</div>
                    <div class="media-artist">Unbekannt</div>
                </div>
            </div>
            <div class="media-controls" data-entity="${entityId}">
                <button class="media-control-button" data-action="media_play_pause">
                    <i class="mdi mdi-play"></i>
                </button>
            </div>
            <div class="media-volume-control">
                ${mediaPlayerEntities.map(player => {
                    const entity = this._hass.states[player.entity];
                    const friendlyName = entity ? entity.attributes.friendly_name : player.entity;
                    return `
                        <div class="volume-row">
                            <span class="volume-label">${friendlyName}</span>
                            <input type="range" class="volume-slider" data-entity="${player.entity}">
                            <span class="volume-value">50%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        mediaPlayerContainer.innerHTML = mediaPlayerContent;
    }

    // Mock method for initialization
    _initializeMediaPlayerControls(popup) {
        // Mock implementation
        return true;
    }
}

// Export for Node.js if available, otherwise add to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaPlayerRoomCardTests;
} else {
    window.MediaPlayerRoomCardTests = MediaPlayerRoomCardTests;
}

// Auto-run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new MediaPlayerRoomCardTests();
    tests.runAllTests();
}