"""API views for DashView admin interface."""
import json
import logging
from aiohttp import web
from aiohttp.web import Request, Response
from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.json import JSONEncoder

from .const import DOMAIN, ENTITY_TYPES
from .data_store import DashViewDataStore

_LOGGER = logging.getLogger(__name__)


class DashViewAdminAPIView(HomeAssistantView):
    """API view for DashView admin operations."""

    url = "/api/dashview/admin"
    name = "api:dashview:admin"
    requires_auth = True

    def __init__(self, data_store: DashViewDataStore):
        """Initialize the API view."""
        self.data_store = data_store

    async def get(self, request: Request) -> Response:
        """Handle GET requests."""
        action = request.query.get("action")
        
        if action == "get_config":
            return self._json_response({
                "rooms": self.data_store.rooms,
                "entities": self.data_store.entities,
                "css_config": self.data_store.css_config,
                "entity_types": ENTITY_TYPES
            })
        
        elif action == "get_ha_entities":
            # Get all Home Assistant entities
            hass = request.app["hass"]
            ha_entities = []
            
            for entity_id in hass.states.async_entity_ids():
                state = hass.states.get(entity_id)
                if state:
                    domain = entity_id.split(".")[0]
                    entity_info = {
                        "entity_id": entity_id,
                        "name": state.attributes.get("friendly_name", entity_id),
                        "domain": domain,
                        "state": state.state,
                        "icon": state.attributes.get("icon"),
                        "device_class": state.attributes.get("device_class"),
                        "unit_of_measurement": state.attributes.get("unit_of_measurement")
                    }
                    ha_entities.append(entity_info)
            
            return self._json_response({"entities": ha_entities})
        
        return self._json_response({"error": "Invalid action"}, status=400)

    async def post(self, request: Request) -> Response:
        """Handle POST requests."""
        try:
            data = await request.json()
            action = data.get("action")

            if action == "update_room":
                await self.data_store.async_update_room(
                    data["room_id"], 
                    data["room_data"]
                )
                return self._json_response({"success": True})

            elif action == "delete_room":
                await self.data_store.async_delete_room(data["room_id"])
                return self._json_response({"success": True})

            elif action == "update_entity":
                await self.data_store.async_update_entity(
                    data["entity_id"],
                    data["entity_data"]
                )
                return self._json_response({"success": True})

            elif action == "delete_entity":
                await self.data_store.async_delete_entity(data["entity_id"])
                return self._json_response({"success": True})

            elif action == "assign_entity_to_room":
                await self.data_store.async_assign_entity_to_room(
                    data["entity_id"],
                    data["room_id"]
                )
                return self._json_response({"success": True})

            elif action == "remove_entity_from_room":
                await self.data_store.async_remove_entity_from_room(
                    data["entity_id"],
                    data["room_id"]
                )
                return self._json_response({"success": True})

            elif action == "update_css_config":
                await self.data_store.async_update_css_config(data["css_config"])
                return self._json_response({"success": True})

            else:
                return self._json_response({"error": "Invalid action"}, status=400)

        except Exception as e:
            _LOGGER.error("Error in DashView admin API: %s", e)
            return self._json_response({"error": str(e)}, status=500)

    def _json_response(self, data, status=200):
        """Return a JSON response."""
        return Response(
            text=json.dumps(data, cls=JSONEncoder),
            content_type="application/json",
            status=status
        )


class DashViewDataAPIView(HomeAssistantView):
    """API view for DashView data operations."""

    url = "/api/dashview/data"
    name = "api:dashview:data"
    requires_auth = False

    def __init__(self, data_store: DashViewDataStore):
        """Initialize the API view."""
        self.data_store = data_store

    async def get(self, request: Request) -> Response:
        """Handle GET requests for dashboard data."""
        action = request.query.get("action")
        
        if action == "get_dashboard_data":
            hass = request.app["hass"]
            
            # Get current states for all configured entities
            entity_states = {}
            for room_id, room_config in self.data_store.rooms.items():
                for entity_id in room_config.get("entities", []):
                    state = hass.states.get(entity_id)
                    if state:
                        entity_states[entity_id] = {
                            "state": state.state,
                            "attributes": dict(state.attributes),
                            "last_changed": state.last_changed.isoformat(),
                            "last_updated": state.last_updated.isoformat()
                        }
            
            return self._json_response({
                "rooms": self.data_store.rooms,
                "entities": self.data_store.entities,
                "css_config": self.data_store.css_config,
                "entity_states": entity_states
            })
        
        return self._json_response({"error": "Invalid action"}, status=400)

    def _json_response(self, data, status=200):
        """Return a JSON response."""
        return Response(
            text=json.dumps(data, cls=JSONEncoder),
            content_type="application/json",
            status=status
        )