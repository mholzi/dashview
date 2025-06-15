import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom

DOMAIN = "dashview"
_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component from configuration.yaml."""
    hass.data.setdefault(DOMAIN, {})
    
    panel_name = "dashview"
    
    try:
        # Register the 'www' directory to be served at /local/dashview
        www_path = os.path.join(os.path.dirname(__file__), "www")
        hass.http.register_static_path(f"/local/{panel_name}", www_path)

        # Register the panel, telling the frontend to load the JS module
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

    except Exception as e:
        _LOGGER.error("Failed to register DashView panel during async_setup: %s", e, exc_info=True)
        return False
        
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a UI config entry."""
    # This is needed to properly handle UI-based configuration.
    return await async_setup(hass, {})

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    panel_custom.async_remove_panel(hass, "dashview")
    return True
