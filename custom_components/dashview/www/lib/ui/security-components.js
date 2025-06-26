// custom_components/dashview/lib/ui/security-components.js

export class SecurityComponents {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Main update function for the security popup.
     */
    update() {
        const popup = this._shadowRoot.querySelector('#security-popup');
        if (!this._hass || !popup) return;

        this._updateSecurityLists(popup);
        this._updateSecurityHeaderButtons(popup);
    }

    _updateSecurityLists(popup) {
        const lists = {
            'window': { open: '#open-windows-list', closed: '#closed-windows-list' },
            'motion': { open: '#active-motion-list', closed: '#inactive-motion-list' },
            'smoke': { open: '#active-smoke-detector-list', closed: '#inactive-smoke-detector-list' },
            'vibration': { open: '#active-vibration-list', closed: '#inactive-vibration-list' }
        };

        for (const [type, selectors] of Object.entries(lists)) {
            const allEntities = this._panel._getAllEntitiesByType(type);
            const openEntities = allEntities.filter(id => this._hass.states[id]?.state === 'on');
            const closedEntities = allEntities.filter(id => this._hass.states[id]?.state === 'off');

            this._renderEntityList(popup, popup.querySelector(selectors.open), openEntities);
            this._renderEntityList(popup, popup.querySelector(selectors.closed), closedEntities);
        }
    }

    _renderEntityList(popup, container, entityIds) {
        if (!container) return;
        
        const template = popup.querySelector('#sensor-small-card-template');
        if (!template) {
            container.innerHTML = '<div class="placeholder">Template not found.</div>';
            return;
        }

        container.innerHTML = ''; // Clear previous content
        if (entityIds.length === 0) {
            container.innerHTML = `<div class="entity-list-none">None</div>`;
            return;
        }
        
        entityIds.forEach(entityId => {
            const entityState = this._hass.states[entityId];
            if (!entityState) return;
            
            const card = template.content.cloneNode(true);
            const cardElement = card.querySelector('.sensor-small-card');
            
            const type = this._panel._getEntityTypeFromConfig(entityId);
            const { name, label, icon, cardClass } = this._panel._floorManager._getCardDisplayData(entityId, type, false);

            cardElement.className = `sensor-small-card ${cardClass}`;
            cardElement.querySelector('.sensor-small-name').textContent = name;
            cardElement.querySelector('.sensor-small-label').textContent = label;
            cardElement.querySelector('.sensor-small-icon-cell .mdi').className = `mdi ${this._panel._processIconName(icon)}`;
            
            container.appendChild(card);
        });
    }

    _updateSecurityHeaderButtons(popup) {
        if (!this._hass || !popup) return;

        const motionChip = popup.querySelector('.header-info-chip[data-type="motion"]');
        if (motionChip) {
            const activeMotionSensors = this._panel._getAllEntitiesByType('motion').filter(id => this._hass.states[id]?.state === 'on');
            motionChip.style.display = activeMotionSensors.length > 0 ? 'flex' : 'none';
        }

        const windowsChip = popup.querySelector('.header-info-chip[data-type="windows"]');
        if (windowsChip) {
            const openWindows = this._panel._getAllEntitiesByType('window').filter(id => this._hass.states[id]?.state === 'on');
            if (openWindows.length > 0) {
                windowsChip.style.display = 'flex';
                windowsChip.querySelector('.chip-name').textContent = `${openWindows.length} open`;
            } else {
                windowsChip.style.display = 'none';
            }
        }

        const smokeChip = popup.querySelector('.header-info-chip[data-type="smoke"]');
        if (smokeChip) {
            const activeSmoke = this._panel._getAllEntitiesByType('smoke').filter(id => this._hass.states[id]?.state === 'on');
            if (activeSmoke.length > 0) {
                smokeChip.style.display = 'flex';
                smokeChip.style.background = 'var(--red)';
                smokeChip.querySelector('.chip-name').textContent = `${activeSmoke.length} active`;
            } else {
                smokeChip.style.display = 'none';
            }
        }
    }
    
    initializeChips(popup) {
        popup.querySelectorAll('#security-header-chips .header-info-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const chipType = chip.getAttribute('data-type');
                const tabMap = {
                    'motion': 'bewegung-tab',
                    'windows': 'fenster-tab',
                    'smoke': 'rauchmelder-tab'
                };
                const targetTabId = tabMap[chipType];
                if (targetTabId) {
                    const targetButton = popup.querySelector(`.tab-button[data-target="${targetTabId}"]`);
                    if (targetButton) targetButton.click();
                }
            });
        });
    }
}
