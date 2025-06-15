"""Services for DashView integration."""
import logging
from homeassistant.core import HomeAssistant, ServiceCall
from .const import DOMAIN
from .store import DashViewStore

_LOGGER = logging.getLogger(__name__)


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up services for DashView."""
    
    store = DashViewStore(hass)
    await store.async_load()

    async def refresh_dashboard(service_call: ServiceCall) -> None:
        """Refresh the DashView dashboard."""
        _LOGGER.info("DashView dashboard refresh requested")
        hass.bus.async_fire(f"{DOMAIN}_refresh", {})
    
    async def set_weather_entity(service_call: ServiceCall) -> None:
        """Handle the service call to set the weather entity."""
        entity_id = service_call.data.get("entity_id")
        _LOGGER.info("Service called to set weather entity to: %s", entity_id)
        if entity_id and entity_id.startswith("weather."):
            await store.async_set_weather_entity(entity_id)
        else:
            _LOGGER.warning("Invalid entity_id received for set_weather_entity: %s", entity_id)

    async def set_temperature_config(service_call: ServiceCall) -> None:
        """Handle the service call to set the temperature configuration."""
        config = service_call.data.get("config")
        _LOGGER.info("Service called to set temperature configuration")
        if config and isinstance(config, dict):
            await store.async_set_temperature_config(config)
        else:
            _LOGGER.warning("Invalid config received for set_temperature_config: %s", config)

    async def set_covers_config(service_call: ServiceCall) -> None:
        """Handle the service call to set the covers configuration."""
        config = service_call.data.get("config")
        _LOGGER.info("Service called to set covers configuration")
        if config and isinstance(config, dict):
            await store.async_set_covers_config(config)
        else:
            _LOGGER.warning("Invalid config received for set_covers_config: %s", config)

    # Register services
    hass.services.async_register(DOMAIN, "refresh_dashboard", refresh_dashboard)
    hass.services.async_register(DOMAIN, "set_weather_entity", set_weather_entity)
    hass.services.async_register(DOMAIN, "set_temperature_config", set_temperature_config)
    hass.services.async_register(DOMAIN, "set_covers_config", set_covers_config)
    _LOGGER.info("DashView services registered")


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload DashView services."""
    hass.services.async_remove(DOMAIN, "refresh_dashboard")
    hass.services.async_remove(DOMAIN, "set_weather_entity")
    hass.services.async_remove(DOMAIN, "set_temperature_config")
    hass.services.async_remove(DOMAIN, "set_covers_config")
    _LOGGER.info("DashView services unloaded")
