/**
 * Light Slider Component
 * Handles touch and mouse interactions for light brightness sliders
 */

import { triggerHaptic } from '../../utils/haptic.js';

/**
 * Create light slider event handlers
 * @param {Object} options - Handler options
 * @param {Function} options.onBrightnessChange - Callback when brightness changes (entityId, percentage)
 * @param {Function} options.onToggle - Callback when light should be toggled (entityId)
 * @param {Function} options.getSliderElement - Function to get slider element from event
 * @returns {Object} Event handler methods and state
 */
export function createLightSliderHandlers({ onBrightnessChange, onToggle, getSliderElement }) {
  // Internal state
  let dragging = false;
  let currentEntityId = null;
  let sliderItem = null;
  let sliderValue = undefined;
  let dragAbortController = null; // SECURITY: Track AbortController for cleanup (Story 7.4, GitHub #1)

  /**
   * Calculate percentage from position within element
   * @param {number} clientX - Client X position
   * @param {DOMRect} rect - Element bounding rect
   * @returns {number} Clamped percentage (1-100)
   */
  const calculatePercentage = (clientX, rect) => {
    const percentage = Math.round(((clientX - rect.left) / rect.width) * 100);
    return Math.max(1, Math.min(100, percentage));
  };

  /**
   * Update visual elements during drag
   * @param {number} percentage - Current percentage
   */
  const updateVisuals = (percentage) => {
    if (!sliderItem) return;

    const sliderBg = sliderItem.querySelector('.popup-light-slider-bg');
    if (sliderBg) {
      sliderBg.style.width = `${percentage}%`;
    }

    const brightnessEl = sliderItem.querySelector('.popup-light-brightness');
    if (brightnessEl) {
      brightnessEl.textContent = `${percentage}%`;
    }
  };

  /**
   * Reset internal state
   */
  const resetState = () => {
    if (sliderItem) {
      sliderItem.classList.remove('dragging');
    }
    dragging = false;
    currentEntityId = null;
    sliderValue = undefined;
    sliderItem = null;
  };

  /**
   * Handle click on slider (when not dragging) - toggles light on/off
   * @param {Event} e - Click event
   * @param {string} entityId - Entity ID
   */
  const handleClick = (e, entityId) => {
    if (dragging) return;
    // Tap toggles light on/off (drag changes brightness)
    if (onToggle) {
      onToggle(entityId);
    }
  };

  /**
   * Handle touch start
   * @param {TouchEvent} e - Touch event
   * @param {string} entityId - Entity ID
   */
  const handleTouchStart = (e, entityId) => {
    triggerHaptic('light');
    dragging = true;
    currentEntityId = entityId;

    const item = e.currentTarget.closest('.popup-light-item');
    if (item) {
      item.classList.add('dragging');
      sliderItem = item;
    }
  };

  /**
   * Handle touch move
   * @param {TouchEvent} e - Touch event
   * @param {string} entityId - Entity ID
   */
  const handleTouchMove = (e, entityId) => {
    if (!dragging || currentEntityId !== entityId) return;

    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const percentage = calculatePercentage(e.touches[0].clientX, rect);

    updateVisuals(percentage);
    sliderValue = percentage;

    // Prevent scrolling while dragging
    e.preventDefault();
  };

  /**
   * Handle touch end
   */
  const handleTouchEnd = () => {
    if (!dragging) return;

    // If dragged (sliderValue set), change brightness; otherwise toggle
    if (sliderValue !== undefined && currentEntityId) {
      onBrightnessChange(currentEntityId, sliderValue);
    } else if (currentEntityId && onToggle) {
      // No drag movement = tap = toggle
      onToggle(currentEntityId);
    }

    resetState();
  };

  /**
   * Handle mouse down (desktop support)
   * SECURITY: Uses AbortController for guaranteed cleanup (Story 7.4, GitHub #1)
   * @param {MouseEvent} e - Mouse event
   * @param {string} entityId - Entity ID
   */
  const handleMouseDown = (e, entityId) => {
    triggerHaptic('light');
    dragging = true;
    currentEntityId = entityId;

    const item = e.currentTarget.closest('.popup-light-item');
    if (item) {
      item.classList.add('dragging');
      sliderItem = item;
    }

    // SECURITY: Create AbortController for this drag operation
    // This ensures listeners are removed even if component unmounts during drag
    dragAbortController = new AbortController();
    const { signal } = dragAbortController;

    const handleMouseMove = (moveEvent) => {
      if (!dragging) return;

      const slider = item.querySelector('.popup-light-slider-area');
      if (!slider) return;

      const rect = slider.getBoundingClientRect();
      const percentage = calculatePercentage(moveEvent.clientX, rect);

      updateVisuals(percentage);
      sliderValue = percentage;
    };

    const handleMouseUp = () => {
      try {
        // If dragged (sliderValue set), change brightness; otherwise toggle
        if (sliderValue !== undefined && currentEntityId) {
          onBrightnessChange(currentEntityId, sliderValue);
        } else if (currentEntityId && onToggle) {
          // No drag movement = click = toggle
          onToggle(currentEntityId);
        }
      } finally {
        // ALWAYS cleanup, even on error
        resetState();
        if (dragAbortController) {
          dragAbortController.abort();
          dragAbortController = null;
        }
      }
    };

    // Use signal for automatic cleanup when abort() is called
    document.addEventListener('mousemove', handleMouseMove, { signal });
    document.addEventListener('mouseup', handleMouseUp, { signal });

    e.preventDefault();
  };

  /**
   * Cleanup function for external use (e.g., disconnectedCallback)
   * SECURITY: Ensures no memory leaks if component unmounts during drag
   */
  const cleanup = () => {
    if (dragAbortController) {
      dragAbortController.abort();
      dragAbortController = null;
    }
    resetState();
  };

  return {
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    isDragging: () => dragging,
    cleanup, // SECURITY: Expose for component cleanup
  };
}

/**
 * Render a light slider item
 * @param {Function} html - lit-html template function
 * @param {Object} options - Slider options
 * @param {Object} options.light - Light entity data
 * @param {Object} options.handlers - Event handlers from createLightSliderHandlers
 * @param {Function} options.onToggle - Toggle light callback
 * @returns {TemplateResult} Light slider HTML
 */
export function renderLightSliderItem(html, { light, handlers, onToggle }) {
  const isOn = light.state === 'on';
  const brightness = light.brightnessPercent || 0;

  return html`
    <div class="popup-light-item ${isOn ? 'on' : 'off'}">
      <div class="popup-light-toggle" @click=${() => onToggle(light.entity_id)}>
        <ha-icon icon="${light.icon || 'mdi:lightbulb'}"></ha-icon>
      </div>
      <div class="popup-light-info">
        <div class="popup-light-name">${light.name}</div>
        <div class="popup-light-brightness">${isOn ? `${brightness}%` : 'Aus'}</div>
      </div>
      ${light.isDimmable ? html`
        <div
          class="popup-light-slider-area"
          @click=${(e) => handlers.handleClick(e, light.entity_id)}
          @touchstart=${(e) => handlers.handleTouchStart(e, light.entity_id)}
          @touchmove=${(e) => handlers.handleTouchMove(e, light.entity_id)}
          @touchend=${() => handlers.handleTouchEnd()}
          @mousedown=${(e) => handlers.handleMouseDown(e, light.entity_id)}
        >
          <div class="popup-light-slider-bg" style="width: ${isOn ? brightness : 0}%"></div>
        </div>
      ` : ''}
    </div>
  `;
}
