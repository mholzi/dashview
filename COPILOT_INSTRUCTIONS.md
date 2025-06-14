# DashView Copilot Instructions

## Overview
DashView is a comprehensive, fully configurable Home Assistant integration that provides an advanced dashboard with room-based organization, custom widgets, and administrative configuration capabilities. This document provides guidance for AI assistants working with the DashView codebase.

## Key Architecture Components

### 1. Core Integration Files
- **`__init__.py`**: Main integration setup, HTTP views, and dashboard HTML generation
- **`config_flow.py`**: Configuration flow with enhanced options for dashboard customization
- **`const.py`**: Constants, default configurations, entity types, and dashboard view definitions
- **`data_store.py`**: Persistent data storage using Home Assistant's storage system
- **`api.py`**: RESTful API endpoints for admin functionality and data operations
- **`widgets.py`**: Custom widget definitions (HTML, CSS, JavaScript)
- **`admin_js.py`**: Administrative interface JavaScript functionality

### 2. Key Design Principles
- **Native Technology Stack**: Pure HTML/CSS/JavaScript without external dependencies
- **Room-Based Organization**: Entities organized by rooms with custom icons and ordering
- **Admin-Only Configuration**: Administrative features only accessible to HA administrators
- **HACS Compatibility**: Designed for easy installation through Home Assistant Community Store
- **Responsive Design**: Works across desktop, tablet, and mobile devices

## Functional Requirements

### Dashboard Views
1. **Main View**: Welcome screen with system status and quick stats
2. **Rooms View**: Grid of rooms with assigned entities and interactive controls
3. **Security View**: Security entity monitoring and camera integration
4. **Media View**: Media player controls and entertainment system management
5. **Admin View**: Configuration panel for rooms, entities, and styling (admin-only)

### Entity Management
- Support for all major Home Assistant entity types (lights, sensors, climate, media_player, etc.)
- Custom entity type classification including "vacuum/hoover" type
- Entity assignment to rooms with custom names and icons
- Real-time state updates and interactive controls

### Customization Features
- Complete CSS customization (colors, fonts, border radius)
- Room management (add, edit, delete, reorder)
- Entity configuration with custom properties
- Backup and restore functionality

## Technical Implementation Guidelines

### Data Storage Pattern
```python
# Use DashViewDataStore for persistent configuration
data_store = DashViewDataStore(hass)
await data_store.async_load()

# Update room configuration
await data_store.async_update_room(room_id, room_data)

# Assign entity to room
await data_store.async_assign_entity_to_room(entity_id, room_id)
```

### API Endpoint Pattern
```python
# Admin API for configuration operations
class DashViewAdminAPIView(HomeAssistantView):
    url = "/api/dashview/admin"
    requires_auth = True  # Admin operations require authentication

# Data API for dashboard operations
class DashViewDataAPIView(HomeAssistantView):
    url = "/api/dashview/data"
    requires_auth = False  # Dashboard data accessible to all users
```

### Widget System Pattern
```python
# Widget definitions in widgets.py
def get_widget_html():
    return """<template id="widget-template">...</template>"""

def get_widget_css():
    return """/* Widget-specific styles */"""

def get_widget_javascript():
    return """// Widget functionality"""
```

## Configuration Schema

### Default Configuration Structure
```python
DEFAULT_CONFIG = {
    "rooms": {
        "room_id": {
            "name": "Room Name",
            "icon": "🏠",  # Emoji or mdi:icon
            "order": 1,
            "entities": ["entity.id1", "entity.id2"]
        }
    },
    "entities": {
        "entity.id": {
            "custom_name": "Custom Name",
            "custom_icon": "💡",
            "entity_type": "light",
            "assigned_room": "room_id"
        }
    },
    "css_config": {
        "primary_color": "#667eea",
        "secondary_color": "#764ba2",
        "background_color": "#f5f5f5",
        "text_color": "#333",
        "font_family": "system-default",
        "border_radius": "12px"
    }
}
```

