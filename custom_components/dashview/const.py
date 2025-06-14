"""Constants for the DashView integration."""
DOMAIN = "dashview"

# Default configuration for rooms and entities
DEFAULT_CONFIG = {
    "rooms": {
        "living_room": {
            "name": "Living Room",
            "icon": "mdi:sofa",
            "entities": [],
            "order": 1
        },
        "kitchen": {
            "name": "Kitchen", 
            "icon": "mdi:chef-hat",
            "entities": [],
            "order": 2
        },
        "bedroom": {
            "name": "Bedroom",
            "icon": "mdi:bed",
            "entities": [],
            "order": 3
        },
        "bathroom": {
            "name": "Bathroom",
            "icon": "mdi:shower",
            "entities": [],
            "order": 4
        }
    },
    "entities": {},
    "css_config": {
        "primary_color": "#667eea",
        "secondary_color": "#764ba2", 
        "background_color": "#f5f5f5",
        "text_color": "#333",
        "font_family": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
        "border_radius": "12px"
    }
}

# Entity types
ENTITY_TYPES = {
    "light": {"icon": "mdi:lightbulb", "category": "lighting"},
    "switch": {"icon": "mdi:light-switch", "category": "control"},
    "sensor": {"icon": "mdi:thermometer", "category": "monitoring"},
    "binary_sensor": {"icon": "mdi:checkbox-marked-circle", "category": "monitoring"},
    "climate": {"icon": "mdi:thermostat", "category": "climate"},
    "cover": {"icon": "mdi:window-shutter", "category": "cover"},
    "fan": {"icon": "mdi:fan", "category": "climate"},
    "lock": {"icon": "mdi:lock", "category": "security"},
    "vacuum": {"icon": "mdi:robot-vacuum", "category": "cleaning"},
    "media_player": {"icon": "mdi:speaker", "category": "media"},
    "camera": {"icon": "mdi:camera", "category": "security"},
    "alarm_control_panel": {"icon": "mdi:shield-home", "category": "security"}
}

# Dashboard views
DASHBOARD_VIEWS = {
    "main": {"name": "Main", "icon": "mdi:home", "admin_only": False},
    "rooms": {"name": "Rooms", "icon": "mdi:floor-plan", "admin_only": False}, 
    "security": {"name": "Security", "icon": "mdi:security", "admin_only": False},
    "media": {"name": "Media", "icon": "mdi:music", "admin_only": False},
    "admin": {"name": "Admin", "icon": "mdi:cog", "admin_only": True}
}