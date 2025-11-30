/**
 * Empty State Component
 * Shows a placeholder message when no content is available
 */

/**
 * Render an empty state message
 * @param {Function} html - lit-html template function
 * @param {Object} options - Empty state options
 * @param {string} options.icon - MDI icon name
 * @param {string} options.message - Main message
 * @param {string} [options.hint] - Optional hint/subtitle
 * @returns {TemplateResult} Empty state HTML
 */
export function renderEmptyState(html, { icon, message, hint }) {
  return html`
    <div class="empty-state">
      <ha-icon icon="${icon}" style="--mdc-icon-size: 48px;"></ha-icon>
      <div class="empty-state-message">${message}</div>
      ${hint ? html`<div class="empty-state-hint">${hint}</div>` : ''}
    </div>
  `;
}
