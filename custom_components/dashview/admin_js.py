"""Admin interface functionality for DashView."""

def get_admin_javascript():
    """Get the JavaScript for the admin interface."""
    return """
    // Admin panel management functions
    class DashViewAdmin {
        constructor() {
            this.config = {};
            this.haEntities = [];
        }

        async init() {
            await this.loadConfig();
            await this.loadHAEntities();
            this.setupAdminUI();
        }

        // Load current configuration
        async loadConfig() {
            try {
                const response = await fetch('/api/dashview/admin?action=get_config');
                this.config = await response.json();
                this.populateConfigUI();
            } catch (error) {
                console.error('Failed to load config:', error);
            }
        }

        // Load Home Assistant entities
        async loadHAEntities() {
            try {
                const response = await fetch('/api/dashview/admin?action=get_ha_entities');
                const data = await response.json();
                this.haEntities = data.entities || [];
                this.populateEntitySelect();
            } catch (error) {
                console.error('Failed to load HA entities:', error);
            }
        }

        // Populate configuration UI
        populateConfigUI() {
            // Populate CSS config
            const cssConfig = this.config.css_config || {};
            document.getElementById('primary-color').value = cssConfig.primary_color || '#667eea';
            document.getElementById('secondary-color').value = cssConfig.secondary_color || '#764ba2';
            document.getElementById('background-color').value = cssConfig.background_color || '#f5f5f5';
            document.getElementById('text-color').value = cssConfig.text_color || '#333';
            document.getElementById('font-family').value = cssConfig.font_family || 'system';
            
            const borderRadius = parseInt(cssConfig.border_radius) || 12;
            document.getElementById('border-radius').value = borderRadius;
            document.getElementById('border-radius-value').textContent = borderRadius + 'px';

            // Populate rooms list
            this.populateRoomsList();
            this.populateRoomSelect();
        }

        // Populate entity select dropdown
        populateEntitySelect() {
            const select = document.getElementById('ha-entity-select');
            select.innerHTML = '<option value="">Select an entity...</option>';
            
            this.haEntities.forEach(entity => {
                const option = document.createElement('option');
                option.value = entity.entity_id;
                option.textContent = `${entity.name} (${entity.entity_id})`;
                select.appendChild(option);
            });
        }

        // Populate rooms list
        populateRoomsList() {
            const roomsList = document.getElementById('room-list');
            roomsList.innerHTML = '';
            
            Object.entries(this.config.rooms || {}).forEach(([roomId, room]) => {
                const roomItem = document.createElement('div');
                roomItem.className = 'room-item';
                roomItem.innerHTML = `
                    <div>
                        <strong>${room.icon || '🏠'} ${room.name}</strong>
                        <small> (Order: ${room.order || 0}, Entities: ${(room.entities || []).length})</small>
                    </div>
                    <div>
                        <button class="btn btn-secondary" onclick="editRoom('${roomId}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteRoom('${roomId}')">Delete</button>
                    </div>
                `;
                roomsList.appendChild(roomItem);
            });
        }

        // Populate room select for entity assignment
        populateRoomSelect() {
            const select = document.getElementById('entity-room-select');
            select.innerHTML = '<option value="">No room</option>';
            
            Object.entries(this.config.rooms || {}).forEach(([roomId, room]) => {
                const option = document.createElement('option');
                option.value = roomId;
                option.textContent = `${room.icon || '🏠'} ${room.name}`;
                select.appendChild(option);
            });
        }

        // Setup admin UI event listeners
        setupAdminUI() {
            // Border radius slider
            const borderRadiusSlider = document.getElementById('border-radius');
            if (borderRadiusSlider) {
                borderRadiusSlider.addEventListener('input', (e) => {
                    document.getElementById('border-radius-value').textContent = e.target.value + 'px';
                });
            }

            // Entity select change
            const entitySelect = document.getElementById('ha-entity-select');
            if (entitySelect) {
                entitySelect.addEventListener('change', (e) => {
                    const entityId = e.target.value;
                    if (entityId) {
                        const entity = this.haEntities.find(e => e.entity_id === entityId);
                        if (entity) {
                            document.getElementById('entity-custom-name').value = entity.name;
                            document.getElementById('entity-custom-icon').value = entity.icon || '';
                            document.getElementById('entity-type').value = entity.domain;
                        }
                    }
                });
            }
        }
    }

    // Global admin instance
    window.dashViewAdmin = new DashViewAdmin();

    // Room management functions
    async function saveRoom() {
        const name = document.getElementById('room-name').value;
        const icon = document.getElementById('room-icon').value;
        const order = parseInt(document.getElementById('room-order').value) || 1;
        
        if (!name.trim()) {
            alert('Please enter a room name');
            return;
        }
        
        const roomId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const roomData = {
            name: name.trim(),
            icon: icon.trim() || '🏠',
            order: order,
            entities: []
        };
        
        try {
            const response = await fetch('/api/dashview/admin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'update_room',
                    room_id: roomId,
                    room_data: roomData
                })
            });
            
            if (response.ok) {
                alert('Room saved successfully!');
                clearRoomForm();
                await window.dashViewAdmin.loadConfig();
            } else {
                alert('Failed to save room');
            }
        } catch (error) {
            console.error('Error saving room:', error);
            alert('Error saving room');
        }
    }

    function clearRoomForm() {
        document.getElementById('room-name').value = '';
        document.getElementById('room-icon').value = '';
        document.getElementById('room-order').value = '';
    }

    function editRoom(roomId) {
        const room = window.dashViewAdmin.config.rooms[roomId];
        if (room) {
            document.getElementById('room-name').value = room.name;
            document.getElementById('room-icon').value = room.icon || '';
            document.getElementById('room-order').value = room.order || 1;
        }
    }

    async function deleteRoom(roomId) {
        if (confirm('Are you sure you want to delete this room?')) {
            try {
                const response = await fetch('/api/dashview/admin', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'delete_room',
                        room_id: roomId
                    })
                });
                
                if (response.ok) {
                    alert('Room deleted successfully!');
                    await window.dashViewAdmin.loadConfig();
                } else {
                    alert('Failed to delete room');
                }
            } catch (error) {
                console.error('Error deleting room:', error);
                alert('Error deleting room');
            }
        }
    }

    // Entity configuration functions
    async function saveEntityConfig() {
        const entityId = document.getElementById('ha-entity-select').value;
        const customName = document.getElementById('entity-custom-name').value;
        const customIcon = document.getElementById('entity-custom-icon').value;
        const entityType = document.getElementById('entity-type').value;
        const roomId = document.getElementById('entity-room-select').value;
        
        if (!entityId) {
            alert('Please select an entity');
            return;
        }
        
        const entityData = {
            custom_name: customName.trim(),
            custom_icon: customIcon.trim(),
            entity_type: entityType,
            assigned_room: roomId
        };
        
        try {
            // Save entity configuration
            const response = await fetch('/api/dashview/admin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'update_entity',
                    entity_id: entityId,
                    entity_data: entityData
                })
            });
            
            if (response.ok && roomId) {
                // Assign entity to room
                await fetch('/api/dashview/admin', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'assign_entity_to_room',
                        entity_id: entityId,
                        room_id: roomId
                    })
                });
            }
            
            if (response.ok) {
                alert('Entity configuration saved successfully!');
                clearEntityForm();
                await window.dashViewAdmin.loadConfig();
            } else {
                alert('Failed to save entity configuration');
            }
        } catch (error) {
            console.error('Error saving entity config:', error);
            alert('Error saving entity configuration');
        }
    }

    function clearEntityForm() {
        document.getElementById('ha-entity-select').value = '';
        document.getElementById('entity-custom-name').value = '';
        document.getElementById('entity-custom-icon').value = '';
        document.getElementById('entity-type').value = '';
        document.getElementById('entity-room-select').value = '';
    }

    // CSS configuration functions
    async function saveCSSConfig() {
        const cssConfig = {
            primary_color: document.getElementById('primary-color').value,
            secondary_color: document.getElementById('secondary-color').value,
            background_color: document.getElementById('background-color').value,
            text_color: document.getElementById('text-color').value,
            font_family: document.getElementById('font-family').value,
            border_radius: document.getElementById('border-radius').value + 'px'
        };
        
        try {
            const response = await fetch('/api/dashview/admin', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'update_css_config',
                    css_config: cssConfig
                })
            });
            
            if (response.ok) {
                alert('CSS configuration saved! Please refresh the page to see changes.');
            } else {
                alert('Failed to save CSS configuration');
            }
        } catch (error) {
            console.error('Error saving CSS config:', error);
            alert('Error saving CSS configuration');
        }
    }

    function resetCSS() {
        if (confirm('Reset CSS to default values?')) {
            document.getElementById('primary-color').value = '#667eea';
            document.getElementById('secondary-color').value = '#764ba2';
            document.getElementById('background-color').value = '#f5f5f5';
            document.getElementById('text-color').value = '#333333';
            document.getElementById('font-family').value = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            document.getElementById('border-radius').value = '12';
            document.getElementById('border-radius-value').textContent = '12px';
        }
    }

    // Backup and restore functions
    function exportConfig() {
        const config = window.dashViewAdmin.config;
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'dashview-config.json';
        link.click();
    }

    function importConfig() {
        document.getElementById('config-file-input').click();
    }

    // Initialize admin functionality when admin view is shown
    async function setupAdminEventListeners() {
        await window.dashViewAdmin.init();
        
        // Setup file input for config import
        const fileInput = document.getElementById('config-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const text = await file.text();
                        const config = JSON.parse(text);
                        
                        if (confirm('Import this configuration? This will overwrite current settings.')) {
                            // Import configuration logic would go here
                            alert('Configuration import functionality coming soon!');
                        }
                    } catch (error) {
                        alert('Invalid configuration file');
                    }
                }
            });
        }
    }
    """