"""Tests for photo upload validation including magic byte checks.

Includes:
- Unit tests for validate_magic_bytes() and detect_file_type()
- Unit tests for validate_and_sanitize_filename() path traversal prevention (Story 7.2)
- Integration tests for websocket_upload_photo() handler
- Security requirement validation tests
"""
import base64
import sys
from unittest.mock import MagicMock, AsyncMock, patch
from pathlib import Path
from urllib.parse import quote

# Mock homeassistant before importing our module - must be at top
# Create proper mock structure that preserves decorator behavior
mock_websocket_api = MagicMock()
# Make decorators pass through the function unchanged for testing
mock_websocket_api.websocket_command = lambda schema: lambda f: f
mock_websocket_api.async_response = lambda f: f
mock_websocket_api.ActiveConnection = MagicMock

# Create mock for voluptuous that passes through Required
mock_vol = MagicMock()
mock_vol.Required = lambda x: x

# Set up homeassistant mock hierarchy
mock_ha = MagicMock()
mock_components = MagicMock()
mock_components.websocket_api = mock_websocket_api

sys.modules['homeassistant'] = mock_ha
sys.modules['homeassistant.components'] = mock_components
sys.modules['homeassistant.components.frontend'] = MagicMock()
sys.modules['homeassistant.components.http'] = MagicMock()
sys.modules['homeassistant.components.websocket_api'] = mock_websocket_api
sys.modules['homeassistant.config_entries'] = MagicMock()
sys.modules['homeassistant.core'] = MagicMock()
sys.modules['homeassistant.helpers'] = MagicMock()
sys.modules['homeassistant.helpers.storage'] = MagicMock()
sys.modules['voluptuous'] = mock_vol

import pytest

# Test fixtures with real image magic bytes
VALID_JPEG = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01'
VALID_PNG = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR'
VALID_GIF87 = b'GIF87a\x01\x00\x01\x00\x80\x00\x00'
VALID_GIF89 = b'GIF89a\x01\x00\x01\x00\x80\x00\x00'
VALID_WEBP = b'RIFF\x00\x00\x00\x00WEBP'

# Invalid content
FAKE_IMAGE = b'This is not an image'
TEXT_FILE = b'Hello World'
EXE_MAGIC = b'MZ\x90\x00\x03\x00\x00\x00'  # Windows executable
PDF_MAGIC = b'%PDF-1.4'
HTML_CONTENT = b'<!DOCTYPE html>'


class TestValidateMagicBytes:
    """Test suite for validate_magic_bytes function."""

    def test_valid_jpeg(self):
        """Valid JPEG should pass validation."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_JPEG, '.jpg') is True
        assert validate_magic_bytes(VALID_JPEG, '.jpeg') is True

    def test_valid_png(self):
        """Valid PNG should pass validation."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_PNG, '.png') is True

    def test_valid_gif87(self):
        """Valid GIF87a should pass validation."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_GIF87, '.gif') is True

    def test_valid_gif89(self):
        """Valid GIF89a should pass validation."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_GIF89, '.gif') is True

    def test_valid_webp(self):
        """Valid WebP should pass validation."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_WEBP, '.webp') is True

    def test_fake_jpg_with_text(self):
        """File with .jpg extension but text content should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(FAKE_IMAGE, '.jpg') is False
        assert validate_magic_bytes(TEXT_FILE, '.jpg') is False

    def test_jpg_with_png_content(self):
        """File with .jpg extension but PNG magic bytes should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_PNG, '.jpg') is False

    def test_jpg_with_exe_content(self):
        """File with .jpg extension but executable magic bytes should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(EXE_MAGIC, '.jpg') is False

    def test_unsupported_extension(self):
        """Unsupported extension should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(PDF_MAGIC, '.pdf') is False
        assert validate_magic_bytes(HTML_CONTENT, '.html') is False

    def test_case_insensitive_extension(self):
        """Extension matching should be case-insensitive."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_JPEG, '.JPG') is True
        assert validate_magic_bytes(VALID_PNG, '.PNG') is True

    def test_empty_data(self):
        """Empty data should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(b'', '.jpg') is False

    def test_truncated_data(self):
        """Truncated data (too short) should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(b'\xff\xd8', '.jpg') is False
        assert validate_magic_bytes(b'\x89PN', '.png') is False


