"""The DashView custom integration."""
import logging
import os
from aiohttp.web import Response
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url, async_register_built_in_panel
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN, DASHBOARD_VIEWS, DEFAULT_CONFIG
from .services import async_setup_services, async_unload_services
from .data_store import DashViewDataStore
from .api import DashViewAdminAPIView, DashViewDataAPIView
from .widgets import get_widget_html, get_widget_css, get_widget_javascript

_LOGGER = logging.getLogger(__name__)


class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""

    url = "/dashview"
    name = "dashview"
    requires_auth = False

    def __init__(self, data_store: DashViewDataStore):
        """Initialize the panel view."""
        self.data_store = data_store

    async def get(self, request):
        """Serve the DashView HTML."""
        # Check if user is admin for admin panel access
        user = request.get('hass_user')
        is_admin = user and user.is_admin if user else False
        
        # Get view parameter
        view = request.query.get('view', 'main')
        
        # Generate a basic dashboard HTML for now to avoid complexity
        css_config = self.data_store.css_config
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>DashView Dashboard v2.0</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        :root {{
            --primary-color: {css_config.get('primary_color', '#667eea')};
            --secondary-color: {css_config.get('secondary_color', '#764ba2')};
            --background-color: {css_config.get('background_color', '#f5f5f5')};
            --text-color: {css_config.get('text_color', '#333')};
            --font-family: {css_config.get('font_family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')};
            --border-radius: {css_config.get('border_radius', '12px')};
        }}

        body {{
            font-family: var(--font-family);
            margin: 0;
            padding: 20px;
            background-color: var(--background-color);
            color: var(--text-color);
        }}

        .dashboard-container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .dashboard-header {{
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: white;
            padding: 30px;
            border-radius: var(--border-radius);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .header-title {{
            font-size: 2.5em;
            font-weight: bold;
            margin: 0;
        }}

        .header-info {{
            text-align: right;
        }}

        .nav-tabs {{
            display: flex;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }}

        .nav-tab {{
            flex: 1;
            padding: 15px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }}

        .nav-tab:hover {{
            background: #f8f9fa;
        }}

        .nav-tab.active {{
            background: var(--primary-color);
            color: white;
        }}

        .dashboard-content {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }}

        .widget {{
            background: white;
            border-radius: var(--border-radius);
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }}

        .widget:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }}

        .widget h3 {{
            margin: 0 0 15px 0;
            color: var(--text-color);
            font-size: 1.2em;
        }}

        .admin-panel {{
            background: white;
            border-radius: var(--border-radius);
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            grid-column: 1 / -1;
        }}

        .admin-section {{
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }}

        .form-group {{
            margin-bottom: 15px;
        }}

        .form-group label {{
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }}

        .form-group input,
        .form-group select {{
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1em;
        }}

        .btn {{
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            margin-right: 10px;
        }}

        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
            margin-top: 40px;
        }}

        @media (max-width: 768px) {{
            .dashboard-container {{
                padding: 10px;
            }}
            .dashboard-content {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="dashboard-header">
            <h1 class="header-title">🏠 DashView v2.0</h1>
            <div class="header-info">
                <div id="current-time">--:--</div>
                <div id="current-date">Loading...</div>
            </div>
        </div>

        <div class="nav-tabs">
            <button class="nav-tab active" data-view="main">
                <span>🏠</span><span>Main</span>
            </button>
            <button class="nav-tab" data-view="rooms">
                <span>📋</span><span>Rooms</span>
            </button>
            <button class="nav-tab" data-view="security">
                <span>🔒</span><span>Security</span>
            </button>
            <button class="nav-tab" data-view="media">
                <span>🎵</span><span>Media</span>
            </button>
            {'<button class="nav-tab" data-view="admin"><span>🔧</span><span>Admin</span></button>' if is_admin else ''}
        </div>

        <div class="dashboard-content">
            <div class="widget">
                <h3>🏠 Welcome to DashView v2.0</h3>
                <p>Your fully configurable Home Assistant dashboard with:</p>
                <ul>
                    <li>Room-based organization</li>
                    <li>Custom entity widgets</li>
                    <li>Admin configuration panel</li>
                    <li>CSS customization</li>
                    <li>Entity type classification</li>
                </ul>
            </div>
            
            <div class="widget">
                <h3>📊 System Status</h3>
                <div id="system-status">
                    <div>Dashboard Version: 2.0.0</div>
                    <div>Status: Online</div>
                    <div>Rooms Configured: <span id="room-count">0</span></div>
                    <div>Entities: <span id="entity-count">0</span></div>
                </div>
            </div>
            
            <div class="widget">
                <h3>⏰ Quick Stats</h3>
                <div>Session Duration: <span id="session-duration">0s</span></div>
                <div>Last Updated: <span id="last-updated">--:--</span></div>
                <div>Current Time: <span id="time-display">--:--</span></div>
            </div>

            {'<div class="admin-panel" id="admin-panel" style="display: none;"><h2>🔧 Dashboard Administration</h2><div class="admin-section"><h3>🏠 Room Management</h3><p>Room management interface coming soon...</p></div><div class="admin-section"><h3>🔧 Entity Configuration</h3><p>Entity configuration interface coming soon...</p></div><div class="admin-section"><h3>🎨 CSS & Styling</h3><p>CSS customization interface coming soon...</p></div></div>' if is_admin else ''}
        </div>

        <div class="footer">
            <p>DashView v2.0.0 - Fully Configurable Home Assistant Dashboard</p>
        </div>
    </div>

    <script>
        let sessionStartTime = Date.now();

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {{
            console.log('DashView Dashboard v2.0.0 initialized');
            updateTime();
            loadDashboardData();
            setupEventListeners();
            startPeriodicUpdates();
        }});

        // Load dashboard data
        async function loadDashboardData() {{
            try {{
                const response = await fetch('/api/dashview/data?action=get_dashboard_data');
                const data = await response.json();
                
                document.getElementById('room-count').textContent = Object.keys(data.rooms || {{}}).length;
                document.getElementById('entity-count').textContent = Object.keys(data.entity_states || {{}}).length;
            }} catch (error) {{
                console.error('Failed to load dashboard data:', error);
            }}
        }}

        // Setup event listeners
        function setupEventListeners() {{
            document.querySelectorAll('.nav-tab').forEach(tab => {{
                tab.addEventListener('click', () => {{
                    const view = tab.dataset.view;
                    showView(view);
                }});
            }});
        }}

        // Show specific view
        function showView(viewId) {{
            document.querySelectorAll('.nav-tab').forEach(tab => {{
                tab.classList.toggle('active', tab.dataset.view === viewId);
            }});

            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {{
                adminPanel.style.display = viewId === 'admin' ? 'block' : 'none';
            }}
        }}

        // Update time and date
        function updateTime() {{
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {{
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }});
            const dateString = now.toLocaleDateString('en-US', {{
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }});
            
            document.getElementById('current-time').textContent = timeString;
            document.getElementById('current-date').textContent = dateString;
            document.getElementById('last-updated').textContent = timeString;
            document.getElementById('time-display').textContent = timeString;
        }}

        // Update session duration
        function updateSessionDuration() {{
            const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationString = minutes > 0 ? `${{minutes}}m ${{seconds}}s` : `${{seconds}}s`;
            document.getElementById('session-duration').textContent = durationString;
        }}

        // Start periodic updates
        function startPeriodicUpdates() {{
            setInterval(updateTime, 1000);
            setInterval(updateSessionDuration, 1000);
            setInterval(loadDashboardData, 30000);
        }}
    </script>
</body>
</html>
        """
        return Response(text=html_content.strip(), content_type="text/html")


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    _LOGGER.info("Setting up DashView integration v2.0")
    
    # Initialize data store
    data_store = DashViewDataStore(hass)
    await data_store.async_load()
    hass.data[DOMAIN] = {"data_store": data_store}

    # Register the HTTP views
    hass.http.register_view(DashViewPanel(data_store))
    hass.http.register_view(DashViewAdminAPIView(data_store))
    hass.http.register_view(DashViewDataAPIView(data_store))

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
    # Get or create data store
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}
    
    if "data_store" not in hass.data[DOMAIN]:
        data_store = DashViewDataStore(hass) 
        await data_store.async_load()
        hass.data[DOMAIN]["data_store"] = data_store

    # Store config entry data
    hass.data[DOMAIN]["config_entry"] = entry

    # Setup platforms
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, ["sensor"])
    
    if unload_ok:
        # Remove from hass data
        if DOMAIN in hass.data and "config_entry" in hass.data[DOMAIN]:
            hass.data[DOMAIN].pop("config_entry")
    
    await async_unload_services(hass)
    return unload_ok