"""Config flow for DashView integration."""
from homeassistant import config_entries
from homeassistant.core import HomeAssistant

from .const import DOMAIN


class DashViewConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for DashView."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(title="DashView", data={})

        return self.async_show_form(step_id="user")

    async def async_step_import(self, import_config):
        """Import a config entry from configuration.yaml."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        return self.async_create_entry(title="DashView", data={})