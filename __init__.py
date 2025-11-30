"""Dashview - Custom Home Assistant Dashboard Integration."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
import voluptuous as vol

from .const import (
    DOMAIN,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL,
    URL_BASE,
    VERSION,
)

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.settings"
STORAGE_VERSION = 1


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Dashview component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Dashview from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    # Initialize storage
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    hass.data[DOMAIN]["store"] = store

    # Load existing settings
    data = await store.async_load()
    hass.data[DOMAIN]["settings"] = data or {
        "enabledRooms": {},
        "enabledLights": {},
    }

    # Register WebSocket commands
    async_register_websocket_commands(hass)

    # Set up frontend
    await async_setup_frontend(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return True


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_get_settings)
    websocket_api.async_register_command(hass, websocket_save_settings)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/get_settings",
})
@websocket_api.async_response
async def websocket_get_settings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle get settings request."""
    settings = hass.data[DOMAIN].get("settings", {
        "enabledRooms": {},
        "enabledLights": {},
    })
    connection.send_result(msg["id"], settings)


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/save_settings",
    vol.Required("settings"): dict,
})
@websocket_api.async_response
async def websocket_save_settings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle save settings request."""
    settings = msg["settings"]

    # Update in memory
    hass.data[DOMAIN]["settings"] = settings

    # Persist to storage
    store: Store = hass.data[DOMAIN]["store"]
    await store.async_save(settings)

    _LOGGER.debug("Dashview settings saved: %s", settings)
    connection.send_result(msg["id"], {"success": True})


async def async_setup_frontend(hass: HomeAssistant) -> None:
    """Set up the frontend panel."""
    frontend_path = Path(__file__).parent / "frontend"

    # Register static path for frontend assets
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                URL_BASE,
                str(frontend_path),
                cache_headers=True,
            )
        ]
    )

    # Register the panel (only if not already registered)
    panel_url = PANEL_URL.lstrip("/")
    if panel_url not in hass.data.get("frontend_panels", {}):
        async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            frontend_url_path=panel_url,
            require_admin=False,
            config={
                "_panel_custom": {
                    "name": PANEL_NAME,
                    "js_url": f"{URL_BASE}/dashview-panel.js?v={VERSION}",
                    "embed_iframe": False,
                }
            },
        )
        _LOGGER.info("Dashview frontend panel registered")
    else:
        _LOGGER.info("Dashview frontend panel already registered, skipping")
