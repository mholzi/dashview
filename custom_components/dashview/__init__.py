"""The DashView integration."""
import os
import logging
import json
from datetime import timedelta

from aiohttp import web

from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import panel_custom
from homeassistant.components.http import StaticPathConfig, HomeAssistantView
from homeassistant.helpers import (
    area_registry as ar,
    entity_registry as er,
    floor_registry as fr,
    label_registry as lr,
)

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)


# =================================================================================
# SETUP AND UNLOAD
# =================================================================================

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    _LOGGER.info("Setting up DashView panel.")
    hass.data.setdefault(DOMAIN, {})

    # Sync HA's floor/area registries with the DashView config upon startup.
    await _sync_config_from_ha_registries(hass, entry)

    # Register the API endpoint.
    hass.http.register_view(DashViewConfigView(hass, entry))

    # Register the services (e.g., set_weather_entity).
    await async_setup_services(hass)

    # Register the /local/dashview path to serve the frontend files.
    panel_name = "dashview"
    www_path = os.path.join(os.path.dirname(__file__), "www")
    await hass.http.async_register_static_paths([
        StaticPathConfig(f"/local/{panel_name}", www_path, cache_headers=False)
    ])

    # Register the custom panel in the Home Assistant sidebar.
    try:
        await panel_custom.async_register_panel(
            hass,
            webcomponent_name="dashview-panel",
            frontend_url_path=panel_name,
            sidebar_title="DashView",
            sidebar_icon="mdi:view-dashboard",
            module_url=f"/local/{panel_name}/dashview-panel.js",
            require_admin=False,
            config=entry.options.get("house_config", {}),
        )
        _LOGGER.info("DashView panel successfully registered.")
    except ValueError as ve:
        if "Overwriting panel" in str(ve):
            _LOGGER.info("DashView panel already exists, skipping registration.")
        else:
            raise

    hass.data[DOMAIN][entry.entry_id] = entry
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.info("Unloading DashView panel.")
    await async_unload_services(hass)
    from homeassistant.components import frontend
    frontend.async_remove_panel(hass, "dashview")
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True


# =================================================================================
# CONFIGURATION SYNCING
# =================================================================================

@callback
async def _sync_config_from_ha_registries(hass: HomeAssistant, entry: ConfigEntry):
    """
    Creates and syncs the house_config from HA's floor and area registries.
    This ensures that new floors and rooms created in HA automatically appear in
    the DashView admin panel without overwriting existing user configurations.
    """
    _LOGGER.debug("Syncing DashView configuration with HA registries.")
    floor_registry = fr.async_get(hass)
    area_registry = ar.async_get(hass)

    # Start with the user's existing configuration from the options flow.
    house_config = entry.options.get("house_config", {})

    # Ensure top-level keys exist to prevent errors.
    house_config.setdefault("floors", {})
    house_config.setdefault("rooms", {})
    house_config.setdefault("floor_layouts", {})

    # Sync floors: Add new floors from HA, preserving existing DashView settings.
    for floor in floor_registry.floors.values():
        if floor.floor_id not in house_config["floors"]:
            _LOGGER.info(f"New floor '{floor.name}' found, adding to DashView config.")
            house_config["floors"][floor.floor_id] = {}
        
        # Update with latest info from HA, but keep other user-set keys.
        house_config["floors"][floor.floor_id]["friendly_name"] = floor.name
        house_config["floors"][floor.floor_id]["icon"] = floor.icon or "mdi:home"
        house_config["floors"][floor.floor_id]["level"] = floor.level
        
        # **Crucial Fix**: Create a default layout for any new floor.
        if floor.floor_id not in house_config["floor_layouts"]:
            _LOGGER.info(f"Generating default layout for new floor '{floor.name}'.")
            house_config["floor_layouts"][floor.floor_id] = [
                # Default big slots to the room swiper
                {"grid_area": "r1-big", "type": "room_swipe_card", "entity_id": None},
                {"grid_area": "r2-big", "type": "room_swipe_card", "entity_id": None},
                # Default small slots to auto
                {"grid_area": "r1-small-1", "type": "auto", "entity_id": None},
                {"grid_area": "r1-small-2", "type": "auto", "entity_id": None},
                {"grid_area": "r2-small-3", "type": "auto", "entity_id": None},
                {"grid_area": "r2-small-4", "type": "auto", "entity_id": None},
            ]

    # Sync rooms: Add new areas from HA, preserving user-configured entity lists.
    for area in area_registry.areas.values():
        if area.id not in house_config["rooms"]:
            _LOGGER.info(f"New area '{area.name}' found, adding to DashView config.")
            house_config["rooms"][area.id] = {}

        # Update basic info, but preserve the important user-configured lists.
        house_config["rooms"][area.id]["friendly_name"] = area.name
        house_config["rooms"][area.id]["icon"] = area.icon or "mdi:home-outline"
        house_config["rooms"][area.id]["floor"] = area.floor_id
        # Ensure entity lists exist.
        house_config["rooms"][area.id].setdefault("lights", [])
        house_config["rooms"][area.id].setdefault("covers", [])
        house_config["rooms"][area.id].setdefault("media_players", [])
        house_config["rooms"][area.id].setdefault("header_entities", [])

    # Save the updated configuration back to the options flow.
    hass.config_entries.async_update_entry(
        entry, options={"house_config": house_config}
    )
    _LOGGER.info("DashView configuration synchronized.")


