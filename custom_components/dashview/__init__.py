"""Dashview - Custom Home Assistant Dashboard Integration."""
from __future__ import annotations

import base64
import copy
import hashlib
import json
import logging
import os
import re
import time
from pathlib import Path
from urllib.parse import unquote

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
from .rate_limiter import rate_limited

_LOGGER = logging.getLogger(__name__)

STORAGE_KEY = f"{DOMAIN}.settings"
STORAGE_VERSION = 1

# Photo upload configuration
PHOTO_UPLOAD_DIR = "www/dashview/user_photos"
PHOTO_URL_PREFIX = "/local/dashview/user_photos"
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
# SECURITY: Base64 encodes 3 bytes as 4 chars. Add buffer for data URL prefix (~30 chars)
# This prevents DoS by checking payload size BEFORE base64 decode (Story 7.3, GitHub #4)
MAX_BASE64_SIZE = int(MAX_PHOTO_SIZE * 4 / 3) + 1000  # ~6.67MB + buffer for data URL prefix
# Security: Only raster image formats with magic byte signatures.
# Explicitly excluded: SVG (XML-based, XSS risk), HTML, PDF (can contain scripts)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# Magic byte signatures for content validation
# Maps extension to list of valid magic byte prefixes
MAGIC_BYTES = {
    '.jpg': [b'\xff\xd8\xff'],
    '.jpeg': [b'\xff\xd8\xff'],
    '.png': [b'\x89PNG\r\n\x1a\n'],
    '.gif': [b'GIF87a', b'GIF89a'],
    '.webp': None,  # Special handling: RIFF....WEBP
}

# SECURITY: Filename validation regex - only alphanumeric, dash, underscore, and dot allowed
# Pattern: name.extension where name is 1-32 chars and extension is 1-10 chars
SAFE_FILENAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]{1,32}\.[a-zA-Z0-9]{1,10}$')


def validate_and_sanitize_filename(filename: str, upload_dir: Path) -> tuple[str, Path]:
    """Validate filename and return safe path.

    SECURITY: Prevents path traversal attacks by:
    1. URL decoding to catch encoded attacks (%2F, %5C, etc.)
    2. Rejecting path separators and traversal sequences
    3. Whitelist validation with regex
    4. Resolving to canonical path and verifying within upload_dir

    Args:
        filename: User-provided filename
        upload_dir: Upload directory Path object

    Returns:
        Tuple of (sanitized_filename, resolved_path)

    Raises:
        ValueError: If filename is invalid or path escapes upload_dir
    """
    # URL decode to catch encoded attacks (e.g., %2F = /, %5C = \)
    decoded = unquote(filename)

    # Reject path separators, traversal sequences, and null bytes
    if any(c in decoded for c in ('/', '\\', '\x00')) or '..' in decoded:
        raise ValueError(f"Invalid characters in filename: {filename}")

    # Validate against whitelist regex
    if not SAFE_FILENAME_REGEX.match(decoded):
        raise ValueError(f"Filename contains invalid characters: {filename}")

    # Resolve to canonical path and verify within upload_dir
    upload_dir_resolved = upload_dir.resolve()
    resolved = (upload_dir / decoded).resolve()

    # SECURITY: Verify resolved path is within upload directory
    # This catches any remaining path traversal attempts
    if not str(resolved).startswith(str(upload_dir_resolved)):
        raise ValueError(f"Path escapes upload directory: {filename}")

    return decoded, resolved


def detect_file_type(data: bytes) -> str:
    """Attempt to identify file type from magic bytes.

    Uses format-aware minimum lengths consistent with validate_magic_bytes().

    Args:
        data: Raw file bytes to analyze

    Returns:
        Detected type string or 'unknown'
    """
    data_len = len(data)

    # Minimum 2 bytes needed for any detection
    if data_len < 2:
        return "unknown (too short)"

    # Check signatures in order of minimum length required
    # 2-byte signatures
    if data[:2] == b'BM':
        return "BMP"
    if data[:2] == b'MZ':
        return "executable"

    # 3-byte signatures
    if data_len >= 3 and data[:3] == b'\xff\xd8\xff':
        return "JPEG"

    # 4-byte signatures
    if data_len >= 4:
        if data[:4] == b'%PDF':
            return "PDF"
        if data[:4] == b'PK\x03\x04':
            return "ZIP/archive"

    # 5-byte signatures
    if data_len >= 5 and data[:5] == b'<?xml':
        return "XML/HTML"

    # 6-byte signatures
    if data_len >= 6 and data[:6] in (b'GIF87a', b'GIF89a'):
        return "GIF"

    # 8-byte signatures
    if data_len >= 8 and data[:8] == b'\x89PNG\r\n\x1a\n':
        return "PNG"

    # 12-byte signatures (WebP requires checking two locations)
    if data_len >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return "WebP"

    # 14-byte signatures
    if data_len >= 14 and data[:14] == b'<!DOCTYPE html':
        return "XML/HTML"

    return "unknown"


def validate_magic_bytes(data: bytes, extension: str) -> bool:
    """Validate file content matches expected magic bytes for the given extension.

    Args:
        data: Raw file bytes to validate
        extension: File extension including dot (e.g., '.jpg')

    Returns:
        True if content matches expected magic bytes, False otherwise
    """
    ext = extension.lower()

    # Minimum length requirements per format
    min_lengths = {'.jpg': 3, '.jpeg': 3, '.png': 8, '.gif': 6, '.webp': 12}
    min_len = min_lengths.get(ext, 3)
    if len(data) < min_len:
        return False

    # WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
    if ext == '.webp':
        return data[:4] == b'RIFF' and data[8:12] == b'WEBP'

    # Get signatures for this extension
    signatures = MAGIC_BYTES.get(ext)
    if not signatures:
        return False

    # Check if data starts with any valid signature
    return any(data.startswith(sig) for sig in signatures)


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
    websocket_api.async_register_command(hass, websocket_save_settings_delta)
    websocket_api.async_register_command(hass, websocket_upload_photo)
    websocket_api.async_register_command(hass, websocket_delete_photo)


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
