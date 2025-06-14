"""The DashView custom integration."""
import logging
import os
from aiohttp.web import Response
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url, async_register_built_in_panel
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

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
            color: #333;
        }
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .dashboard-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .dashboard-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .widget {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .widget:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .widget h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.2em;
        }
        .widget-content {
            font-size: 1.1em;
        }
        .time-widget {
            text-align: center;
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .date-widget {
            text-align: center;
            font-size: 1.2em;
            color: #666;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-online {
            background-color: #4CAF50;
        }
        .status-offline {
            background-color: #F44336;
        }
        .button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.2s ease;
        }
        .button:hover {
            background-color: #5a67d8;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .dashboard-header {
                padding: 20px;
            }
            .dashboard-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1>🏠 DashView</h1>
            <p>Your Custom Home Assistant Dashboard</p>
        </div>
        
        <div class="dashboard-content">
            <div class="widget">
                <h3>⏰ Current Time</h3>
                <div class="widget-content">
                    <div id="current-time" class="time-widget">--:--:--</div>
                    <div id="current-date" class="date-widget">Loading...</div>
                </div>
            </div>
            
            <div class="widget">
                <h3>📊 System Status</h3>
                <div class="widget-content">
                    <p><span class="status-indicator status-online"></span>DashView Integration: Online</p>
                    <p><span class="status-indicator status-online"></span>Dashboard: Active</p>
                    <p>Last Updated: <span id="last-updated">--</span></p>
                </div>
            </div>
            
            <div class="widget">
                <h3>🎛️ Quick Actions</h3>
                <div class="widget-content">
                    <button class="button" onclick="refreshDashboard()">🔄 Refresh Dashboard</button>
                    <button class="button" onclick="showInfo()" style="margin-left: 10px;">ℹ️ Info</button>
                </div>
            </div>
            
            <div class="widget">
                <h3>📈 Dashboard Stats</h3>
                <div class="widget-content">
                    <p>Page Views: <span id="page-views">1</span></p>
                    <p>Session Duration: <span id="session-duration">0s</span></p>
                    <p>Widgets Loaded: <span id="widgets-loaded">4</span></p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>DashView v1.0.0 - Custom Home Assistant Integration</p>
            <p>Built with ❤️ for the Home Assistant Community</p>
        </div>
    </div>
    
    <script>
        // Dashboard state
        let sessionStartTime = Date.now();
        let pageViews = parseInt(localStorage.getItem('dashview-pageviews') || '0') + 1;
        localStorage.setItem('dashview-pageviews', pageViews);
        
        // Update time function
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const dateString = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            document.getElementById('current-time').textContent = timeString;
            document.getElementById('current-date').textContent = dateString;
            document.getElementById('last-updated').textContent = timeString;
        }
        
        // Update session duration
        function updateSessionDuration() {
            const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            document.getElementById('session-duration').textContent = durationString;
        }
        
        // Refresh dashboard function
        function refreshDashboard() {
            updateTime();
            updateSessionDuration();
            document.getElementById('page-views').textContent = pageViews;
            console.log('Dashboard refreshed at', new Date().toISOString());
        }
        
        // Show info function
        function showInfo() {
            alert('DashView v1.0.0\\n\\n' +
                  'A custom Home Assistant integration that provides a ' +
                  'customizable dashboard view.\\n\\n' +
                  'Features:\\n' +
                  '• Custom HTML/CSS/JS dashboard\\n' +
                  '• HACS compatible installation\\n' +
                  '• Extensible widget system\\n' +
                  '• Real-time updates\\n\\n' +
                  'Visit: https://github.com/mholzi/dashview');
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DashView Dashboard initialized');
            updateTime();
            document.getElementById('page-views').textContent = pageViews;
            
            // Update time every second
            setInterval(updateTime, 1000);
            
            // Update session duration every second
            setInterval(updateSessionDuration, 1000);
            
            // Log successful load
            console.log('DashView loaded successfully with', 
                       document.querySelectorAll('.widget').length, 'widgets');
        });
        
        // Handle visibility change (when tab becomes active/inactive)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                refreshDashboard();
            }
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
    async_register_built_in_panel(
        hass,
        "iframe",
        "DashView",
        "mdi:view-dashboard",
        "dashview",
        {"url": "/dashview"},
        require_admin=False,
    )
    
    # Setup services
    await async_setup_services(hass)
    
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
    await async_unload_services(hass)
    return True
