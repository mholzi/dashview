"""DashView sensor platform."""
import logging
from homeassistant.components.sensor import SensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .store import DashViewStore

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up DashView sensor."""
    
    store = DashViewStore(hass)
    await store.async_load()
    
    sensors = [
        DashViewStatusSensor("DashView Status", "active"),
        ConfiguredWeatherSensor(store),
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


class ConfiguredWeatherSensor(SensorEntity):
    """A sensor to expose the configured weather entity to the frontend."""
    _attr_icon = "mdi:weather-partly-cloudy"
    _attr_name = "DashView Configured Weather"
    _attr_unique_id = f"{DOMAIN}_configured_weather_entity"

    def __init__(self, store: DashViewStore):
        """Initialize the sensor."""
        self._store = store
        self._attr_state = self._store.get_weather_entity()

    async def async_update_from_service(self, new_state: str):
        """Update the sensor's state from the service call."""
        self._attr_state = new_state
        self.async_write_ha_state()
