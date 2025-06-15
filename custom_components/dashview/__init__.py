import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from .services import async_setup_services, async_unload_services

DOMAIN = "dashview"
_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    # This function is called by Home Assistant to initialize the component.
    # We leave it minimal to allow for UI-based setup.
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry (the primary setup method)."""
    _LOGGER.info("Setting up DashView panel from config entry.")
    
    panel_name = "dashview"
    
    try:
        # FIX #2: Use the new, non-blocking method for registering static paths.
        www_path = os.path.join(os.path.dirname(__file__), "www")
        await hass.http.async_register_static_paths([
            StaticPathConfig(f"/local/{panel_name}", www_path, False)
        ])

        # FIX #1: This logic now only runs once within async_setup_entry,
        # preventing the "Overwriting panel" error.
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
        
        # Set up services
        await async_setup_services(hass)

    except Exception as e:
        _LOGGER.error("Failed to register DashView panel: %s", e, exc_info=True)
        return False

    hass.data[DOMAIN][entry.entry_id] = True
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    
    try:
        # Clean up the panel when the integration is unloaded or reloaded.
        async_remove_panel(hass, "dashview")
        _LOGGER.info("DashView panel successfully removed.")
    except Exception as e:
        _LOGGER.error("Error removing DashView panel: %s", e, exc_info=True)
    
    try:
        # Unload services
        await async_unload_services(hass)
    except Exception as e:
        _LOGGER.error("Error unloading DashView services: %s", e, exc_info=True)
    
    # Clean up data
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
