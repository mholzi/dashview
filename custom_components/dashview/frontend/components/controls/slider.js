/**
 * Slider Component
 * A draggable slider control for values like brightness, volume, etc.
 */

/**
 * Render a slider control
 * @param {Function} html - lit-html template function
 * @param {Object} options - Slider options
 * @param {number} options.value - Current value (0-100)
 * @param {Function} options.onClick - Callback when slider is clicked
 * @param {Function} [options.onTouchStart] - Touch start handler
 * @param {Function} [options.onTouchMove] - Touch move handler
 * @param {Function} [options.onTouchEnd] - Touch end handler
 * @param {Function} [options.onMouseDown] - Mouse down handler
 * @param {boolean} [options.showThumb] - Whether to show slider thumb
 * @param {string} [options.className] - Additional class name
 * @returns {TemplateResult} Slider HTML
 */
export function renderSlider(html, {
  value,
  onClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  showThumb = true,
  className = ''
}) {
  return html`
    <div
      class="slider ${className}"
      @click=${onClick}
      @touchstart=${onTouchStart}
      @touchmove=${onTouchMove}
      @touchend=${onTouchEnd}
      @mousedown=${onMouseDown}
    >
      <div class="slider-fill" style="width: ${value}%"></div>
      ${showThumb ? html`
        <div class="slider-thumb" style="left: ${value}%"></div>
      ` : ''}
    </div>
  `;
}
