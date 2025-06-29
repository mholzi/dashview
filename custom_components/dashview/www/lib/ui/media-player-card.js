// custom_components/dashview/www/lib/ui/media-player-card.js

export class MediaPlayerCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
        this._shadowRoot = panel.shadowRoot;
        // Map to hold debounce timers for each entity to prevent UI snapping back.
        this._updateDebounceTimers = new Map();
    }

    setHass(hass) {
        this._hass = hass;
    }

    initialize(popup, roomKey, mediaPlayerEntities) {
        const card = popup.querySelector('.media-player-card');
        if (!card) return;
    
        const container = card.querySelector('.media-player-container');
        if (!container) return;
    
        const primaryPlayer = mediaPlayerEntities[0];
        if (!primaryPlayer) return;
        
        container.innerHTML = this._generateRoomPlayerHTML(mediaPlayerEntities);
        
        this._initializeMediaPlayerControls(popup);
    
        // Initial update for all players in this card
        mediaPlayerEntities.forEach(player => {
            this.update(player.entity);
        });
    }    
    update(entityId) {
        const popups = this._shadowRoot.querySelectorAll('.popup.active');
        popups.forEach(popup => {
            // Find all elements related to this entity in the active popup
            const display = popup.querySelector(`.media-display[data-entity="${entityId}"]`);
            const slider = popup.querySelector(`.volume-slider[data-entity="${entityId}"]`);
            
            if (display) {
                this._updateMediaPlayerDisplay(popup, entityId);
            }
            if (slider) {
                this._updateMediaPlayerVolume(popup, entityId);
            }
        });
    }

    _generateRoomPlayerHTML(mediaPlayerEntities) {
        const primaryEntityId = mediaPlayerEntities[0].entity;
        const presets = this._config?.media_presets || [];
        
        return `
            <div class="media-presets">
              ${presets.map(preset => `
                <button class="media-preset-button" data-content-id="${preset.content_id}">
                  <span class="preset-name">${preset.name}</span>
                </button>
              `).join('')}
            </div>
            <div class="media-display" data-entity="${primaryEntityId}">
                <div class="media-image"><img src="" alt="Media Cover" class="media-cover"></div>
                <div class="media-info">
                    <div class="media-title">Kein Titel</div>
                    <div class="media-artist">Unbekannt</div>
                </div>
            </div>
            <div class="media-controls" data-entity="${primaryEntityId}">
                <button class="media-control-button" data-action="media_previous_track"><i class="mdi mdi-skip-previous"></i></button>
                <button class="media-control-button play-pause" data-action="media_play_pause"><i class="mdi mdi-play"></i></button>
                <button class="media-control-button" data-action="media_next_track"><i class="mdi mdi-skip-next"></i></button>
            </div>
            <div class="media-volume-control">
                ${mediaPlayerEntities.map(player => {
                    const entity = this._hass.states[player.entity];
                    const friendlyName = entity?.attributes.friendly_name || player.entity;
                    return `
                        <div class="volume-row">
                            <span class="volume-label">${friendlyName}</span>
                            <div class="volume-slider-container">
                                <input type="range" class="volume-slider" data-entity="${player.entity}" min="0" max="100" value="50">
                            </div>
                            <span class="volume-value">50%</span>
                        </div>`;
                }).join('')}
            </div>`;
    }
    
    /**
     * Helper to ignore state updates for a brief period after a user interaction.
     * @param {string} entityId The entity ID to ignore updates for.
     * @param {HTMLElement} element The element to apply the ignore flag to.
     */
    _ignoreUpdatesFor(entityId, element) {
        element.dataset.ignoreUpdate = 'true';
        if (this._updateDebounceTimers.has(entityId)) {
            clearTimeout(this._updateDebounceTimers.get(entityId));
        }
        this._updateDebounceTimers.set(entityId, setTimeout(() => {
            delete element.dataset.ignoreUpdate;
            this._updateDebounceTimers.delete(entityId);
        }, 1500)); // Ignore updates for 1.5 seconds to allow state to propagate
    }

    _initializeMediaPlayerControls(popup) {

        // Control buttons (play, pause, next, prev)
        popup.querySelectorAll('.media-control-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const controls = button.closest('.media-controls');
                const entityId = controls.dataset.entity;
                const action = button.dataset.action;
                if (entityId && action && this._hass) {
                    this._ignoreUpdatesFor(entityId, controls.closest('.media-display'));
                    this._hass.callService('media_player', action, { entity_id: entityId });
                }
            });
        });

        // Volume sliders
        popup.querySelectorAll('.volume-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const label = e.target.closest('.volume-row').querySelector('.volume-value');
                if (label) label.textContent = `${e.target.value}%`;
            });
            slider.addEventListener('change', (e) => {
                const entityId = e.target.dataset.entity;
                const volume = parseFloat(e.target.value) / 100;
                if (entityId && this._hass) {
                    this._ignoreUpdatesFor(entityId, e.target);
                    this._hass.callService('media_player', 'volume_set', { entity_id: entityId, volume_level: volume });
                }
            });
        });
        
        // Preset buttons
        popup.querySelectorAll('.media-preset-button').forEach(button => {
            button.addEventListener('click', () => {
                const contentId = button.dataset.contentId;
                const primaryPlayerEntityId = popup.querySelector('.media-display').dataset.entity;
                if (contentId && primaryPlayerEntityId && this._hass) {
                    this._ignoreUpdatesFor(primaryPlayerEntityId, popup.querySelector('.media-display'));
                    this._hass.callService('media_player', 'play_media', {
                        entity_id: primaryPlayerEntityId,
                        media_content_id: contentId,
                        media_content_type: 'playlist'
                    });
                }
            });
        });
    }

    _updateMediaPlayerDisplay(popup, entityId) {
        const display = popup.querySelector(`.media-display[data-entity="${entityId}"]`);
        if (!display || display.dataset.ignoreUpdate === 'true') {
            return; // Skip update if element is not found or is ignoring updates
        }

        const entityState = this._hass.states[entityId];
        if (!entityState) return;

        const img = display.querySelector('.media-cover');
        const title = display.querySelector('.media-title');
        const artist = display.querySelector('.media-artist');

        if (img) img.src = entityState.attributes.entity_picture || '';
        if (title) title.textContent = entityState.attributes.media_title || 'Kein Titel';
        if (artist) artist.textContent = entityState.attributes.media_artist || 'Unbekannt';

        const playPauseButton = popup.querySelector(`.media-controls[data-entity="${entityId}"] .play-pause i`);
        if (playPauseButton) {
            playPauseButton.className = ['playing', 'on'].includes(entityState.state) ? 'mdi mdi-pause' : 'mdi mdi-play';
        }
    }

    _updateMediaPlayerVolume(popup, entityId) {
        const slider = popup.querySelector(`.volume-slider[data-entity="${entityId}"]`);
        if (!slider || slider.dataset.ignoreUpdate === 'true') {
            return; // Skip update if element is not found or is ignoring updates
        }
        
        const entityState = this._hass.states[entityId];
        if (!entityState) return;

        const label = slider?.closest('.volume-row')?.querySelector('.volume-value');
        if (!label) return;

        const volumeLevel = entityState.attributes.volume_level || 0;
        const volumePercent = Math.round(volumeLevel * 100);

        // Only update if the value is different to avoid interrupting user input
        if (slider.value != volumePercent) {
            slider.value = volumePercent;
        }
        label.textContent = `${volumePercent}%`;
    }

}