class TestDetectFileType:
    """Test suite for detect_file_type function."""

    def test_detect_jpeg(self):
        """Should detect JPEG files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(VALID_JPEG) == "JPEG"

    def test_detect_png(self):
        """Should detect PNG files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(VALID_PNG) == "PNG"

    def test_detect_gif(self):
        """Should detect GIF files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(VALID_GIF87) == "GIF"
        assert detect_file_type(VALID_GIF89) == "GIF"

    def test_detect_webp(self):
        """Should detect WebP files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(VALID_WEBP) == "WebP"

    def test_detect_executable(self):
        """Should detect executable files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(EXE_MAGIC) == "executable"

    def test_detect_pdf(self):
        """Should detect PDF files."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(PDF_MAGIC) == "PDF"

    def test_detect_unknown(self):
        """Should return unknown for unrecognized content."""
        from custom_components.dashview import detect_file_type
        assert detect_file_type(b'random bytes here') == "unknown"

    def test_detect_short_data(self):
        """Should handle very short data appropriately."""
        from custom_components.dashview import detect_file_type
        # 0-1 bytes: too short for any detection
        assert detect_file_type(b'') == "unknown (too short)"
        assert detect_file_type(b'x') == "unknown (too short)"
        # 2 bytes: enough to detect some formats (BM, MZ) or return unknown
        assert detect_file_type(b'ab') == "unknown"
        assert detect_file_type(b'BM') == "BMP"
        assert detect_file_type(b'MZ') == "executable"


