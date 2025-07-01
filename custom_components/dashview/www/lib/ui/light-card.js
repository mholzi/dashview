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
                this._initDraggableSlider(row, entityId, card, lightEntities);
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

    /**
     * Initialize lights card for single-entity popup context
     * @param {HTMLElement} container - The popup container
     * @param {string} entityId - The single entity ID to control
     */
    initializeForPopup(container, entityId) {
        console.log('[LightsCard] Initializing for popup with entity:', entityId);
        
        if (!this._hass || !entityId) {
            console.warn('[LightsCard] Cannot initialize popup: missing hass or entityId');
            return;
        }
        
        const entityState = this._hass.states[entityId];
        if (!entityState) {
            console.warn('[LightsCard] Entity not found:', entityId);
            return;
        }
        
        // Find the light row in the popup (should be created by strategy)
        const lightRow = container.querySelector(`[data-entity-id="${entityId}"]`);
        if (!lightRow) {
            console.warn('[LightsCard] Light row not found for entity:', entityId);
            return;
        }
        
        // Check if light is dimmable
        const isDimmable = entityState.attributes?.supported_color_modes?.some(mode => 
            ['brightness', 'color_temp', 'hs'].includes(mode));
        
        if (isDimmable) {
            lightRow.classList.add('is-dimmable');
            this._initDraggableSlider(lightRow, entityId, container, [entityId]);
        } else {
            // Non-dimmable lights are simple toggles
            if (!lightRow.listenerAttached) {
                lightRow.addEventListener('click', () => {
                    this._toggleLight(entityId, lightRow, container, [entityId]);
                });
                lightRow.listenerAttached = true;
            }
        }
        
        // Update initial state
        this.update(container, entityId);
        
        console.log('[LightsCard] Popup initialization complete for:', entityId);
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


    _initDraggableSlider(row, entityId, card, lightEntities) {
        let isDragging = false;
        let startX = 0;
        let dragStartTime = 0;
        let hasMoved = false;

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

        const onStart = (e) => {
            isDragging = true;
            hasMoved = false;
            dragStartTime = Date.now();
            startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            row.style.cursor = 'ew-resize';
            document.body.style.cursor = 'ew-resize';
            e.preventDefault(); // Prevent text selection during drag
        };

        const onMove = (e) => {
            if (!isDragging) return;
            
            const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const deltaX = Math.abs(currentX - startX);
            
            // If moved more than 5px, consider it a drag
            if (deltaX > 5) {
                hasMoved = true;
                updateVisuals(currentX);
            }
        };

        const onEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            row.style.cursor = 'pointer';
            document.body.style.cursor = '';
            
            const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
            const dragDuration = Date.now() - dragStartTime;
            const deltaX = Math.abs(endX - startX);
            
            if (hasMoved && deltaX > 5) {
                // This was a drag - set brightness
                callLightService(endX);
            } else if (dragDuration < 300 && deltaX <= 5) {
                // This was a click - toggle light
                this._toggleLight(entityId, row, card, lightEntities);
            }
        };

        // Mouse events
        row.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events
        row.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd, { passive: false });
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
                // Use requestAnimationFrame to ensure immediate visual update
                requestAnimationFrame(() => {
                    bar.style.width = `${brightnessPercent}%`;
                    if (handle) handle.style.left = `${brightnessPercent}%`;
                });
            } else {
                 stateEl.textContent = 'On';
                 requestAnimationFrame(() => {
                     bar.style.width = '100%';
                 });
            }
        } else {
            stateEl.textContent = 'Off';
            requestAnimationFrame(() => {
                bar.style.width = '0%';
                if (handle) handle.style.left = '0%';
            });
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
