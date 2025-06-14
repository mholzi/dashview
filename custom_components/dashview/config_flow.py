"""Config flow for DashView integration."""
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, DEFAULT_CONFIG


class DashViewConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for DashView."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        errors = {}
        
        if user_input is not None:
            # Initialize with default configuration
            config_data = {
                "dashboard_title": user_input.get("dashboard_title", "DashView Dashboard"),
                "enable_admin_panel": user_input.get("enable_admin_panel", True),
                "theme_color": user_input.get("theme_color", "#667eea"),
                "rooms": DEFAULT_CONFIG["rooms"],
                "entities": DEFAULT_CONFIG["entities"],
                "css_config": DEFAULT_CONFIG["css_config"]
            }
            
            return self.async_create_entry(
                title=config_data["dashboard_title"], 
                data=config_data
            )

        # Show configuration form
        data_schema = vol.Schema({
            vol.Optional("dashboard_title", default="DashView Dashboard"): str,
            vol.Optional("enable_admin_panel", default=True): bool,
            vol.Optional("theme_color", default="#667eea"): str,
        })

        return self.async_show_form(
            step_id="user", 
            data_schema=data_schema,
            errors=errors
        )

    async def async_step_import(self, import_config):
        """Import a config entry from configuration.yaml."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        return self.async_create_entry(title="DashView", data=import_config or {})