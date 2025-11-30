/**
 * Entity Picker Component
 * A search input with dropdown suggestions for selecting Home Assistant entities
 */

/**
 * Render an entity picker with search suggestions
 * @param {Function} html - lit-html template function
 * @param {Object} options - Entity picker options
 * @param {Object} options.hass - Home Assistant instance
 * @param {string} options.value - Currently selected entity ID
 * @param {string} options.searchQuery - Current search query
 * @param {boolean} options.focused - Whether the input is focused
 * @param {Function} options.onSelect - Callback when entity is selected (entityId)
 * @param {Function} options.onSearch - Callback when search query changes (query)
 * @param {Function} options.onFocus - Callback when input is focused
 * @param {Function} options.onBlur - Callback when input is blurred
 * @param {string} [options.placeholder] - Placeholder text
 * @param {string} [options.domainFilter] - Filter by domain (e.g., 'sensor', 'weather')
 * @param {Function} [options.entityFilter] - Custom filter function (entityId, state) => boolean
 * @param {number} [options.maxSuggestions=10] - Maximum number of suggestions
 * @param {string} [options.className] - Additional CSS class
 * @returns {TemplateResult} Entity picker HTML
 */
export function renderEntityPicker(html, {
  hass,
  value,
  searchQuery,
  focused,
  onSelect,
  onSearch,
  onFocus,
  onBlur,
  placeholder = 'Search entities...',
  domainFilter = null,
  entityFilter = null,
  maxSuggestions = 10,
  className = ''
}) {
  const suggestions = getEntitySuggestions(hass, searchQuery, {
    domainFilter,
    entityFilter,
    maxSuggestions
  });

  const displayValue = searchQuery !== undefined && searchQuery !== null
    ? searchQuery
    : value || '';

  const selectedState = value ? hass?.states[value] : null;
  const selectedName = selectedState?.attributes?.friendly_name || value || '';

  return html`
    <div class="entity-picker ${className}">
      <div class="entity-picker-input-wrapper">
        <ha-icon icon="mdi:magnify" class="entity-picker-icon"></ha-icon>
        <input
          type="text"
          class="entity-picker-input"
          placeholder="${placeholder}"
          .value=${focused ? displayValue : (value ? selectedName : '')}
          @input=${(e) => onSearch(e.target.value)}
          @focus=${() => {
            onFocus();
            if (value && !searchQuery) {
              onSearch(value);
            }
          }}
          @blur=${() => setTimeout(() => onBlur(), 200)}
        />
        ${(searchQuery || value) ? html`
          <ha-icon
            icon="mdi:close"
            class="entity-picker-clear"
            @click=${() => {
              onSelect('');
              onSearch('');
            }}
          ></ha-icon>
        ` : ''}
      </div>

      ${focused && searchQuery ? html`
        <div class="entity-picker-suggestions">
          ${suggestions.length === 0 ? html`
            <div class="entity-picker-no-results">No matching entities found</div>
          ` : suggestions.map(entity => {
            const state = hass?.states[entity.entity_id];
            const icon = state?.attributes?.icon || getDefaultIcon(entity.entity_id);
            const friendlyName = state?.attributes?.friendly_name || entity.entity_id;
            const isSelected = entity.entity_id === value;

            return html`
              <div
                class="entity-picker-suggestion ${isSelected ? 'selected' : ''}"
                @mousedown=${(e) => {
                  e.preventDefault();
                  onSelect(entity.entity_id);
                  onSearch('');
                }}
              >
                <ha-icon icon="${icon}"></ha-icon>
                <div class="entity-picker-suggestion-info">
                  <div class="entity-picker-suggestion-name">${friendlyName}</div>
                  <div class="entity-picker-suggestion-entity">${entity.entity_id}</div>
                </div>
                ${isSelected ? html`
                  <ha-icon icon="mdi:check" class="entity-picker-suggestion-check"></ha-icon>
                ` : ''}
              </div>
            `;
          })}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Get entity suggestions based on search query
 * @param {Object} hass - Home Assistant instance
 * @param {string} query - Search query
 * @param {Object} options - Filter options
 * @returns {Array} Array of matching entity objects
 */
export function getEntitySuggestions(hass, query, options = {}) {
  if (!hass || !query) return [];

  const {
    domainFilter = null,
    entityFilter = null,
    maxSuggestions = 10
  } = options;

  const queryLower = query.toLowerCase();

  return Object.keys(hass.states)
    .filter(entityId => {
      // Domain filter
      if (domainFilter) {
        const domain = entityId.split('.')[0];
        if (Array.isArray(domainFilter)) {
          if (!domainFilter.includes(domain)) return false;
        } else if (domain !== domainFilter) {
          return false;
        }
      }

      // Custom filter
      if (entityFilter && !entityFilter(entityId, hass.states[entityId])) {
        return false;
      }

      // Search match
      const state = hass.states[entityId];
      const friendlyName = (state?.attributes?.friendly_name || '').toLowerCase();
      return entityId.toLowerCase().includes(queryLower) || friendlyName.includes(queryLower);
    })
    .slice(0, maxSuggestions)
    .map(entityId => ({ entity_id: entityId }));
}

/**
 * Get default icon for an entity based on domain
 * @param {string} entityId - Entity ID
 * @returns {string} MDI icon name
 */
function getDefaultIcon(entityId) {
  const domain = entityId.split('.')[0];
  const domainIcons = {
    sensor: 'mdi:eye',
    weather: 'mdi:weather-partly-cloudy',
    light: 'mdi:lightbulb',
    switch: 'mdi:toggle-switch',
    binary_sensor: 'mdi:checkbox-blank-circle',
    climate: 'mdi:thermostat',
    cover: 'mdi:window-shutter',
    media_player: 'mdi:speaker',
    scene: 'mdi:palette',
    script: 'mdi:script-text',
    automation: 'mdi:robot',
    input_boolean: 'mdi:toggle-switch-outline',
    input_number: 'mdi:numeric',
    input_select: 'mdi:form-dropdown',
    input_text: 'mdi:form-textbox',
    person: 'mdi:account',
    zone: 'mdi:map-marker',
    sun: 'mdi:white-balance-sunny',
  };
  return domainIcons[domain] || 'mdi:help-circle';
}

/**
 * Create state management for entity picker
 * @returns {Object} State object with query, focused, and helper methods
 */
export function createEntityPickerState() {
  return {
    query: '',
    focused: false,
    setQuery(q) { this.query = q; },
    setFocused(f) { this.focused = f; },
    reset() { this.query = ''; this.focused = false; }
  };
}
