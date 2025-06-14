"""The DashView custom integration."""
import logging
import os
import json
from aiohttp.web import Response, json_response
from homeassistant.core import HomeAssistant, State
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url, async_register_built_in_panel
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers.json import JSONEncoder
import homeassistant.helpers.service as service

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'rooms.json')

# This data management part remains the same
def get_rooms_data():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_rooms_data(data):
    with open(CONFIG_PATH, 'w') as f:
        json.dump(data, f, indent=4)


# AdminView and DashViewApi remain unchanged from the previous version
class AdminView(HomeAssistantView):
    url = "/admin"
    name = "admin"
    requires_auth = True
    # ... (implementation from previous step)

class DashViewApi(HomeAssistantView):
    url = "/api/dashview/{path:.+}"
    name = "api:dashview"
    requires_auth = True
    # ... (implementation from previous step)


class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""
    url = "/dashview"
    name = "dashview"
    requires_auth = False

    async def get(self, request):
        """Serve the DashView HTML."""
        rooms_data = get_rooms_data()

        # Data from floor_tab.yaml
        floors = [
            { "id": "erdgeschoss", "room": "Erdgeschoss", "default": True, "active_tab": 1 },
            { "id": "obergeschoss", "room": "Obergeschoss", "default": False, "active_tab": 2 },
            { "id": "elternbereich", "room": "Elternbereich", "default": False, "active_tab": 3 },
            { "id": "keller", "room": "Kellergeschoss", "default": False, "active_tab": 4 }
        ]
        tabs = [
            { "icon": "mdi:home", "label": "EG", "target": "erdgeschoss" },
            { "icon": "mdi:home-floor-1", "label": "OG", "target": "obergeschoss" },
            { "icon": "mdi:home-roof", "label": "Eltern", "target": "elternbereich" },
            { "icon": "mdi:stairs-down", "label": "Keller", "target": "keller" }
        ]

        def generate_floor_tabs_html():
            html = """
            <div class="card">
                <div class="grid-layout" style="grid-template-columns: 1fr max-content max-content max-content max-content;">
                    <div class="floor-title">Räume</div>
            """
            for i, tab in enumerate(tabs):
                html += f"""
                    <div class="tab-chip" data-target="{tab['target']}">
                        <i class="mdi {tab['icon']}"></i>
                    </div>
                """
            html += "</div></div>"
            return html

        def generate_floor_content_html():
            html = ""
            # This data is from room_control_card.yaml
            room_control_templates = {
                'Erdgeschoss': ['sensor_small_swipe', 'floor_swipe', 'Muell'],
                'Gästeklo': ['sensor_big_swipe', 'sensor_small_swipe'],
                'Kellergeschoss': ['sensor_small_swipe', 'sensor_big_swipe', 'floor_swipe'],
                # ... and so on for every room
            }

            for floor in floors:
                display_style = "display: block;" if floor["default"] else "display: none;"
                html += f"""
                <div id="{floor['id']}" class="floor-content" style="{display_style}">
                    <div class="placeholder card">
                        Content for {floor['room']} requires the following templates:<br>
                        <strong>{', '.join(set(room_control_templates.get(floor['room'], ["N/A"])))}</strong>
                    </div>
                </div>
                """
            return html

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>DashView - Home</title>
    <style>
        /* ... existing styles ... */
        .floor-title {{ font-size: 16px; font-weight: 500; align-self: center; }}
        .tab-chip {{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background-color: var(--gray100);
            color: var(--gray800);
            cursor: pointer;
        }}
        .tab-chip.active {{
            background: var(--active-small); /* Using a theme variable */
            color: var(--black);
        }}
        .floor-content {{ display: none; }}
        .floor-content.active {{ display: block; }}
    </style>
</head>
<body>
    <div class="vertical-layout">
        {generate_floor_tabs_html()}

        {generate_floor_content_html()}
        
        <div style="height: 70px;"></div> </div>

    <script>
        // Existing JS functions (updateDashboard, etc.) are here
        // ...

        function handleTabClick(e) {{
            const clickedTab = e.target.closest('.tab-chip');
            if (!clickedTab) return;

            const targetId = clickedTab.dataset.target;

            // Update tab active state
            document.querySelectorAll('.tab-chip').forEach(tab => tab.classList.remove('active'));
            clickedTab.classList.add('active');
            
            // Update floor content visibility
            document.querySelectorAll('.floor-content').forEach(content => {{
                content.style.display = content.id === targetId ? 'block' : 'none';
            }});
        }}
        
        document.addEventListener('DOMContentLoaded', () => {{
            // Initial setup for tabs
            document.querySelector('.tab-chip').classList.add('active');
            document.querySelector('.floor-content').style.display = 'block';
            document.querySelector('.card').addEventListener('click', handleTabClick);

            // Existing setup
            updateDashboard();
            setInterval(updateDashboard, 5000);
        }});
    </script>
</body>
</html>
        """
        return Response(text=html_content.strip(), content_type="text/html")

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    _LOGGER.info("Setting up DashView integration")

    hass.http.register_view(DashViewPanel())
    hass.http.register_view(AdminView())
    hass.http.register_view(DashViewApi())

    if "dashview" not in hass.data.get("frontend_panels", {}):
      async_register_built_in_panel(
          hass,
          "iframe",
          "DashView",
          "mdi:view-dashboard",
          "dashview",
          {"url": "/dashview"},
          require_admin=False,
      )

    await async_setup_services(hass)

    if not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "import"}, data={}
            )
        )

    return True

# async_setup_entry and async_unload_entry remain the same
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    await async_unload_services(hass)
    return True
