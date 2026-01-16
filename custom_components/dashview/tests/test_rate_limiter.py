"""Tests for rate limiter (Story 7.9).

Tests the token bucket rate limiter implementation for WebSocket handlers.
"""
import sys
import time
from unittest.mock import MagicMock

# Mock homeassistant before importing our module - must be at top
mock_websocket_api = MagicMock()
mock_websocket_api.websocket_command = lambda schema: lambda f: f
mock_websocket_api.async_response = lambda f: f
mock_websocket_api.ActiveConnection = MagicMock

mock_vol = MagicMock()
mock_vol.Required = lambda x: x

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

from custom_components.dashview.rate_limiter import (
    RateLimiter,
    get_rate_limiter,
    rate_limited,
    reset_rate_limiters,
    RATE_LIMITS,
    DEFAULT_RATE_LIMIT,
)


class TestRateLimiter:
    """Test RateLimiter class."""

    def test_init_with_rate_and_burst(self):
        """Test initialization with rate and burst values."""
        limiter = RateLimiter(rate=10, burst=5)
        assert limiter.rate == 10
        assert limiter.burst == 5

    def test_initial_burst_allowance(self):
        """Test that initial burst allowance is available (AC3)."""
        limiter = RateLimiter(rate=1, burst=5)
        conn_id = 1

        # Should allow burst number of requests immediately
        for _ in range(5):
            assert limiter.check(conn_id) is True

        # Next request should be denied (tokens exhausted)
        assert limiter.check(conn_id) is False

    def test_token_replenishment(self):
        """Test that tokens replenish over time."""
        limiter = RateLimiter(rate=10, burst=5)
        conn_id = 1

        # Exhaust all tokens
        for _ in range(5):
            limiter.check(conn_id)

        # Tokens exhausted
        assert limiter.check(conn_id) is False

        # Manually set last_update to simulate time passing (0.1 sec = 1 token at 10/sec)
        limiter._last_update[conn_id] = time.time() - 0.1

        # Should have replenished 1 token
        assert limiter.check(conn_id) is True

    def test_per_connection_isolation(self):
        """Test that rate limits are per-connection (AC1)."""
        limiter = RateLimiter(rate=1, burst=2)

        conn1 = 1
        conn2 = 2

        # Connection 1 uses all tokens
        assert limiter.check(conn1) is True
        assert limiter.check(conn1) is True
        assert limiter.check(conn1) is False

        # Connection 2 should still have tokens
        assert limiter.check(conn2) is True
        assert limiter.check(conn2) is True
        assert limiter.check(conn2) is False

    def test_rate_limited_count_tracking(self):
        """Test rate limited request counting for monitoring (AC1)."""
        limiter = RateLimiter(rate=1, burst=1)
        conn_id = 1

        # Use the one token
        limiter.check(conn_id)
        assert limiter.get_rate_limited_count(conn_id) == 0

        # Next requests should be rate limited
        limiter.check(conn_id)
        assert limiter.get_rate_limited_count(conn_id) == 1

        limiter.check(conn_id)
        assert limiter.get_rate_limited_count(conn_id) == 2

    def test_cleanup_connection(self):
        """Test cleanup of connection state."""
        limiter = RateLimiter(rate=10, burst=5)
        conn_id = 1

        # Use some tokens
        limiter.check(conn_id)
        limiter.check(conn_id)

        # Cleanup
        limiter.cleanup_connection(conn_id)

        # State should be cleared
        assert conn_id not in limiter._tokens
        assert conn_id not in limiter._last_update
        assert conn_id not in limiter._rate_limited_count

    def test_burst_cap_at_max(self):
        """Test that tokens don't exceed burst limit."""
        limiter = RateLimiter(rate=100, burst=5)
        conn_id = 1

        # Set last_update to far in the past (simulate long idle time)
        limiter._last_update[conn_id] = time.time() - 1000
        limiter._tokens[conn_id] = 0

        # First check should replenish but cap at burst
        limiter.check(conn_id)

        # Tokens should be capped at burst (5) minus 1 for the check
        assert limiter._tokens[conn_id] <= limiter.burst

    def test_stale_connection_cleanup(self):
        """Test that stale connections are cleaned up automatically."""
        limiter = RateLimiter(rate=10, burst=5)
        # Lower threshold for testing
        limiter.CLEANUP_INTERVAL = 5
        limiter.STALE_TIMEOUT = 0.001  # 1ms

        # Create some connections
        limiter.check(1)
        limiter.check(2)
        limiter.check(3)

        # Set one connection as stale
        limiter._last_update[1] = time.time() - 1  # 1 second ago

        # Trigger cleanup by making CLEANUP_INTERVAL requests
        time.sleep(0.002)  # Wait longer than STALE_TIMEOUT
        for _ in range(limiter.CLEANUP_INTERVAL):
            limiter.check(99)

        # Stale connection should be cleaned up
        assert 1 not in limiter._tokens
        # Recent connections should still exist
        assert 99 in limiter._tokens


