"""The DashView integration."""
import os
import logging
import json
from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom, history
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.http.view import HomeAssistantView
from aiohttp import web
from homeassistant.helpers import area_registry as ar, floor_registry as fr, entity_registry as er
from homeassistant.util import dt as dt_util
from datetime import timedelta
from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the DashView component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    _LOGGER.info("Setting up DashView panel from config entry.")

    await _sync_config_from_ha_registries(hass, entry)

    config_data = entry.options or entry.data

    hass.http.register_view(DashViewConfigView(hass, entry))
    
    await async_setup_services(hass)
    
    panel_name = "dashview"
    www_path = os.path.join(os.path.dirname(__file__), "www")
    await hass.http.async_register_static_paths([
        StaticPathConfig(f"/local/{panel_name}", www_path, False)
    ])

    panel_config = None
    if config_data and isinstance(config_data, dict) and config_data.get("house_config"):
        panel_config = config_data
        _LOGGER.debug("DashView panel config prepared with house_config data")
    else:
        _LOGGER.debug("DashView panel config set to None (no house_config data)")

    try:
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="dashview-panel",
            frontend_url_path=panel_name,
            sidebar_title="DashView",
            sidebar_icon="mdi:view-dashboard",
            module_url=f"/local/{panel_name}/dashview-panel.js",
            require_admin=False,
            config=panel_config,
        )
        _LOGGER.info("DashView panel successfully registered.")
    except ValueError as ve:
        if "Overwriting panel" in str(ve):
            _LOGGER.info("DashView panel already exists, skipping registration.")
        else:
            raise

    hass.data[DOMAIN][entry.entry_id] = entry
    return True


@callback
async def _sync_config_from_ha_registries(hass: HomeAssistant, entry: ConfigEntry):
    """Create and sync house_config from HA floor and area registries."""
    _LOGGER.debug("Syncing DashView configuration with HA registries.")
    
    current_data = entry.options or entry.data
    if not current_data.get("house_config"):
        _LOGGER.debug("No house_config found, attempting migration from legacy files first.")
        await _migrate_config_files(hass, entry)
    
    floor_registry = fr.async_get(hass)
    area_registry = ar.async_get(hass)
    
    existing_house_config = (entry.options or entry.data).get("house_config", {})
    
    new_house_config = {
        "weather_entity": existing_house_config.get("weather_entity", "weather.forecast_home"),
        "floors": {},
        "rooms": {}
    }

    for floor in floor_registry.floors.values():
        new_house_config["floors"][floor.floor_id] = {
            "friendly_name": floor.name,
            "icon": floor.icon or "mdi:home",
            "level": floor.level
        }

    for area in area_registry.areas.values():
        existing_room_config = existing_house_config.get("rooms", {}).get(area.id, {})
        
        new_house_config["rooms"][area.id] = {
            "friendly_name": area.name,
            "icon": area.icon or "mdi:home-outline",
            "floor": area.floor_id,
            "combined_sensor": existing_room_config.get("combined_sensor", ""),
            "lights": existing_room_config.get("lights", []),
            "covers": existing_room_config.get("covers", []),
            "media_players": existing_room_config.get("media_players", []),
            "header_entities": existing_room_config.get("header_entities", [])
        }

    hass.config_entries.async_update_entry(
        entry, options={"house_config": new_house_config}
    )
    _LOGGER.info("DashView configuration synchronized with Home Assistant floors and areas.")


