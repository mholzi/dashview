/**
 * Toggle Switch Component
 * A simple on/off toggle control
 */

import { triggerHaptic } from '../../utils/haptic.js';

/**
 * Render a toggle switch component
 * @param {Function} html - lit-html template function
 * @param {Object} options - Toggle options
 * @param {boolean} options.checked - Whether the toggle is on
 * @param {Function} options.onChange - Callback when toggled
 * @param {boolean} [options.disabled] - Whether the toggle is disabled
 * @param {boolean} [options.small] - Whether to use a smaller toggle size
 * @returns {TemplateResult} Toggle switch HTML
 */
export function renderToggleSwitch(html, { checked, onChange, disabled = false, small = false }) {
  return html`
    <div
      class="toggle-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''} ${small ? 'small' : ''}"
      @click=${(e) => {
        e.stopPropagation();
        if (!disabled) {
          triggerHaptic('light');
          onChange();
        }
      }}
    ></div>
  `;
}
