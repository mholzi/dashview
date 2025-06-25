// custom_components/dashview/lib/ui/media-player-card.js

export class MediaPlayerCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
        this._shadowRoot = panel.shadowRoot;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Initializes a media player card within a room popup.
     * @param {HTMLElement} popup The popup element.
     * @param {string} roomKey The key for the current room.
     * @param {Array<object>} mediaPlayerEntities The list of media player configurations for the room.
     */
    initialize(popup, roomKey, mediaPlayerEntities) {
        const card = popup.querySelector('.media-player-card');
        if (!card) return;

        const container = card.querySelector('.media-player-container');
        if (!container) return;

        const primaryPlayer = mediaPlayerEntities[0];
        if (!primaryPlayer) return;
        
        // This can be further simplified in the future by using templates.
        container.innerHTML = this._generateRoomPlayerHTML(mediaPlayerEntities);
        
        this._initializeMediaPlayerControls(popup);
    }
    
    /**
     * Updates all media player components when an entity changes.
     * @param {string} entityId The ID of the media_player entity that changed.
     */
    update(entityId) {
        const popups = this._shadowRoot.querySelectorAll('.popup.active');
        popups.forEach(popup => {
            const hasPlayer = popup.querySelector(`.media-display[data-entity="${entityId}"]`);
            if (hasPlayer) {
                this._updateMediaPlayerDisplay(popup, entityId);
                this._updateMediaPlayerVolume(popup, entityId);
            }
        });
    }

    _generateRoomPlayerHTML(mediaPlayerEntities) {
        const primaryEntityId = mediaPlayerEntities[0].entity;
        return `
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

    _initializeMediaPlayerControls(popup) {
        if (!this._hass) return;

        // Control buttons (play, pause, next, prev)
        popup.querySelectorAll('.media-control-button').forEach(button => {
            button.addEventListener('click', () => {
                const controls = button.closest('.media-controls');
                const entityId = controls.dataset.entity;
                const action = button.dataset.action;
                if (entityId && action) {
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
                if (entityId) {
                    this._hass.callService('media_player', 'volume_set', { entity_id: entityId, volume_level: volume });
                }
            });
        });
    }

    _updateMediaPlayerDisplay(popup, entityId) {
        const entityState = this._hass.states[entityId];
        if (!entityState) return;

        const display = popup.querySelector(`.media-display[data-entity="${entityId}"]`);
        if (!display) return;

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
        const entityState = this._hass.states[entityId];
        if (!entityState) return;

        const slider = popup.querySelector(`.volume-slider[data-entity="${entityId}"]`);
        const label = slider?.closest('.volume-row')?.querySelector('.volume-value');
        if (!slider || !label) return;

        const volumeLevel = entityState.attributes.volume_level || 0;
        const volumePercent = Math.round(volumeLevel * 100);

        if (slider.value != volumePercent) {
            slider.value = volumePercent;
        }
        label.textContent = `${volumePercent}%`;
    }
}
