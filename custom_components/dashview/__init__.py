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
    house_config.setdefault("main_dashboard_sections", {
        "info-card": {"visible": True, "order": 1},
        "train-departures-section": {"visible": True, "order": 2},
        "notifications-container": {"visible": True, "order": 3},
        "dwd-warning-card-container": {"visible": True, "order": 4},
        "scenes-container": {"visible": True, "order": 5},
        "media-header-buttons-container": {"visible": True, "order": 6},
        "floor-tabs-container": {"visible": True, "order": 7}
    })
    house_config.setdefault("notifications", {
        "enabled": True,
        "max_persistent": 50,
        "default_duration": 300,
        "auto_dismiss": True,
        "sound_enabled": False,
        "persistent_notifications": [],
        "entity_triggers": []
    })

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
        elif config_type == 'config_health':
            return await self._get_configuration_health_check()
        elif config_type == 'main_dashboard_sections':
            house_config = self._entry.options.get('house_config', {})
            sections_config = house_config.get('main_dashboard_sections', {})
            return web.json_response(sections_config)
        elif config_type == 'trend_analysis':
            house_config = self._entry.options.get('house_config', {})
            trend_config = house_config.get('trend_analysis', {
                'enabled': True,
                'sensitivity': 'medium',
                'short_term_hours': 2,
                'long_term_hours': 24,
                'baseline_hours': 168,
                'show_patterns': True,
                'show_indicators': True
            })
            return web.json_response(trend_config)
        elif config_type == 'notifications':
            house_config = self._entry.options.get('house_config', {})
            notifications_config = house_config.get('notifications', {
                'enabled': True,
                'max_persistent': 50,
                'default_duration': 300,  # 5 minutes
                'auto_dismiss': True,
                'sound_enabled': False,
                'persistent_notifications': [],
                'entity_triggers': []
            })
            return web.json_response(notifications_config)

        return web.json_response({"error": f"Invalid or unhandled config type: {config_type}"}, status=400)

    async def _get_entities_by_room(self, request: web.Request) -> web.Response:
        """Enhanced method to get entities filtered by domain or label, grouped by room with configuration status."""
        label_param = request.query.get('label')
        domain_param = request.query.get('domain')
        room_id = request.query.get('room_id')  # For detailed room configuration

        if not label_param and not domain_param:
            return web.json_response({"error": "A 'label' or 'domain' parameter is required."}, status=400)

        entity_reg = er.async_get(self._hass)
        area_reg = ar.async_get(self._hass)
        label_reg = lr.async_get(self._hass)
        device_reg = dr.async_get(self._hass)
        
        # Get current house configuration
        house_config = self._entry.options.get('house_config', {})
        rooms = house_config.get('rooms', {})
        
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
            if not area_id and entity_entry.device_id:
                device = device_reg.async_get(entity_entry.device_id)
                if device and device.area_id:
                    area_id = device.area_id
            
            if not area_id:
                continue

            # Skip if room_id is specified and doesn't match
            if room_id and area_id != room_id:
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
                    # Determine entity configuration status
                    is_configured = self._is_entity_configured_in_room(entity_id, area.id, rooms, domain_param, label_param)
                    is_ignored = self._is_entity_ignored_in_room(entity_id, area.id, rooms)
                    is_newly_discovered = self._is_entity_newly_discovered(entity_id, area.id, rooms)
                    
                    entities_by_area[area.id]["entities"].append({
                        "entity_id": entity_entry.entity_id,
                        "name": entity_entry.name or entity_entry.original_name or entity_entry.entity_id,
                        "domain": entity_entry.domain,
                        "labels": list(entity_entry.labels),
                        "is_configured_in_dashview": is_configured,
                        "is_ignored_in_dashview": is_ignored,
                        "is_newly_discovered_and_unconfirmed": is_newly_discovered
                    })

        for area_data in entities_by_area.values():
            area_data["entities"].sort(key=lambda x: x["name"])

        return web.json_response(entities_by_area)

    def _is_entity_configured_in_room(self, entity_id: str, area_id: str, rooms: dict, domain_param: str = None, label_param: str = None) -> bool:
        """Check if entity is configured in the specified room."""
        if area_id not in rooms:
            return False
        
        room_config = rooms[area_id]
        
        # Check different entity types based on domain/label
        if domain_param == 'light':
            return entity_id in room_config.get('lights', [])
        elif domain_param == 'cover':
            return entity_id in room_config.get('covers', [])
        elif domain_param == 'media_player':
            return entity_id in room_config.get('media_players', [])
        elif label_param:
            # Check in header_entities for labeled sensors
            header_entities = room_config.get('header_entities', [])
            return any(he.get('entity') == entity_id for he in header_entities)
        
        return False

    def _is_entity_ignored_in_room(self, entity_id: str, area_id: str, rooms: dict) -> bool:
        """Check if entity is explicitly ignored in the specified room."""
        if area_id not in rooms:
            return False
        
        ignored_entities = rooms[area_id].get('ignored_entities', [])
        return entity_id in ignored_entities

    def _is_entity_newly_discovered(self, entity_id: str, area_id: str, rooms: dict) -> bool:
        """Check if entity is newly discovered and unconfirmed."""
        # An entity is newly discovered if it's not configured and not ignored
        is_configured = self._is_entity_configured_in_room(entity_id, area_id, rooms)
        is_ignored = self._is_entity_ignored_in_room(entity_id, area_id, rooms)
        
        # Also check if the room has a confirmation flag
        if area_id in rooms:
            room_config = rooms[area_id]
            # If the room has been confirmed recently, new entities since then are unconfirmed
            last_confirmed = room_config.get('last_confirmed_timestamp', 0)
            # For now, consider any non-configured, non-ignored entity as newly discovered
            return not is_configured and not is_ignored
        
        return not is_configured and not is_ignored

    async def _handle_entity_status_update(self, payload: dict) -> web.Response:
        """Handle granular entity status updates (assign/unassign/ignore/unignore)."""
        try:
            room_id = payload.get("room_id")
            entity_id = payload.get("entity_id")
            status_type = payload.get("status_type")
            entity_domain = payload.get("entity_domain")
            entity_label = payload.get("entity_label")

            if not all([room_id, entity_id, status_type]):
                return web.json_response({"error": "room_id, entity_id, and status_type are required."}, status=400)

            if status_type not in ["assigned", "unassigned", "ignored", "unignored"]:
                return web.json_response({"error": "status_type must be 'assigned', 'unassigned', 'ignored', or 'unignored'."}, status=400)

            current_options = dict(self._entry.options)
            house_config = current_options.setdefault("house_config", {})
            rooms = house_config.setdefault("rooms", {})
            
            # Initialize room if it doesn't exist
            if room_id not in rooms:
                rooms[room_id] = {
                    "friendly_name": room_id.replace("_", " ").title(),
                    "lights": [],
                    "covers": [],
                    "media_players": [],
                    "header_entities": [],
                    "ignored_entities": []
                }

            room_config = rooms[room_id]
            ignored_entities = room_config.setdefault("ignored_entities", [])

            if status_type == "assigned":
                # Remove from ignored list if present
                if entity_id in ignored_entities:
                    ignored_entities.remove(entity_id)
                
                # Add to appropriate entity list based on domain
                if entity_domain == "light":
                    if entity_id not in room_config.setdefault("lights", []):
                        room_config["lights"].append(entity_id)
                elif entity_domain == "cover":
                    if entity_id not in room_config.setdefault("covers", []):
                        room_config["covers"].append(entity_id)
                elif entity_domain == "media_player":
                    if entity_id not in room_config.setdefault("media_players", []):
                        room_config["media_players"].append(entity_id)
                elif entity_label:
                    # Add to header_entities for labeled sensors
                    header_entities = room_config.setdefault("header_entities", [])
                    if not any(he.get("entity") == entity_id for he in header_entities):
                        header_entities.append({
                            "entity": entity_id,
                            "entity_type": entity_label.lower()
                        })

            elif status_type == "unassigned":
                # Remove from appropriate entity list
                if entity_domain == "light" and entity_id in room_config.get("lights", []):
                    room_config["lights"].remove(entity_id)
                elif entity_domain == "cover" and entity_id in room_config.get("covers", []):
                    room_config["covers"].remove(entity_id)
                elif entity_domain == "media_player" and entity_id in room_config.get("media_players", []):
                    room_config["media_players"].remove(entity_id)
                elif entity_label:
                    header_entities = room_config.get("header_entities", [])
                    room_config["header_entities"] = [he for he in header_entities if he.get("entity") != entity_id]

            elif status_type == "ignored":
                # Remove from all entity lists first
                if entity_domain == "light" and entity_id in room_config.get("lights", []):
                    room_config["lights"].remove(entity_id)
                elif entity_domain == "cover" and entity_id in room_config.get("covers", []):
                    room_config["covers"].remove(entity_id)
                elif entity_domain == "media_player" and entity_id in room_config.get("media_players", []):
                    room_config["media_players"].remove(entity_id)
                elif entity_label:
                    header_entities = room_config.get("header_entities", [])
                    room_config["header_entities"] = [he for he in header_entities if he.get("entity") != entity_id]
                
                # Add to ignored list
                if entity_id not in ignored_entities:
                    ignored_entities.append(entity_id)

            elif status_type == "unignored":
                # Remove from ignored list
                if entity_id in ignored_entities:
                    ignored_entities.remove(entity_id)

            # Save the updated configuration
            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
            )

            return web.json_response({"status": "success", "message": f"Entity {entity_id} {status_type} successfully"})

        except Exception as e:
            _LOGGER.error("[DashView] Error updating entity status: %s", e)
            return web.json_response({"status": "error", "message": str(e)}, status=500)

    async def _handle_room_confirmation(self, payload: dict) -> web.Response:
        """Handle room setup confirmation to mark newly discovered entities as acknowledged."""
        try:
            room_id = payload.get("room_id")

            if not room_id:
                return web.json_response({"error": "room_id is required."}, status=400)

            current_options = dict(self._entry.options)
            house_config = current_options.setdefault("house_config", {})
            rooms = house_config.setdefault("rooms", {})

            if room_id not in rooms:
                return web.json_response({"error": f"Room {room_id} not found."}, status=404)

            # Update the room's confirmation timestamp
            import time
            rooms[room_id]["last_confirmed_timestamp"] = int(time.time())
            rooms[room_id]["has_unconfirmed_entities"] = False

            # Save the updated configuration
            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
            )

            return web.json_response({"status": "success", "message": f"Room {room_id} setup confirmed successfully"})

        except Exception as e:
            _LOGGER.error("[DashView] Error confirming room setup: %s", e)
            return web.json_response({"status": "error", "message": str(e)}, status=500)

    async def _get_calendar_events(self, request: web.Request) -> web.Response:
        """Get calendar events for specified entities."""
        entity_ids = request.query.get('entity_ids', '').split(',')
        start_date = request.query.get('start_date')
        end_date = request.query.get('end_date')
        
        if not entity_ids or not entity_ids[0]:
            return web.json_response({"error": "entity_ids parameter is required", "error_type": "missing_parameters"}, status=400)
        
        if not start_date or not end_date:
            return web.json_response({"error": "start_date and end_date parameters are required", "error_type": "missing_parameters"}, status=400)
        
        all_events = []
        errors = []
        
        for entity_id in entity_ids:
            entity_id = entity_id.strip()
            if not entity_id:
                continue
                
            # Validate that the calendar entity exists
            if not self._hass.states.get(entity_id):
                error_msg = f"Calendar entity '{entity_id}' not found in Home Assistant"
                _LOGGER.warning(f"[DashView] Calendar: {error_msg}")
                errors.append({
                    "entity_id": entity_id,
                    "error": error_msg,
                    "error_type": "entity_not_found"
                })
                continue
                
            try:
                # Call the calendar.get_events service
                service_data = {
                    "entity_id": entity_id,
                    "start_date_time": start_date,
                    "end_date_time": end_date,
                }
                
                _LOGGER.debug(f"[DashView] Calendar: Fetching events for {entity_id} from {start_date} to {end_date}")
                
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
                    _LOGGER.debug(f"[DashView] Calendar: Found {len(events)} events for {entity_id}")
                    for event in events:
                        event["calendar_entity_id"] = entity_id
                        all_events.append(event)
                else:
                    _LOGGER.warning(f"[DashView] Calendar: No response data for entity {entity_id}")
                        
            except Exception as e:
                error_msg = f"Error fetching events for {entity_id}: {str(e)}"
                _LOGGER.error(f"[DashView] Calendar: {error_msg}")
                errors.append({
                    "entity_id": entity_id,
                    "error": error_msg,
                    "error_type": "service_call_failed"
                })
                continue
        
        # Sort events by start time
        all_events.sort(key=lambda x: x.get("start", ""))
        
        response_data = {
            "events": all_events,
            "errors": errors,
            "total_events": len(all_events),
            "entity_count": len([e for e in entity_ids if e.strip()])
        }
        
        return web.json_response(response_data)

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
            elif config_type == "main_dashboard_sections":
                current_options.setdefault("house_config", {})["main_dashboard_sections"] = config_payload
            elif config_type == "trend_analysis":
                current_options.setdefault("house_config", {})["trend_analysis"] = config_payload
            elif config_type == "notifications":
                current_options.setdefault("house_config", {})["notifications"] = config_payload
            elif config_type == "config_health_fix":
                return await self._apply_configuration_fix(config_payload)
            elif config_type == "entity_status_update":
                return await self._handle_entity_status_update(config_payload)
            elif config_type == "confirm_room_setup":
                return await self._handle_room_confirmation(config_payload)
            else:
                return web.json_response({"error": f"Invalid config type: {config_type}"}, status=400)

            self._hass.config_entries.async_update_entry(
                self._entry, options=current_options
            )
            return web.json_response({"status": "success"})
        except Exception as e:
            _LOGGER.error("[DashView] Error saving configuration: %s", e)
            return web.json_response({"status": "error", "message": str(e)}, status=500)

    async def _get_configuration_health_check(self) -> web.Response:
        """Perform comprehensive configuration health check."""
        try:
            issues = []
            house_config = self._entry.options.get('house_config', {})
            
            # Check room consistency
            issues.extend(await self._check_room_consistency(house_config))
            
            # Check entity references
            issues.extend(await self._check_entity_references(house_config))
            
            # Check floor consistency
            issues.extend(await self._check_floor_consistency(house_config))
            
            # Check scene consistency
            issues.extend(await self._check_scene_consistency(house_config))
            
            # Check weather configuration
            issues.extend(await self._check_weather_configuration())
            
            # Check integration settings
            issues.extend(await self._check_integration_settings())
            
            health_report = {
                "totalIssues": len(issues),
                "errors": len([i for i in issues if i["type"] == "error"]),
                "warnings": len([i for i in issues if i["type"] == "warning"]),
                "issues": issues
            }
            
            return web.json_response(health_report)
            
        except Exception as e:
            _LOGGER.error("[DashView] Health check error: %s", e)
            return web.json_response({
                "totalIssues": 1,
                "errors": 1,
                "warnings": 0,
                "issues": [{
                    "id": "health_check_error",
                    "type": "error",
                    "category": "system",
                    "title": "Fehler bei der Konsistenzprüfung",
                    "description": "Ein Fehler ist bei der Überprüfung der Konfiguration aufgetreten.",
                    "fixable": False
                }]
            }, status=500)

    async def _check_room_consistency(self, house_config: dict) -> list:
        """Check for rooms not assigned to floors."""
        issues = []
        rooms = house_config.get('rooms', {})
        floors = house_config.get('floors', {})

        for room_key, room in rooms.items():
            assigned_to_floor = any(
                room_key in floor.get('rooms', [])
                for floor in floors.values()
            )
            
            if not assigned_to_floor:
                issues.append({
                    "id": f"unassigned_room_{room_key}",
                    "type": "warning",
                    "category": "rooms",
                    "title": f"Raum \"{room.get('name', room_key)}\" nicht zugewiesen",
                    "description": f"Der Raum \"{room.get('name', room_key)}\" ({room_key}) ist keiner Etage zugeordnet.",
                    "fixable": True,
                    "fixAction": "assign_room_to_floor",
                    "fixData": {"roomKey": room_key, "roomName": room.get('name', room_key)}
                })
        
        return issues

    async def _check_entity_references(self, house_config: dict) -> list:
        """Check for missing entity references."""
        issues = []
        rooms = house_config.get('rooms', {})
        
        entity_fields = [
            'room_lights', 'room_sensors', 'room_temperature_sensor',
            'room_humidity_sensor', 'room_covers', 'room_media_players'
        ]

        for room_key, room in rooms.items():
            for field in entity_fields:
                entities = room.get(field, [])
                entity_list = entities if isinstance(entities, list) else [entities] if entities else []
                
                for entity_id in entity_list:
                    if entity_id and self._hass.states.get(entity_id) is None:
                        issues.append({
                            "id": f"missing_entity_{room_key}_{field}_{entity_id}",
                            "type": "error",
                            "category": "entities",
                            "title": f"Entity nicht gefunden: {entity_id}",
                            "description": f"Entity \"{entity_id}\" in Raum \"{room.get('name', room_key)}\" ({field}) existiert nicht in Home Assistant.",
                            "fixable": True,
                            "fixAction": "remove_missing_entity",
                            "fixData": {
                                "roomKey": room_key,
                                "field": field,
                                "entityId": entity_id,
                                "roomName": room.get('name', room_key)
                            }
                        })
        
        return issues

    async def _check_floor_consistency(self, house_config: dict) -> list:
        """Check floor consistency."""
        issues = []
        floors = house_config.get('floors', {})
        rooms = house_config.get('rooms', {})

        for floor_key, floor in floors.items():
            floor_rooms = floor.get('rooms', [])
            
            # Check for empty floors
            if not floor_rooms:
                issues.append({
                    "id": f"empty_floor_{floor_key}",
                    "type": "warning",
                    "category": "floors",
                    "title": f"Leere Etage: {floor.get('name', floor_key)}",
                    "description": f"Die Etage \"{floor.get('name', floor_key)}\" ({floor_key}) hat keine zugewiesenen Räume.",
                    "fixable": True,
                    "fixAction": "remove_empty_floor",
                    "fixData": {"floorKey": floor_key, "floorName": floor.get('name', floor_key)}
                })
            
            # Check for references to non-existent rooms
            for room_key in floor_rooms:
                if room_key not in rooms:
                    issues.append({
                        "id": f"missing_room_ref_{floor_key}_{room_key}",
                        "type": "error",
                        "category": "floors",
                        "title": f"Ungültige Raumreferenz: {room_key}",
                        "description": f"Etage \"{floor.get('name', floor_key)}\" referenziert nicht existierenden Raum \"{room_key}\".",
                        "fixable": True,
                        "fixAction": "remove_missing_room_ref",
                        "fixData": {"floorKey": floor_key, "roomKey": room_key, "floorName": floor.get('name', floor_key)}
                    })
        
        return issues

    async def _check_scene_consistency(self, house_config: dict) -> list:
        """Check scene consistency."""
        issues = []
        scenes = house_config.get('scenes', {})

        for scene_key, scene in scenes.items():
            entities = scene.get('entities', {})
            
            for entity_id in entities.keys():
                if self._hass.states.get(entity_id) is None:
                    issues.append({
                        "id": f"scene_missing_entity_{scene_key}_{entity_id}",
                        "type": "error",
                        "category": "scenes",
                        "title": f"Scene Entity nicht gefunden: {entity_id}",
                        "description": f"Scene \"{scene.get('name', scene_key)}\" referenziert nicht existierende Entity \"{entity_id}\".",
                        "fixable": True,
                        "fixAction": "remove_scene_entity",
                        "fixData": {"sceneKey": scene_key, "entityId": entity_id, "sceneName": scene.get('name', scene_key)}
                    })
        
        return issues

    async def _check_weather_configuration(self) -> list:
        """Check weather configuration."""
        issues = []
        weather_entity = self._entry.options.get('weather_entity')
        
        if weather_entity and self._hass.states.get(weather_entity) is None:
            issues.append({
                "id": "missing_weather_entity",
                "type": "error",
                "category": "weather",
                "title": "Wetter-Entity nicht gefunden",
                "description": f"Die konfigurierte Wetter-Entity \"{weather_entity}\" existiert nicht in Home Assistant.",
                "fixable": True,
                "fixAction": "clear_weather_entity",
                "fixData": {"entityId": weather_entity}
            })
        
        return issues

    async def _check_integration_settings(self) -> list:
        """Check integration settings."""
        issues = []
        integrations = self._entry.options.get('integrations_config', {})
        
        if 'dwd' in integrations and 'weather_entity' in integrations['dwd']:
            dwd_entity = integrations['dwd']['weather_entity']
            if self._hass.states.get(dwd_entity) is None:
                issues.append({
                    "id": "missing_dwd_entity",
                    "type": "warning",
                    "category": "integrations",
                    "title": "DWD Wetter-Entity nicht gefunden",
                    "description": f"Die DWD Wetter-Entity \"{dwd_entity}\" existiert nicht in Home Assistant.",
                    "fixable": True,
                    "fixAction": "clear_dwd_entity",
                    "fixData": {"entityId": dwd_entity}
                })
        
        return issues

    async def _apply_configuration_fix(self, fix_data: dict) -> web.Response:
        """Apply automated fix for configuration issues."""
        try:
            fix_action = fix_data.get('fixAction')
            data = fix_data.get('fixData', {})
            
            if fix_action == 'remove_missing_entity':
                return await self._fix_remove_missing_entity(data)
            elif fix_action == 'remove_missing_room_ref':
                return await self._fix_remove_missing_room_ref(data)
            elif fix_action == 'remove_empty_floor':
                return await self._fix_remove_empty_floor(data)
            elif fix_action == 'remove_scene_entity':
                return await self._fix_remove_scene_entity(data)
            elif fix_action == 'clear_weather_entity':
                return await self._fix_clear_weather_entity(data)
            elif fix_action == 'clear_dwd_entity':
                return await self._fix_clear_dwd_entity(data)
            else:
                return web.json_response({"success": False, "message": "Unbekannte Fix-Aktion"}, status=400)
                
        except Exception as e:
            _LOGGER.error("[DashView] Fix application error: %s", e)
            return web.json_response({"success": False, "message": "Fehler beim Anwenden der Korrektur"}, status=500)

    async def _fix_remove_missing_entity(self, fix_data: dict) -> web.Response:
        """Remove missing entity from room configuration."""
        current_options = dict(self._entry.options)
        house_config = current_options.get('house_config', {})
        
        room_key = fix_data.get('roomKey')
        field = fix_data.get('field')
        entity_id = fix_data.get('entityId')
        
        if room_key in house_config.get('rooms', {}):
            room = house_config['rooms'][room_key]
            if field in room:
                if isinstance(room[field], list):
                    room[field] = [e for e in room[field] if e != entity_id]
                elif room[field] == entity_id:
                    del room[field]
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": f"Entity \"{entity_id}\" entfernt"})

    async def _fix_remove_missing_room_ref(self, fix_data: dict) -> web.Response:
        """Remove missing room reference from floor."""
        current_options = dict(self._entry.options)
        house_config = current_options.get('house_config', {})
        
        floor_key = fix_data.get('floorKey')
        room_key = fix_data.get('roomKey')
        
        if floor_key in house_config.get('floors', {}):
            floor = house_config['floors'][floor_key]
            if 'rooms' in floor and room_key in floor['rooms']:
                floor['rooms'].remove(room_key)
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": f"Raumreferenz \"{room_key}\" entfernt"})

    async def _fix_remove_empty_floor(self, fix_data: dict) -> web.Response:
        """Remove empty floor."""
        current_options = dict(self._entry.options)
        house_config = current_options.get('house_config', {})
        
        floor_key = fix_data.get('floorKey')
        floor_name = fix_data.get('floorName')
        
        if floor_key in house_config.get('floors', {}):
            del house_config['floors'][floor_key]
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": f"Leere Etage \"{floor_name}\" entfernt"})

    async def _fix_remove_scene_entity(self, fix_data: dict) -> web.Response:
        """Remove entity from scene."""
        current_options = dict(self._entry.options)
        house_config = current_options.get('house_config', {})
        
        scene_key = fix_data.get('sceneKey')
        entity_id = fix_data.get('entityId')
        
        if scene_key in house_config.get('scenes', {}):
            scene = house_config['scenes'][scene_key]
            if 'entities' in scene and entity_id in scene['entities']:
                del scene['entities'][entity_id]
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": f"Entity \"{entity_id}\" aus Scene entfernt"})

    async def _fix_clear_weather_entity(self, fix_data: dict) -> web.Response:
        """Clear weather entity configuration."""
        current_options = dict(self._entry.options)
        current_options['weather_entity'] = None
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": "Wetter-Entity Konfiguration gelöscht"})

    async def _fix_clear_dwd_entity(self, fix_data: dict) -> web.Response:
        """Clear DWD weather entity configuration."""
        current_options = dict(self._entry.options)
        integrations = current_options.get('integrations_config', {})
        
        if 'dwd' in integrations and 'weather_entity' in integrations['dwd']:
            del integrations['dwd']['weather_entity']
        
        self._hass.config_entries.async_update_entry(self._entry, options=current_options)
        return web.json_response({"success": True, "message": "DWD Wetter-Entity Konfiguration gelöscht"})
