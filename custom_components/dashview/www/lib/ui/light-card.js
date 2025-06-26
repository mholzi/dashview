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

            // Add click listener to the toggle area
            const toggleArea = row.querySelector('.light-toggle-area');
            toggleArea.addEventListener('click', () => {
                this._hass.callService('light', 'toggle', { entity_id: entityId });
            });

            const sliderArea = row.querySelector('.light-slider-area');
            const slider = row.querySelector('.light-slider');
            const isDimmable = entity.attributes.supported_color_modes?.some(mode => ['brightness', 'color_temp', 'hs'].includes(mode));

            if (isDimmable) {
                slider.addEventListener('change', (e) => {
                    const brightness_pct = parseInt(e.target.value, 10);
                    this._hass.callService('light', 'turn_on', {
                        entity_id: entityId,
                        brightness_pct: brightness_pct
                    });
                });
            } else {
                sliderArea.style.display = 'none';
            }

            individualContainer.appendChild(row);
            this.update(popup, entityId); // Perform initial update
        });

        this._updateCount(card, lightEntities);
    }

    update(popup, entityId) {
        if (!this._hass) return;

        const lightRow = popup.querySelector(`.light-control-row[data-entity-id="${entityId}"]`);
        if (!lightRow) return;

        const entityState = this._hass.states[entityId];
        const isOn = entityState && entityState.state === 'on';

        lightRow.setAttribute('state', isOn ? 'on' : 'off');
        
        const iconEl = lightRow.querySelector('.light-icon .mdi');
        if (iconEl) {
            iconEl.className = isOn ? 'mdi mdi-lightbulb' : 'mdi mdi-lightbulb-outline';
        }

        const stateEl = lightRow.querySelector('.light-state');
        const slider = lightRow.querySelector('.light-slider');
        const sliderArea = lightRow.querySelector('.light-slider-area');

        if (isOn) {
            const brightness = entityState.attributes.brightness;
            if (typeof brightness === 'number') {
                const brightnessPercent = Math.round((brightness / 255) * 100);
                stateEl.textContent = `On - ${brightnessPercent}%`;
                if (slider) {
                    slider.value = brightnessPercent;
                    slider.style.background = `linear-gradient(to right, #fca103 ${brightnessPercent}%, var(--gray500) ${brightnessPercent}%)`;
                }
            } else {
                stateEl.textContent = 'On';
                if (slider) {
                    slider.value = 100;
                    slider.style.background = `linear-gradient(to right, #fca103 100%, var(--gray500) 100%)`;
                }
            }
        } else {
            stateEl.textContent = 'Off';
             if (slider) {
                slider.style.background = 'var(--gray500)';
             }
        }

        const lightEntities = this._config.rooms[popup.id.replace('-popup', '')]?.lights || [];
        this._updateCount(popup.querySelector('.lights-card'), lightEntities);
    }
    
    _updateCount(card, lightEntities) {
        if (!card || !lightEntities) return;
        const countEl = card.querySelector('.lights-count');
        if (countEl) {
            const onCount = lightEntities.filter(id => this._hass.states[id]?.state === 'on').length;
            countEl.textContent = `${onCount} / ${lightEntities.length}`;
        }
    }
}
