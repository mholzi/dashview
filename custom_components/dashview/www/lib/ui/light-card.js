// custom_components/dashview/www/lib/ui/light-card.js

export class LightsCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
        this._updateDebounceTimers = new Map();
    }

    setHass(hass) {
        this._hass = hass;
    }

    initialize(popup, roomKey, lightEntities) {
        const card = popup.querySelector('.lights-card');
        if (!card) return;

        const individualContainer = card.querySelector('.individual-lights-container');
        const rowTemplate = popup.querySelector('#light-row-template');

        if (!individualContainer || !rowTemplate) {
            console.error("[LightsCard] Key elements for the lights card are missing from the template.");
            return;
        }

        individualContainer.innerHTML = ''; // Clear previous content
        lightEntities.forEach(entityId => {
            const entity = this._hass.states[entityId];
            if (!entity) return;

            const row = rowTemplate.content.cloneNode(true).querySelector('.light-control-row');
            row.dataset.entityId = entityId;

            const nameEl = row.querySelector('.light-name');
            nameEl.textContent = entity.attributes.friendly_name || entityId;

            const isDimmable = entity.attributes.supported_color_modes?.some(mode => ['brightness', 'color_temp', 'hs'].includes(mode));
            
            if (isDimmable) {
                row.classList.add('is-dimmable');
                this._initDraggableSlider(row, entityId);
                
                // Clicking on the content area (icon/text) will toggle the light.
                const contentArea = row.querySelector('.light-content');
                if (contentArea) {
                    contentArea.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent the drag handler from firing.
                        this._toggleLight(entityId, row, card, lightEntities);
                    });
                }
            } else {
                // Non-dimmable lights are simple toggles.
                row.addEventListener('click', () => {
                    this._toggleLight(entityId, row, card, lightEntities);
                });
            }

            individualContainer.appendChild(row);
            this.update(popup, entityId); // Initial update.
        });

        this._updateCount(card, lightEntities);
    }
    
    _toggleLight(entityId, row, card, lightEntities) {
        const currentState = row.getAttribute('state');
        const newState = currentState === 'on' ? 'off' : 'on';

        // Optimistic UI update
        this._updateRowState(row, newState);
        this._updateCount(card, lightEntities, newState, entityId);

        this._hass.callService('light', 'toggle', { entity_id: entityId });
    }
    
    _updateRowState(row, state, brightnessPercent = null) {
        const isOn = state === 'on';
        row.setAttribute('state', isOn ? 'on' : 'off');
        
        const iconEl = row.querySelector('.light-icon .mdi');
        if (iconEl) {
            iconEl.className = isOn ? 'mdi mdi-lightbulb' : 'mdi mdi-lightbulb-outline';
        }

        const stateEl = row.querySelector('.light-state');
        const bar = row.querySelector('.light-brightness-bar');
        const handle = row.querySelector('.light-brightness-handle');
        const isDimmable = row.classList.contains('is-dimmable');

        if (isOn) {
            if (isDimmable) {
                const displayPercent = brightnessPercent !== null ? brightnessPercent : (this._hass.states[row.dataset.entityId]?.attributes.brightness ? Math.round((this._hass.states[row.dataset.entityId].attributes.brightness / 255) * 100) : 100);
                stateEl.textContent = `On - ${displayPercent}%`;
                bar.style.width = `${displayPercent}%`;
                handle.style.left = `${displayPercent}%`;
            } else {
                 stateEl.textContent = 'On';
                 bar.style.width = '100%';
            }
        } else {
            stateEl.textContent = 'Off';
            bar.style.width = '0%';
            if (handle) {
                handle.style.left = '0%';
            }
        }
    }


    _initDraggableSlider(row, entityId) {
        let isDragging = false;
        let startX = 0;

        const updateVisuals = (clientX) => {
            const rect = row.getBoundingClientRect();
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            const brightness_pct = Math.round(percent * 100);

            const bar = row.querySelector('.light-brightness-bar');
            const handle = row.querySelector('.light-brightness-handle');
            const stateEl = row.querySelector('.light-state');
            if (bar) bar.style.width = `${brightness_pct}%`;
            if (handle) handle.style.left = `${brightness_pct}%`;
            if (stateEl) stateEl.textContent = brightness_pct > 0 ? `On - ${brightness_pct}%` : 'Off';
        };

        const callLightService = (clientX) => {
            const rect = row.getBoundingClientRect();
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            const brightness_pct = Math.round(percent * 100);

            // Temporarily ignore state updates for this entity to prevent slider jumping.
            row.dataset.ignoreUpdate = 'true';
            if (this._updateDebounceTimers.has(entityId)) {
                clearTimeout(this._updateDebounceTimers.get(entityId));
            }
            this._updateDebounceTimers.set(entityId, setTimeout(() => {
                delete row.dataset.ignoreUpdate;
                this._updateDebounceTimers.delete(entityId);
            }, 1000)); // Ignore updates for 1 second.

            if (brightness_pct === 0) {
                this._hass.callService('light', 'turn_off', { entity_id: entityId });
            } else {
                this._hass.callService('light', 'turn_on', {
                    entity_id: entityId,
                    brightness_pct: brightness_pct
                });
            }
        };

        const onDragStart = (e) => {
            isDragging = true;
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            row.style.cursor = 'ew-resize';
            document.body.style.cursor = 'ew-resize';
        };

        const onDragMove = (e) => {
            if (isDragging) {
                updateVisuals(e.type === 'touchmove' ? e.touches[0].clientX : e.clientX);
            }
        };

        const onDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            row.style.cursor = 'pointer';
            document.body.style.cursor = '';
            
            const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
            
            // Only call service if it was a real drag, not a click on the slider area.
            if (Math.abs(endX - startX) > 5) {
                callLightService(endX);
            }
        };

        row.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);

        row.addEventListener('touchstart', onDragStart, { passive: true });
        document.addEventListener('touchmove', onDragMove);
        document.addEventListener('touchend', onDragEnd);
    }

    update(popup, entityId) {
        if (!this._hass) return;

        const row = popup.querySelector(`.light-control-row[data-entity-id="${entityId}"]`);
        if (!row || row.dataset.ignoreUpdate === 'true') {
            return; // Skip update if row not found or if we are ignoring updates for it
        }

        const entityState = this._hass.states[entityId];
        const isOn = entityState && entityState.state === 'on';

        row.setAttribute('state', isOn ? 'on' : 'off');
        
        const iconEl = row.querySelector('.light-icon .mdi');
        if (iconEl) {
            iconEl.className = isOn ? 'mdi mdi-lightbulb' : 'mdi mdi-lightbulb-outline';
        }

        const stateEl = row.querySelector('.light-state');
        const bar = row.querySelector('.light-brightness-bar');
        const handle = row.querySelector('.light-brightness-handle');
        const isDimmable = row.classList.contains('is-dimmable');

        if (isOn) {
            if (isDimmable) {
                const brightness = entityState.attributes.brightness;
                const brightnessPercent = (typeof brightness === 'number') ? Math.round((brightness / 255) * 100) : 100;
                
                stateEl.textContent = `On - ${brightnessPercent}%`;
                bar.style.width = `${brightnessPercent}%`;
                handle.style.left = `${brightnessPercent}%`;
            } else {
                 stateEl.textContent = 'On';
                 bar.style.width = '100%';
            }
        } else {
            stateEl.textContent = 'Off';
            bar.style.width = '0%';
            if (handle) {
                handle.style.left = '0%';
            }
        }

        const roomKey = popup.id.replace('-popup', '');
        const lightEntities = this._config?.rooms[roomKey]?.lights || [];
        this._updateCount(popup.querySelector('.lights-card'), lightEntities);
    }
    
    _updateCount(card, lightEntities, optimisticState = null, changedEntityId = null) {
        if (!card) return;
        const countElement = card.querySelector('.lights-count');
        if (!countElement) return;

        let onLights = lightEntities.filter(id => {
            if (id === changedEntityId && optimisticState !== null) {
                return optimisticState === 'on';
            }
            return this._hass.states[id]?.state === 'on';
        }).length;
        
        countElement.textContent = `${onLights}/${lightEntities.length}`;
    }
}
