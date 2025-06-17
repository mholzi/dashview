import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.http.view import HomeAssistantView
from aiohttp import web
from .store import DashViewStore
from .services import async_setup_services, async_unload_services

DOMAIN = "dashview"
_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    # This function is called by Home Assistant to initialize the component.
    # We leave it minimal to allow for UI-based setup.
    hass.data.setdefault(DOMAIN, {})
    return True


class DashViewConfigView(HomeAssistantView):
    """DashView configuration API endpoint."""
    
    url = "/api/dashview/config"
    name = "api:dashview:config"
    requires_auth = True
    
    def __init__(self, store: DashViewStore):
        """Initialize the config view."""
        self._store = store
    
    async def get(self, request):
        """Get configuration data."""
        config_type = request.query.get("type")
        
        if config_type == "floors":
            data = self._store.get_floors_config()
        elif config_type == "rooms":
            data = self._store.get_rooms_config()
        elif config_type == "house":
            data = self._store.get_house_config()
        elif config_type == "weather_entity":
            data = {"weather_entity": self._store.get_weather_entity()}
        else:
            return web.Response(status=400, text="Invalid config type. Use: floors, rooms, house, weather_entity")
        
        return self.json(data)
    
    async def post(self, request):
        """Save configuration data."""
        try:
            data = await request.json()
            config_type = data.get("type")
            config_data = data.get("config")
            
            if config_type == "floors":
                await self._store.async_set_floors_config(config_data)
            elif config_type == "rooms":
                await self._store.async_set_rooms_config(config_data)
            elif config_type == "house":
                await self._store.async_set_house_config(config_data)
            elif config_type == "weather_entity":
                await self._store.async_set_weather_entity(config_data.get("weather_entity"))
            else:
                return web.Response(status=400, text="Invalid config type")
            
            return self.json({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving config: %s", e)
            return web.Response(status=500, text=f"Error saving configuration: {str(e)}")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry (the primary setup method)."""
    _LOGGER.info("Setting up DashView panel from config entry.")
    
    panel_name = "dashview"
    
    try:
        # Initialize the store
        store = DashViewStore(hass)
        await store.async_load()
        
        # Migrate existing config files to storage if they exist and storage is empty
        await _migrate_config_files(hass, store)
        
        # Register the API endpoint
        hass.http.register_view(DashViewConfigView(store))
        
        # Register services
        await async_setup_services(hass)
        
        # FIX #2: Use the new, non-blocking method for registering static paths.
        www_path = os.path.join(os.path.dirname(__file__), "www")
        await hass.http.async_register_static_paths([
            StaticPathConfig(f"/local/{panel_name}", www_path, False)
        ])

        # FIX #1: This logic now only runs once within async_setup_entry,
        # preventing the "Overwriting panel" error.
        try:
            await panel_custom.async_register_panel(
                hass,
                webcomponent_name="dashview-panel",
                frontend_url_path=panel_name,
                sidebar_title="DashView",
                sidebar_icon="mdi:view-dashboard",
                module_url=f"/local/{panel_name}/dashview-panel.js",
                require_admin=False,
            )
            _LOGGER.info("DashView panel successfully registered.")
        except ValueError as ve:
            if "Overwriting panel" in str(ve):
                _LOGGER.info("DashView panel already exists, skipping registration.")
            else:
                raise

    except Exception as e:
        _LOGGER.error("Failed to register DashView panel: %s", e, exc_info=True)
        return False

    hass.data[DOMAIN][entry.entry_id] = store
    return True


async def _migrate_config_files(hass: HomeAssistant, store: DashViewStore):
    """Migrate existing config files to centralized storage."""
    try:
        floors_file = hass.config.path("custom_components", "dashview", "www", "config", "floors.json")
        rooms_file = hass.config.path("custom_components", "dashview", "www", "config", "rooms.json")
        house_file = hass.config.path("custom_components", "dashview", "www", "config", "house_setup.json")
        
        import json
        
        # First try to load house_setup.json if it exists and storage is empty
        if not store.get_house_config() and os.path.exists(house_file):
            with open(house_file, 'r') as f:
                house_config = json.load(f)
            await store.async_set_house_config(house_config)
            _LOGGER.info("[DashView] Migrated house_setup.json to centralized storage")
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
        if floors_config and rooms_config and not store.get_house_config():
            house_config = _convert_legacy_to_house_config(floors_config, rooms_config)
            await store.async_set_house_config(house_config)
            _LOGGER.info("[DashView] Converted legacy configs to new house configuration")
            return
        
        # Fallback: Only migrate if storage is empty and files exist
        if not store.get_floors_config() and floors_config:
            await store.async_set_floors_config(floors_config)
            _LOGGER.info("[DashView] Migrated floors.json to centralized storage")
        
        if not store.get_rooms_config() and rooms_config:
            await store.async_set_rooms_config(rooms_config)
            _LOGGER.info("[DashView] Migrated rooms.json to centralized storage")
            
    except Exception as e:
        _LOGGER.warning("[DashView] Could not migrate config files: %s", e)


def _convert_legacy_to_house_config(floors_config, rooms_config):
    """Convert legacy floors and rooms configuration to new house structure."""
    house_config = {
        "rooms": {},
        "floors": {}
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
    
    # Unload services first
    await async_unload_services(hass)
    
    # Clean up the panel when the integration is unloaded or reloaded.
    try:
        # Use frontend module to remove the panel
        from homeassistant.components import frontend
        frontend.async_remove_panel(hass, "dashview")
    except (AttributeError, ImportError) as e:
        # If removal method doesn't exist or fails, log but don't fail unload
        _LOGGER.warning("Could not remove panel during unload: %s", e)
    
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
