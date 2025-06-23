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
from homeassistant.helpers import (
    area_registry as ar,
    device_registry as dr,
    entity_registry as er,
    floor_registry as fr,
    label_registry as lr,
)
from homeassistant.util import dt as dt_util
from datetime import timedelta
from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    _LOGGER.info("Setting up DashView panel from config entry.")

    # Initialize the domain data
    hass.data.setdefault(DOMAIN, {})

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
    """Create and sync house_config from HA floor and area registries without overwriting user settings."""
    _LOGGER.debug("Syncing DashView configuration with HA registries.")

    current_data = entry.options or entry.data
    if not current_data.get("house_config"):
        _LOGGER.debug("No house_config found, attempting migration from legacy files first.")
        await _migrate_config_files(hass, entry)

    floor_registry = fr.async_get(hass)
    area_registry = ar.async_get(hass)

    # Start with the user's existing, detailed configuration
    house_config = (entry.options or entry.data).get("house_config", {})

    # Ensure top-level keys exist
    house_config.setdefault("floors", {})
    house_config.setdefault("rooms", {})
    house_config.setdefault("floor_layouts", {})
    house_config.setdefault("entity_usage_stats", {})

    # Sync floors: Add new floors from HA and update names/icons, but don't delete existing data
    for floor in floor_registry.floors.values():
        if floor.floor_id not in house_config["floors"]:
            _LOGGER.info(f"New floor '{floor.name}' found in HA, adding to DashView config.")
            house_config["floors"][floor.floor_id] = {} # Add as new
        
        # Update with latest info from HA, preserving other keys
        house_config["floors"][floor.floor_id]["friendly_name"] = floor.name
        house_config["floors"][floor.floor_id]["icon"] = floor.icon or "mdi:home"
        house_config["floors"][floor.floor_id]["level"] = floor.level
        
        # Create a default layout for the new floor if one doesn't exist
        if floor.floor_id not in house_config["floor_layouts"]:
            house_config["floor_layouts"][floor.floor_id] = [
                {"grid_area": "r1-small-1", "type": "auto", "entity_id": None},
                {"grid_area": "r1-small-2", "type": "auto", "entity_id": None},
                {"grid_area": "r1-big", "type": "room_swipe_card", "entity_id": None},
                {"grid_area": "r2-big", "type": "room_swipe_card", "entity_id": None},
                {"grid_area": "r2-small-1", "type": "auto", "entity_id": None},
                {"grid_area": "r2-small-2", "type": "auto", "entity_id": None},
            ]

    # Sync rooms: Add new areas from HA and update basic info, preserving detailed lists
    for area in area_registry.areas.values():
        if area.id not in house_config["rooms"]:
            _LOGGER.info(f"New area '{area.name}' found in HA, adding to DashView config.")
            house_config["rooms"][area.id] = { # Add as a new, empty room
                "lights": [], "covers": [], "media_players": [], "header_entities": []
            }

        # Update with latest info from HA, preserving the important user-configured lists
        house_config["rooms"][area.id]["friendly_name"] = area.name
        house_config["rooms"][area.id]["icon"] = area.icon or "mdi:home-outline"
        house_config["rooms"][area.id]["floor"] = area.floor_id
        # Ensure lists exist if they were somehow deleted
        house_config["rooms"][area.id].setdefault("lights", [])
        house_config["rooms"][area.id].setdefault("covers", [])
        house_config["rooms"][area.id].setdefault("media_players", [])
        house_config["rooms"][area.id].setdefault("header_entities", [])


    # Save the merged and updated configuration back to the options
    hass.config_entries.async_update_entry(
        entry, options={"house_config": house_config}
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

        if config_type == "house":
            data = house_config
        elif config_type == "weather_entity":
            data = {"weather_entity": house_config.get("weather_entity", "weather.forecast_home")}
        elif config_type == "integrations":
            data = config_data.get("integrations_config", {})
        elif config_type == "ha_rooms":
            area_registry = ar.async_get(self._hass)
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
        elif config_type == "combined_sensors":
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
            # FIX: Use modern, direct registry getters
            area_registry = ar.async_get(self._hass)
            entity_registry = er.async_get(self._hass)
            device_registry = dr.async_get(self._hass)
            label_registry = lr.async_get(self._hass)

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
            config_type = data.get("type")
            config_payload = data.get("config")

            if not config_type or config_payload is None:
                if 'rooms' in data and 'floors' in data:
                    config_type = "house"
                    config_payload = data
                else:
                    return self.json_message("'type' and 'config' are required, or a full house_config object", status_code=400)

            current_options = dict(self._entry.options)
            
            # Ensure house_config exists in options
            if "house_config" not in current_options:
                current_options["house_config"] = {}

            if config_type == "house":
                current_options["house_config"] = config_payload
            
            # ADD THIS NEW, SAFE-HANDLING BLOCK
            elif config_type == "entity_usage_stats":
                # This safely merges the stats without overwriting anything else
                if "house_config" not in current_options:
                    current_options["house_config"] = {}
                current_options["house_config"]["entity_usage_stats"] = config_payload
            
            elif config_type == "integrations":
                current_options["integrations_config"] = config_payload
            else:
                return self.json_message(f"Invalid config type: {config_type}", status_code=400)

            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
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
