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
