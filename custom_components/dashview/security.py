"""Dashview - Security utilities for file validation."""
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote

# SECURITY: Filename validation regex - only alphanumeric, dash, underscore, and dot allowed
# Pattern: name.extension where name is 1-32 chars and extension is 1-10 chars
SAFE_FILENAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]{1,32}\.[a-zA-Z0-9]{1,10}$')

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
