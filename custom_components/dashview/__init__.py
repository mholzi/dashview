"""Dashview - Custom Home Assistant Dashboard Integration."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components.frontend import (
    async_register_built_in_panel,
    async_remove_panel,
)
from homeassistant.components.http import StaticPathConfig
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL,
    URL_BASE,
    VERSION,
)
from .websocket import (
    websocket_get_settings,
    websocket_save_settings,
    websocket_save_settings_delta,
    websocket_upload_photo,
    websocket_delete_photo,
    deep_merge,
)

# Re-export security utilities for backward compatibility (used by tests)
from .security import (  # noqa: F401
    validate_and_sanitize_filename,
    detect_file_type,
    validate_magic_bytes,
    ALLOWED_EXTENSIONS,
    MAGIC_BYTES,
    SAFE_FILENAME_REGEX,
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
    # Remove frontend panel (#77)
    panel_url = PANEL_URL.lstrip("/")
    try:
        async_remove_panel(hass, panel_url)
    except Exception:  # noqa: BLE001
        _LOGGER.debug("Panel %s was not registered, skipping removal", panel_url)

    # Clean up domain data
    hass.data.pop(DOMAIN, None)

    return True


@callback
def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_get_settings)
    websocket_api.async_register_command(hass, websocket_save_settings)
    websocket_api.async_register_command(hass, websocket_save_settings_delta)
    websocket_api.async_register_command(hass, websocket_upload_photo)
    websocket_api.async_register_command(hass, websocket_delete_photo)


def _get_asset_manifest(frontend_path: Path) -> dict | None:
    """Read asset manifest for content-hashed filenames.

    Returns the manifest dict if found, None otherwise (dev mode).
    """
    manifest_path = frontend_path / "dist" / "asset-manifest.json"
    try:
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text())
            _LOGGER.debug("Loaded asset manifest: %s", manifest)
            return manifest
    except (json.JSONDecodeError, OSError) as err:
        _LOGGER.warning("Failed to read asset manifest: %s", err)
    return None


async def async_setup_frontend(hass: HomeAssistant) -> None:
    """Set up the frontend panel."""
    frontend_path = Path(__file__).parent / "frontend"
    dist_path = frontend_path / "dist"

    # Check for bundled assets (production mode)
    manifest = _get_asset_manifest(frontend_path)

    static_paths = [
        # Always register base frontend path for unbundled development
        StaticPathConfig(
            URL_BASE,
            str(frontend_path),
            cache_headers=False,
        )
    ]

    # If dist exists, register it for bundled assets
    if dist_path.exists():
        static_paths.append(
            StaticPathConfig(
                f"{URL_BASE}/dist",
                str(dist_path),
                # Enable caching for hashed files (filename changes on content change)
                cache_headers=True,
            )
        )

    await hass.http.async_register_static_paths(static_paths)

    # Determine JS URL based on manifest availability
    if manifest and "dashview-panel.js" in manifest:
        # Production mode: use content-hashed bundle
        hashed_filename = manifest["dashview-panel.js"]
        js_url = f"{URL_BASE}/dist/{hashed_filename}"
        _LOGGER.info("Using bundled frontend: %s", hashed_filename)
    else:
        # Development mode: use unbundled source with version query param
        js_url = f"{URL_BASE}/dashview-panel.js?v={VERSION}"
        _LOGGER.info("Using unbundled frontend (dev mode)")

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
                    "js_url": js_url,
                    "embed_iframe": False,
                }
            },
        )
        _LOGGER.info("Dashview frontend panel registered")
    else:
        _LOGGER.info("Dashview frontend panel already registered, skipping")
