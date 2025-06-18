"""DashView sensor platform."""
import logging
from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up DashView sensor."""
    
    sensors = [
        DashViewStatusSensor("DashView Status", "active"),
    ]
    async_add_entities(sensors, True)


class DashViewStatusSensor(SensorEntity):
    """Representation of a DashView status sensor."""
    _attr_icon = "mdi:view-dashboard"

    def __init__(self, name: str, state: str) -> None:
        """Initialize the sensor."""
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
