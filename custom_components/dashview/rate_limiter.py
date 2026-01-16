"""Rate Limiter for Dashview WebSocket handlers.

Story 7.9: WebSocket Rate Limiting
Implements token bucket algorithm for per-connection rate limiting.
"""
from __future__ import annotations

import functools
import logging
import time
from collections import defaultdict
from typing import Callable, Any

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# Rate limit configuration (Story 7.9 AC2)
# Format: (rate_per_second, burst_size)
RATE_LIMITS = {
    "get_settings": (20, 10),    # Read-only, low impact
    "save_settings": (5, 3),     # Write operation, needs protection
    "upload_photo": (2, 2),      # Heavy payload, disk I/O
    "delete_photo": (5, 3),      # Write operation, moderate impact
}

# Default rate limit for any unlisted handler
DEFAULT_RATE_LIMIT = (10, 5)


class RateLimiter:
    """Token bucket rate limiter for per-connection rate limiting.

    Implements the token bucket algorithm where:
    - Tokens are added at a fixed rate (rate per second)
    - Each request consumes one token
    - Requests are denied when tokens are exhausted
    - Burst allowance provides flexibility for legitimate rapid actions

    Includes automatic cleanup of stale connections to prevent memory leaks.

    Attributes:
        rate: Tokens added per second
        burst: Maximum tokens (bucket size)
    """

    # Connections inactive for this long are considered stale (5 minutes)
    STALE_TIMEOUT = 300
    # Clean up stale connections every 100 requests
    CLEANUP_INTERVAL = 100

    def __init__(self, rate: float, burst: int):
        """Initialize rate limiter.

        Args:
            rate: Tokens per second to add
            burst: Maximum tokens in bucket (burst allowance)
        """
        self.rate = rate
        self.burst = burst
        self._tokens: dict[int, float] = defaultdict(lambda: burst)
        self._last_update: dict[int, float] = defaultdict(time.time)
        self._rate_limited_count: dict[int, int] = defaultdict(int)
        self._request_count = 0

    def check(self, connection_id: int) -> bool:
        """Check if a request should be allowed.

        Args:
            connection_id: Unique identifier for the connection

        Returns:
            True if request is allowed, False if rate limited
        """
        now = time.time()

        # Handle first request for this connection
        is_new_connection = connection_id not in self._last_update
        if is_new_connection:
            self._last_update[connection_id] = now
            # New connections start with full burst allowance (already in _tokens defaultdict)
            elapsed = 0
        else:
            elapsed = now - self._last_update[connection_id]
            self._last_update[connection_id] = now

        # Periodic cleanup of stale connections to prevent memory leaks
        self._request_count += 1
        if self._request_count >= self.CLEANUP_INTERVAL:
            self._cleanup_stale_connections(now)
            self._request_count = 0

        # Add tokens based on elapsed time (capped at burst)
        self._tokens[connection_id] = min(
            self.burst,
            self._tokens[connection_id] + elapsed * self.rate
        )

        if self._tokens[connection_id] >= 1:
            self._tokens[connection_id] -= 1
            return True

        # Track rate limited requests for monitoring
        self._rate_limited_count[connection_id] += 1
        return False

    def _cleanup_stale_connections(self, now: float) -> None:
        """Remove state for connections that haven't been seen recently.

        Args:
            now: Current timestamp
        """
        stale_ids = [
            conn_id for conn_id, last_time in self._last_update.items()
            if now - last_time > self.STALE_TIMEOUT
        ]
        for conn_id in stale_ids:
            self.cleanup_connection(conn_id)
        if stale_ids:
            _LOGGER.debug("Cleaned up %d stale rate limiter connections", len(stale_ids))

    def get_rate_limited_count(self, connection_id: int) -> int:
        """Get the count of rate-limited requests for a connection.

        Args:
            connection_id: Unique identifier for the connection

        Returns:
            Number of rate-limited requests for this connection
        """
        return self._rate_limited_count[connection_id]

    def cleanup_connection(self, connection_id: int) -> None:
        """Clean up state for a disconnected connection.

        Args:
            connection_id: Unique identifier for the connection
        """
        self._tokens.pop(connection_id, None)
        self._last_update.pop(connection_id, None)
        self._rate_limited_count.pop(connection_id, None)


# Global rate limiters per handler type
_RATE_LIMITERS: dict[str, RateLimiter] = {}


def get_rate_limiter(handler_name: str) -> RateLimiter:
    """Get or create a rate limiter for a handler.

    Args:
        handler_name: Name of the WebSocket handler

    Returns:
        RateLimiter instance for the handler
    """
    if handler_name not in _RATE_LIMITERS:
        rate, burst = RATE_LIMITS.get(handler_name, DEFAULT_RATE_LIMIT)
        _RATE_LIMITERS[handler_name] = RateLimiter(rate, burst)
    return _RATE_LIMITERS[handler_name]


def rate_limited(handler_name: str) -> Callable:
    """Decorator to add rate limiting to WebSocket handlers.

    Story 7.9: AC1 - Per-connection rate limiting with graceful degradation.
    Excess requests are rejected with an error but connection is not terminated.

    Args:
        handler_name: Name of the handler for rate limit configuration lookup

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(
            hass: HomeAssistant,
            connection: websocket_api.ActiveConnection,
            msg: dict,
        ) -> Any:
            limiter = get_rate_limiter(handler_name)
            conn_id = id(connection)

            if not limiter.check(conn_id):
                rate_count = limiter.get_rate_limited_count(conn_id)
                _LOGGER.warning(
                    "RATE_LIMITED: handler=%s | connection=%d | count=%d",
                    handler_name, conn_id, rate_count
                )
                connection.send_error(
                    msg["id"],
                    "rate_limited",
                    "Too many requests. Please slow down."
                )
                return

            return await func(hass, connection, msg)
        return wrapper
    return decorator


def reset_rate_limiters() -> None:
    """Reset all rate limiters. Useful for testing."""
    global _RATE_LIMITERS
    _RATE_LIMITERS = {}
