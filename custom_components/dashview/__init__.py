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
    device_registry as dr,
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

    await _sync_config_from_ha_registries(hass, entry)
    hass.http.register_view(DashViewConfigView(hass, entry))
    await async_setup_services(hass)

    panel_name = "dashview"
    www_path = os.path.join(os.path.dirname(__file__), "www")
    await hass.http.async_register_static_paths([
        StaticPathConfig(f"/local/{panel_name}", www_path, cache_headers=False)
    ])

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
    """Syncs the house_config from HA's floor and area registries."""
    _LOGGER.debug("Syncing DashView configuration with HA registries.")
    floor_registry = fr.async_get(hass)
    area_registry = ar.async_get(hass)
    house_config = entry.options.get("house_config", {})

    house_config.setdefault("floors", {})
    house_config.setdefault("rooms", {})
    house_config.setdefault("floor_layouts", {})
    house_config.setdefault("other_entities", [])

    for floor in floor_registry.floors.values():
        if floor.floor_id not in house_config["floors"]:
            _LOGGER.info(f"New floor '{floor.name}' found, adding to DashView config.")
            house_config["floors"][floor.floor_id] = {}
        
        floor_data = house_config["floors"][floor.floor_id]
        
        # Update the name and icon from HA's registry
        floor_data.update({
            "friendly_name": floor.name,
            "icon": floor.icon or "mdi:home",
        })
        
        # Only set the level from HA if it's not already set by the user in DashView.
        # This preserves the custom order.
        if "level" not in floor_data:
            floor_data["level"] = floor.level
        
        if floor.floor_id not in house_config["floor_layouts"]:
            _LOGGER.info(f"Generating default layout for new floor '{floor.name}'.")
            house_config["floor_layouts"][floor.floor_id] = [
                {"grid_area": "r1-big", "type": "room_swipe_card", "entity_id": None},
                {"grid_area": "r2-big", "type": "room_swipe_card", "entity_id": None},
                {"grid_area": "r1-small-1", "type": "auto", "entity_id": None},
                {"grid_area": "r1-small-2", "type": "auto", "entity_id": None},
                {"grid_area": "r2-small-3", "type": "auto", "entity_id": None},
                {"grid_area": "r2-small-4", "type": "auto", "entity_id": None},
            ]

    for area in area_registry.areas.values():
        if area.id not in house_config["rooms"]:
            _LOGGER.info(f"New area '{area.name}' found, adding to DashView config.")
            house_config["rooms"][area.id] = {}

        house_config["rooms"][area.id].update({
            "friendly_name": area.name,
            "icon": area.icon or "mdi:home-outline",
            "floor": area.floor_id,
        })
        for key in ["lights", "covers", "media_players", "header_entities"]:
            house_config["rooms"][area.id].setdefault(key, [])

    # custom_components/dashview/__init__.py

    current_options = dict(entry.options)
    current_options["house_config"] = house_config
    hass.config_entries.async_update_entry(entry, options=current_options)
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
        self._hass = hass
        self._entry = entry

    async def get(self, request: web.Request) -> web.Response:
        """Handle GET requests to fetch configuration or entities."""
        config_type = request.query.get('type')
        
        if config_type == 'house':
            config = self._entry.options.get('house_config', {})
            return web.json_response(config)
        elif config_type == 'available_media_players':
            all_media_players = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.attributes.get("friendly_name", entity.entity_id),
                }
                for entity in self._hass.states.async_all()
                if entity.entity_id.startswith("media_player.")
            ]
            all_media_players.sort(key=lambda x: x["friendly_name"])
            return web.json_response(all_media_players)
        elif config_type == 'dwd_entities':
            entity_reg = er.async_get(self._hass)
            dwd_entities = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.name or entity.original_name or entity.entity_id,
                }
                for entity in entity_reg.entities.values()
                if entity.platform == "dwd_weather_warnings"
            ]
            dwd_entities.sort(key=lambda x: x["friendly_name"])
            return web.json_response(dwd_entities)
        elif config_type == 'entities_by_room':
            return await self._get_entities_by_room(request)
        elif config_type == 'weather_entity':
            house_config = self._entry.options.get('house_config', {})
            weather_entity = house_config.get('weather_entity', 'weather.forecast_home')
            return web.json_response({'weather_entity': weather_entity})
        elif config_type == 'integrations':
            config = self._entry.options.get('integrations_config', {})
            return web.json_response(config)
        elif config_type == 'available_calendars':
            all_calendars = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.attributes.get("friendly_name", entity.entity_id),
                }
                for entity in self._hass.states.async_all()
                if entity.entity_id.startswith("calendar.")
            ]
            all_calendars.sort(key=lambda x: x["friendly_name"])
            return web.json_response(all_calendars)
        elif config_type == 'custom_cards':
            house_config = self._entry.options.get('house_config', {})
            custom_cards = house_config.get('custom_cards', {})
            return web.json_response(custom_cards)
        elif config_type == 'calendar_events':
            return await self._get_calendar_events(request)
        elif config_type == 'calendar_config':
            house_config = self._entry.options.get('house_config', {})
            linked_calendars = house_config.get('linked_calendars', [])
            calendar_colors = house_config.get('calendar_colors', {})
            calendar_display_range = house_config.get('calendar_display_range', 14)
            return web.json_response({
                'linked_calendars': linked_calendars,
                'calendar_colors': calendar_colors,
                'calendar_display_range': calendar_display_range
            })
        elif config_type == 'available_persons':
            all_persons = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.attributes.get("friendly_name", entity.entity_id),
                }
                for entity in self._hass.states.async_all()
                if entity.entity_id.startswith("person.")
            ]
            all_persons.sort(key=lambda x: x["friendly_name"])
            return web.json_response(all_persons)
        elif config_type == 'available_device_trackers':
            all_device_trackers = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.attributes.get("friendly_name", entity.entity_id),
                }
                for entity in self._hass.states.async_all()
                if entity.entity_id.startswith("device_tracker.")
            ]
            all_device_trackers.sort(key=lambda x: x["friendly_name"])
            return web.json_response(all_device_trackers)
        elif config_type == 'available_sensors':
            all_sensors = [
                {
                    "entity_id": entity.entity_id,
                    "friendly_name": entity.attributes.get("friendly_name", entity.entity_id),
                    "device_class": entity.attributes.get("device_class"),
                    "unit_of_measurement": entity.attributes.get("unit_of_measurement"),
                }
                for entity in self._hass.states.async_all()
                if entity.entity_id.startswith("sensor.")
            ]
            all_sensors.sort(key=lambda x: x["friendly_name"])
            return web.json_response(all_sensors)
        elif config_type == 'person_config':
            house_config = self._entry.options.get('house_config', {})
            person_config = house_config.get('persons', {})
            return web.json_response({'persons': person_config})

        return web.json_response({"error": f"Invalid or unhandled config type: {config_type}"}, status=400)

    async def _get_entities_by_room(self, request: web.Request) -> web.Response:
        """A robust method to get entities filtered by domain or label, grouped by room."""
        label_param = request.query.get('label')
        domain_param = request.query.get('domain')

        if not label_param and not domain_param:
            return web.json_response({"error": "A 'label' or 'domain' parameter is required."}, status=400)

        entity_reg = er.async_get(self._hass)
        area_reg = ar.async_get(self._hass)
        label_reg = lr.async_get(self._hass)
        device_reg = dr.async_get(self._hass)
        
        target_label_id = None
        if label_param:
            all_labels = label_reg.async_list_labels()
            label_entry = next((l for l in all_labels if l.name.lower() == label_param.lower()), None)
            if label_entry:
                target_label_id = label_entry.label_id
            else:
                _LOGGER.warning(f"Label '{label_param}' not found in registry.")
                return web.json_response({})

        entities_by_area = {}

        for entity_id, entity_entry in entity_reg.entities.items():
            area_id = entity_entry.area_id

            # If the entity itself has no area, check its device.
            # This handles cases where area is assigned to the device, not the entity.
            if not area_id and entity_entry.device_id:
                device = device_reg.async_get(entity_entry.device_id)
                if device and device.area_id:
                    area_id = device.area_id
            
            if not area_id:
                continue

            domain_matches = domain_param and entity_entry.domain == domain_param
            label_matches = target_label_id and target_label_id in entity_entry.labels
            
            if domain_matches or label_matches:
                area = area_reg.async_get_area(area_id)
                if not area:
                    continue
                
                if area.id not in entities_by_area:
                    entities_by_area[area.id] = {"name": area.name, "entities": []}
                
                if entity_entry.domain != 'automation':
                    entities_by_area[area.id]["entities"].append({
                        "entity_id": entity_entry.entity_id,
                        "name": entity_entry.name or entity_entry.original_name or entity_entry.entity_id,
                    })

        for area_data in entities_by_area.values():
            area_data["entities"].sort(key=lambda x: x["name"])

        return web.json_response(entities_by_area)

    async def _get_calendar_events(self, request: web.Request) -> web.Response:
        """Get calendar events for specified entities."""
        entity_ids = request.query.get('entity_ids', '').split(',')
        start_date = request.query.get('start_date')
        end_date = request.query.get('end_date')
        
        if not entity_ids or not entity_ids[0]:
            return web.json_response({"error": "entity_ids parameter is required"}, status=400)
        
        if not start_date or not end_date:
            return web.json_response({"error": "start_date and end_date parameters are required"}, status=400)
        
        all_events = []
        
        for entity_id in entity_ids:
            entity_id = entity_id.strip()
            if not entity_id:
                continue
                
            try:
                # Call the calendar.get_events service
                service_data = {
                    "entity_id": entity_id,
                    "start_date_time": start_date,
                    "end_date_time": end_date,
                }
                
                response = await self._hass.services.async_call(
                    "calendar",
                    "get_events",
                    service_data,
                    blocking=True,
                    return_response=True
                )
                
                # Extract events from the response
                if entity_id in response:
                    events = response[entity_id].get("events", [])
                    for event in events:
                        event["calendar_entity_id"] = entity_id
                        all_events.append(event)
                        
            except Exception as e:
                _LOGGER.error(f"Error fetching events for {entity_id}: {e}")
                continue
        
        # Sort events by start time
        all_events.sort(key=lambda x: x.get("start", ""))
        
        return web.json_response({"events": all_events})

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
                current_options.setdefault("house_config", {}).setdefault("entity_usage_stats", {}).update(config_payload)
            elif config_type == "integrations":
                current_options.setdefault("integrations_config", {}).update(config_payload)
            elif config_type == "media_presets":
                current_options.setdefault("house_config", {})["media_presets"] = config_payload
            elif config_type == "scenes":
                current_options.setdefault("house_config", {})["scenes"] = config_payload
            elif config_type == "calendar":
                current_options.setdefault("house_config", {})["linked_calendars"] = config_payload
            elif config_type == "calendar_full":
                # Handle full calendar configuration including display range and colors
                house_config = current_options.setdefault("house_config", {})
                house_config["linked_calendars"] = config_payload.get("linked_calendars", [])
                house_config["calendar_colors"] = config_payload.get("calendar_colors", {})
                house_config["calendar_display_range"] = config_payload.get("calendar_display_range", 14)
            elif config_type == "persons":
                current_options.setdefault("house_config", {})["persons"] = config_payload
            elif config_type == "custom_cards":
                current_options.setdefault("house_config", {})["custom_cards"] = config_payload
            else:
                return web.json_response({"error": f"Invalid config type: {config_type}"}, status=400)

            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
            )
            return web.json_response({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving configuration: %s", e)
            return web.json_response({"status": "error", "message": str(e)}, status=500)
