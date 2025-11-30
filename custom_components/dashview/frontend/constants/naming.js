/**
 * Naming Conventions for Dashview
 *
 * This file documents the naming conventions used throughout the codebase.
 * When adding new properties or functions, follow these patterns for consistency.
 *
 * PROPERTY NAMING:
 * ================
 *
 * State/Settings (persisted):
 *   _enabled[Entity]s    - Map of enabled entity IDs { entityId: boolean }
 *                          Examples: _enabledRooms, _enabledLights, _enabledCovers
 *
 *   _[feature]Config     - Configuration objects for features
 *                          Examples: _floorCardConfig, _infoTextConfig
 *
 *   _[entity]Entity      - Single entity ID references
 *                          Examples: _weatherEntity, _hourlyForecastEntity
 *
 * UI State (transient):
 *   _active[Feature]     - Currently active/selected item
 *                          Examples: _activeTab, _activeFloorTab, _activeMediaTab
 *
 *   _[feature]Open       - Boolean for popup/modal open state
 *                          Examples: _weatherPopupOpen, _securityPopupOpen
 *
 *   _[feature]Expanded   - Boolean for collapsible section state
 *                          Examples: _popupLightExpanded, _popupCoverExpanded
 *
 *   _[feature]Index      - Current index in swipeable/carousel
 *                          Examples: _garbageCardIndex, _floorOverviewIndex
 *
 *   _[feature]SearchQuery    - Search input text
 *   _[feature]SearchFocused  - Search input focus state
 *
 * FUNCTION NAMING:
 * ================
 *
 * Render functions:
 *   render[Component]    - Returns HTML template
 *                          Examples: renderHomeTab, renderGarbageCard, renderFloorOverviewCard
 *
 * Event handlers:
 *   _handle[Event]       - Internal event handlers
 *                          Examples: _handleClick, _handleSwipe
 *
 *   _on[Action]          - Callback props passed to child components
 *                          Examples: _onToggle, _onChange
 *
 * Data getters:
 *   _get[Data]           - Methods that retrieve/compute data
 *                          Examples: _getAreaLights, _getGarbageData, _getOrderedFloors
 *
 *   _getArea[Entity]s    - Get entities for a specific area
 *                          Examples: _getAreaLights, _getAreaCovers
 *
 * Actions:
 *   _toggle[Entity]      - Toggle entity state
 *   _open[Popup]         - Open a popup/modal
 *   _close[Popup]        - Close a popup/modal
 *   _save[Data]          - Persist data
 *   _load[Data]          - Load data
 *
 * CSS CLASS NAMING:
 * =================
 *
 * Components:
 *   [component]-[element]        - BEM-like naming
 *                                  Examples: room-card, room-card-icon, room-card-name
 *
 * States:
 *   .active, .inactive           - Active/inactive states
 *   .expanded, .collapsed        - Expandable sections
 *   .on, .off                    - Toggle states
 *   .urgent, .soon               - Priority indicators
 *
 * Modifiers:
 *   .big, .small                 - Size variants
 *   .active-gradient             - Active with gradient background
 *   .active-light                - Active with light color (for lights)
 */

// Export naming patterns for reference
export const NAMING = {
  // Property prefixes
  ENABLED_PREFIX: '_enabled',
  ACTIVE_PREFIX: '_active',
  CONFIG_SUFFIX: 'Config',
  ENTITY_SUFFIX: 'Entity',
  OPEN_SUFFIX: 'Open',
  EXPANDED_SUFFIX: 'Expanded',
  INDEX_SUFFIX: 'Index',

  // Function prefixes
  RENDER_PREFIX: 'render',
  HANDLE_PREFIX: '_handle',
  GET_PREFIX: '_get',
  TOGGLE_PREFIX: '_toggle',
  OPEN_PREFIX: '_open',
  CLOSE_PREFIX: '_close',
  SAVE_PREFIX: '_save',
  LOAD_PREFIX: '_load',
};
