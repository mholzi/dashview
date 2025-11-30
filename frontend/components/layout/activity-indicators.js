/**
 * Activity Indicators Component
 * Renders the floor/room activity row showing active rooms with lights, motion, or smoke
 */

/**
 * Create a room indicator object
 * @param {Object} roomData - Room data
 * @param {Object} roomData.area - Area object
 * @param {boolean} roomData.hasLight - Has active lights
 * @param {boolean} roomData.hasMotion - Has motion detected
 * @param {boolean} roomData.hasSmoke - Has smoke detected
 * @param {Function} getAreaIcon - Function to get area icon
 * @returns {Object} Room indicator object
 */
export function createRoomIndicator(roomData, getAreaIcon) {
  let type = 'room';
  if (roomData.hasSmoke) type = 'room-smoke';
  else if (roomData.hasMotion && !roomData.hasLight) type = 'room-motion';

  return {
    type,
    areaId: roomData.area.area_id,
    icon: getAreaIcon(roomData.area),
    label: roomData.area.name,
    hasLight: roomData.hasLight,
    hasMotion: roomData.hasMotion,
    hasSmoke: roomData.hasSmoke,
  };
}

/**
 * Find rooms with active entities of a given type
 * @param {Object} hass - Home Assistant instance
 * @param {Object} enabledMap - Map of entityId -> enabled boolean
 * @param {Object} enabledRooms - Map of areaId -> enabled boolean
 * @param {Function} getAreaIdForEntity - Function to get area ID for entity
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Set} Set of area IDs with active entities
 */
export function getRoomsWithActiveEntities(hass, enabledMap, enabledRooms, getAreaIdForEntity, labelId = null, entityHasLabel = null) {
  const rooms = new Set();
  Object.entries(enabledMap).forEach(([entityId, enabled]) => {
    if (!enabled) return;
    // Filter by current label if provided
    if (labelId && entityHasLabel && !entityHasLabel(entityId, labelId)) return;
    const state = hass?.states[entityId];
    if (!state || state.state !== 'on') return;
    const areaId = getAreaIdForEntity(entityId);
    if (areaId && enabledRooms[areaId]) rooms.add(areaId);
  });
  return rooms;
}

/**
 * Build active room indicators grouped by floor
 * @param {Object} options - Options
 * @param {Object} options.hass - Home Assistant instance
 * @param {Array} options.areas - All areas
 * @param {Object} options.enabledLights - Enabled lights map
 * @param {Object} options.enabledMotionSensors - Enabled motion sensors map
 * @param {Object} options.enabledSmokeSensors - Enabled smoke sensors map
 * @param {Object} options.enabledRooms - Enabled rooms map
 * @param {Function} options.getAreaIdForEntity - Function to get area ID for entity
 * @param {Function} options.getAreaIcon - Function to get area icon
 * @param {Function} options.getOrderedFloors - Function to get ordered floors
 * @param {Function} options.sortRoomsByOrder - Function to sort rooms by order
 * @returns {Array} Array of indicator objects
 */
export function buildActivityIndicators({
  hass,
  areas,
  enabledLights,
  enabledMotionSensors,
  enabledSmokeSensors,
  enabledRooms,
  getAreaIdForEntity,
  getAreaIcon,
  getOrderedFloors,
  sortRoomsByOrder
}) {
  if (!hass) return [];

  // Find rooms with active states
  const roomsWithLightsOn = getRoomsWithActiveEntities(hass, enabledLights, enabledRooms, getAreaIdForEntity);
  const roomsWithMotion = getRoomsWithActiveEntities(hass, enabledMotionSensors, enabledRooms, getAreaIdForEntity);
  const roomsWithSmoke = getRoomsWithActiveEntities(hass, enabledSmokeSensors, enabledRooms, getAreaIdForEntity);
  const allActiveRooms = new Set([...roomsWithLightsOn, ...roomsWithMotion, ...roomsWithSmoke]);

  // Group by floor
  const roomsByFloor = new Map();
  const roomsWithoutFloor = [];

  allActiveRooms.forEach(areaId => {
    const area = areas.find(a => a.area_id === areaId);
    if (!area) return;

    const roomData = {
      area,
      hasLight: roomsWithLightsOn.has(areaId),
      hasMotion: roomsWithMotion.has(areaId),
      hasSmoke: roomsWithSmoke.has(areaId)
    };

    if (area.floor_id) {
      if (!roomsByFloor.has(area.floor_id)) roomsByFloor.set(area.floor_id, []);
      roomsByFloor.get(area.floor_id).push(roomData);
    } else {
      roomsWithoutFloor.push(roomData);
    }
  });

  // Build indicators in floor order
  const indicators = [];
  const orderedFloors = getOrderedFloors();

  orderedFloors.filter(f => roomsByFloor.has(f.floor_id)).forEach(floor => {
    // Add floor indicator
    indicators.push({
      type: 'floor',
      icon: floor.icon || 'mdi:home-floor-0',
      label: floor.name
    });

    // Add room indicators for this floor
    sortRoomsByOrder(roomsByFloor.get(floor.floor_id), floor.floor_id)
      .forEach(rd => indicators.push(createRoomIndicator(rd, getAreaIcon)));
  });

  // Add unassigned rooms
  sortRoomsByOrder(roomsWithoutFloor, null)
    .forEach(rd => indicators.push(createRoomIndicator(rd, getAreaIcon)));

  return indicators;
}

/**
 * Render the activity row
 * @param {Function} html - lit-html template function
 * @param {Array} indicators - Array of indicator objects
 * @param {Function} onRoomClick - Callback when room is clicked
 * @returns {TemplateResult} Activity row HTML
 */
export function renderActivityRow(html, indicators, onRoomClick) {
  if (!indicators || indicators.length === 0) return '';

  return html`
    <div class="activity-row">
      ${indicators.map(indicator => html`
        <div
          class="activity-chip ${indicator.type === 'floor' ? 'floor-chip' : indicator.type === 'room-smoke' ? 'room-smoke-chip' : indicator.type === 'room-motion' ? 'room-motion-chip' : 'room-chip'}"
          title="${indicator.label}${indicator.hasMotion ? ' (Motion)' : ''}${indicator.hasSmoke ? ' (Smoke!)' : ''}"
          @click=${indicator.areaId ? () => onRoomClick(indicator.areaId) : null}
          style="${indicator.areaId ? 'cursor: pointer;' : ''}"
        >
          <ha-icon icon="${indicator.icon}"></ha-icon>
        </div>
      `)}
    </div>
  `;
}
