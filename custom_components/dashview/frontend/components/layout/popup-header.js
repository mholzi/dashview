/**
 * Popup Header Component
 * Reusable popup header with icon, title, and close button
 * Eliminates duplication across room-popup, weather-popup, and media-popup
 */

/**
 * Render a popup header
 * @param {Function} html - Lit html template function
 * @param {Object} config - Configuration object
 * @param {string} config.icon - MDI icon name (e.g., 'mdi:music')
 * @param {string} config.title - Popup title text
 * @param {Function} config.onClose - Close button click handler
 * @param {string} [config.iconStyle] - Optional inline style for icon background
 * @returns {TemplateResult} Popup header template
 */
export function renderPopupHeader(html, { icon, title, onClose, iconStyle = '' }) {
  return html`
    <div class="popup-header">
      <div class="popup-icon" style="${iconStyle}">
        <ha-icon icon="${icon}"></ha-icon>
      </div>
      <div class="popup-title">
        <h2>${title}</h2>
      </div>
      <button class="popup-close" @click=${onClose}>
        <ha-icon icon="mdi:close"></ha-icon>
      </button>
    </div>
  `;
}

/**
 * Render a popup overlay wrapper
 * @param {Function} html - Lit html template function
 * @param {Object} config - Configuration object
 * @param {Function} config.onOverlayClick - Overlay click handler
 * @param {Function} [config.onContainerClick] - Optional container click handler (e.g., stopPropagation)
 * @param {TemplateResult} content - Popup content to render inside
 * @returns {TemplateResult} Popup overlay template
 */
export function renderPopupOverlay(html, { onOverlayClick, onContainerClick }, content) {
  return html`
    <div class="popup-overlay" @click=${onOverlayClick}>
      <div class="popup-container" @click=${onContainerClick || (() => {})}>
        ${content}
      </div>
    </div>
  `;
}

export default { renderPopupHeader, renderPopupOverlay };
