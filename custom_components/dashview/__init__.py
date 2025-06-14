"""The DashView custom integration."""
import logging
import os
from aiohttp.web import Response
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""

    url = "/dashview"
    name = "dashview"
    requires_auth = False

    async def get(self, request):
        """Serve the DashView HTML."""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>DashView</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .dashboard-header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .dashboard-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin: 0 0 10px 0;
        }
        .welcome-text {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>Welcome to DashView</h1>
            <p class="welcome-text">Your custom Home Assistant dashboard</p>
        </div>
        <div class="dashboard-content">
            <h2>Dashboard Content</h2>
            <p>This is where your custom dashboard content will go. You can customize this HTML, add JavaScript functionality, and integrate with Home Assistant entities.</p>
            <div id="dashboard-widgets">
                <!-- Custom widgets will be added here -->
            </div>
        </div>
    </div>
    
    <script>
        // Basic JavaScript functionality
        console.log('DashView loaded successfully');
        
        // Example: Add current time
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            document.getElementById('current-time')?.textContent = timeString;
        }
        
        // Update time every second
        setInterval(updateTime, 1000);
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DashView DOM loaded');
            const widgetsContainer = document.getElementById('dashboard-widgets');
            if (widgetsContainer) {
                widgetsContainer.innerHTML = `
                    <div style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0;">
                        <h3>Time Widget</h3>
                        <p>Current time: <span id="current-time"></span></p>
                    </div>
                `;
            }
            updateTime();
        });
    </script>
</body>
</html>
        """
        return Response(text=html_content.strip(), content_type="text/html")


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    _LOGGER.info("Setting up DashView integration")
    
    # Register the HTTP view
    hass.http.register_view(DashViewPanel())
    
    # Register the custom panel in the frontend
    hass.components.frontend.async_register_built_in_panel(
        "iframe",
        "DashView",
        "mdi:view-dashboard",
        "dashview",
        {"url": "/dashview"},
        require_admin=False,
    )
    
    # Auto-create config entry if it doesn't exist
    if not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "import"}, data={}
            )
        )
    
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return True