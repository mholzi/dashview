"""The DashView integration."""
import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.http.view import HomeAssistantView
from aiohttp import web

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
    
    # Get the config data
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
        config_data = self._entry.options or self._entry.data
        config_type = request.query.get("type")
        
        if config_type == "house":
            data = config_data.get("house_config", {})
        elif config_type == "weather_entity":
            house_config = config_data.get("house_config", {})
            data = {"weather_entity": house_config.get("weather_entity", "weather.forecast_home")}
        elif config_type is None:
            # Return the full house_config when no type is specified
            data = config_data.get("house_config", {})
        else:
            return web.Response(status=400, text="Invalid config type. Use: house, weather_entity")
        
        return self.json(data)
    
    async def post(self, request):
        """Save configuration data by updating the ConfigEntry."""
        try:
            data = await request.json()
            
            # The new format is a direct house config data
            self._hass.config_entries.async_update_entry(
                self._entry, options={"house_config": data}
            )
            
            return self.json({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving config to entry: %s", e)
            return self.json({"status": "error", "message": str(e)}, status_code=500)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    await async_unload_services(hass)
    from homeassistant.components import frontend
    frontend.async_remove_panel(hass, "dashview")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
