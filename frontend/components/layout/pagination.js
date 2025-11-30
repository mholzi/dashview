/**
 * Pagination Component
 * Dots indicator for swipeable/carousel content
 */

/**
 * Render pagination dots
 * @param {Function} html - lit-html template function
 * @param {Object} options - Pagination options
 * @param {number} options.total - Total number of items
 * @param {number} options.current - Current active index
 * @param {Function} options.onSelect - Callback when a dot is clicked (receives index)
 * @param {string} [options.className] - Additional CSS class
 * @returns {TemplateResult} Pagination dots HTML
 */
export function renderPagination(html, { total, current, onSelect, className = '' }) {
  if (total <= 1) return '';

  return html`
    <div class="pagination ${className}">
      ${Array.from({ length: total }, (_, idx) => html`
        <div
          class="pagination-dot ${idx === current ? 'active' : ''}"
          @click=${(e) => { e.stopPropagation(); onSelect(idx); }}
        ></div>
      `)}
    </div>
  `;
}

/**
 * Render floor overview style pagination dots
 * @param {Function} html - lit-html template function
 * @param {Object} options - Pagination options
 * @param {number} options.total - Total number of items
 * @param {number} options.current - Current active index
 * @param {Function} options.onSelect - Callback when a dot is clicked (receives index)
 * @returns {TemplateResult} Floor overview pagination dots HTML
 */
export function renderFloorOverviewPagination(html, { total, current, onSelect }) {
  return renderPagination(html, {
    total,
    current,
    onSelect,
    className: 'floor-overview-pagination'
  });
}

/**
 * Render garbage card style pagination dots
 * @param {Function} html - lit-html template function
 * @param {Object} options - Pagination options
 * @param {number} options.total - Total number of items
 * @param {number} options.current - Current active index
 * @param {Function} options.onSelect - Callback when a dot is clicked (receives index)
 * @returns {TemplateResult} Garbage pagination dots HTML
 */
export function renderGarbagePagination(html, { total, current, onSelect }) {
  return renderPagination(html, {
    total,
    current,
    onSelect,
    className: 'garbage-pagination'
  });
}
