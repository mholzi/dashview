// custom_components/dashview/lib/ui/thermostat-card.js

export class ThermostatCard {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Initializes and updates the thermostat card within a given popup.
     * @param {HTMLElement} popup The popup element containing the card.
     * @param {string} roomKey The key for the current room.
     */
    async update(popup, roomKey) {
        if (!this._hass || !this._config.rooms || !roomKey) return;

        const roomConfig = this._config.rooms[roomKey];
        const card = popup.querySelector('.thermostat-card');
        if (!roomConfig || !card) return;

        const tempSensorConfig = roomConfig.header_entities?.find(e => e.entity_type === 'temperatur');
        const humSensorConfig = roomConfig.header_entities?.find(e => e.entity_type === 'humidity');
        const tempEntityId = tempSensorConfig?.entity;
        const humEntityId = humSensorConfig?.entity;

        const tempElement = card.querySelector('.thermostat-temp-display .temperature');
        const humElement = card.querySelector('.thermostat-temp-display .humidity');
        const nameElement = card.querySelector('.thermostat-name');

        if (nameElement) nameElement.textContent = roomConfig.friendly_name || roomKey;

        // Update temperature value and graph
        if (tempEntityId && this._hass.states[tempEntityId]) {
            const tempState = this._hass.states[tempEntityId];
            const tempValue = parseFloat(tempState.state);
            if (tempElement) tempElement.textContent = isNaN(tempValue) ? '--°' : `${tempValue.toFixed(1)}°`;

            try {
                const history = await this._hass.callApi('GET', `dashview/config?type=history&entity_id=${tempEntityId}`);
                const graphContainer = card.querySelector('.thermostat-graph');
                if (history && graphContainer) {
                    this._renderTemperatureGraph(graphContainer, history);
                }
            } catch (e) {
                console.error("[ThermostatCard] Error fetching history for graph:", e);
            }
        } else if (tempElement) {
            tempElement.textContent = '--°';
        }

        // Update humidity value
        if (humEntityId && this._hass.states[humEntityId]) {
            const humState = this._hass.states[humEntityId];
            const humValue = parseFloat(humState.state);
            if(humElement) humElement.textContent = isNaN(humValue) ? '--%' : `${Math.round(humValue)}%`;
        } else if (humElement) {
            humElement.textContent = '--%';
        }
    }

    _renderTemperatureGraph(container, historyData) {
        if (!container || !Array.isArray(historyData) || historyData.length < 2) {
            container.innerHTML = '';
            return;
        }

        const temperatures = historyData.map(d => parseFloat(d.state)).filter(t => !isNaN(t));
        if (temperatures.length < 2) {
            container.innerHTML = '';
            return;
        }

        // Calculate min/max with some padding for better visualization
        const minTemp = Math.min(...temperatures);
        const maxTemp = Math.max(...temperatures);
        const tempRange = Math.max(maxTemp - minTemp, 2); // Minimum range of 2 degrees
        const padding = tempRange * 0.1; // 10% padding
        const adjustedMin = minTemp - padding;
        const adjustedMax = maxTemp + padding;
        const adjustedRange = adjustedMax - adjustedMin;
        
        const svgWidth = 100;
        const svgHeight = 85;

        // Create line path with smooth curves
        const points = historyData.map((d, i) => ({
            x: (i / (historyData.length - 1)) * svgWidth,
            y: svgHeight - ((parseFloat(d.state) - adjustedMin) / adjustedRange) * svgHeight,
            temp: parseFloat(d.state)
        })).filter(p => !isNaN(p.temp));

        if (points.length < 2) {
            container.innerHTML = '';
            return;
        }

        // Create smooth curve path using quadratic curves
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            
            if (i === 1) {
                // First curve - start from first point
                pathD += ` Q ${prevPoint.x + (currentPoint.x - prevPoint.x) / 2} ${prevPoint.y} ${currentPoint.x} ${currentPoint.y}`;
            } else {
                // Smooth curves between points
                const nextPoint = points[i + 1] || currentPoint;
                const cp1x = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5;
                const cp1y = prevPoint.y;
                const cp2x = currentPoint.x - (nextPoint.x - currentPoint.x) * 0.3;
                const cp2y = currentPoint.y;
                
                pathD += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${currentPoint.x} ${currentPoint.y}`;
            }
        }

        container.innerHTML = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
                <defs>
                    <linearGradient id="temp-graph-gradient-${container.id || 'default'}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--gray800); stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:var(--gray800); stop-opacity:0.0" />
                    </linearGradient>
                </defs>
                <path d="${pathD}" class="graph-path" stroke="var(--gray800)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </svg>`;
    }

    /**
     * Render entity-specific thermostat data for popup context
     * @param {HTMLElement} container - The popup container
     * @param {string} entityId - The entity ID to render
     */
    async renderEntityThermostat(container, entityId) {
        console.log('[ThermostatCard] Rendering entity thermostat for popup:', entityId);
        
        if (!this._hass || !entityId) {
            console.warn('[ThermostatCard] Cannot render entity thermostat: missing hass or entityId');
            return;
        }
        
        const entityState = this._hass.states[entityId];
        if (!entityState) {
            console.warn('[ThermostatCard] Entity not found:', entityId);
            return;
        }
        
        // Determine if this is a temperature or humidity sensor
        const unitOfMeasurement = entityState.attributes?.unit_of_measurement;
        const isTemperature = unitOfMeasurement === '°C' || unitOfMeasurement === '°F';
        const isHumidity = unitOfMeasurement === '%' && entityState.attributes?.device_class === 'humidity';
        
        // Create single-entity thermostat display
        let html = '<div class="entity-thermostat-display">';
        
        // Current value display
        html += '<div class="thermostat-current-value">';
        html += `<span class="value">${entityState.state}</span>`;
        html += `<span class="unit">${unitOfMeasurement || ''}</span>`;
        html += '</div>';
        
        // Entity name
        html += `<div class="thermostat-entity-name">${entityState.attributes.friendly_name || entityId}</div>`;
        
        // Historical graph placeholder
        html += '<div class="thermostat-history">';
        html += '<h4>Historical Data</h4>';
        html += '<div class="graph-placeholder">';
        html += '<p>Historical temperature/humidity graph would be displayed here</p>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // TODO: Implement actual historical data fetching and graphing
        console.log('[ThermostatCard] Entity thermostat rendering complete for:', entityId);
    }
}
