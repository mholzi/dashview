"""DashView sensor platform."""
import logging
from datetime import datetime, timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up DashView sensor."""
    sensors = [
        DashViewSensor("DashView Status", "active"),
        DashViewSensor("DashView Version", "1.0.0"),
    ]
    async_add_entities(sensors, True)


class DashViewSensor(SensorEntity):
    """Representation of a DashView sensor."""

    def __init__(self, name: str, state: str) -> None:
        """Initialize the DashView sensor."""
        self._name = name
        self._state = state
        self._attr_unique_id = f"{DOMAIN}_{name.lower().replace(' ', '_')}"

    @property
    def name(self) -> str:
        """Return the name of the sensor."""
        return self._name

    @property
    def state(self) -> str:
        """Return the state of the sensor."""
        return self._state

    @property
    def icon(self) -> str:
        """Return the icon for the sensor."""
        return "mdi:view-dashboard"

    async def async_update(self) -> None:
        """Update the sensor."""
        # For demo purposes, keep state as is
        # In a real implementation, you might fetch data here
        pass