"""The DashView integration."""
import os
import logging
import json
from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.http.view import HomeAssistantView
from aiohttp import web
from homeassistant.helpers import area_registry as ar, floor_registry as fr, entity_registry as er

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the DashView component."""
    # This function is called by Home Assistant to initialize the component.
    # We leave it minimal to allow for UI-based setup.
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    _LOGGER.info("Setting up DashView panel from config entry.")
    
    # NEW: Synchronize HA areas and floors with the DashView config on startup
    await _sync_config_from_ha_registries(hass, entry)

    # Get the config data AFTER synchronization
    config_data = entry.options or entry.data
    
    # Register the API endpoint, passing the hass instance and entry object
    hass.http.register_view(DashViewConfigView(hass, entry))
    
    # Register services
    await async_setup_services(hass)
    
    # Register the www/ panel directory
    panel_name = "dashview"
    www_path = os.path.join(os.path.dirname(__file__), "www")
    await hass.http.async_register_static_paths([
        StaticPathConfig(f"/local/{panel_name}", www_path, False)
    ])

    # Prepare panel config - use None if config is empty or has no meaningful data
    panel_config = None
    if config_data and isinstance(config_data, dict) and config_data.get("house_config"):
        panel_config = config_data
        _LOGGER.debug("DashView panel config prepared with house_config data")
    else:
        _LOGGER.debug("DashView panel config set to None (no house_config data)")

    # Register the panel
    try:
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="dashview-panel",
            frontend_url_path=panel_name,
            sidebar_title="DashView",
            sidebar_icon="mdi:view-dashboard",
            module_url=f"/local/{panel_name}/dashview-panel.js",
            require_admin=False,
            config=panel_config,
        )
        _LOGGER.info("DashView panel successfully registered.")
    except ValueError as ve:
        if "Overwriting panel" in str(ve):
            _LOGGER.info("DashView panel already exists, skipping registration.")
        else:
            raise

    hass.data[DOMAIN][entry.entry_id] = entry
    return True


@callback
async def _sync_config_from_ha_registries(hass: HomeAssistant, entry: ConfigEntry):
    """Create and sync house_config from HA floor and area registries."""
    _LOGGER.debug("Syncing DashView configuration with HA registries.")
    
    # First check if we need to migrate from legacy files
    current_data = entry.options or entry.data
    if not current_data.get("house_config"):
        _LOGGER.debug("No house_config found, attempting migration from legacy files first.")
        await _migrate_config_files(hass, entry)
    
    floor_registry = fr.async_get(hass)
    area_registry = ar.async_get(hass)
    
    # Get existing config to preserve user-made assignments
    existing_house_config = (entry.options or entry.data).get("house_config", {})
    
    # Build the new structure from HA's registries
    new_house_config = {
        "weather_entity": existing_house_config.get("weather_entity", "weather.forecast_home"),
        "floors": {},
        "rooms": {}
    }

    # 1. Populate floors from the floor registry
    for floor in floor_registry.floors.values():
        new_house_config["floors"][floor.floor_id] = {
            "friendly_name": floor.name,
            "icon": floor.icon or "mdi:home",
            "level": floor.level
        }

    # 2. Populate rooms from the area registry and link them to floors
    for area in area_registry.areas.values():
        # Preserve existing entity assignments for this room if they exist
        existing_room_config = existing_house_config.get("rooms", {}).get(area.id, {})
        
        new_house_config["rooms"][area.id] = {
            "friendly_name": area.name,
            "icon": area.icon or "mdi:home-outline",
            "floor": area.floor_id,  # This directly links the room to its HA floor
            "combined_sensor": existing_room_config.get("combined_sensor", ""),
            "lights": existing_room_config.get("lights", []),
            "covers": existing_room_config.get("covers", []),
            "media_players": existing_room_config.get("media_players", []),
            "header_entities": existing_room_config.get("header_entities", [])
        }

    # 3. Update the config entry with the synchronized configuration
    hass.config_entries.async_update_entry(
        entry, options={"house_config": new_house_config}
    )
    _LOGGER.info("DashView configuration synchronized with Home Assistant floors and areas.")


class DashViewConfigView(HomeAssistantView):
    """DashView configuration API endpoint."""
    
    url = "/api/dashview/config"
    name = "api:dashview:config"
    requires_auth = True
    
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry):
        """Initialize the config view."""
        self._hass = hass
        self._entry = entry
    
    async def get(self, request):
        """Get configuration data from the ConfigEntry."""
        # This view now primarily serves the most up-to-date config from the entry
        config_data = self._entry.options or self._entry.data
        config_type = request.query.get("type")
        
        # All config types now pull from the single `house_config` source of truth
        house_config = config_data.get("house_config", {})

        if config_type == "house":
            data = house_config
        elif config_type == "weather_entity":
            data = {"weather_entity": house_config.get("weather_entity", "weather.forecast_home")}
        elif config_type == "available_media_players":
            media_players = []
            for entity in self._hass.states.async_all('media_player'):
                media_players.append({
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.entity_id
                })
            data = sorted(media_players, key=lambda p: p["friendly_name"])
        elif config_type == "combined_sensors":
            # This is still useful for assigning sensors in the admin UI
            combined_sensors = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.entity_id
                }
                for entity in self._hass.states.async_all('binary_sensor')
                if entity.entity_id.startswith("binary_sensor.combined")
            ]
            data = sorted(combined_sensors, key=lambda s: s["friendly_name"])
        elif config_type == "entities_by_room":
            # This is also still useful for assigning entities
            from homeassistant.helpers import device_registry as dr
            entity_registry = er.async_get(self._hass)
            area_registry = ar.async_get(self._hass)
            device_registry = dr.async_get(self._hass)
            
            from homeassistant.helpers import label_registry as lr
            label_registry = lr.async_get(self._hass)
            
            label_filter = request.query.get("label")
            domain_filter = request.query.get("domain")

            if not label_filter and not domain_filter:
                return web.Response(status=400, text="Either 'label' or 'domain' query parameter is required.")
            
            label_id = None
            if label_filter:
                for label in label_registry.labels.values():
                    if label.name.lower() == label_filter.lower():
                        label_id = label.label_id
                        break
            
            entities_by_area = {}
            for entity in entity_registry.entities.values():
                # Determine the area_id, preferring the entity's but falling back to its device's
                area_id = entity.area_id
                if not area_id and entity.device_id:
                    device = device_registry.async_get(entity.device_id)
                    if device:
                        area_id = device.area_id

                # Now proceed with the original logic, but using our found area_id
                if area_id and entity.domain != 'automation':
                    matches_filter = (label_id and label_id in entity.labels) or \
                                     (domain_filter and entity.domain == domain_filter)
                    if matches_filter:
                        if area_id not in entities_by_area:
                            area = area_registry.async_get_area(area_id)
                            entities_by_area[area_id] = {
                                "name": area.name if area else "Unknown Area",
                                "entities": []
                            }
# This now correctly handles entities without a friendly name by generating one.
                        friendly_name = entity.name or entity.original_name or entity.entity_id.split('.')[-1].replace('_', ' ').title()
                        entities_by_area[area_id]["entities"].append({
                            "entity_id": entity.entity_id,
                            "name": friendly_name
                        })

            data = entities_by_area
        else:
            # Default to returning the full house config
            data = house_config
        
        return self.json(data)
    
    async def post(self, request):
        """Save configuration data by updating the ConfigEntry."""
        # This method remains the same, as it correctly saves the entire house_config
        try:
            data = await request.json()
            self._hass.config_entries.async_update_entry(
                self._entry, options={"house_config": data}
            )
            return self.json({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving config to entry: %s", e)
            return self.json({"status": "error", "message": str(e)}, status_code=500)


async def _migrate_config_files(hass: HomeAssistant, entry: ConfigEntry):
    """Migrate existing config files to ConfigEntry."""
    try:
        # Only migrate if ConfigEntry doesn't have house_config yet
        current_data = entry.options or entry.data
        if current_data.get("house_config"):
            return  # Already has configuration
            
        floors_file = hass.config.path("custom_components", "dashview", "www", "config", "floors.json")
        rooms_file = hass.config.path("custom_components", "dashview", "www", "config", "rooms.json")
        house_file = hass.config.path("custom_components", "dashview", "www", "config", "house_setup.json")
        
        import json
        
        # First try to load house_setup.json if it exists
        if os.path.exists(house_file):
            with open(house_file, 'r') as f:
                house_config = json.load(f)
            hass.config_entries.async_update_entry(
                entry, options={"house_config": house_config}
            )
            _LOGGER.info("[DashView] Migrated house_setup.json to ConfigEntry")
            return
        
        # If house config doesn't exist, try to migrate from legacy files
        floors_config = {}
        rooms_config = {}
        
        if os.path.exists(floors_file):
            with open(floors_file, 'r') as f:
                floors_config = json.load(f)
                
        if os.path.exists(rooms_file):
            with open(rooms_file, 'r') as f:
                rooms_config = json.load(f)
        
        # Convert legacy configs to new house structure if both exist
        if floors_config and rooms_config:
            house_config = _convert_legacy_to_house_config(floors_config, rooms_config)
            hass.config_entries.async_update_entry(
                entry, options={"house_config": house_config}
            )
            _LOGGER.info("[DashView] Converted legacy configs to new house configuration in ConfigEntry")
            return
        
        # Fallback: create basic structure from individual configs
        house_config = {
            "weather_entity": "weather.forecast_home",
            "rooms": {},
            "floors": {},
            "floor_sensors": {}
        }
        
        if floors_config:
            house_config["floors"] = floors_config
            _LOGGER.info("[DashView] Migrated floors.json to ConfigEntry")
        
        if rooms_config:
            house_config["rooms"] = rooms_config
            _LOGGER.info("[DashView] Migrated rooms.json to ConfigEntry")
            
        if floors_config or rooms_config:
            hass.config_entries.async_update_entry(
                entry, options={"house_config": house_config}
            )
            
    except Exception as e:
        _LOGGER.warning("[DashView] Could not migrate config files: %s", e)


def _convert_legacy_to_house_config(floors_config, rooms_config):
    """Convert legacy floors and rooms configuration to new house structure."""
    house_config = {
        "rooms": {},
        "floors": {},
        "floor_sensors": {}
    }
    
    # Convert floor configuration
    floor_icons = floors_config.get("floor_icons", {})
    floor_sensors = floors_config.get("floor_sensors", {})
    
    for floor_key in floor_icons.keys():
        house_config["floors"][floor_key] = {
            "friendly_name": floor_key,
            "icon": floor_icons.get(floor_key, "mdi:home"),
            "floor_sensor": floor_sensors.get(floor_key, f"binary_sensor.floor_{floor_key.lower()}_active")
        }
    
    # Convert room configuration with proper icons
    room_icon_map = {
        'wohnzimmer': 'mdi:sofa',
        'buero': 'mdi:desk',
        'kueche': 'mdi:chef-hat',
        'eingangsflur': 'mdi:door-open',
        'gaesteklo': 'mdi:toilet',
        'treppe_erdgeschoss': 'mdi:stairs',
        'kids': 'mdi:teddy-bear',
        'kinderbad': 'mdi:shower',
        'flur': 'mdi:floor-plan',
        'aupair': 'mdi:bed',
        'schlafzimmer': 'mdi:bed-double',
        'partykeller': 'mdi:party-popper',
        'heizungskeller': 'mdi:heating-coil',
        'kellerflur': 'mdi:floor-plan',
        'waschkeller': 'mdi:washing-machine',
        'serverraum': 'mdi:server-network',
        'buero_keller': 'mdi:desk',
        'sauna': 'mdi:sauna',
        'aussen': 'mdi:tree'
    }
    
    room_name_map = {
        'wohnzimmer': 'Wohnzimmer',
        'buero': 'Büro',
        'kueche': 'Küche',
        'eingangsflur': 'Eingangsflur',
        'gaesteklo': 'Gäste-WC',
        'treppe_erdgeschoss': 'Treppe Erdgeschoss',
        'kids': 'Kinderzimmer',
        'kinderbad': 'Kinderbad',
        'flur': 'Flur OG',
        'aupair': 'Au-pair Zimmer',
        'schlafzimmer': 'Schlafzimmer',
        'partykeller': 'Partykeller',
        'heizungskeller': 'Heizungskeller',
        'kellerflur': 'Kellerflur',
        'waschkeller': 'Waschkeller',
        'serverraum': 'Serverraum',
        'buero_keller': 'Büro Keller',
        'sauna': 'Sauna',
        'aussen': 'Außenbereich'
    }
    
    floors = rooms_config.get("floors", {})
    for floor_key, sensors in floors.items():
        for sensor in sensors:
            # Extract room name from sensor ID
            room_key = sensor.replace('binary_sensor.combined_sensor_', '')
            
            house_config["rooms"][room_key] = {
                "friendly_name": room_name_map.get(room_key, room_key.replace('_', ' ').title()),
                "icon": room_icon_map.get(room_key, "mdi:home-outline"),
                "floor": floor_key,
                "combined_sensor": sensor,
                "lights": [],
                "covers": [],
                "media_players": []
            }
    
    return house_config


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    await async_unload_services(hass)
    from homeassistant.components import frontend
    frontend.async_remove_panel(hass, "dashview")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