### Entity Types Classification
```python
ENTITY_TYPES = {
    "light": {"icon": "mdi:lightbulb", "category": "lighting"},
    "switch": {"icon": "mdi:light-switch", "category": "control"},
    "sensor": {"icon": "mdi:thermometer", "category": "monitoring"},
    "vacuum": {"icon": "mdi:robot-vacuum", "category": "cleaning"},  # Hoover
    "climate": {"icon": "mdi:thermostat", "category": "climate"},
    "media_player": {"icon": "mdi:speaker", "category": "media"},
    # ... additional types
}
```

## Code Modification Guidelines

### Adding New Entity Types
1. Update `ENTITY_TYPES` in `const.py`
2. Add widget template in `widgets.py`
3. Implement widget creation logic in JavaScript
4. Add entity type option in admin panel

### Adding New Dashboard Views
1. Add view definition to `DASHBOARD_VIEWS` in `const.py`
2. Add navigation tab in dashboard HTML
3. Implement view-specific content and functionality
4. Add view-specific data loading logic

### Customizing Styling
1. Modify CSS variables in dashboard HTML generation
2. Update `DEFAULT_CONFIG.css_config` in `const.py`
3. Add new styling options to admin panel
4. Implement CSS update functionality in API

## Security Considerations

### Admin-Only Features
- Admin panel access controlled by `user.is_admin` check
- Administrative API endpoints require authentication
- Configuration changes restricted to administrators
- Sensitive operations logged for auditing

### User Permissions
```python
# Check admin status
user = request.get('hass_user')
is_admin = user and user.is_admin if user else False

# Admin-only view rendering
if is_admin:
    html += admin_panel_html
```

## Testing and Validation

### Code Compilation
```bash
# Test all Python files compile correctly
python3 -m py_compile custom_components/dashview/*.py
```

### Integration Testing
- Test dashboard loading with and without admin privileges
- Verify room and entity configuration persistence
- Test API endpoints with valid and invalid data
- Validate responsive design across device types

## Common Modification Patterns

### Adding New API Endpoints
1. Define endpoint in `api.py`
2. Add URL route and handler method
3. Implement data validation and error handling
4. Register endpoint in main `__init__.py`

### Creating Custom Widgets
1. Add HTML template to `get_widget_html()`
2. Add CSS styles to `get_widget_css()`
3. Add JavaScript functionality to `get_widget_javascript()`
4. Implement widget creation logic in main JavaScript

### Extending Configuration Options
1. Update config flow in `config_flow.py`
2. Add options to `DEFAULT_CONFIG` in `const.py`
3. Update data store methods in `data_store.py`
4. Add UI controls in admin panel

## Troubleshooting Guide

### Common Issues
- **Import Errors**: Check all required modules are imported correctly
- **API Failures**: Verify endpoint URLs and request/response formats
- **Widget Issues**: Check JavaScript console for client-side errors
- **Configuration Problems**: Validate data store operations and persistence

### Debugging Tips
- Use `_LOGGER.debug()` for detailed logging
- Test API endpoints independently using browser dev tools
- Validate JSON configuration data structure
- Check Home Assistant logs for integration errors

## Best Practices

### Code Quality
- Follow Home Assistant integration patterns
- Use type hints for function parameters and returns
- Implement proper error handling and logging
- Maintain backward compatibility when making changes

### Performance
- Minimize API calls through efficient data loading
- Use CSS transitions for smooth animations
- Implement proper caching for static resources
- Optimize JavaScript for mobile devices

### User Experience
- Provide clear feedback for configuration changes
- Implement loading states for async operations
- Ensure accessible design patterns
- Maintain consistent UI/UX across all views

This document serves as a comprehensive guide for understanding and modifying the DashView integration. Always test changes thoroughly and follow Home Assistant development best practices.