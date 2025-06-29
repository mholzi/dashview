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

    _formatTimeAgo(lastChanged) {
        if (!lastChanged) return 'Unbekannt';
        
        const now = new Date();
        const changed = new Date(lastChanged);
        const diffMs = now - changed;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) {
            return 'Jetzt';
        } else if (diffMinutes < 60) {
            return `vor ${diffMinutes} min`;
        } else if (diffHours < 24) {
            return `vor ${diffHours} h`;
        } else {
            return `vor ${diffDays} Tagen`;
        }
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
        const { WINDOW, MOTION, SMOKE, VIBRATION } = this._panel._entityLabels;
        const lists = {
            [WINDOW]: { open: '#open-windows-list', closed: '#closed-windows-list' },
            [MOTION]: { open: '#active-motion-list', closed: '#inactive-motion-list' },
            [SMOKE]: { open: '#active-smoke-detector-list', closed: '#inactive-smoke-detector-list' },
            [VIBRATION]: { open: '#active-vibration-list', closed: '#inactive-vibration-list' }
        };

        for (const [type, selectors] of Object.entries(lists)) {
            const allEntities = this._panel._getAllEntitiesByType(type);
            const openEntities = allEntities.filter(id => this._hass.states[id]?.state === 'on');
            const closedEntities = allEntities.filter(id => this._hass.states[id]?.state === 'off');

            this._renderEntityList(popup, popup.querySelector(selectors.open), openEntities);
            this._renderEntityList(popup, popup.querySelector(selectors.closed), closedEntities);
        }
    }

    _getSecurityCardDisplayData(entityId, type) {
        const entityState = this._hass.states[entityId];
        
        let name = entityState?.attributes.friendly_name || entityId;
        let label = entityState?.state || 'N/A';
        let icon = 'mdi:help-circle';
        let cardClass = '';

        if (!entityState || entityState.state === 'unavailable') {
            cardClass = 'is-unavailable';
            label = 'Nicht verfügbar';
        } else if (entityState.state === 'on' || entityState.state === 'Run' || entityState.state === 'playing') {
            cardClass = 'is-on';
        }

        const { WINDOW, MOTION, SMOKE, VIBRATION } = this._panel._entityLabels;
        switch (type) {
            case WINDOW:
                 icon = entityState.state === 'on' ? 'mdi:window-open-variant' : 'mdi:window-closed';
                 label = entityState.state === 'on' ? 'Offen' : 'Geschlossen';
                 break;
            case MOTION:
                 icon = entityState.state === 'on' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
                 label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                 break;
            case SMOKE:
                icon = entityState.state === 'on' ? 'mdi:smoke-detector-variant-alert' : 'mdi:smoke-detector-variant';
                label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                break;
            case VIBRATION:
                icon = entityState.state === 'on' ? 'mdi:vibrate' : 'mdi:vibrate-off';
                label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                break;
            default:
                if (entityState?.state === 'on' || entityState?.state === 'off') {
                    label = entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1);
                }
                break;
        }
        return { name, label, icon, cardClass };
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
            
            // This is the critical change to get the entity type
            const type = this._panel._getEntityTypeFromConfig(entityId);
            const { name, label, icon, cardClass } = this._getSecurityCardDisplayData(entityId, type);

            // *** FIX: Add the data-type attribute to the card ***
            cardElement.dataset.type = type;

            cardElement.className = `sensor-small-card ${cardClass}`;
            cardElement.querySelector('.sensor-small-name').textContent = name;
            cardElement.querySelector('.sensor-small-label').textContent = label;
            cardElement.querySelector('.sensor-small-icon-cell .mdi').className = `mdi ${this._panel._processIconName(icon)}`;
            
            container.appendChild(card);
        });
    }

    _getSecurityCardDisplayData(entityId, type) {
        const entityState = this._hass.states[entityId];
        
        let name = entityState?.attributes.friendly_name || entityId;
        let label = entityState?.state || 'N/A';
        let icon = 'mdi:help-circle';
        let cardClass = '';

        if (!entityState || entityState.state === 'unavailable') {
            cardClass = 'is-unavailable';
            label = 'Nicht verfügbar';
        } else if (entityState.state === 'on') {
            cardClass = 'is-on';
        }

        const { WINDOW, MOTION, SMOKE, VIBRATION } = this._panel._entityLabels;
        switch (type) {
            case WINDOW:
                 icon = entityState.state === 'on' ? 'mdi:window-open-variant' : 'mdi:window-closed';
                 label = entityState.state === 'on' ? 'Offen' : 'Geschlossen';
                 break;
            case MOTION:
                 icon = entityState.state === 'on' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
                 label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                 if(entityState.state === 'on') cardClass += ' active-motion'; // Add a specific class for active motion
                 break;
            case SMOKE:
                icon = entityState.state === 'on' ? 'mdi:smoke-detector-variant-alert' : 'mdi:smoke-detector-variant';
                label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                if(entityState.state === 'on') cardClass += ' active-smoke'; // Add a specific class for active smoke
                break;
            case VIBRATION:
                icon = entityState.state === 'on' ? 'mdi:vibrate' : 'mdi:vibrate-off';
                label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
                if(entityState.state === 'on') cardClass += ' active-vibration'; // Add a specific class for active vibration
                break;
            default:
                if (entityState?.state === 'on' || entityState?.state === 'off') {
                    label = entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1);
                }
                break;
        }
        return { name, label, icon, cardClass };
    }
    _updateSecurityHeaderButtons(popup) {
        if (!this._hass || !popup) return;

        const motionChip = popup.querySelector('.header-info-chip[data-type="motion"]');
        if (motionChip) {
            const allMotionSensors = this._panel._getAllEntitiesByType(this._panel._entityLabels.MOTION);
            const activeMotionSensors = allMotionSensors.filter(id => this._hass.states[id]?.state === 'on');
            
            if (allMotionSensors.length > 0) {
                motionChip.style.display = 'flex';
                
                const iconElement = motionChip.querySelector('.chip-icon-container i');
                const nameElement = motionChip.querySelector('.chip-name');
                const iconContainer = motionChip.querySelector('.chip-icon-container');
                
                if (activeMotionSensors.length > 0) {
                    // Motion detected - show active state
                    iconElement.className = 'mdi mdi-motion-sensor';
                    iconContainer.style.background = 'var(--active-big)';
                    
                    // Find the most recently triggered motion sensor
                    let mostRecentChange = null;
                    activeMotionSensors.forEach(entityId => {
                        const state = this._hass.states[entityId];
                        if (state?.last_changed) {
                            const changed = new Date(state.last_changed);
                            if (!mostRecentChange || changed > mostRecentChange) {
                                mostRecentChange = changed;
                            }
                        }
                    });
                    
                    const timeText = this._formatTimeAgo(mostRecentChange?.toISOString());
                    nameElement.textContent = timeText;
                } else {
                    // No motion detected - show inactive state
                    iconElement.className = 'mdi mdi-motion-sensor-off';
                    iconContainer.style.background = 'var(--gray000)';
                    
                    // Find the most recently inactive motion sensor
                    let mostRecentChange = null;
                    allMotionSensors.forEach(entityId => {
                        const state = this._hass.states[entityId];
                        if (state?.last_changed) {
                            const changed = new Date(state.last_changed);
                            if (!mostRecentChange || changed > mostRecentChange) {
                                mostRecentChange = changed;
                            }
                        }
                    });
                    
                    const timeText = this._formatTimeAgo(mostRecentChange?.toISOString());
                    nameElement.textContent = timeText;
                }
            } else {
                motionChip.style.display = 'none';
            }
        }

        const windowsChip = popup.querySelector('.header-info-chip[data-type="windows"]');
        if (windowsChip) {
            const openWindows = this._panel._getAllEntitiesByType(this._panel._entityLabels.WINDOW).filter(id => this._hass.states[id]?.state === 'on');
            const iconContainer = windowsChip.querySelector('.chip-icon-container');
            const iconElement = windowsChip.querySelector('.chip-icon-container i');
            
            if (openWindows.length > 0) {
                windowsChip.style.display = 'flex';
                windowsChip.querySelector('.chip-name').textContent = `${openWindows.length} offen`;
                iconContainer.style.background = 'var(--orange)';
                iconElement.className = 'mdi mdi-window-open';
            } else {
                windowsChip.style.display = 'none';
            }
        }

        const smokeChip = popup.querySelector('.header-info-chip[data-type="smoke"]');
        if (smokeChip) {
            const activeSmoke = this._panel._getAllEntitiesByType(this._panel._entityLabels.SMOKE).filter(id => this._hass.states[id]?.state === 'on');
            const iconContainer = smokeChip.querySelector('.chip-icon-container');
            const iconElement = smokeChip.querySelector('.chip-icon-container i');
            
            if (activeSmoke.length > 0) {
                smokeChip.style.display = 'flex';
                iconContainer.style.background = 'var(--red)';
                iconElement.className = 'mdi mdi-smoke-detector-variant-alert';
                smokeChip.querySelector('.chip-name').textContent = `${activeSmoke.length} aktiv`;
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
