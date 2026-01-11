"""Dashview - Custom Home Assistant Dashboard Integration."""
from __future__ import annotations

import base64
import json
import logging
import os
import time
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

# Photo upload configuration
PHOTO_UPLOAD_DIR = "www/dashview/user_photos"
PHOTO_URL_PREFIX = "/local/dashview/user_photos"
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


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
    websocket_api.async_register_command(hass, websocket_upload_photo)
    websocket_api.async_register_command(hass, websocket_delete_photo)


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


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/upload_photo",
    vol.Required("filename"): str,
    vol.Required("data"): str,  # Base64 encoded image data
})
@websocket_api.async_response
async def websocket_upload_photo(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle photo upload request."""
    filename = msg["filename"]
    data = msg["data"]

    # Validate file extension
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        connection.send_error(
            msg["id"],
            "invalid_format",
            f"Invalid file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        return

    # Decode base64 data
    try:
        # Handle data URL format (data:image/jpeg;base64,...)
        if "," in data:
            data = data.split(",", 1)[1]
        image_data = base64.b64decode(data)
    except Exception as err:
        _LOGGER.error("Failed to decode image data: %s", err)
        connection.send_error(msg["id"], "decode_error", "Failed to decode image data")
        return

    # Check file size
    if len(image_data) > MAX_PHOTO_SIZE:
        connection.send_error(
            msg["id"],
            "file_too_large",
            f"File too large. Maximum size: {MAX_PHOTO_SIZE // (1024 * 1024)}MB"
        )
        return

    # Create upload directory if it doesn't exist
    upload_dir = Path(hass.config.path(PHOTO_UPLOAD_DIR))
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
    except OSError as err:
        _LOGGER.error("Failed to create upload directory: %s", err)
        connection.send_error(msg["id"], "directory_error", "Failed to create upload directory")
        return

    # Generate unique filename with timestamp
    timestamp = int(time.time() * 1000)
    safe_name = "".join(c for c in os.path.splitext(filename)[0] if c.isalnum() or c in "-_")[:32]
    new_filename = f"{safe_name}_{timestamp}{ext}"
    file_path = upload_dir / new_filename

    # Save the file
    try:
        await hass.async_add_executor_job(file_path.write_bytes, image_data)
    except OSError as err:
        _LOGGER.error("Failed to save photo: %s", err)
        connection.send_error(msg["id"], "save_error", "Failed to save photo")
        return

    # Return the public URL path
    public_path = f"{PHOTO_URL_PREFIX}/{new_filename}"
    _LOGGER.info("Photo uploaded: %s", public_path)
    connection.send_result(msg["id"], {"success": True, "path": public_path})


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/delete_photo",
    vol.Required("path"): str,
})
@websocket_api.async_response
async def websocket_delete_photo(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle photo delete request."""
    path = msg["path"]

    # Validate path is within our upload directory
    if not path.startswith(PHOTO_URL_PREFIX):
        connection.send_error(
            msg["id"],
            "invalid_path",
            "Can only delete photos from Dashview upload directory"
        )
        return

    # Convert public URL to file path
    filename = path.replace(PHOTO_URL_PREFIX + "/", "")
    # Prevent directory traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        connection.send_error(msg["id"], "invalid_path", "Invalid file path")
        return

    file_path = Path(hass.config.path(PHOTO_UPLOAD_DIR)) / filename

    # Delete the file if it exists
    try:
        if file_path.exists():
            await hass.async_add_executor_job(file_path.unlink)
            _LOGGER.info("Photo deleted: %s", path)
        connection.send_result(msg["id"], {"success": True})
    except OSError as err:
        _LOGGER.error("Failed to delete photo: %s", err)
        connection.send_error(msg["id"], "delete_error", "Failed to delete photo")


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
