/**
 * Toggle Switch Component
 * A simple on/off toggle control
 */

/**
 * Render a toggle switch component
 * @param {Function} html - lit-html template function
 * @param {Object} options - Toggle options
 * @param {boolean} options.checked - Whether the toggle is on
 * @param {Function} options.onChange - Callback when toggled
 * @param {boolean} [options.disabled] - Whether the toggle is disabled
 * @returns {TemplateResult} Toggle switch HTML
 */
export function renderToggleSwitch(html, { checked, onChange, disabled = false }) {
  return html`
    <div
      class="toggle-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}"
      @click=${(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
    ></div>
  `;
}
