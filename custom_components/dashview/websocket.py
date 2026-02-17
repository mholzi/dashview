"""Dashview - WebSocket command handlers."""
from __future__ import annotations

import base64
import copy
import hashlib
import logging
import os
import time
from pathlib import Path

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
import voluptuous as vol

from .const import DOMAIN
from .rate_limiter import rate_limited
from .security import (
    ALLOWED_EXTENSIONS,
    detect_file_type,
    validate_and_sanitize_filename,
    validate_magic_bytes,
)

_LOGGER = logging.getLogger(__name__)

# Photo upload configuration
PHOTO_UPLOAD_DIR = "www/dashview/user_photos"
PHOTO_URL_PREFIX = "/local/dashview/user_photos"
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
# SECURITY: Base64 encodes 3 bytes as 4 chars. Add buffer for data URL prefix (~30 chars)
# This prevents DoS by checking payload size BEFORE base64 decode (Story 7.3, GitHub #4)
MAX_BASE64_SIZE = int(MAX_PHOTO_SIZE * 4 / 3) + 1000  # ~6.67MB + buffer for data URL prefix


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/get_settings",
})
@websocket_api.async_response
@rate_limited("get_settings")
async def websocket_get_settings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle get settings request.

    Rate limit: 20 req/sec, burst 10 (Story 7.9 AC2)
    """
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
@rate_limited("save_settings")
async def websocket_save_settings(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle save settings request.

    Rate limit: 5 req/sec, burst 3 (Story 7.9 AC2)
    """
    settings = msg["settings"]

    # Update in memory
    hass.data[DOMAIN]["settings"] = settings

    # Persist to storage
    store: Store = hass.data[DOMAIN]["store"]
    await store.async_save(settings)

    _LOGGER.debug("Dashview settings saved: %s", settings)
    connection.send_result(msg["id"], {"success": True})