class DashViewConfigView(HomeAssistantView):
    """DashView configuration API endpoint."""
    
    url = "/api/dashview/config"
    name = "api:dashview:config"
    requires_auth = True
    
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry):
        """Initialize the config view."""
        self._hass = hass
        self._entry = entry
    
    async def get(self, request):
        """Get configuration data from the ConfigEntry."""
        config_data = self._entry.options or self._entry.data
        config_type = request.query.get("type")
        
        house_config = config_data.get("house_config", {})
        area_registry = ar.async_get(self._hass)

        if config_type == "house":
            data = house_config
        elif config_type == "weather_entity":
            data = {"weather_entity": house_config.get("weather_entity", "weather.forecast_home")}
        elif config_type == "ha_rooms":  # FIX: Added explicit handler
            areas = area_registry.areas.values()
            data = sorted(
                [
                    {
                        "area_id": area.id,
                        "name": area.name,
                        "icon": area.icon or "mdi:home-outline"
                    }
                    for area in areas
                ],
                key=lambda r: r["name"],
            )
        elif config_type == "combined_sensors":  # FIX: Added explicit handler
            combined_sensors = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.entity_id,
                }
                for entity in self._hass.states.async_all("binary_sensor")
                if entity.entity_id.startswith("binary_sensor.combined")
            ]
            data = sorted(combined_sensors, key=lambda s: s["friendly_name"])
        elif config_type == "available_media_players":
            media_players = []
            for entity in self._hass.states.async_all('media_player'):
                media_players.append({
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.entity_id
                })
            data = sorted(media_players, key=lambda p: p["friendly_name"])
        elif config_type == "history":
            entity_id = request.query.get("entity_id")
            if not entity_id:
                return self.json_message("entity_id is required for history", status_code=400)
            
            start_time = dt_util.utcnow() - timedelta(hours=24)
            history_data = await history.get_significant_states(
                self._hass, start_time, None, [entity_id], include_start_time_state=True
            )
            
            data = []
            if entity_id in history_data:
                for state in history_data[entity_id]:
                    if state.state not in ['unknown', 'unavailable']:
                        try:
                            data.append({
                                "state": float(state.state),
                                "last_changed": state.last_changed.isoformat()
                            })
                        except (ValueError, TypeError):
                            continue
            
            return self.json(data)
        elif config_type == "entities_by_room":
            entity_registry = er.async_get(self._hass)
            device_registry = self._hass.helpers.device_registry.async_get(self._hass)
            label_registry = self._hass.helpers.label_registry.async_get(self._hass)
            
            label_filter = request.query.get("label")
            domain_filter = request.query.get("domain")

            if not label_filter and not domain_filter:
                return web.Response(status=400, text="Either 'label' or 'domain' query parameter is required.")
            
            label_id = None
            if label_filter:
                for label in label_registry.labels.values():
                    if label.name.lower() == label_filter.lower():
                        label_id = label.label_id
                        break
            
            entities_by_area = {}
            for entity in entity_registry.entities.values():
                area_id = entity.area_id
                if not area_id and entity.device_id:
                    # FIX: Use the correct method to get a device from the registry
                    device = device_registry.devices.get(entity.device_id)
                    if device:
                        area_id = device.area_id

                if area_id and entity.domain != 'automation':
                    matches_filter = (label_id and label_id in entity.labels) or \
                                     (domain_filter and entity.domain == domain_filter)
                    if matches_filter:
                        if area_id not in entities_by_area:
                            area = area_registry.areas.get(area_id)
                            entities_by_area[area_id] = {
                                "name": area.name if area else "Unknown Area",
                                "entities": []
                            }
                        friendly_name = entity.name or entity.original_name or entity.entity_id.split('.')[-1].replace('_', ' ').title()
                        entities_by_area[area_id]["entities"].append({
                            "entity_id": entity.entity_id,
                            "name": friendly_name
                        })

            data = entities_by_area
        else:
            data = house_config
        
        return self.json(data)

    async def post(self, request):
        """Save configuration data by updating the ConfigEntry."""
        try:
            data = await request.json()
            self._hass.config_entries.async_update_entry(
                self._entry, options={"house_config": data}
            )
            return self.json({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving config to entry: %s", e)
            return self.json({"status": "error", "message": str(e)}, status_code=500)

def _load_json_from_file_sync(file_path):
    """Load a JSON file synchronously (for use in executor)."""
    if not os.path.exists(file_path):
        return None
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError) as e:
        _LOGGER.warning("Could not read or parse JSON file %s: %s", file_path, e)
        return None

async def _migrate_config_files(hass: HomeAssistant, entry: ConfigEntry):
    """Migrate legacy house_setup.json file to ConfigEntry asynchronously."""
    try:
        current_data = entry.options or entry.data
        if current_data.get("house_config"):
            return

        house_file = hass.config.path("custom_components", "dashview", "www", "config", "house_setup.json")
        
        house_config = await hass.async_add_executor_job(_load_json_from_file_sync, house_file)
        
        if house_config:
            hass.config_entries.async_update_entry(
                entry, options={"house_config": house_config}
            )
            _LOGGER.info("[DashView] Migrated house_setup.json to ConfigEntry")
            
    except Exception as e:
        _LOGGER.warning("[DashView] Could not migrate config files: %s", e)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    await async_unload_services(hass)
    from homeassistant.components import frontend
    frontend.async_remove_panel(hass, "dashview")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
