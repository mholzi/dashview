// custom_components/dashview/lib/ui/lights-card.js

export class LightsCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Initializes the lights card, creating a row for each light entity.
     * @param {HTMLElement} popup The popup element containing the card.
     * @param {string} roomKey The key for the current room.
     * @param {Array<string>} lightEntities A list of light entity IDs for the room.
     */
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
            const row = rowTemplate.content.cloneNode(true).querySelector('.light-row');
            row.dataset.entityId = entityId;

            const nameEl = row.querySelector('.light-name');
            nameEl.textContent = this._hass.states[entityId]?.attributes.friendly_name || entityId;
            
            // Add click listener to the entire row to toggle the light
            row.addEventListener('click', () => {
                this._hass.callService('light', 'toggle', { entity_id: entityId });
            });
            
            individualContainer.appendChild(row);
            this.update(popup, entityId); // Perform initial update for this row
        });

        // Initial update for the main "X / Y" count
        this._updateCount(card, lightEntities);
    }

    /**
     * Updates a single light row's appearance based on its state.
     * @param {HTMLElement} popup The popup element containing the card.
     * @param {string} entityId The specific light entity that changed.
     */
    update(popup, entityId) {
        if (!this._hass) return;

        const lightRow = popup.querySelector(`.light-row[data-entity-id="${entityId}"]`);
        if (!lightRow) return;

        const entityState = this._hass.states[entityId];
        const isOn = entityState && entityState.state === 'on';

        // Update icon
        const iconEl = lightRow.querySelector('.mdi');
        if (iconEl) {
            iconEl.className = isOn ? 'mdi mdi-lightbulb' : 'mdi mdi-lightbulb-off';
        }
        
        // Update state label with brightness
        const stateLabelEl = lightRow.querySelector('.light-state-label');
        if (stateLabelEl) {
            if (isOn) {
                let label = 'An';
                if (entityState.attributes && typeof entityState.attributes.brightness === 'number') {
                    const brightnessPercent = Math.round((entityState.attributes.brightness / 255) * 100);
                    label += ` - ${brightnessPercent}%`;
                }
                stateLabelEl.textContent = label;
            } else {
                stateLabelEl.textContent = 'Aus';
            }
        }
        
        // Update the row's state attribute for CSS styling
        lightRow.setAttribute('state', isOn ? 'on' : 'off');
        
        // Update the main "X / Y" count
        const lightEntities = this._config.rooms[popup.id.replace('-popup', '')]?.lights || [];
        this._updateCount(popup.querySelector('.lights-card'), lightEntities);
    }
    
    /**
     * Updates the "X / Y" counter in the card's header.
     * @param {HTMLElement} card The .lights-card element.
     * @param {Array<string>} lightEntities A list of all light entities for the room.
     */
    _updateCount(card, lightEntities) {
        if (!card || !lightEntities) return;
        const countEl = card.querySelector('.lights-count');
        if (countEl) {
            const onCount = lightEntities.filter(id => this._hass.states[id]?.state === 'on').length;
            countEl.textContent = `${onCount} / ${lightEntities.length}`;
        }
    }
}