class TestCrossFormatRejection:
    """Test cross-format magic byte mismatches."""

    def test_gif_with_jpeg_content(self):
        """File with .gif extension but JPEG content should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_JPEG, '.gif') is False

    def test_png_with_gif_content(self):
        """File with .png extension but GIF content should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_GIF89, '.png') is False

    def test_webp_with_png_content(self):
        """File with .webp extension but PNG content should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_PNG, '.webp') is False

    def test_jpeg_with_webp_content(self):
        """File with .jpeg extension but WebP content should be rejected."""
        from custom_components.dashview import validate_magic_bytes
        assert validate_magic_bytes(VALID_WEBP, '.jpeg') is False


class TestSecurityRequirements:
    """Test security-related requirements."""

    def test_magic_bytes_constant_defined(self):
        """MAGIC_BYTES constant should be defined and contain expected formats."""
        from custom_components.dashview import MAGIC_BYTES
        assert '.jpg' in MAGIC_BYTES
        assert '.jpeg' in MAGIC_BYTES
        assert '.png' in MAGIC_BYTES
        assert '.gif' in MAGIC_BYTES
        assert '.webp' in MAGIC_BYTES
        # Ensure no dangerous formats
        assert '.svg' not in MAGIC_BYTES
        assert '.html' not in MAGIC_BYTES
        assert '.pdf' not in MAGIC_BYTES

    def test_allowed_extensions_excludes_dangerous(self):
        """ALLOWED_EXTENSIONS should not include dangerous formats."""
        from custom_components.dashview import ALLOWED_EXTENSIONS
        dangerous_formats = {'.svg', '.html', '.pdf', '.exe', '.js', '.php'}
        for ext in dangerous_formats:
            assert ext not in ALLOWED_EXTENSIONS, f"{ext} should not be allowed"

    def test_error_does_not_reveal_magic_bytes(self):
        """Error path should not expose internal validation details.

        The validate_magic_bytes function returns boolean only,
        never exposing which magic bytes were expected.
        """
        from custom_components.dashview import validate_magic_bytes
        # The function only returns True/False, no details
        result = validate_magic_bytes(b'malicious content', '.jpg')
        assert result is False
        assert isinstance(result, bool)

    def test_detect_file_type_available_for_logging(self):
        """detect_file_type should be available for security logging."""
        from custom_components.dashview import detect_file_type
        # Verify function exists and returns useful forensic info
        assert detect_file_type(EXE_MAGIC) == "executable"
        assert detect_file_type(PDF_MAGIC) == "PDF"


class TestWebsocketUploadPhotoHandler:
    """Integration tests for websocket_upload_photo handler (AC4: existing functionality)."""

    @pytest.fixture
    def mock_hass(self, tmp_path):
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.config.path = lambda p: str(tmp_path / p)
        hass.async_add_executor_job = AsyncMock(side_effect=lambda f, *a: f(*a))
        return hass

    @pytest.fixture
    def mock_connection(self):
        """Create mock WebSocket connection."""
        conn = MagicMock()
        conn.send_result = MagicMock()
        conn.send_error = MagicMock()
        return conn

    @pytest.mark.asyncio
    async def test_valid_jpeg_upload_success(self, mock_hass, mock_connection, tmp_path):
        """Valid JPEG upload should succeed and return path (AC1, AC4)."""
        from custom_components.dashview import websocket_upload_photo

        # Create valid JPEG data
        jpeg_data = VALID_JPEG + b'\x00' * 100  # Pad to reasonable size
        b64_data = base64.b64encode(jpeg_data).decode()

        msg = {
            "id": 1,
            "filename": "test.jpg",
            "data": b64_data
        }

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        # Should succeed
        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()
        result = mock_connection.send_result.call_args[0]
        assert result[0] == 1  # msg id
        assert result[1]["success"] is True
        assert "path" in result[1]
        assert result[1]["path"].startswith("/local/dashview/user_photos/")

    @pytest.mark.asyncio
    async def test_valid_png_upload_success(self, mock_hass, mock_connection, tmp_path):
        """Valid PNG upload should succeed (AC1)."""
        from custom_components.dashview import websocket_upload_photo

        png_data = VALID_PNG + b'\x00' * 100
        b64_data = base64.b64encode(png_data).decode()

        msg = {"id": 2, "filename": "image.png", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()
        assert mock_connection.send_result.call_args[0][1]["success"] is True

    @pytest.mark.asyncio
    async def test_disguised_exe_rejected(self, mock_hass, mock_connection):
        """Executable disguised as JPG should be rejected with invalid_file_content (AC2)."""
        from custom_components.dashview import websocket_upload_photo

        # EXE magic bytes but .jpg extension
        b64_data = base64.b64encode(EXE_MAGIC + b'\x00' * 100).decode()

        msg = {"id": 3, "filename": "malware.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        error_args = mock_connection.send_error.call_args[0]
        assert error_args[0] == 3  # msg id
        assert error_args[1] == "invalid_file_content"

    @pytest.mark.asyncio
    async def test_text_disguised_as_image_rejected(self, mock_hass, mock_connection):
        """Text file disguised as image should be rejected (AC2)."""
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(FAKE_IMAGE).decode()

        msg = {"id": 4, "filename": "fake.png", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        assert mock_connection.send_error.call_args[0][1] == "invalid_file_content"

    @pytest.mark.asyncio
    async def test_unsupported_extension_rejected_early(self, mock_hass, mock_connection):
        """Unsupported extension should be rejected before magic byte check (AC3)."""
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(PDF_MAGIC).decode()

        msg = {"id": 5, "filename": "document.pdf", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        # Should be invalid_format (extension check), NOT invalid_file_content
        assert mock_connection.send_error.call_args[0][1] == "invalid_format"

    @pytest.mark.asyncio
    async def test_oversized_file_rejected(self, mock_hass, mock_connection):
        """File exceeding MAX_PHOTO_SIZE should be rejected (size limit)."""
        from custom_components.dashview import websocket_upload_photo, MAX_PHOTO_SIZE

        # Create valid JPEG header but oversized content
        oversized_data = VALID_JPEG + b'\x00' * (MAX_PHOTO_SIZE + 1000)
        b64_data = base64.b64encode(oversized_data).decode()

        msg = {"id": 6, "filename": "huge.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        assert mock_connection.send_error.call_args[0][1] == "file_too_large"

    @pytest.mark.asyncio
    async def test_data_url_format_handled(self, mock_hass, mock_connection, tmp_path):
        """Data URL format (data:image/jpeg;base64,...) should be handled (AC4)."""
        from custom_components.dashview import websocket_upload_photo

        jpeg_data = VALID_JPEG + b'\x00' * 100
        b64_data = f"data:image/jpeg;base64,{base64.b64encode(jpeg_data).decode()}"

        msg = {"id": 7, "filename": "dataurl.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()
        assert mock_connection.send_result.call_args[0][1]["success"] is True

    @pytest.mark.asyncio
    async def test_invalid_base64_rejected(self, mock_hass, mock_connection):
        """Invalid base64 data should return decode_error."""
        from custom_components.dashview import websocket_upload_photo

        msg = {"id": 8, "filename": "bad.jpg", "data": "not-valid-base64!!!"}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        assert mock_connection.send_error.call_args[0][1] == "decode_error"

    @pytest.mark.asyncio
    async def test_file_actually_saved(self, mock_hass, mock_connection, tmp_path):
        """Verify file is actually written to disk (AC4)."""
        from custom_components.dashview import websocket_upload_photo

        jpeg_data = VALID_JPEG + b'\x00' * 100
        b64_data = base64.b64encode(jpeg_data).decode()

        msg = {"id": 9, "filename": "saved.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        # Check file was created
        upload_dir = tmp_path / "www" / "dashview" / "user_photos"
        assert upload_dir.exists()
        files = list(upload_dir.glob("*.jpg"))
        assert len(files) == 1
        # Verify content matches
        assert files[0].read_bytes() == jpeg_data

    @pytest.mark.asyncio
    async def test_webp_upload_success(self, mock_hass, mock_connection, tmp_path):
        """Valid WebP upload should succeed (AC1)."""
        from custom_components.dashview import websocket_upload_photo

        webp_data = VALID_WEBP + b'\x00' * 100
        b64_data = base64.b64encode(webp_data).decode()

        msg = {"id": 10, "filename": "image.webp", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()

    @pytest.mark.asyncio
    async def test_gif_upload_success(self, mock_hass, mock_connection, tmp_path):
        """Valid GIF upload should succeed (AC1)."""
        from custom_components.dashview import websocket_upload_photo

        gif_data = VALID_GIF89 + b'\x00' * 100
        b64_data = base64.b64encode(gif_data).decode()

        msg = {"id": 11, "filename": "animation.gif", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()


class TestValidateAndSanitizeFilename:
    """Test suite for validate_and_sanitize_filename function (Story 7.2)."""

    @pytest.fixture
    def upload_dir(self, tmp_path):
        """Create a temporary upload directory."""
        upload_dir = tmp_path / "uploads"
        upload_dir.mkdir()
        return upload_dir

    def test_valid_filename_simple(self, upload_dir):
        """Normal filename should pass validation (AC1)."""
        from custom_components.dashview import validate_and_sanitize_filename
        safe_name, path = validate_and_sanitize_filename("photo.jpg", upload_dir)
        assert safe_name == "photo.jpg"
        assert path == upload_dir / "photo.jpg"

    def test_valid_filename_with_dash_underscore(self, upload_dir):
        """Filename with dash and underscore should pass (AC6)."""
        from custom_components.dashview import validate_and_sanitize_filename
        safe_name, _ = validate_and_sanitize_filename("my-photo_2024.png", upload_dir)
        assert safe_name == "my-photo_2024.png"

    def test_valid_filename_with_numbers(self, upload_dir):
        """Filename with numbers should pass (AC6)."""
        from custom_components.dashview import validate_and_sanitize_filename
        safe_name, _ = validate_and_sanitize_filename("IMG12345.jpeg", upload_dir)
        assert safe_name == "IMG12345.jpeg"

    def test_path_traversal_basic(self, upload_dir):
        """Basic path traversal should be rejected (AC2)."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("../../../etc/passwd.jpg", upload_dir)

    def test_path_traversal_double_dot(self, upload_dir):
        """Double dot traversal should be rejected (AC2)."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("..photo.jpg", upload_dir)

    def test_path_traversal_url_encoded_slash(self, upload_dir):
        """URL-encoded forward slash should be decoded and rejected (AC3)."""
        from custom_components.dashview import validate_and_sanitize_filename
        # %2F is URL-encoded /
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("..%2F..%2F..%2Fetc%2Fpasswd.jpg", upload_dir)

    def test_path_traversal_url_encoded_backslash(self, upload_dir):
        """URL-encoded backslash should be decoded and rejected (AC3)."""
        from custom_components.dashview import validate_and_sanitize_filename
        # %5C is URL-encoded \
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("..%5C..%5Cwindows%5Csystem32.jpg", upload_dir)

    def test_null_byte_injection(self, upload_dir):
        """Null byte injection should be rejected."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("photo.jpg\x00.exe", upload_dir)

    def test_forward_slash_in_filename(self, upload_dir):
        """Forward slash in filename should be rejected (AC2)."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("path/to/photo.jpg", upload_dir)

    def test_backslash_in_filename(self, upload_dir):
        """Backslash in filename should be rejected (AC2)."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError, match="Invalid characters"):
            validate_and_sanitize_filename("path\\to\\photo.jpg", upload_dir)

    def test_special_characters_rejected(self, upload_dir):
        """Special characters should be rejected (AC6)."""
        from custom_components.dashview import validate_and_sanitize_filename
        invalid_filenames = [
            "photo<script>.jpg",
            "photo>.jpg",
            "photo|.jpg",
            "photo:.jpg",
            "photo*.jpg",
            "photo?.jpg",
            'photo".jpg',
            "photo'.jpg",
            "photo .jpg",  # space
            "photo\t.jpg",  # tab
        ]
        for filename in invalid_filenames:
            with pytest.raises(ValueError, match="invalid characters"):
                validate_and_sanitize_filename(filename, upload_dir)

    def test_empty_filename_rejected(self, upload_dir):
        """Empty filename should be rejected."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError):
            validate_and_sanitize_filename("", upload_dir)

    def test_extension_only_rejected(self, upload_dir):
        """Filename with only extension should be rejected."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError):
            validate_and_sanitize_filename(".jpg", upload_dir)

    def test_no_extension_rejected(self, upload_dir):
        """Filename without extension should be rejected."""
        from custom_components.dashview import validate_and_sanitize_filename
        with pytest.raises(ValueError):
            validate_and_sanitize_filename("photo", upload_dir)

    def test_path_is_within_upload_dir(self, upload_dir):
        """Resolved path should be within upload directory (AC5)."""
        from custom_components.dashview import validate_and_sanitize_filename
        _, resolved_path = validate_and_sanitize_filename("test.jpg", upload_dir)
        assert str(resolved_path).startswith(str(upload_dir.resolve()))

    def test_pathlib_resolve_used(self, upload_dir):
        """Path should use resolve() for canonical path (AC4)."""
        from custom_components.dashview import validate_and_sanitize_filename
        _, resolved_path = validate_and_sanitize_filename("test.jpg", upload_dir)
        # Resolved path should be absolute
        assert resolved_path.is_absolute()


