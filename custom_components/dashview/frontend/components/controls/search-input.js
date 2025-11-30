/**
 * Search Input Component
 * A search input with icon and clear button
 */

/**
 * Render a search input with clear button
 * @param {Function} html - lit-html template function
 * @param {Object} options - Search input options
 * @param {string} options.placeholder - Placeholder text
 * @param {string} options.value - Current search value
 * @param {Function} options.onInput - Callback when input changes
 * @param {Function} options.onClear - Callback when clear button is clicked
 * @param {Function} [options.onFocus] - Optional callback on focus
 * @param {Function} [options.onBlur] - Optional callback on blur
 * @param {string} [options.className] - Optional additional class name
 * @returns {TemplateResult} Search input HTML
 */
export function renderSearchInput(html, {
  placeholder,
  value,
  onInput,
  onClear,
  onFocus,
  onBlur,
  className = ''
}) {
  return html`
    <div class="search-input-wrapper ${className}">
      <ha-icon icon="mdi:magnify" class="search-input-icon"></ha-icon>
      <input
        type="text"
        class="search-input"
        placeholder="${placeholder}"
        .value=${value || ''}
        @input=${(e) => onInput(e.target.value)}
        @focus=${onFocus}
        @blur=${onBlur}
      />
      ${value ? html`
        <ha-icon
          icon="mdi:close"
          class="search-input-clear"
          @click=${onClear}
        ></ha-icon>
      ` : ''}
    </div>
  `;
}
