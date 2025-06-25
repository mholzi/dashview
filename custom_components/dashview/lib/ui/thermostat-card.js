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

        const tempElement = card.querySelector('.temperature');
        const humElement = card.querySelector('.humidity');
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

        const minTemp = Math.min(...temperatures);
        const maxTemp = Math.max(...temperatures);
        const tempRange = maxTemp - minTemp || 1;
        const svgWidth = 100;
        const svgHeight = 85;

        const points = historyData.map((d, i) => ({
            x: (i / (historyData.length - 1)) * svgWidth,
            y: svgHeight - ((parseFloat(d.state) - minTemp) / tempRange) * svgHeight,
        }));

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const x_mid = (points[i].x + points[i+1].x) / 2;
            const y_mid = (points[i].y + points[i+1].y) / 2;
            const cp_x1 = (x_mid + points[i].x) / 2;
            const cp_x2 = (x_mid + points[i+1].x) / 2;
            pathD += ` C ${cp_x1} ${points[i].y}, ${cp_x2} ${points[i+1].y}, ${points[i+1].x} ${points[i+1].y}`;
        }
        
        const filledPathD = `${pathD} V ${svgHeight} H ${points[0].x} Z`;
        const pointsSVG = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="1.5" class="graph-point" />`).join('');
        
        container.innerHTML = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
                <defs>
                    <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--blue); stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:var(--blue); stop-opacity:0.05" />
                    </linearGradient>
                </defs>
                <path d="${filledPathD}" class="graph-fill" />
                <path d="${pathD}" class="graph-path" />
                ${pointsSVG}
            </svg>`;
    }
}
