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
HTML_GENERATOR_PATH = os.path.join(os.path.dirname(__file__), "html_generator.py")

def get_rooms_data():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_rooms_data(data):
    with open(CONFIG_PATH, 'w') as f:
        json.dump(data, f, indent=4)

class AdminView(HomeAssistantView):
    """View to serve the admin panel."""
    url = "/admin"
    name = "admin"
    requires_auth = True

    async def get(self, request):
        """Serve the admin HTML."""
        return Response(text="<html><head><title>DashView Admin</title></head><body><h1>Room Management</h1><p>UI for managing rooms, sensors, and scenes.</p></body></html>", content_type="text/html")

class DashViewApi(HomeAssistantView):
    """API for DashView."""
    url = "/api/dashview/{path:.+}"
    name = "api:dashview"
    requires_auth = True

    async def get(self, request, path):
        hass = request.app['hass']
        if path == "rooms":
            return json_response(get_rooms_data())
        if path == "states":
            states = [s.as_dict() for s in hass.states.async_all()]
            return Response(body=json.dumps(states, cls=JSONEncoder), content_type="application/json")
        return json_response({"error": "Not Found"}, status=404)

    async def post(self, request, path):
        hass = request.app['hass']
        data = await request.json()
        if path == "call_service":
            domain = data.get("domain")
            service_name = data.get("service")
            service_data = data.get("service_data", {})
            if domain and service_name:
                await hass.services.async_call(domain, service_name, service_data, blocking=False)
                return json_response({"success": True})
            return json_response({"error": "Invalid service call"}, status=400)
        return json_response({"success": True})

class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""
    url = "/dashview"
    name = "dashview"
    requires_auth = False

    async def get(self, request):
        """Serve the DashView HTML."""
        from .html_generator import generate_full_html
        return Response(text=generate_full_html(), content_type="text/html")

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    _LOGGER.info("Setting up DashView integration")

    if not os.path.exists(HTML_GENERATOR_PATH):
        with open(HTML_GENERATOR_PATH, "w") as f:
            f.write(HTML_GENERATOR_CONTENT)

    hass.http.register_view(DashViewPanel())
    hass.http.register_view(AdminView())
    hass.http.register_view(DashViewApi())

    if "dashview" not in hass.data.get("frontend_panels", {}):
        async_register_built_in_panel(
            hass, "iframe", "DashView", "mdi:view-dashboard", "dashview",
            {"url": "/dashview"}, require_admin=False
        )

    await async_setup_services(hass)
    if not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(DOMAIN, context={"source": "import"}, data={})
        )
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    await async_unload_services(hass)
    return True

