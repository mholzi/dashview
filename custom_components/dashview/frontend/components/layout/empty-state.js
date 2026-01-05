/**
 * Empty State Component
 * Shows a consistent placeholder message when no content is available
 * Used across admin tabs for a unified look and feel
 */

/**
 * Render an empty state message
 * @param {Function} html - lit-html template function
 * @param {Object} options - Empty state options
 * @param {string} options.icon - MDI icon name (e.g., 'mdi:weather-cloudy')
 * @param {string} options.title - Main title/heading
 * @param {string} [options.description] - Detailed description
 * @param {string} [options.hint] - Optional hint/action guidance (italicized)
 * @returns {TemplateResult} Empty state HTML
 */
export function renderEmptyState(html, { icon, title, description, hint }) {
  return html`
    <div class="admin-empty-state">
      <ha-icon icon="${icon}" class="admin-empty-state-icon"></ha-icon>
      <h3 class="admin-empty-state-title">${title}</h3>
      ${description ? html`<p class="admin-empty-state-description">${description}</p>` : ''}
      ${hint ? html`<p class="admin-empty-state-hint">${hint}</p>` : ''}
    </div>
  `;
}