def deep_merge(base: dict, changes: dict) -> dict:
    """Deep merge changes into base dict using dot-notation paths.

    Args:
        base: Base settings dictionary
        changes: Dict with dot-notation paths as keys (e.g., "weather.entity": "value")

    Returns:
        Merged dictionary (new object, base is not modified)

    Raises:
        ValueError: If a path contains dangerous keys
    """
    # Reject dangerous keys that could cause issues
    dangerous_keys = {"__class__", "__init__", "__proto__", "constructor", "__dict__"}

    result = copy.deepcopy(base)

    for path, value in changes.items():
        parts = path.split(".")

        # Validate path parts don't contain dangerous keys
        if any(part in dangerous_keys for part in parts):
            raise ValueError(f"Invalid path: {path}")

        if len(parts) == 1:
            # Top-level key
            if value is None:
                result.pop(path, None)
            else:
                result[path] = value
        else:
            # Nested path - navigate to parent and set/delete value
            current = result
            for part in parts[:-1]:
                if part not in current or not isinstance(current.get(part), dict):
                    current[part] = {}
                current = current[part]

            # Set or delete the final key
            final_key = parts[-1]
            if value is None:
                current.pop(final_key, None)
            else:
                current[final_key] = value

    return result


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/save_settings_delta",
    vol.Required("changes"): dict,
    vol.Optional("version"): int,  # Timestamp for conflict detection
})
@websocket_api.async_response
@rate_limited("save_settings")
async def websocket_save_settings_delta(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle delta settings save request with conflict detection.

    Rate limit: 5 req/sec, burst 3 (same as full save)

    This endpoint applies incremental changes to existing settings using
    dot-notation paths (e.g., "weather.entity": "new_value").
    """
    changes = msg["changes"]
    client_version = msg.get("version", 0)

    # Get current settings
    existing = hass.data[DOMAIN].get("settings", {})
    current_version = existing.get("_version", 0)

    # Version conflict detection (Story 10.1 AC5)
    if client_version > 0 and client_version < current_version:
        _LOGGER.warning(
            "Settings version conflict: client=%d, server=%d",
            client_version, current_version
        )
        connection.send_error(
            msg["id"],
            "version_conflict",
            "Settings were modified by another session. Please reload."
        )
        return

    # Apply delta changes
    try:
        merged = deep_merge(existing, changes)
    except Exception as err:
        _LOGGER.error("Failed to merge settings delta: %s", err)
        connection.send_error(msg["id"], "merge_error", f"Failed to apply changes: {err}")
        return

    # Update version timestamp
    new_version = int(time.time() * 1000)
    merged["_version"] = new_version

    # Update in memory
    hass.data[DOMAIN]["settings"] = merged

    # Persist to storage
    store: Store = hass.data[DOMAIN]["store"]
    await store.async_save(merged)

    _LOGGER.debug("Dashview delta settings saved: %d changes", len(changes))
    connection.send_result(msg["id"], {"success": True, "version": new_version})


@websocket_api.websocket_command({
    vol.Required("type"): f"{DOMAIN}/upload_photo",
    vol.Required("filename"): str,
    vol.Required("data"): str,  # Base64 encoded image data
})
@websocket_api.async_response
@rate_limited("upload_photo")
async def websocket_upload_photo(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle photo upload request.

    Rate limit: 2 req/sec, burst 2 (Story 7.9 AC2) - strictest due to heavy payload
    """
    filename = msg["filename"]
    data = msg["data"]

    # SECURITY: Check payload size BEFORE any processing to prevent DoS (Story 7.3, GitHub #4)
    # This prevents memory exhaustion from oversized base64 payloads
    if len(data) > MAX_BASE64_SIZE:
        _LOGGER.warning(
            "SECURITY: Oversized upload rejected | size=%d | max=%d | filename=%s",
            len(data), MAX_BASE64_SIZE, filename
        )
        connection.send_error(
            msg["id"],
            "file_too_large",
            f"Photo exceeds maximum size of {MAX_PHOTO_SIZE // (1024 * 1024)}MB"
        )
        return

    # Validate file extension
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        connection.send_error(
            msg["id"],
            "invalid_format",
            f"Invalid file format. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        return

    # SECURITY: Validate filename and path BEFORE processing data (Story 7.2, GitHub #5)
    upload_dir = Path(hass.config.path(PHOTO_UPLOAD_DIR))
    try:
        safe_filename, _ = validate_and_sanitize_filename(filename, upload_dir)
    except ValueError as err:
        _LOGGER.warning(
            "SECURITY: Path traversal attempt rejected | filename=%s | error=%s",
            filename, str(err)
        )
        connection.send_error(msg["id"], "invalid_filename", str(err))
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

    # Validate magic bytes match expected format for extension
    if not validate_magic_bytes(image_data, ext):
        file_hash = hashlib.sha256(image_data).hexdigest()[:16]
        detected_type = detect_file_type(image_data)
        _LOGGER.warning(
            "SECURITY: Photo upload rejected - magic bytes mismatch | "
            "claimed=%s | detected=%s | hash=%s | filename=%s | size=%d",
            ext, detected_type, file_hash, filename, len(image_data)
        )
        connection.send_error(
            msg["id"],
            "invalid_file_content",
            "File content does not match the expected format"
        )
        return

    # Check file size
    if len(image_data) > MAX_PHOTO_SIZE:
        connection.send_error(
            msg["id"],
            "file_too_large",
            f"File too large. Maximum size: {MAX_PHOTO_SIZE // (1024 * 1024)}MB"
        )
        return

    # Create upload directory if it doesn't exist (upload_dir already defined above)
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
@rate_limited("delete_photo")
async def websocket_delete_photo(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle photo delete request.

    Rate limit: 5 req/sec, burst 3 (Story 7.9 AC2)
    """
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
    # SECURITY: Reuse the same validation as upload to prevent path traversal (#167)
    upload_dir = Path(hass.config.path(PHOTO_UPLOAD_DIR))
    try:
        safe_filename, file_path = validate_and_sanitize_filename(filename, upload_dir)
    except ValueError as err:
        _LOGGER.warning(
            "SECURITY: Delete path traversal attempt rejected | filename=%s | error=%s",
            filename, str(err)
        )
        connection.send_error(msg["id"], "invalid_path", str(err))
        return

    # Delete the file if it exists
    try:
        if file_path.exists():
            await hass.async_add_executor_job(file_path.unlink)
            _LOGGER.info("Photo deleted: %s", path)
        connection.send_result(msg["id"], {"success": True})
    except OSError as err:
        _LOGGER.error("Failed to delete photo: %s", err)
        connection.send_error(msg["id"], "delete_error", "Failed to delete photo")
