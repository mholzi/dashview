// custom_components/dashview/lib/ui/covers-card.js

export class CoversCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Initializes the entire covers card, including all event listeners.
     * @param {HTMLElement} popup The popup element containing the card.
     * @param {Array<string>} coverEntities A list of cover entity IDs for the room.
     */
    initialize(popup, coverEntities) {
        const card = popup.querySelector('.covers-card');
        if (!card) return;

        const mainSlider = card.querySelector('.main-slider');
        const mainLabel = card.querySelector('.main-position-label');
        const positionButtons = card.querySelectorAll('.cover-position-buttons button');
        const individualContainer = card.querySelector('.individual-covers-container');
        const rowTemplate = popup.querySelector('#cover-row-template');

        if (!mainSlider || !individualContainer || !rowTemplate) {
            console.error("[CoversCard] Key elements for the covers card are missing from the template.");
            return;
        }

        // Setup main slider to control all covers
        mainSlider.addEventListener('input', (e) => {
            mainLabel.textContent = `${e.target.value}%`;
        });
        mainSlider.addEventListener('change', (e) => {
            const position = e.target.value;
            coverEntities.forEach(entityId => {
                this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: position });
            });
        });

        // Setup main position buttons (0%, 50%, 100%)
        positionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const position = button.dataset.position;
                coverEntities.forEach(entityId => {
                    this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: position });
                });
            });
        });

        // Create and initialize a row for each individual cover
        individualContainer.innerHTML = ''; // Clear previous rows
        coverEntities.forEach(entityId => {
            const row = rowTemplate.content.cloneNode(true).querySelector('.cover-row');
            row.dataset.entityId = entityId;

            const nameEl = row.querySelector('.cover-name');
            const sliderEl = row.querySelector('.cover-slider');
            const labelEl = row.querySelector('.cover-position-label');

            nameEl.textContent = this._hass.states[entityId]?.attributes.friendly_name || entityId;

            sliderEl.addEventListener('change', (e) => {
                this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: e.target.value });
            });
            sliderEl.addEventListener('input', (e) => {
                labelEl.textContent = `${e.target.value}%`;
            });
            
            individualContainer.appendChild(row);
        });

        // Perform an initial update for all covers
        coverEntities.forEach(entityId => this.update(popup, entityId));
    }

    /**
     * Initialize covers card for single-entity popup context
     * @param {HTMLElement} container - The popup container
     * @param {string} entityId - The single entity ID to control
     */
    initializeForPopup(container, entityId) {
        console.log('[CoversCard] Initializing for popup with entity:', entityId);
        
        if (!this._hass || !entityId) {
            console.warn('[CoversCard] Cannot initialize popup: missing hass or entityId');
            return;
        }
        
        const entityState = this._hass.states[entityId];
        if (!entityState) {
            console.warn('[CoversCard] Entity not found:', entityId);
            return;
        }
        
        // Find the cover row in the popup (should be created by strategy)
        const coverRow = container.querySelector(`[data-entity-id="${entityId}"]`);
        if (!coverRow) {
            console.warn('[CoversCard] Cover row not found for entity:', entityId);
            return;
        }
        
        // Set up the cover name
        const nameEl = coverRow.querySelector('.cover-name');
        if (nameEl) {
            nameEl.textContent = entityState.attributes.friendly_name || entityId;
        }
        
        // Set up the slider for position control
        const sliderEl = coverRow.querySelector('.cover-slider');
        const labelEl = coverRow.querySelector('.cover-position-label');
        
        if (sliderEl && labelEl) {
            // Add event listeners if not already attached
            if (!sliderEl.listenerAttached) {
                sliderEl.addEventListener('change', (e) => {
                    this._hass.callService('cover', 'set_cover_position', { 
                        entity_id: entityId, 
                        position: e.target.value 
                    });
                });
                sliderEl.addEventListener('input', (e) => {
                    labelEl.textContent = `${e.target.value}%`;
                });
                sliderEl.listenerAttached = true;
            }
        }
        
        // Set up position buttons if present
        const positionButtons = coverRow.querySelectorAll('.cover-position-buttons button');
        positionButtons.forEach(button => {
            if (!button.listenerAttached) {
                button.addEventListener('click', () => {
                    const position = button.dataset.position;
                    this._hass.callService('cover', 'set_cover_position', { 
                        entity_id: entityId, 
                        position: position 
                    });
                });
                button.listenerAttached = true;
            }
        });
        
        // Update initial state
        this.update(container, entityId);
        
        console.log('[CoversCard] Popup initialization complete for:', entityId);
    }

    /**
     * Updates a single cover row and the main slider if applicable.
     * @param {HTMLElement} popup The popup element containing the card.
     * @param {string} entityId The specific cover entity that changed.
     */
    update(popup, entityId) {
        if (!this._hass) return;

        const entityState = this._hass.states[entityId];
        if (!entityState) return;

        const position = entityState.attributes.current_position ?? 0;
        const roundedPosition = Math.round(position);

        // Update the specific row for the changed entity
        const row = popup.querySelector(`.cover-row[data-entity-id="${entityId}"]`);
        if (row) {
            const sliderEl = row.querySelector('.cover-slider');
            const labelEl = row.querySelector('.cover-position-label');
            if (sliderEl.value != roundedPosition) sliderEl.value = roundedPosition;
            labelEl.textContent = `${roundedPosition}%`;
        }

        // Check if this entity is the "master" entity for the main slider
        const mainSlider = popup.querySelector('.main-slider');
        const roomConfig = Object.values(this._config.rooms).find(r => r.covers && r.covers[0] === entityId);
        if (mainSlider && roomConfig) {
            if (mainSlider.value != roundedPosition) mainSlider.value = roundedPosition;
            popup.querySelector('.main-position-label').textContent = `${roundedPosition}%`;
        }
    }
}
