/**
 * Controls Components Index
 * Re-exports all control components for easy importing
 */

export { renderToggleSwitch } from './toggle-switch.js';
export { renderSlider } from './slider.js';
export { renderSearchInput } from './search-input.js';
export { createSwipeHandlers, renderSwipeable } from './swipeable.js';
export { createLightSliderHandlers, renderLightSliderItem } from './light-slider.js';
export {
  renderEntityPicker,
  getEntitySuggestions,
  createEntityPickerState
} from './entity-picker.js';

// Import sortable-list to ensure it registers as custom element
import './sortable-list.js';
export { SortableList } from './sortable-list.js';

// Import confirmation-dialog to ensure it registers as custom element
// Note: Class cannot be exported (async definition), use via document.createElement('confirmation-dialog')
import './confirmation-dialog.js';
