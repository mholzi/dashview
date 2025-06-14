"""Widget definitions for DashView dashboard."""

def get_widget_html():
    """Get the HTML for all custom widgets."""
    return """
    <!-- Room Widget Template -->
    <template id="room-widget-template">
        <div class="room-widget">
            <div class="room-header">
                <span class="room-icon"></span>
                <h3 class="room-name"></h3>
                <span class="room-status"></span>
            </div>
            <div class="room-entities"></div>
        </div>
    </template>

    <!-- Entity Widget Template -->
    <template id="entity-widget-template">
        <div class="entity-widget" data-entity-id="">
            <div class="entity-icon"></div>
            <div class="entity-info">
                <div class="entity-name"></div>
                <div class="entity-state"></div>
            </div>
            <div class="entity-controls"></div>
        </div>
    </template>

    <!-- Button Widget Template -->
    <template id="button-widget-template">
        <button class="custom-button" data-entity-id="" data-action="">
            <span class="button-icon"></span>
            <span class="button-text"></span>
        </button>
    </template>

    <!-- Sensor Card Template -->
    <template id="sensor-card-template">
        <div class="sensor-card" data-entity-id="">
            <div class="sensor-icon"></div>
            <div class="sensor-value">
                <span class="sensor-number"></span>
                <span class="sensor-unit"></span>
            </div>
            <div class="sensor-name"></div>
        </div>
    </template>

    <!-- Media Player Widget Template -->
    <template id="media-widget-template">
        <div class="media-widget" data-entity-id="">
            <div class="media-info">
                <div class="media-title"></div>
                <div class="media-artist"></div>
            </div>
            <div class="media-controls">
                <button class="media-btn" data-action="media_previous_track">⏮</button>
                <button class="media-btn play-pause" data-action="media_play_pause">▶</button>
                <button class="media-btn" data-action="media_next_track">⏭</button>
            </div>
            <div class="media-volume">
                <span>🔊</span>
                <input type="range" class="volume-slider" min="0" max="100" step="1">
            </div>
        </div>
    </template>

    <!-- Climate Widget Template -->
    <template id="climate-widget-template">
        <div class="climate-widget" data-entity-id="">
            <div class="climate-temp">
                <span class="current-temp"></span>
                <span class="target-temp"></span>
            </div>
            <div class="climate-controls">
                <button class="temp-btn" data-action="decrease">-</button>
                <button class="temp-btn" data-action="increase">+</button>
            </div>
            <div class="climate-mode"></div>
        </div>
    </template>
    """

def get_widget_css():
    """Get the CSS for all custom widgets."""
    return """
    /* Room Widget Styles */
    .room-widget {
        background: white;
        border-radius: var(--border-radius, 12px);
        padding: 20px;
        margin: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .room-widget:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .room-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }

    .room-icon {
        font-size: 1.5em;
        margin-right: 10px;
        color: var(--primary-color, #667eea);
    }

    .room-name {
        flex: 1;
        margin: 0;
        color: var(--text-color, #333);
        font-size: 1.2em;
    }

    .room-status {
        font-size: 0.9em;
        color: #666;
        background: #f0f0f0;
        padding: 2px 8px;
        border-radius: 10px;
    }

    .room-entities {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
    }

    /* Entity Widget Styles */
    .entity-widget {
        display: flex;
        align-items: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .entity-widget:hover {
        background: #e9ecef;
    }

    .entity-widget.active {
        background: var(--primary-color, #667eea);
        color: white;
    }

    .entity-icon {
        font-size: 1.2em;
        margin-right: 10px;
        width: 20px;
        text-align: center;
    }

    .entity-info {
        flex: 1;
    }

    .entity-name {
        font-weight: 500;
        font-size: 0.9em;
    }

    .entity-state {
        font-size: 0.8em;
        opacity: 0.7;
        margin-top: 2px;
    }

    .entity-controls {
        display: flex;
        gap: 5px;
    }

    /* Custom Button Styles */
    .custom-button {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: var(--primary-color, #667eea);
        color: white;
        border: none;
        border-radius: var(--border-radius, 8px);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9em;
        font-weight: 500;
    }

    .custom-button:hover {
        background: var(--secondary-color, #5a67d8);
        transform: translateY(-1px);
    }

    .custom-button:active {
        transform: translateY(0);
    }

    .button-icon {
        margin-right: 8px;
        font-size: 1.1em;
    }

    /* Sensor Card Styles */
    .sensor-card {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: var(--border-radius, 8px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .sensor-icon {
        font-size: 2em;
        color: var(--primary-color, #667eea);
        margin-bottom: 10px;
    }

    .sensor-value {
        font-size: 1.5em;
        font-weight: bold;
        color: var(--text-color, #333);
        margin-bottom: 5px;
    }

    .sensor-unit {
        font-size: 0.8em;
        font-weight: normal;
        color: #666;
    }

    .sensor-name {
        font-size: 0.9em;
        color: #666;
    }

    /* Media Player Widget Styles */
    .media-widget {
        background: white;
        border-radius: var(--border-radius, 8px);
        padding: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .media-info {
        margin-bottom: 10px;
    }

    .media-title {
        font-weight: bold;
        color: var(--text-color, #333);
    }

    .media-artist {
        font-size: 0.9em;
        color: #666;
        margin-top: 2px;
    }

    .media-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
    }

    .media-btn {
        background: var(--primary-color, #667eea);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 1.2em;
        transition: background-color 0.2s ease;
    }

    .media-btn:hover {
        background: var(--secondary-color, #5a67d8);
    }

    .media-volume {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .volume-slider {
        flex: 1;
        height: 5px;
        border-radius: 2px;
        background: #ddd;
        outline: none;
    }

    /* Climate Widget Styles */
    .climate-widget {
        background: white;
        border-radius: var(--border-radius, 8px);
        padding: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        text-align: center;
    }

    .climate-temp {
        font-size: 1.5em;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .current-temp {
        color: var(--primary-color, #667eea);
    }

    .target-temp {
        color: #666;
        margin-left: 10px;
    }

    .climate-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
    }

    .temp-btn {
        background: var(--primary-color, #667eea);
        color: white;
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        font-size: 1.2em;
        font-weight: bold;
    }

    .temp-btn:hover {
        background: var(--secondary-color, #5a67d8);
    }

    .climate-mode {
        font-size: 0.9em;
        color: #666;
        text-transform: capitalize;
    }
    """

