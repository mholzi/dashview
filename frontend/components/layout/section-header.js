/**
 * Section Header Component
 * An expandable section header with icon, title, and chevron
 */

/**
 * Render an expandable section header
 * @param {Function} html - lit-html template function
 * @param {Object} options - Section header options
 * @param {string} options.icon - MDI icon name
 * @param {string} options.title - Section title
 * @param {string} [options.subtitle] - Optional subtitle/count text
 * @param {boolean} options.expanded - Whether section is expanded
 * @param {Function} options.onToggle - Callback when header is clicked
 * @returns {TemplateResult} Section header HTML
 */
export function renderSectionHeader(html, { icon, title, subtitle, expanded, onToggle }) {
  return html`
    <div class="section-header" @click=${onToggle}>
      <div class="section-header-title">
        <ha-icon icon="${icon}"></ha-icon>
        <span>${title}</span>
        ${subtitle ? html`<span class="section-header-subtitle">${subtitle}</span>` : ''}
      </div>
      <ha-icon
        class="section-header-chevron ${expanded ? 'expanded' : ''}"
        icon="mdi:chevron-down"
      ></ha-icon>
    </div>
  `;
}
