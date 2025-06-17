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
        elif config_type == "house_setup":
            data = self._store.get_house_setup_config()
        elif config_type == "weather_entity":
            data = {"weather_entity": self._store.get_weather_entity()}
        else:
            return web.Response(status=400, text="Invalid config type. Use: floors, rooms, house_setup, weather_entity")
        
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
            elif config_type == "house_setup":
                await self._store.async_set_house_setup_config(config_data)
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
        house_setup_file = hass.config.path("custom_components", "dashview", "www", "config", "house_setup.json")
        
        import json
        
        # Only migrate if storage is empty and files exist
        if not store.get_floors_config() and os.path.exists(floors_file):
            with open(floors_file, 'r') as f:
                floors_config = json.load(f)
            await store.async_set_floors_config(floors_config)
            _LOGGER.info("[DashView] Migrated floors.json to centralized storage")
        
        if not store.get_rooms_config() and os.path.exists(rooms_file):
            with open(rooms_file, 'r') as f:
                rooms_config = json.load(f)
            await store.async_set_rooms_config(rooms_config)
            _LOGGER.info("[DashView] Migrated rooms.json to centralized storage")

        if not store.get_house_setup_config() and os.path.exists(house_setup_file):
            with open(house_setup_file, 'r') as f:
                house_setup_config = json.load(f)
            await store.async_set_house_setup_config(house_setup_config)
            _LOGGER.info("[DashView] Migrated house_setup.json to centralized storage")
            
    except Exception as e:
        _LOGGER.warning("[DashView] Could not migrate config files: %s", e)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
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
