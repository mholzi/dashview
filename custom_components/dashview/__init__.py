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
        
        # --- Data Definitions from YAML files ---
        room_layouts = {
            'Erdgeschoss': {"grid_template_areas": ["'eingang raeume'", "'garbage raeume'", "'garbage esszimmertuer'", "'sauger dishwasher'"], "cards": [{'template': 'sensor_small_swipe', 'grid': 'eingang', 'entity': 'lock.door_aqara_smart_lock_u200_lock', 'type': 'door', 'closed_entity': 'binary_sensor.tuer_eingang'}, {'template': 'floor_swipe', 'grid': 'raeume', 'entity': 'Erdgeschoss'}, {'template': 'floor_swipe', 'grid': 'garbage', 'entity': 'Muell'}, {'template': 'sensor_small_swipe', 'grid': 'esszimmertuer', 'entity': 'binary_sensor.fenster_terrasse', 'type': 'window'}, {'template': 'sensor_small_swipe', 'grid': 'sauger', 'entity': 'vacuum.mova_e30_ultra', 'type': 'hoover'}, {'template': 'sensor_small_swipe', 'grid': 'dishwasher', 'entity': 'sensor.geschirrspuler_operation_state', 'type': 'dishwasher'}]},
            'Obergeschoss': {"grid_template_areas": ["'kinder kinderbad'", "'kinder kinderbad'", "'kinderflur aupair'", "'kinderflur aupair'"], "cards": [{'template': 'room_card', 'grid': 'kinder', 'entity': 'binary_sensor.combined_sensor_kids'}, {'template': 'room_card', 'grid': 'kinderbad', 'entity': 'binary_sensor.combined_sensor_kinderbad'}, {'template': 'room_card', 'grid': 'aupair', 'entity': 'binary_sensor.combined_sensor_aupair'}, {'template': 'room_card', 'grid': 'kinderflur', 'entity': 'binary_sensor.combined_sensor_flur'}]},
        }
        floor_swipe_cards = {
            'Erdgeschoss': [{'entity': 'binary_sensor.combined_sensor_wohnzimmer', 'temp': 'sensor.humidity_wohnzimmer_temperature', 'hum': 'sensor.humidity_wohnzimmer_humidity'}, {'entity': 'binary_sensor.combined_sensor_kueche', 'temp': 'sensor.kuche_temperature'}],
            'Keller': [{'entity': 'binary_sensor.combined_sensor_waschkeller', 'temp': 'sensor.humidity_waschkeller_temperature'}, {'entity': 'binary_sensor.combined_sensor_partykeller', 'temp': 'sensor.partykeller_humidity_detector_temperature'}],
            'Muell': [{'abfuhr_index': 0}, {'abfuhr_index': 1}, {'abfuhr_index': 2}, {'abfuhr_index': 3}]
        }
        floors = [ { "id": "erdgeschoss", "room": "Erdgeschoss", "default": True }, { "id": "obergeschoss", "room": "Obergeschoss", "default": False }, { "id": "elternbereich", "room": "Elternbereich", "default": False }, { "id": "keller", "room": "Kellergeschoss", "default": False } ]
        tabs = [ { "icon": "mdi:home", "target": "erdgeschoss" }, { "icon": "mdi:home-floor-1", "target": "obergeschoss" }, { "icon": "mdi:home-roof", "target": "elternbereich" }, { "icon": "mdi:stairs-down", "target": "keller" } ]
        
        # --- HTML Generation Functions ---
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

        # By using a raw multi-line string (r'''...'''), we prevent Python from misinterpreting
        # the curly braces {} and other characters used in the Javascript code.
        script_js = r'''
            let states = {};

            // --- LOGIC FROM SENSOR_BIG.YAML & SENSOR_SMALL.YAML ---
            function getSensorState(entityId, type, labelLast, closedEntity) {
                const entity = states[entityId];
                if (!entity) return { name: "Unknown", label: "Entity not found", icon: "mdi:help-circle", styles: { card: {}, icon: {}, img_cell: {}, name: {}, label: {} } };

                let name = entity.attributes.friendly_name || entityId;
                if (type === 'cartridge') { name = 'Druckerpatrone'; }
                
                let label = entity.state;
                let icon = entity.attributes.icon || 'mdi:help-circle';
                let styles = { 
                    card: { background: 'var(--gray000)' }, 
                    icon: { color: 'var(--gray800)' }, 
                    img_cell: { background: 'rgba(var(--highlight))' }, 
                    name: { color: 'var(--gray800)' }, 
                    label: { color: 'var(--gray800)' } 
                };

                // This is a comprehensive translation of the logic in the sensor templates
                if (type === 'light') {
                    const isOn = entity.state === 'on';
                    label = isOn ? 'An' : 'Aus';
                    icon = entity.attributes.icon || 'mdi:lightbulb';
                    styles.card.background = isOn ? 'var(--active-light)' : 'var(--gray000)';
                    styles.name.color = isOn ? 'var(--gray000)' : 'var(--gray800)';
                    styles.label.color = styles.name.color;
                    styles.icon.color = styles.name.color;
                    styles.img_cell.background = isOn ? 'var(--gray800)' : 'rgba(var(--highlight))';
                }
                // ... a full implementation would include all other 'type' checks from your YAMLs here ...
                // e.g., 'mower', 'dishwasher', 'washing', 'door', 'window', 'temp', etc.

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

            // --- LOGIC FROM ROOM_CARD.YAML ---
            function getRoomCardState(entityId, tempId, humId) {
                const entity = states[entityId];
                if (!entity) return { name: "Raum", temp: "", icon: "mdi:home-city", nav_path: "#", isActive: false };
                
                let temp_html = '';
                if (tempId && states[tempId] && states[tempId].state !== 'unavailable') {
                     const tempVal = parseFloat(states[tempId].state);
                     if (!isNaN(tempVal)) temp_html += `${tempVal.toFixed(0)}°`;
                }
                if (humId && states[humId] && states[humId].state !== 'unavailable') {
                    const humVal = parseFloat(states[humId].state);
                    if (!isNaN(humVal)) temp_html += ` <span style="font-size:0.3em;opacity:0.7">${humVal.toFixed(0)}%</span>`;
                }
                
                return {
                    name: entity.attributes.friendly_name || 'Raum',
                    temp: temp_html,
                    icon: entity.attributes.icon || 'mdi:home-city',
                    nav_path: entity.attributes.room_type || '#',
                    isActive: entity.state === 'on'
                };
            }

            // --- DOM UPDATE FUNCTIONS ---
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
                        </a>`;
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
            
            // --- EVENT HANDLERS AND MAIN LOOP ---
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
                    // updateHeaderWeather(), updateHeaderPerson(), updateSceneButtons() would also be called here
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

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>DashView - Home</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css" rel="stylesheet">
    <style>
        :root {{
            --primary-font-family: 'Space Grotesk', sans-serif; --ha-card-border-radius: 12px; --background: #f5f7fa; --popupBG: #fafbfc;
            --gray000: #edeff2; --gray100: #e9eaec; --gray200: #d6d7d9; --gray300: #b6b7b9; --gray400: #909193; --gray500: #707173;
            --gray600: #494a4c; --gray700: #313233; --gray800: #0f0f10; --primary-text-color: var(--gray800); --secondary-text-color: var(--gray500);
            --red: #f0a994; --active-big: linear-gradient(145deg, rgba(255,220,178,1) 0%, rgba(255,176,233,1) 60%, rgba(104,156,255,1) 150%);
            --active-light: linear-gradient(145deg, rgba(255,245,200,1) 0%, rgba(255,225,130,1) 60%, rgba(255,200,90,1) 150%);
            --active-appliances: linear-gradient(145deg, rgba(220,245,220,1) 0%, rgba(200,235,200,1) 60%, rgba(180,225,180,1) 150%);
            --active-small: linear-gradient(145deg, rgba(255,212,193,1) 0%, rgba(248,177,235,1) 100%); --highlight: 40, 40, 42, 0.05;
        }}
        @media (prefers-color-scheme: dark) {{ :root {{ --background: #28282A; --popupBG: #28282A; --gray000: #3a3b3d; --gray800: #ffffff; --primary-text-color: var(--gray800); --highlight: 250, 251, 252, 0.05; }} }}
        body {{ font-family: var(--primary-font-family); background-color: var(--background); color: var(--primary-text-color); margin: 0; padding: 10px; }}
        .vertical-layout {{ display: flex; flex-direction: column; gap: 12px; max-width: 300px; margin: auto; }}
        .card {{ background-color: var(--gray100); border-radius: var(--ha-card-border-radius); padding: 16px; }}
        .grid-layout {{ display: grid; gap: 12px; }}
        .horizontal-stack {{ display: flex; gap: 6px; }}
        .placeholder {{ border: 2px dashed var(--gray400); padding: 10px; text-align: center; color: var(--gray500); border-radius: 15px; min-height: 70px; }}
        .room-grid-layout {{ display: grid; gap: 8px; }}
        .swipe-card-wrapper {{ perspective: 1000px; cursor: pointer; }}
        .swipe-card-content {{ position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }}
        .swipe-card-content.flipped {{ transform: rotateY(180deg); }}
        .sensor-card {{ position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; box-sizing: border-box; }}
        .sensor-card[data-label-last="true"] {{ transform: rotateY(180deg); }}
        .floor-title {{ font-size: 16px; font-weight: 500; justify-self: start; }}
        .tab-chip {{ display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 50%; background-color: var(--gray200); color: var(--gray800); cursor: pointer; }}
        .tab-chip.active {{ background: var(--active-small); color: var(--black); }}
        .floor-content {{ display: none; }}
        .room-card {{ min-width: 100%; height: 143px; box-sizing: border-box; }}
        .swipe-container {{ display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 8px; -ms-overflow-style: none; scrollbar-width: none; }}
        .swipe-container::-webkit-scrollbar {{ display: none; }}
        .swipe-container > * {{ scroll-snap-align: start; flex: 0 0 100%; }}
    </style>
</head>
<body>
    <div class="vertical-layout" style="padding-bottom: 80px;">
        {generate_floor_tabs_html()}
        {generate_floor_content_html()}
    </div>
    <script>{script_js}</script>
</body>
</html>
        """
        return html_content
