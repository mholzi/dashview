"""Data store for DashView configuration."""
import json
import logging
from typing import Dict, Any, Optional
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, DEFAULT_CONFIG

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}_data"


class DashViewDataStore:
    """Manage DashView configuration data."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the data store."""
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: Dict[str, Any] = {}

    async def async_load(self) -> None:
        """Load data from storage."""
        stored_data = await self._store.async_load()
        if stored_data is None:
            self._data = DEFAULT_CONFIG.copy()
            await self.async_save()
        else:
            self._data = stored_data
        _LOGGER.debug("Loaded DashView data: %s", self._data)

    async def async_save(self) -> None:
        """Save data to storage."""
        await self._store.async_save(self._data)
        _LOGGER.debug("Saved DashView data")

    @property
    def rooms(self) -> Dict[str, Any]:
        """Get rooms configuration."""
        return self._data.get("rooms", {})

    @property 
    def entities(self) -> Dict[str, Any]:
        """Get entities configuration."""
        return self._data.get("entities", {})

    @property
    def css_config(self) -> Dict[str, Any]:
        """Get CSS configuration."""
        return self._data.get("css_config", DEFAULT_CONFIG["css_config"])

    async def async_update_room(self, room_id: str, room_data: Dict[str, Any]) -> None:
        """Update or create a room."""
        if "rooms" not in self._data:
            self._data["rooms"] = {}
        self._data["rooms"][room_id] = room_data
        await self.async_save()

    async def async_delete_room(self, room_id: str) -> None:
        """Delete a room."""
        if "rooms" in self._data and room_id in self._data["rooms"]:
            del self._data["rooms"][room_id]
            await self.async_save()

    async def async_update_entity(self, entity_id: str, entity_data: Dict[str, Any]) -> None:
        """Update or create entity configuration."""
        if "entities" not in self._data:
            self._data["entities"] = {}
        self._data["entities"][entity_id] = entity_data
        await self.async_save()

    async def async_delete_entity(self, entity_id: str) -> None:
        """Delete entity configuration."""
        if "entities" in self._data and entity_id in self._data["entities"]:
            del self._data["entities"][entity_id]
            await self.async_save()

    async def async_update_css_config(self, css_config: Dict[str, Any]) -> None:
        """Update CSS configuration."""
        self._data["css_config"] = css_config
        await self.async_save()

    async def async_assign_entity_to_room(self, entity_id: str, room_id: str) -> None:
        """Assign an entity to a room."""
        if "rooms" not in self._data:
            self._data["rooms"] = {}
        if room_id not in self._data["rooms"]:
            return
        
        if "entities" not in self._data["rooms"][room_id]:
            self._data["rooms"][room_id]["entities"] = []
        
        if entity_id not in self._data["rooms"][room_id]["entities"]:
            self._data["rooms"][room_id]["entities"].append(entity_id)
            await self.async_save()

    async def async_remove_entity_from_room(self, entity_id: str, room_id: str) -> None:
        """Remove an entity from a room."""
        if ("rooms" in self._data and 
            room_id in self._data["rooms"] and 
            "entities" in self._data["rooms"][room_id]):
            
            if entity_id in self._data["rooms"][room_id]["entities"]:
                self._data["rooms"][room_id]["entities"].remove(entity_id)
                await self.async_save()

    def get_entities_for_room(self, room_id: str) -> list:
        """Get all entities assigned to a room."""
        if ("rooms" in self._data and 
            room_id in self._data["rooms"] and 
            "entities" in self._data["rooms"][room_id]):
            return self._data["rooms"][room_id]["entities"]
        return []

    def get_entity_config(self, entity_id: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific entity."""
        return self._data.get("entities", {}).get(entity_id)