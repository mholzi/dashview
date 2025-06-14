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

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'rooms.json')

def get_rooms_data():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    return {
        'Wohnzimmer': {'icon': 'mdi:sofa', 'sensors': [{'entity': 'binary_sensor.fenster_terrasse', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_esszimmer_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_wohnzimmer_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.rauchmelder_wohnzimmer_smoke', 'entity_type': 'smoke'}, {'entity': 'media_player.unnamed_room', 'entity_type': 'music'}, {'entity': 'media_player.wohnzimmer', 'entity_type': 'tv'}]},
        'Aussen': {'icon': 'mdi:tree', 'sensors': [{'entity': 'binary_sensor.motion_garage_motion', 'entity_type': 'motion'}, {'entity': 'vacuum.sileno', 'entity_type': 'mower'}]},
        'Partykeller': {'icon': 'mdi:party-popper', 'sensors': [{'entity': 'binary_sensor.motion_partykeller_group', 'entity_type': 'motion'}, {'entity': 'binary_sensor.fenster_partykeller', 'entity_type': 'window'}, {'entity': 'binary_sensor.rauchmelder_partykeller1_smoke', 'entity_type': 'smoke'}]},
        'Küche': {'icon': 'mdi:stove', 'sensors': [{'entity': 'binary_sensor.motion_kuche_presence_sensor_1', 'entity_type': 'motion'}, {'entity': 'binary_sensor.fenster_kuche', 'entity_type': 'window'}, {'entity': 'sensor.geschirrspuler_operation_state', 'entity_type': 'dishwasher'}, {'entity': 'sensor.gefrierschrank_door_alarm_freezer', 'entity_type': 'freezer'}, {'entity': 'media_player.unnamed_room', 'entity_type': 'music'}]},
        'Büro': {'icon': 'mdi:desk', 'sensors': [{'entity': 'binary_sensor.motion_buro_presence_sensor_1', 'entity_type': 'motion'}, {'entity': 'binary_sensor.fenster_buero_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.vibration_buero_vibration', 'entity_type': 'vibration'}, {'entity': 'binary_sensor.rauchmelder_buro_smoke', 'entity_type': 'smoke'}, {'entity': 'media_player.echo_buero', 'entity_type': 'music'}]},
        'Gästeklo': {'icon': 'mdi:toilet', 'sensors': [{'entity': 'binary_sensor.motion_gasteklo_occupancy', 'entity_type': 'motion'}]},
        'Kellerflur': {'icon': 'mdi:floor-plan', 'sensors': [{'entity': 'binary_sensor.motion_kellerflur', 'entity_type': 'motion'}]},
        'Aupair': {'icon': 'mdi:account', 'sensors': [{'entity': 'binary_sensor.fenster_aupair', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_aupairbad_2', 'entity_type': 'window'}]},
        'Kinderbad': {'icon': 'mdi:toilet', 'sensors': [{'entity': 'binary_sensor.fenster_kinderbad_opening', 'entity_type': 'window'}]},
        'Heizungskeller': {'icon': 'mdi:heating-coil', 'sensors': [{'entity': 'binary_sensor.fenster_heizungskeller_opening', 'entity_type': 'window'}, {'entity': 'binary_sensor.motion_heizungskeller_occupancy', 'entity_type': 'motion'}]},
        'Serverraum': {'icon': 'mdi:server', 'sensors': [{'entity': 'binary_sensor.fenster_serverraum_opening', 'entity_type': 'window'}, {'entity': 'binary_sensor.motion_serverraum_occupancy', 'entity_type': 'motion'}]},
        'Kellerraum': {'icon': 'mdi:wardrobe', 'sensors': [{'entity': 'binary_sensor.fenster_buro_keller_opening', 'entity_type': 'window'}, {'entity': 'binary_sensor.motion_buro_keller_occupancy', 'entity_type': 'motion'}]},
        'Eltern': {'icon': 'mdi:bed-double', 'sensors': [{'entity': 'binary_sensor.fenster_elternbad_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_schlafzimmer_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.rauchmelder_schlafzimmer_smoke', 'entity_type': 'smoke'}, {'entity': 'media_player.echo_bad', 'entity_type': 'music'}]},
        'Wäschekeller': {'icon': 'mdi:washing-machine', 'sensors': [{'entity': 'binary_sensor.motion_waschkeller_occupancy', 'entity_type': 'motion'}, {'entity': 'binary_sensor.fenster_waschekeller_opening', 'entity_type': 'window'}, {'entity': 'sensor.waschmaschine_operation_state', 'entity_type': 'washing'}, {'entity': 'input_boolean.trockner_an', 'entity_type': 'dryer'}]},
        'Kinderzimmer': {'icon': 'mdi:human-child', 'sensors': [{'entity': 'binary_sensor.fenster_felicia_links', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_jp_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.fenster_frederik_contact', 'entity_type': 'window'}, {'entity': 'binary_sensor.rauchmelder_jan_philipp_smoke', 'entity_type': 'smoke'}, {'entity': 'binary_sensor.rauchmelder_frederik_smoke', 'entity_type': 'smoke'}, {'entity': 'binary_sensor.rauchmelder_felicia_smoke', 'entity_type': 'smoke'}]},
    }

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
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>DashView - Admin</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css" rel="stylesheet">
            <style>
                body {
                    font-family: 'Space Grotesk', sans-serif;
                    background-color: #f5f7fa;
                    color: #0f0f10;
                    margin: 20px;
                }
                .container { max-width: 800px; margin: auto; }
                .room { background: white; padding: 15px; border-radius: 15px; margin-bottom: 15px; }
                .room h3 { margin-top: 0; }
                .sensor { display: flex; justify-content: space-between; padding: 5px; border-bottom: 1px solid #e9eaec; }
                button { background-color: #abcbf8; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
                button:hover { background-color: #6c757d; }
                input { padding: 8px; border-radius: 8px; border: 1px solid #d6d7d9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Room Management</h1>
                <div id="rooms-container"></div>
                <div class="room">
                    <h3>Add New Room</h3>
                    <input type="text" id="new-room-name" placeholder="Room Name">
                    <input type="text" id="new-room-icon" placeholder="mdi:icon-name">
                    <button onclick="addRoom()">Add Room</button>
                </div>
            </div>
            <script>
                function renderRooms(rooms) {
                    const container = document.getElementById('rooms-container');
                    container.innerHTML = '';
                    for (const roomName in rooms) {
                        const room = rooms[roomName];
                        let roomHtml = `<div class="room"><h3><i class="mdi ${room.icon}"></i> ${roomName} <button onclick="deleteRoom('${roomName}')">Delete</button></h3>`;

                        room.sensors.forEach((sensor, index) => {
                            roomHtml += `<div class="sensor"><span>${sensor.entity} (${sensor.entity_type})</span><button onclick="deleteSensor('${roomName}', ${index})">x</button></div>`;
                        });

                        roomHtml += `<div>
                            <input type="text" id="new-sensor-entity-${roomName.replace(/\\s+/g, '-')}" placeholder="Sensor Entity">
                            <input type="text" id="new-sensor-type-${roomName.replace(/\\s+/g, '-')}" placeholder="Sensor Type">
                            <button onclick="addSensor('${roomName}')">Add Sensor</button>
                        </div>`;

                        roomHtml += '</div>';
                        container.innerHTML += roomHtml;
                    }
                }

                async function fetchRooms() {
                    const response = await fetch('/api/dashview/rooms');
                    const rooms = await response.json();
                    renderRooms(rooms);
                }

                async function addRoom() {
                    const name = document.getElementById('new-room-name').value;
                    const icon = document.getElementById('new-room-icon').value;
                    if (!name || !icon) return;
                    await fetch('/api/dashview/room', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({name, icon})
                    });
                    fetchRooms();
                }

                async function deleteRoom(roomName) {
                    await fetch('/api/dashview/room', {
                        method: 'DELETE',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({name: roomName})
                    });
                    fetchRooms();
                }

                async function addSensor(roomName) {
                    const entity = document.getElementById(`new-sensor-entity-${roomName.replace(/\\s+/g, '-')}`).value;
                    const entity_type = document.getElementById(`new-sensor-type-${roomName.replace(/\\s+/g, '-')}`).value;
                    if (!entity || !entity_type) return;

                    await fetch('/api/dashview/sensor', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({room: roomName, sensor: {entity, entity_type}})
                    });
                    fetchRooms();
                }

                async function deleteSensor(roomName, sensorIndex) {
                     await fetch('/api/dashview/sensor', {
                        method: 'DELETE',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({room: roomName, index: sensorIndex})
                    });
                    fetchRooms();
                }

                fetchRooms();
            </script>
        </body>
        </html>
        """
        return Response(text=html_content.strip(), content_type="text/html")

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
            return Response(
                body=json.dumps(states, cls=JSONEncoder),
                content_type="application/json",
            )
        return json_response({"error": "Not Found"}, status=404)

    async def post(self, request, path):
        data = await request.json()
        rooms = get_rooms_data()
        if path == "room":
            rooms[data['name']] = {"icon": data['icon'], "sensors": []}
        elif path == "sensor":
            rooms[data['room']]['sensors'].append(data['sensor'])

        save_rooms_data(rooms)
        return json_response({"success": True})

    async def delete(self, request, path):
        data = await request.json()
        rooms = get_rooms_data()
        if path == "room":
            if data['name'] in rooms:
                del rooms[data['name']]
        elif path == "sensor":
            if data['room'] in rooms and 0 <= data['index'] < len(rooms[data['room']]['sensors']):
                 del rooms[data['room']]['sensors'][data['index']]

        save_rooms_data(rooms)
        return json_response({"success": True})


class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""

    url = "/dashview"
    name = "dashview"
    requires_auth = False

    async def get(self, request):
        """Serve the DashView HTML."""

        rooms_data = get_rooms_data()

        def generate_room_header_icons(room_name):
            room_info = rooms_data.get(room_name, {})
            sensors = room_info.get('sensors', [])

            cards_html = ""
            for sensor in sensors:
                cards_html += f"""
                <div class="header-info-chip" data-entity-id="{sensor['entity']}" data-entity-type="{sensor['entity_type']}">
                    <div class="img-cell"><i class="icon mdi"></i></div>
                    <div class="name"></div>
                </div>
                """

            return f"""
            <div class="card" style="overflow-x: auto; display: flex; justify-content: flex-start; padding: 8px; border-radius: 0; --webkit-scrollbar-display: none;">
                <div class="horizontal-stack" style="gap: 8px;">{cards_html}</div>
            </div>
            """

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
            --primary-font-family: 'Space Grotesk', sans-serif;
            --ha-card-border-radius: 12px;
            --background: #f5f7fa;
            --popupBG: #fafbfc;
            --gray000: #edeff2;
            --gray100: #e9eaec;
            --gray200: #d6d7d9;
            --gray300: #b6b7b9;
            --gray400: #909193;
            --gray500: #707173;
            --gray600: #494a4c;
            --gray700: #313233;
            --gray800: #0f0f10;
            --primary-text-color: var(--gray800);
            --secondary-text-color: var(--gray500);
            --red: #f0a994;
            --active-big: linear-gradient(145deg, rgba(255,220,178,1) 0%, rgba(255,176,233,1) 60%, rgba(104,156,255,1) 150%);
        }}
        @media (prefers-color-scheme: dark) {{
            :root {{
                --background: #28282A;
                --popupBG: #28282A;
                --gray000: #3a3b3d;
                --gray800: #ffffff;
                --primary-text-color: var(--gray800);
            }}
        }}
        body {{
            font-family: var(--primary-font-family);
            background-color: var(--background);
            color: var(--primary-text-color);
            margin: 0;
            padding: 10px;
        }}
        .vertical-layout {{ display: flex; flex-direction: column; gap: 12px; max-width: 300px; margin: auto; }}
        .card {{ background-color: var(--gray000); border-radius: var(--ha-card-border-radius); padding: 16px; }}
        .grid-layout {{ display: grid; gap: 12px; }}
        .horizontal-stack {{ display: flex; gap: 6px; }}
        .placeholder {{ border: 2px dashed var(--gray400); padding: 10px; text-align: center; color: var(--gray500); border-radius: 15px; }}
        .popup {{ display: none; position: fixed; z-index: 10; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); backdrop-filter: blur(5px); }}
        .popup:target {{ display: flex; align-items: center; justify-content: center; }}
        .popup-content {{ background-color: var(--popupBG); margin: auto; padding: 20px; border-radius: 15px; width: 90%; max-width: 500px; position: relative; }}
        .close-popup {{ color: var(--gray500); position: absolute; top: 10px; right: 20px; font-size: 28px; font-weight: bold; text-decoration: none; }}
        
        .header-info-chip {{
            height: 42px;
            padding: 4px;
            border-radius: 12px;
            width: auto;
            min-width: 0;
            display: grid;
            grid-template-columns: 34px 1fr;
            grid-template-areas: 'i name';
            align-items: center;
        }}
        .header-info-chip .img-cell {{
            grid-area: i;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background: var(--gray800);
            border-radius: 50%;
        }}
        .header-info-chip .icon {{
            width: 22px;
            color: var(--gray000);
        }}
        .header-info-chip .name {{
            grid-area: name;
            justify-self: start;
            align-self: center;
            font-size: 13px;
            white-space: normal;
            overflow: visible;
            padding-left: 6px;
            padding-right: 6px;
        }}
    </style>
</head>
<body>

    <div class="vertical-layout">
        <div class="card" style="padding:0;">
            <div class="grid-layout" style="grid-template-columns: min-content 1fr max-content;">
                <div class="placeholder">kiosk_button</div>
                <div></div>
                <div class="card" style="border-radius: 10px; padding: 0;">
                    <div class="horizontal-stack">
                        <div class="placeholder">header_weather</div>
                        <div class="placeholder">header_person</div>
                    </div>
                </div>
            </div>
        </div>
        {generate_room_header_icons('Wohnzimmer')}
        <div class="placeholder card">...Other Cards...</div>

        <div class="card" style="position: fixed; bottom: 10px; left: 10px; right: 10px; width: calc(100% - 40px); border-radius: 100px; background: var(--gray800); padding: 10px; z-index: 5; max-width: 300px; margin: 0 auto;">
             <div class="grid-layout" style="grid-template-columns: repeat(6, 1fr); justify-items: center;">
                <a href="#aussen" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-tree" style="font-size: 24px;"></i></a>
                <a href="#security" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-security" style="font-size: 24px;"></i></a>
                <a href="#calendar" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-calendar" style="font-size: 24px;"></i></a>
                <a href="#music" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-music" style="font-size: 24px;"></i></a>
                <a href="#settings" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-tune-variant" style="font-size: 24px;"></i></a>
                <a href="/admin" target="_blank" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-cog" style="font-size: 24px;"></i></a>
            </div>
        </div>
    </div>

    <div id="weather" class="popup"><div class="popup-content"><a href="#" class="close-popup">&times;</a><h2>Wetter</h2><div class="placeholder">Weather content</div></div></div>
    
    {''.join([f'<div id="{room_name.lower().replace(" ", "-")}" class="popup"><div class="popup-content"><a href="#" class="close-popup">&times;</a><h2>{room_name}</h2>{generate_room_header_icons(room_name)}</div></div>' for room_name in rooms_data])}

    <script>
        let states = {{}};

        function getChipName(entityId, entityType) {
            const entity = states[entityId];
            if (!entity) return '–';

            switch (entityType) {
                case 'dishwasher':
                    const remaining = states['sensor.geschirrspuler_remaining_program_time'];
                    if (!remaining || !remaining.state || ['unknown', 'unavailable'].includes(remaining.state)) return 'Unknown';
                    const end = new Date(remaining.state).getTime();
                    const now = new Date().getTime();
                    const diffMin = Math.round((end - now) / 60000);
                    return diffMin > 0 ? `in ${diffMin}m` : 'Ready';
                case 'motion':
                    const lastChanged = new Date(entity.last_changed);
                    const now = new Date();
                    const diffSec = Math.floor((now - lastChanged) / 1000);
                    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
                    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
                    return `${Math.floor(diffSec / 86400)}d ago`;
                case 'mower':
                    const state = entity.state;
                    const error = entity.attributes?.error;
                    const errorMessages = {{'Wheel motor blocked': 'Radmotor blockiert', 'Wheel motor overloaded': 'Radmotor überlastet', 'Cutting system blocked': 'Mähwerk blockiert', 'No loop signal': 'Kein Schleifensignal', 'Upside down': 'Mäher umgekippt', 'Battery problem': 'Batterieproblem', 'Collision sensor problem': 'Kollisionssensor defekt', 'Lift sensor problem': 'Anhebesensor defekt', 'Charging station blocked': 'Ladestation blockiert', 'Outside working area': 'Außerhalb des Arbeitsbereichs', 'Trapped': 'Mäher festgefahren', 'Low battery': 'Batterie fast leer', 'OFF_HATCH_CLOSED': 'Klappe offen'}};
                    const stateDescriptions = {{'cleaning': 'Mäht', 'error': errorMessages[error] || 'Fehler', 'returning': 'Fährt zur Ladestation', 'paused': 'Pause', 'docked': 'Geparkt', 'idle': 'Bereit'}};
                    return stateDescriptions[state] || state;
                default:
                    return entity.attributes?.friendly_name || '–';
            }
        }

        function getChipIcon(entityId, entityType) {
            const entity = states[entityId];
            switch (entityType) {
                case 'motion': return entity?.state === 'off' ? 'mdi:motion-sensor-off' : 'mdi:motion-sensor';
                case 'window': return 'mdi:window-open-variant';
                case 'smoke': return 'mdi:smoke-detector-variant-alert';
                case 'music': return 'mdi:music-note';
                case 'tv': return 'mdi:television-play';
                case 'dishwasher': return 'mdi:dishwasher';
                case 'freezer':
                    const alarmDoor = states['sensor.gefrierschrank_door_alarm_freezer']?.state;
                    const alarmTemp = states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
                    return (alarmDoor === 'present' || alarmTemp === 'present') ? 'mdi:alert-circle' : 'mdi:fridge';
                case 'mower': return 'mdi:robot-mower';
                default: return 'mdi:help-circle-outline';
            }
        }
        
        function applyChipStyles(element, entityId, entityType) {
            const entity = states[entityId];
            const style = element.style;
            
            // Display logic
            let display = 'none';
            if (entity) {
                const state = entity.state;
                switch (entityType) {
                    case 'motion': display = 'grid'; break;
                    case 'music': case 'tv': if (state === 'playing') display = 'grid'; break;
                    case 'freezer':
                        const door = states['sensor.gefrierschrank_door_alarm_freezer']?.state;
                        const temp = states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
                        if (door === 'present' || temp === 'present') display = 'grid';
                        break;
                    case 'mower':
                        const err = entity.attributes?.error;
                        if (['cleaning', 'error'].includes(state) && err !== 'OFF_DISABLED') display = 'grid';
                        break;
                    default: if (state === 'on') display = 'grid'; break;
                }
            }
            style.display = display;

            // Background logic
            let background = 'var(--active-big)';
            if (entityType === 'smoke') background = 'var(--red)';
            if (entityType === 'motion') background = entity?.state === 'off' ? 'var(--gray000)' : 'var(--active-big)';
            element.style.background = background;
            
            // Name color logic
            let color = 'var(--gray000)';
            if (entityType === 'motion' && entity?.state === 'off') color = 'var(--gray800)';
            element.querySelector('.name').style.color = color;
        }

        async function updateDashboard() {
            const response = await fetch('/api/dashview/states');
            const statesArray = await response.json();
            states = Object.fromEntries(statesArray.map(s => [s.entity_id, s]));

            document.querySelectorAll('.header-info-chip').forEach(chip => {
                const entityId = chip.dataset.entityId;
                const entityType = chip.dataset.entityType;
                
                chip.querySelector('.name').textContent = getChipName(entityId, entityType);
                chip.querySelector('.icon').className = 'icon mdi ' + getChipIcon(entityId, entityType);
                applyChipStyles(chip, entityId, entityType);
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            updateDashboard();
            setInterval(updateDashboard, 5000); // Refresh every 5 seconds
        });

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


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    await async_unload_services(hass)
    return True