def get_widget_javascript():
    """Get the JavaScript for all custom widgets."""
    return """
    // Widget management functions
    class DashViewWidgets {
        constructor() {
            this.entityStates = {};
            this.dashboardData = {};
        }

        // Initialize all widgets
        async init() {
            await this.loadDashboardData();
            this.setupEventListeners();
            this.startStateUpdates();
        }

        // Load dashboard configuration and entity states
        async loadDashboardData() {
            try {
                const response = await fetch('/api/dashview/data?action=get_dashboard_data');
                this.dashboardData = await response.json();
                this.entityStates = this.dashboardData.entity_states || {};
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        }

        // Create room widget
        createRoomWidget(roomId, roomConfig) {
            const template = document.getElementById('room-widget-template');
            const widget = template.content.cloneNode(true);
            
            const roomWidget = widget.querySelector('.room-widget');
            const roomIcon = widget.querySelector('.room-icon');
            const roomName = widget.querySelector('.room-name');
            const roomStatus = widget.querySelector('.room-status');
            const roomEntities = widget.querySelector('.room-entities');

            roomWidget.dataset.roomId = roomId;
            roomIcon.textContent = roomConfig.icon || '🏠';
            roomName.textContent = roomConfig.name;
            
            // Count active entities
            const entities = roomConfig.entities || [];
            const activeCount = entities.filter(entityId => {
                const state = this.entityStates[entityId];
                return state && ['on', 'open', 'active'].includes(state.state.toLowerCase());
            }).length;
            
            roomStatus.textContent = `${activeCount}/${entities.length} active`;

            // Add entity widgets
            entities.forEach(entityId => {
                const entityWidget = this.createEntityWidget(entityId);
                if (entityWidget) {
                    roomEntities.appendChild(entityWidget);
                }
            });

            return roomWidget;
        }

        // Create entity widget
        createEntityWidget(entityId) {
            const state = this.entityStates[entityId];
            if (!state) return null;

            const domain = entityId.split('.')[0];
            const entityConfig = this.dashboardData.entities[entityId] || {};

            switch (domain) {
                case 'light':
                case 'switch':
                    return this.createButtonWidget(entityId, state, entityConfig);
                case 'sensor':
                case 'binary_sensor':
                    return this.createSensorWidget(entityId, state, entityConfig);
                case 'media_player':
                    return this.createMediaWidget(entityId, state, entityConfig);
                case 'climate':
                    return this.createClimateWidget(entityId, state, entityConfig);
                default:
                    return this.createGenericWidget(entityId, state, entityConfig);
            }
        }

        // Create button widget for lights/switches
        createButtonWidget(entityId, state, config) {
            const template = document.getElementById('button-widget-template');
            const widget = template.content.cloneNode(true);
            
            const button = widget.querySelector('.custom-button');
            const icon = widget.querySelector('.button-icon');
            const text = widget.querySelector('.button-text');

            button.dataset.entityId = entityId;
            button.dataset.action = 'toggle';
            
            const isOn = ['on', 'open'].includes(state.state.toLowerCase());
            button.classList.toggle('active', isOn);
            
            icon.textContent = config.icon || (entityId.includes('light') ? '💡' : '🔌');
            text.textContent = state.attributes.friendly_name || entityId;

            button.addEventListener('click', () => this.toggleEntity(entityId));

            return widget;
        }

        // Create sensor widget
        createSensorWidget(entityId, state, config) {
            const template = document.getElementById('sensor-card-template');
            const widget = template.content.cloneNode(true);
            
            const card = widget.querySelector('.sensor-card');
            const icon = widget.querySelector('.sensor-icon');
            const number = widget.querySelector('.sensor-number');
            const unit = widget.querySelector('.sensor-unit');
            const name = widget.querySelector('.sensor-name');

            card.dataset.entityId = entityId;
            
            icon.textContent = config.icon || '📊';
            number.textContent = parseFloat(state.state) || state.state;
            unit.textContent = state.attributes.unit_of_measurement || '';
            name.textContent = state.attributes.friendly_name || entityId;

            return widget;
        }

        // Create media player widget
        createMediaWidget(entityId, state, config) {
            const template = document.getElementById('media-widget-template');
            const widget = template.content.cloneNode(true);
            
            const mediaWidget = widget.querySelector('.media-widget');
            const title = widget.querySelector('.media-title');
            const artist = widget.querySelector('.media-artist');
            const playPause = widget.querySelector('.play-pause');
            const volumeSlider = widget.querySelector('.volume-slider');

            mediaWidget.dataset.entityId = entityId;
            
            title.textContent = state.attributes.media_title || 'No media';
            artist.textContent = state.attributes.media_artist || '';
            
            const isPlaying = state.state === 'playing';
            playPause.textContent = isPlaying ? '⏸' : '▶';
            
            volumeSlider.value = Math.round((state.attributes.volume_level || 0) * 100);

            // Add event listeners
            widget.querySelectorAll('.media-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    this.callService('media_player', action, entityId);
                });
            });

            volumeSlider.addEventListener('change', () => {
                this.callService('media_player', 'volume_set', entityId, {
                    volume_level: volumeSlider.value / 100
                });
            });

            return widget;
        }

        // Create climate widget
        createClimateWidget(entityId, state, config) {
            const template = document.getElementById('climate-widget-template');
            const widget = template.content.cloneNode(true);
            
            const climateWidget = widget.querySelector('.climate-widget');
            const currentTemp = widget.querySelector('.current-temp');
            const targetTemp = widget.querySelector('.target-temp');
            const mode = widget.querySelector('.climate-mode');

            climateWidget.dataset.entityId = entityId;
            
            currentTemp.textContent = `${state.attributes.current_temperature || '--'}°`;
            targetTemp.textContent = `${state.attributes.temperature || '--'}°`;
            mode.textContent = state.state;

            // Add event listeners
            widget.querySelectorAll('.temp-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    const currentTarget = state.attributes.temperature || 20;
                    const newTarget = action === 'increase' ? currentTarget + 1 : currentTarget - 1;
                    
                    this.callService('climate', 'set_temperature', entityId, {
                        temperature: newTarget
                    });
                });
            });

            return widget;
        }

        // Create generic entity widget
        createGenericWidget(entityId, state, config) {
            const template = document.getElementById('entity-widget-template');
            const widget = template.content.cloneNode(true);
            
            const entityWidget = widget.querySelector('.entity-widget');
            const icon = widget.querySelector('.entity-icon');
            const name = widget.querySelector('.entity-name');
            const stateText = widget.querySelector('.entity-state');

            entityWidget.dataset.entityId = entityId;
            
            icon.textContent = config.icon || '📋';
            name.textContent = state.attributes.friendly_name || entityId;
            stateText.textContent = state.state;

            return widget;
        }

        // Toggle entity state
        async toggleEntity(entityId) {
            const domain = entityId.split('.')[0];
            const service = domain === 'light' ? 'toggle' : 'toggle';
            await this.callService(domain, service, entityId);
        }

        // Call Home Assistant service
        async callService(domain, service, entityId, serviceData = {}) {
            try {
                const response = await fetch('/api/services/' + domain + '/' + service, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        entity_id: entityId,
                        ...serviceData
                    })
                });
                
                if (response.ok) {
                    // Refresh entity state after service call
                    setTimeout(() => this.loadDashboardData(), 500);
                }
            } catch (error) {
                console.error('Service call failed:', error);
            }
        }

        // Setup event listeners
        setupEventListeners() {
            // Refresh button
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('refresh-btn')) {
                    this.loadDashboardData();
                }
            });
        }

        // Start periodic state updates
        startStateUpdates() {
            setInterval(() => {
                this.loadDashboardData();
            }, 30000); // Update every 30 seconds
        }
    }

    // Initialize widgets when DOM is loaded
    window.dashViewWidgets = new DashViewWidgets();
    """