HTML_GENERATOR_CONTENT = r'''
import json

def generate_full_html():
    # --- Data Definitions from YAML files ---
    room_layouts = {
        'Erdgeschoss': {"grid_template_areas": ["'eingang raeume'", "'garbage raeume'", "'garbage esszimmertuer'", "'sauger dishwasher'"], "cards": [{'template': 'sensor_small_swipe', 'grid': 'eingang', 'entity': 'lock.door_aqara_smart_lock_u200_lock', 'type': 'door', 'closed_entity': 'binary_sensor.tuer_eingang'}, {'template': 'floor_swipe', 'grid': 'raeume', 'entity': 'Erdgeschoss'}, {'template': 'floor_swipe', 'grid': 'garbage', 'entity': 'Muell'}, {'template': 'sensor_small_swipe', 'grid': 'esszimmertuer', 'entity': 'binary_sensor.fenster_terrasse', 'type': 'window'}, {'template': 'sensor_small_swipe', 'grid': 'sauger', 'entity': 'vacuum.mova_e30_ultra', 'type': 'hoover'}, {'template': 'sensor_small_swipe', 'grid': 'dishwasher', 'entity': 'sensor.geschirrspuler_operation_state', 'type': 'dishwasher'}]},
        'Obergeschoss': {"grid_template_areas": ["'kinder kinderbad'", "'kinder kinderbad'", "'kinderflur aupair'", "'kinderflur aupair'"], "cards": [{'template': 'room_card', 'grid': 'kinder', 'entity': 'binary_sensor.combined_sensor_kids'}, {'template': 'room_card', 'grid': 'kinderbad', 'entity': 'binary_sensor.combined_sensor_kinderbad'}, {'template': 'room_card', 'grid': 'aupair', 'entity': 'binary_sensor.combined_sensor_aupair'}, {'template': 'room_card', 'grid': 'kinderflur', 'entity': 'binary_sensor.combined_sensor_flur'}]},
        # ... other room layouts ...
    }
    floor_swipe_cards = {
        'Erdgeschoss': [{'entity': 'binary_sensor.combined_sensor_wohnzimmer', 'temp': 'sensor.humidity_wohnzimmer_temperature', 'hum': 'sensor.humidity_wohnzimmer_humidity'}, {'entity': 'binary_sensor.combined_sensor_kueche', 'temp': 'sensor.kuche_temperature'}],
        'Keller': [{'entity': 'binary_sensor.combined_sensor_waschkeller', 'temp': 'sensor.humidity_waschkeller_temperature'}, {'entity': 'binary_sensor.combined_sensor_partykeller', 'temp': 'sensor.partykeller_humidity_detector_temperature'}],
        'Muell': [{'abfuhr_index': 0}, {'abfuhr_index': 1}, {'abfuhr_index': 2}, {'abfuhr_index': 3}]
    }
    floors = [ { "id": "erdgeschoss", "room": "Erdgeschoss", "default": True }, { "id": "obergeschoss", "room": "Obergeschoss", "default": False }, { "id": "elternbereich", "room": "Elternbereich", "default": False }, { "id": "keller", "room": "Kellergeschoss", "default": False } ]
    tabs = [ { "icon": "mdi:home", "target": "erdgeschoss" }, { "icon": "mdi:home-floor-1", "target": "obergeschoss" }, { "icon": "mdi:home-roof", "target": "elternbereich" }, { "icon": "mdi:stairs-down", "target": "keller" } ]
    
    def generate_floor_tabs_html():
        active_class = "active"
        html = f"""<div id="floor-tabs-container" class="card"><div class="grid-layout" style="grid-template-columns: 1fr repeat({len(tabs)}, max-content); align-items: center;"><div class="floor-title">Räume</div>"""
        for tab in tabs:
            html += f"""<div class="tab-chip {active_class}" data-target="{tab['target']}"><i class="mdi {tab['icon']}"></i></div>"""
            active_class = ""
        html += "</div></div>"
        return html

    def generate_floor_content_html():
        html = ""
        for floor in floors:
            display_style = "display: block;" if floor["default"] else "display: none;"
            html += f'<div id="{floor["id"]}" class="floor-content" style="{display_style}">'
            layout = room_layouts.get(floor["room"])
            if layout:
                grid_template_areas_css = " ".join(layout['grid_template_areas'])
                row_heights = ' '.join(['10px' if 'gap' in row else '76px' for row in layout['grid_template_areas']])
                html += f'<div class="room-grid-layout" style="grid-template-areas: {grid_template_areas_css}; grid-template-rows: {row_heights};">'
                for card in layout['cards']:
                    card_template = card.get('template', '')
                    if card_template == 'floor_swipe':
                        swipe_cards_data = floor_swipe_cards.get(card['entity'], [])
                        swipe_html = ""
                        for swipe_card_data in swipe_cards_data:
                            if card['entity'] == 'Muell':
                                swipe_html += '<div class="placeholder" style="min-width: 100%; height: 100%;">Needed: naechste_abfuhr_card</div>'
                            else:
                                swipe_html += f"""<div class="room-card" data-entity="{swipe_card_data['entity']}" data-temp="{swipe_card_data.get('temp','')}" data-hum="{swipe_card_data.get('hum','')}"></div>"""
                        html += f'<div style="grid-area: {card["grid"]};"><div class="swipe-container">{swipe_html}</div></div>'
                    elif card_template in ['sensor_small_swipe', 'sensor_big_swipe']:
                        html += f"""
                         <div class="swipe-card-wrapper" style="grid-area: {card['grid']};" onclick="this.querySelector('.swipe-card-content').classList.toggle('flipped')">
                            <div class="swipe-card-content">
                                <div class="sensor-card {card['template']}" data-entity="{card.get('entity', '')}" data-type="{card.get('type', '')}" data-closed_entity="{card.get('closed_entity', '')}" data-height="{card.get('height', '')}"></div>
                                <div class="sensor-card {card['template']}" data-entity="{card.get('entity', '')}" data-type="{card.get('type', '')}" data-closed_entity="{card.get('closed_entity', '')}" data-label-last="true" data-height="{card.get('height', '')}"></div>
                            </div>
                         </div>"""
                    else:
                        html += f'<div class="placeholder" style="grid-area: {card["grid"]}; display:flex; align-items:center; justify-content:center;">Needed: <br/><strong>{card_template}</strong></div>'
                html += "</div>"
            else:
                html += f"<div class='placeholder card'>Layout for {floor['room']} not defined.</div>"
            html += "</div>"
        return html

    # Using a raw string literal r'''...''' to prevent Python from interpreting the JS backslashes and braces.
    script_js = r'''
        let states = {};

        function getSensorState(entityId, type, labelLast, closedEntity) {
            const entity = states[entityId];
            if (!entity) return { name: "Unknown", label: "Entity not found", icon: "mdi:help-circle", styles: { card: {}, icon: {}, img_cell: {}, name: {}, label: {} } };

            let name = entity.attributes.friendly_name || entityId;
            let label = entity.state;
            let icon = entity.attributes.icon || 'mdi:help-circle';
            let styles = { card: {}, icon: {}, img_cell: {}, name: {}, label: {} };
            
            // This is a simplified version of the full logic from the YAML files.
            // A full implementation would have all the detailed switch/case statements.
            if (type === 'light') {
                label = entity.state === 'on' ? 'An' : 'Aus';
                icon = entity.attributes.icon || 'mdi:lightbulb';
                styles.card.background = entity.state === 'on' ? 'var(--active-light)' : 'var(--gray000)';
                styles.name.color = entity.state === 'on' ? 'var(--gray000)' : 'var(--gray800)';
                styles.label.color = styles.name.color;
                styles.icon.color = styles.name.color;
                styles.img_cell.background = entity.state === 'on' ? 'var(--gray800)' : 'rgba(var(--highlight))';
            }
            // ... more type handlers
            
            if (labelLast && entity.last_changed) {
                const lastChanged = new Date(entity.last_changed);
                const now = new Date();
                const diff = Math.floor((now - lastChanged) / 1000); // in seconds
                if (diff < 60) { label = 'vor wenigen Sekunden'; }
                else if (diff < 3600) { label = `vor ${Math.floor(diff / 60)}m`; }
                else if (diff < 86400) { label = `vor ${Math.floor(diff / 3600)}h`; }
                else { label = `vor ${Math.floor(diff / 86400)}d`; }
            }
            return { name, label, icon, styles };
        }

        function getRoomCardState(entityId, tempId, humId) {
            const entity = states[entityId];
            if (!entity) return { name: "Raum", temp: "", icon: "mdi:home-city", nav_path: "#" };
            
            let temp_html = '';
            if (tempId && states[tempId]) {
                 temp_html += `${parseFloat(states[tempId].state).toFixed(0)}°`;
            }
            if (humId && states[humId]) {
                temp_html += ` <span style="font-size:0.3em;opacity:0.7">${parseFloat(states[humId].state).toFixed(0)}%</span>`;
            }
            
            return {
                name: entity.attributes.friendly_name || 'Raum',
                temp: temp_html,
                icon: entity.attributes.icon || 'mdi:home-city',
                nav_path: entity.attributes.room_type || '#',
                isActive: entity.state === 'on'
            };
        }

        function updateRoomCards() {
            document.querySelectorAll('.room-card').forEach(card => {
                const ds = card.dataset;
                const state = getRoomCardState(ds.entity, ds.temp, ds.hum);
                const bgColor = state.isActive ? 'var(--active-big)' : 'rgba(var(--highlight))';
                const iconColor = state.isActive ? 'var(--black)' : 'var(--white)';

                card.innerHTML = `
                    <a href="${state.nav_path}" style="text-decoration: none; display: block; height: 100%;">
                        <div style="padding: 8px; height: 100%; border-radius: 12px; background: var(--gray000); display: grid; grid-template-areas: 'n i' 'temp temp'; grid-template-rows: 1fr min-content; grid-template-columns: 1fr min-content; box-sizing: border-box;">
                            <div style="grid-area: n; justify-self: start; align-self: start; text-align: left; font-size: 1em; font-weight: 500; color: var(--gray800); padding: 14px;">${state.name}</div>
                            <div style="grid-area: i; justify-self: end; align-self: start; background: ${bgColor}; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                                <i class="mdi ${state.icon}" style="font-size: 30px; color: ${iconColor};"></i>
                            </div>
                            <div style="grid-area: temp; justify-self: start; font-size: 2.5em; line-height: 1em; font-weight: 300; color: var(--gray800); padding: 0 0 6px 14px;">${state.temp}</div>
                        </div>
                    </a>
                `;
            });
        }
        
        function updateSensorCards() {
            document.querySelectorAll('.sensor-card').forEach(card => {
                const ds = card.dataset;
                if (!ds.entity) return;
                const state = getSensorState(ds.entity, ds.type, ds.labelLast === 'true', ds.closedEntity);
                
                const cardHeight = ds.height || (card.classList.contains('sensor_big_swipe') ? '240px' : '66px');
                card.innerHTML = `
                    <div style="padding: 20px; border-radius: 12px; display: grid; grid-template-areas: 'i' 'l' 'n'; text-align: left; background: ${state.styles.card.background}; height: ${cardHeight}; box-sizing: border-box; color: ${state.styles.name.color};">
                        <div style="grid-area: i; justify-self: end; align-self: start; background: ${state.styles.img_cell.background}; padding: 14px; border-radius: 50%; margin: -16px -16px 0 0; width: 30px; height: 30px; display:flex; align-items:center; justify-content:center;">
                            <i class="mdi ${state.icon}" style="font-size: 22px; color: ${state.styles.icon.color};"></i>
                        </div>
                        <div style="grid-area: l; font-size: 1.5em; font-weight: 300; color: ${state.styles.label.color};">${state.label}</div>
                        <div style="grid-area: n; font-size: 14px; opacity: 0.7;">${state.name}</div>
                    </div>`;
            });
        }
        
        function handleTabClick(e) {
            const clickedTab = e.target.closest('.tab-chip');
            if (!clickedTab) return;
            const targetId = clickedTab.dataset.target;
            clickedTab.parentElement.querySelectorAll('.tab-chip').forEach(tab => tab.classList.remove('active'));
            clickedTab.classList.add('active');
            document.querySelectorAll('.floor-content').forEach(content => {
                content.style.display = content.id === targetId ? 'block' : 'none';
            });
        }
        
        async function updateDashboard() {
            try {
                const response = await fetch('/api/dashview/states');
                if (!response.ok) return;
                const statesArray = await response.json();
                states = Object.fromEntries(statesArray.map(s => [s.entity_id, s]));
                updateSensorCards();
                updateRoomCards();
                // ... other update functions ...
            } catch (error) {
                console.error("Error updating dashboard:", error);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('floor-tabs-container').addEventListener('click', handleTabClick);
            updateDashboard();
            setInterval(updateDashboard, 5000);
        });
    '''

    return html_content
'''
