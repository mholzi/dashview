"""Services for DashView integration."""
import logging
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.entity_component import EntityComponent
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
            # Find our sensor and tell it to update its state
            component: EntityComponent = hass.data.get("sensor")
            for entity in component.entities:
                if entity.unique_id == f"{DOMAIN}_configured_weather_entity":
                    await entity.async_update_from_service(entity_id)
                    break
        else:
            _LOGGER.warning("Invalid entity_id received for set_weather_entity: %s", entity_id)

    # Register services
    hass.services.async_register(DOMAIN, "refresh_dashboard", refresh_dashboard)
    hass.services.async_register(DOMAIN, "set_weather_entity", set_weather_entity)
    _LOGGER.info("DashView services registered")


async def async_unload_services(hass: HomeAssistant) -> None:
    """Unload DashView services."""
    hass.services.async_remove(DOMAIN, "refresh_dashboard")
    hass.services.async_remove(DOMAIN, "set_weather_entity")
    _LOGGER.info("DashView services unloaded")
