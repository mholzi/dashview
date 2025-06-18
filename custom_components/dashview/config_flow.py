"""Config flow for DashView integration."""
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
import voluptuous as vol

from .const import DOMAIN


class DashViewOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle an options flow for DashView."""

    def __init__(self, config_entry: config_entries.ConfigEntry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        # This flow is a placeholder. It directs the user to the custom admin panel.
        return self.async_show_form(
            step_id="init",
            description_placeholders={
                "admin_url": "/local/dashview/admin.html"
            },
            errors={},
        )


class DashViewConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for DashView."""

    VERSION = 1

    @staticmethod
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return DashViewOptionsFlowHandler(config_entry)

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            # Create the entry with a default, empty structure.
            # This is the "structural" setup.
            default_data = {
                "house_config": {
                    "weather_entity": "weather.home",
                    "rooms": {},
                    "floors": {}
                }
            }
            return self.async_create_entry(title="DashView", data=default_data, options={})

        return self.async_show_form(step_id="user")

    async def async_step_import(self, import_config):
        """Import a config entry from configuration.yaml."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        return self.async_create_entry(title="DashView", data={})