# =================================================================================
# API VIEW
# =================================================================================

class DashViewConfigView(HomeAssistantView):
    """Provides the /api/dashview/config endpoint for the frontend."""

    url = "/api/dashview/config"
    name = "api:dashview:config"
    requires_auth = True

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry):
        """Initialize the config view."""
        self._hass = hass
        self._entry = entry

# In custom_components/dashview/__init__.py

    async def get(self, request: web.Request) -> web.Response:
        """Handle GET requests to fetch configuration or entities."""
        config_type = request.query.get('type')

        if config_type == 'house':
            config = self._entry.options.get('house_config', {})
            return web.json_response(config)

        if config_type == 'integrations':
            config = self._entry.options.get('integrations_config', {})
            return web.json_response(config)

        if config_type == 'available_media_players':
            entity_reg = er.async_get(self._hass)
            all_media_players = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.original_name or entity.entity_id,
                }
                for entity in entity_reg.entities.values() if entity.domain == "media_player"
            ]
            return web.json_response(all_media_players)

        if config_type == 'entities_by_room':
            label = request.query.get('label')
            domain = request.query.get('domain')
            entity_reg = er.async_get(self._hass)
            area_reg = ar.async_get(self._hass)
            
            source_entity_ids = set()
            if label:
                label_reg = lr.async_get(self._hass)
                label_entry = next((entry for entry in label_reg.labels.values() if entry.name.lower() == label.lower()), None)
                if label_entry:
                    source_entities = entity_reg.entities.get_entries_for_label(label_entry.label_id)
                    source_entity_ids = {entity.entity_id for entity in source_entities if entity.domain != "automation"}
            elif domain:
                source_entity_ids = {entity.entity_id for entity in entity_reg.entities.values() if entity.domain == domain}

            if not source_entity_ids:
                return web.json_response({})

            entities_by_area = {}
            processed_entity_ids = set()

            for area in area_reg.areas.values():
                area_entity_ids = set(entity_reg.entities_by_area_id.get(area.id, []))
                matching_entities_in_area = source_entity_ids.intersection(area_entity_ids)
                
                if matching_entities_in_area:
                    entities_by_area[area.id] = {"name": area.name, "entities": []}
                    for entity_id in matching_entities_in_area:
                        entity = await entity_reg.async_get(entity_id)
                        if entity:
                            entities_by_area[area.id]["entities"].append({
                                "entity_id": entity.entity_id,
                                "name": entity.name or entity.original_name,
                            })
                            processed_entity_ids.add(entity.entity_id)

            unassigned_entity_ids = source_entity_ids - processed_entity_ids
            if unassigned_entity_ids:
                entities_by_area["unassigned"] = {"name": "Unassigned Entities", "entities": []}
                for entity_id in unassigned_entity_ids:
                    entity = await entity_reg.async_get(entity_id)
                    if entity:
                         entities_by_area["unassigned"]["entities"].append({
                            "entity_id": entity.entity_id,
                            "name": entity.name or entity.original_name,
                        })

            return web.json_response(entities_by_area)

        return web.json_response({"error": "Invalid config type"}, status=400)

    async def post(self, request: web.Request) -> web.Response:
        """Handle POST requests to save configuration."""
        try:
            data = await request.json()
            config_type = data.get("type")
            config_payload = data.get("config")

            if not config_type or config_payload is None:
                return web.json_response({"error": "'type' and 'config' keys are required."}, status=400)

            current_options = dict(self._entry.options)
            
            if config_type == "house":
                current_options["house_config"] = config_payload
            elif config_type == "entity_usage_stats":
                current_options.setdefault("house_config", {})["entity_usage_stats"] = config_payload
            elif config_type == "integrations":
                current_options["integrations_config"] = config_payload
            else:
                return web.json_response({"error": f"Invalid config type: {config_type}"}, status=400)

            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
            )
            return web.json_response({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving configuration: %s", e)
            return web.json_response({"status": "error", "message": str(e)}, status=500)
            
