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

            const isDimmable = entity.attributes.supported_color_modes?.some(mode => ['brightness', 'color_temp', 'hs'].includes(mode));

            if (isDimmable) {
                row.classList.add('is-dimmable');
                this._initDraggableSlider(row, entityId);
            } else {
                row.addEventListener('click', () => {
                    this._hass.callService('light', 'toggle', { entity_id: entityId });
                });
            }

            individualContainer.appendChild(row);
            this.update(popup, entityId); // Perform initial update
        });

        this._updateCount(card, lightEntities);
    }

    _initDraggableSlider(row, entityId) {
        let isDragging = false;

        const updateBrightness = (clientX) => {
            const rect = row.getBoundingClientRect();
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent)); // Clamp between 0 and 1
            const brightness_pct = Math.round(percent * 100);

            if (brightness_pct === 0) {
                this._hass.callService('light', 'turn_off', { entity_id: entityId });
            } else {
                this._hass.callService('light', 'turn_on', {
                    entity_id: entityId,
                    brightness_pct: brightness_pct
                });
            }
        };

        const onMouseMove = (e) => {
            if (isDragging) updateBrightness(e.clientX);
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onTouchMove = (e) => {
            if (isDragging) updateBrightness(e.touches[0].clientX);
        };

        const onTouchEnd = () => {
            isDragging = false;
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };

        row.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateBrightness(e.clientX);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        row.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateBrightness(e.touches[0].clientX);
            document.addEventListener('touchmove', onTouchMove);
            document.addEventListener('touchend', onTouchEnd);
            e.preventDefault();
        }, { passive: false });
    }

update(popup, entityId) {
        if (!this._hass) return;

        const row = popup.querySelector(`.light-control-row[data-entity-id="${entityId}"]`);
        if (!row) return;

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

        const lightEntities = this._config.rooms[popup.id.replace('-popup', '')]?.lights || [];
        this._updateCount(popup.querySelector('.lights-card'), lightEntities);
    }
