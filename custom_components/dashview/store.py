"""Helper to manage persistent storage for DashView."""
import os
import json
import logging
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)
STORAGE_VERSION = 1
STORAGE_KEY = "dashview.config"


class DashViewStore:
    """Manages the persistent storage for DashView."""

    def __init__(self, hass: HomeAssistant):
        """Initialize the storage helper."""
        self._hass = hass
        self._path = hass.config.path(".storage", STORAGE_KEY)
        self._data = {}

    async def async_load(self) -> dict:
        """Load the data from storage."""
        def load():
            """Load the data."""
            if not os.path.exists(self._path):
                return {}
            with open(self._path, "r", encoding="utf-8") as f:
                return json.load(f)

        self._data = await self._hass.async_add_executor_job(load)
        _LOGGER.debug("Loaded data from %s: %s", self._path, self._data)
        return self._data

    async def async_save(self, data: dict):
        """Save the data to storage."""
        def save():
            """Save the data."""
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
        
        await self._hass.async_add_executor_job(save)
        self._data = data
        _LOGGER.debug("Saved data to %s: %s", self._path, self._data)

    def get_weather_entity(self, default="weather.forecast_home"):
        """Get the configured weather entity."""
        # Default to weather.forecast_home to match existing dashboard usage
        return self._data.get("weather_entity", default)

    async def async_set_weather_entity(self, entity_id: str):
        """Set the weather entity."""
        self._data["weather_entity"] = entity_id
        await self.async_save(self._data)

    def get_floors_config(self):
        """Get the floors configuration."""
        return self._data.get("floors_config", {})

    def get_rooms_config(self):
        """Get the rooms configuration."""
        return self._data.get("rooms_config", {})

    async def async_set_floors_config(self, config: dict):
        """Set the floors configuration."""
        self._data["floors_config"] = config
        await self.async_save(self._data)

    async def async_set_rooms_config(self, config: dict):
        """Set the rooms configuration."""
        self._data["rooms_config"] = config
        await self.async_save(self._data)
