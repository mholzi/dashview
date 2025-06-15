import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom

DOMAIN = "dashview"
_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    # This function is called by Home Assistant to initialize the component.
    # We set up a data dictionary to be used by the config entry setup.
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry (UI configuration)."""
    _LOGGER.info("Setting up DashView panel from config entry.")
    
    panel_name = "dashview"
    
    try:
        # Register the 'www' directory to be served at /local/dashview
        www_path = os.path.join(os.path.dirname(__file__), "www")
        hass.http.register_static_path(f"/local/{panel_name}", www_path)

        # Register the custom panel
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
        _LOGGER.error("Failed to register DashView panel during async_setup_entry: %s", e, exc_info=True)
        return False  # Return False if setup fails

    # Store the entry for proper unloading
    hass.data[DOMAIN][entry.entry_id] = True
    
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    panel_custom.async_remove_panel(hass, "dashview")
    hass.data[DOMAIN].pop(entry.entry_id)
    return True
