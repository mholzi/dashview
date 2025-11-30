/**
 * Chip Component
 * A small tag/badge element for displaying status or labels
 */

/**
 * Render a chip/tag element
 * @param {Function} html - lit-html template function
 * @param {Object} options - Chip options
 * @param {string} options.icon - MDI icon name
 * @param {string} options.label - Chip label text
 * @param {boolean} [options.active] - Whether chip is in active state
 * @param {string} [options.type] - Optional type for special styling (e.g., 'smoke', 'warning')
 * @param {Function} [options.onClick] - Optional click handler
 * @returns {TemplateResult} Chip HTML
 */
export function renderChip(html, { icon, label, active = false, type = '', onClick }) {
  return html`
    <div
      class="chip ${active ? 'active' : 'inactive'} ${type}"
      @click=${onClick}
    >
      <ha-icon icon="${icon}"></ha-icon>
      <span>${label}</span>
    </div>
  `;
}