class TestGetRateLimiter:
    """Test get_rate_limiter function."""

    def setup_method(self):
        """Reset rate limiters before each test."""
        reset_rate_limiters()

    def test_creates_limiter_with_configured_rates(self):
        """Test that rate limiters use configured rates (AC2)."""
        for handler_name, (expected_rate, expected_burst) in RATE_LIMITS.items():
            limiter = get_rate_limiter(handler_name)
            assert limiter.rate == expected_rate
            assert limiter.burst == expected_burst

    def test_uses_default_for_unknown_handler(self):
        """Test that unknown handlers get default rate limit."""
        limiter = get_rate_limiter("unknown_handler")
        default_rate, default_burst = DEFAULT_RATE_LIMIT
        assert limiter.rate == default_rate
        assert limiter.burst == default_burst

    def test_returns_same_limiter_for_same_handler(self):
        """Test that same handler gets same limiter instance."""
        limiter1 = get_rate_limiter("get_settings")
        limiter2 = get_rate_limiter("get_settings")
        assert limiter1 is limiter2


class TestRateLimitedDecorator:
    """Test rate_limited decorator."""

    def setup_method(self):
        """Reset rate limiters before each test."""
        reset_rate_limiters()

    @pytest.mark.asyncio
    async def test_allows_requests_within_limit(self):
        """Test that requests within limit are allowed."""
        call_count = 0

        @rate_limited("get_settings")
        async def handler(hass, connection, msg):
            nonlocal call_count
            call_count += 1
            return "success"

        hass = MagicMock()
        connection = MagicMock()
        connection.send_error = MagicMock()
        msg = {"id": 1}

        # Should allow burst number of requests
        burst = RATE_LIMITS["get_settings"][1]
        for _ in range(burst):
            result = await handler(hass, connection, msg)
            assert result == "success"

        assert call_count == burst
        connection.send_error.assert_not_called()

    @pytest.mark.asyncio
    async def test_rejects_requests_exceeding_limit(self):
        """Test that excess requests are rejected with error (AC1)."""
        @rate_limited("upload_photo")  # Strictest limit: 2 req/sec, burst 2
        async def handler(hass, connection, msg):
            return "success"

        hass = MagicMock()
        connection = MagicMock()
        connection.send_error = MagicMock()
        msg = {"id": 1}

        # Use up burst allowance
        await handler(hass, connection, msg)
        await handler(hass, connection, msg)

        # Next request should be rate limited
        await handler(hass, connection, msg)

        # Should send error response
        connection.send_error.assert_called_with(
            1,
            "rate_limited",
            "Too many requests. Please slow down."
        )

    @pytest.mark.asyncio
    async def test_connection_not_terminated(self):
        """Test that connection is not terminated on rate limit (AC1)."""
        @rate_limited("save_settings")
        async def handler(hass, connection, msg):
            return "success"

        hass = MagicMock()
        connection = MagicMock()
        connection.send_error = MagicMock()
        # No close method should be called
        connection.close = MagicMock()
        msg = {"id": 1}

        # Exhaust rate limit
        for _ in range(10):
            await handler(hass, connection, msg)

        # Connection should not be closed (graceful degradation)
        connection.close.assert_not_called()


class TestRateLimitConfiguration:
    """Test rate limit configuration values (AC2)."""

    def test_get_settings_has_highest_rate(self):
        """Test get_settings has highest rate (read-only, low impact)."""
        rate, _ = RATE_LIMITS["get_settings"]
        assert rate == 20

    def test_save_settings_has_moderate_rate(self):
        """Test save_settings has moderate rate (write operation)."""
        rate, _ = RATE_LIMITS["save_settings"]
        assert rate == 5

    def test_upload_photo_has_strictest_rate(self):
        """Test upload_photo has strictest rate (heavy payload)."""
        rate, _ = RATE_LIMITS["upload_photo"]
        assert rate == 2

    def test_delete_photo_has_moderate_rate(self):
        """Test delete_photo has moderate rate (write operation)."""
        rate, _ = RATE_LIMITS["delete_photo"]
        assert rate == 5

    def test_burst_values_are_reasonable(self):
        """Test burst values allow legitimate rapid actions (AC3)."""
        for handler_name, (rate, burst) in RATE_LIMITS.items():
            # Burst should be at least 2 for legitimate rapid actions
            assert burst >= 2, f"{handler_name} burst too low"
            # Burst should not exceed 2 seconds worth of requests
            assert burst <= rate * 2, f"{handler_name} burst too high"