class TestDoSPrevention:
    """Test suite for DoS prevention via early size validation (Story 7.3)."""

    def test_max_base64_size_constant_defined(self):
        """MAX_BASE64_SIZE constant should be defined correctly (AC3)."""
        from custom_components.dashview import MAX_BASE64_SIZE, MAX_PHOTO_SIZE
        # Should be approximately 4/3 of MAX_PHOTO_SIZE plus buffer
        expected_min = int(MAX_PHOTO_SIZE * 4 / 3)
        assert MAX_BASE64_SIZE > expected_min
        assert MAX_BASE64_SIZE < expected_min + 2000  # Buffer shouldn't be too large

    def test_max_base64_size_relationship(self):
        """MAX_BASE64_SIZE should account for base64 overhead (AC3)."""
        from custom_components.dashview import MAX_BASE64_SIZE, MAX_PHOTO_SIZE
        # Base64 encoding: 3 bytes -> 4 chars
        # So 5MB decoded = ~6.67MB base64
        assert MAX_BASE64_SIZE > MAX_PHOTO_SIZE  # Must be larger due to encoding
        assert MAX_BASE64_SIZE < MAX_PHOTO_SIZE * 2  # But not excessively large


class TestDoSPreventionIntegration:
    """Integration tests for DoS prevention in websocket handler (Story 7.3)."""

    @pytest.fixture
    def mock_hass(self, tmp_path):
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.config.path = lambda p: str(tmp_path / p)
        hass.async_add_executor_job = AsyncMock(side_effect=lambda f, *a: f(*a))
        return hass

    @pytest.fixture
    def mock_connection(self):
        """Create mock WebSocket connection."""
        conn = MagicMock()
        conn.send_result = MagicMock()
        conn.send_error = MagicMock()
        return conn

    @pytest.mark.asyncio
    async def test_oversized_payload_rejected_before_decode(self, mock_hass, mock_connection):
        """Oversized base64 payload should be rejected BEFORE decode (AC2, AC4, AC5)."""
        from custom_components.dashview import websocket_upload_photo, MAX_BASE64_SIZE

        # Create payload larger than MAX_BASE64_SIZE
        oversized_data = "A" * (MAX_BASE64_SIZE + 1000)
        msg = {"id": 1, "filename": "huge.jpg", "data": oversized_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        error_args = mock_connection.send_error.call_args[0]
        assert error_args[1] == "file_too_large"
        assert "5MB" in error_args[2]

    @pytest.mark.asyncio
    async def test_valid_size_upload_succeeds(self, mock_hass, mock_connection, tmp_path):
        """Valid size upload should succeed (AC1, AC7)."""
        from custom_components.dashview import websocket_upload_photo

        # Use a normal-sized valid JPEG
        jpeg_data = VALID_JPEG + b'\x00' * 100
        b64_data = base64.b64encode(jpeg_data).decode()

        msg = {"id": 2, "filename": "normal.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()
        assert mock_connection.send_result.call_args[0][1]["success"] is True

    @pytest.mark.asyncio
    async def test_boundary_size_at_limit(self, mock_hass, mock_connection):
        """Payload exactly at limit should be accepted (boundary test)."""
        from custom_components.dashview import websocket_upload_photo, MAX_BASE64_SIZE

        # Create payload exactly at MAX_BASE64_SIZE
        # This will fail later due to invalid content, but should pass size check
        at_limit_data = "A" * MAX_BASE64_SIZE
        msg = {"id": 3, "filename": "atlimit.jpg", "data": at_limit_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        # Should NOT fail with "file_too_large" - will fail later with decode_error
        error_args = mock_connection.send_error.call_args[0]
        assert error_args[1] != "file_too_large"

    @pytest.mark.asyncio
    async def test_data_url_format_with_size_check(self, mock_hass, mock_connection, tmp_path):
        """Data URL format should work with size check (AC7)."""
        from custom_components.dashview import websocket_upload_photo

        jpeg_data = VALID_JPEG + b'\x00' * 100
        data_url = f"data:image/jpeg;base64,{base64.b64encode(jpeg_data).decode()}"

        msg = {"id": 4, "filename": "dataurl.jpg", "data": data_url}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()


class TestPathTraversalIntegration:
    """Integration tests for path traversal prevention in websocket handler."""

    @pytest.fixture
    def mock_hass(self, tmp_path):
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.config.path = lambda p: str(tmp_path / p)
        hass.async_add_executor_job = AsyncMock(side_effect=lambda f, *a: f(*a))
        return hass

    @pytest.fixture
    def mock_connection(self):
        """Create mock WebSocket connection."""
        conn = MagicMock()
        conn.send_result = MagicMock()
        conn.send_error = MagicMock()
        return conn

    @pytest.mark.asyncio
    async def test_path_traversal_rejected_in_handler(self, mock_hass, mock_connection):
        """Path traversal in handler should return invalid_filename error (AC7)."""
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(VALID_JPEG + b'\x00' * 100).decode()
        msg = {"id": 1, "filename": "../../../etc/passwd.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        error_args = mock_connection.send_error.call_args[0]
        assert error_args[1] == "invalid_filename"

    @pytest.mark.asyncio
    async def test_url_encoded_traversal_rejected(self, mock_hass, mock_connection):
        """URL-encoded path traversal should be rejected (AC3, AC7)."""
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(VALID_JPEG + b'\x00' * 100).decode()
        # %2F is URL-encoded /
        msg = {"id": 2, "filename": "..%2F..%2F..%2Fetc%2Fpasswd.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        assert mock_connection.send_error.call_args[0][1] == "invalid_filename"

    @pytest.mark.asyncio
    async def test_null_byte_rejected_in_handler(self, mock_hass, mock_connection):
        """Null byte injection should be rejected.

        Note: Null bytes in filename get caught by extension check because
        os.path.splitext("photo.jpg\\x00.exe") returns extension ".exe".
        The important thing is the upload is rejected.
        """
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(VALID_JPEG + b'\x00' * 100).decode()
        msg = {"id": 3, "filename": "photo.jpg\x00.exe", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        # Should be rejected (either invalid_format or invalid_filename depending on check order)
        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        error_code = mock_connection.send_error.call_args[0][1]
        assert error_code in ("invalid_format", "invalid_filename")

    @pytest.mark.asyncio
    async def test_special_chars_rejected_in_handler(self, mock_hass, mock_connection):
        """Special characters in filename should be rejected (AC6)."""
        from custom_components.dashview import websocket_upload_photo

        b64_data = base64.b64encode(VALID_JPEG + b'\x00' * 100).decode()
        msg = {"id": 4, "filename": "photo<script>.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_result.assert_not_called()
        mock_connection.send_error.assert_called_once()
        assert mock_connection.send_error.call_args[0][1] == "invalid_filename"

    @pytest.mark.asyncio
    async def test_valid_upload_still_works(self, mock_hass, mock_connection, tmp_path):
        """Valid uploads should still succeed (AC8)."""
        from custom_components.dashview import websocket_upload_photo

        jpeg_data = VALID_JPEG + b'\x00' * 100
        b64_data = base64.b64encode(jpeg_data).decode()

        msg = {"id": 5, "filename": "valid-photo_123.jpg", "data": b64_data}

        await websocket_upload_photo(mock_hass, mock_connection, msg)

        mock_connection.send_error.assert_not_called()
        mock_connection.send_result.assert_called_once()
        assert mock_connection.send_result.call_args[0][1]["success"] is True
