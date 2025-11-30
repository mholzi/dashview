/**
 * Skeleton Loading Components
 * Placeholder components shown while content is loading
 */

/**
 * Render skeleton loading state for floor overview card
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderFloorOverviewSkeleton(html) {
  return html`
    <div class="floor-overview-card loading">
      <div class="skeleton-slide">
        <div class="skeleton skeleton-name"></div>
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton skeleton-temp"></div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton loading state for garbage card
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderGarbageCardSkeleton(html) {
  return html`
    <div class="garbage-card loading">
      <div class="skeleton-slide">
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton skeleton-label"></div>
        <div class="skeleton skeleton-name"></div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton loading state for room cards
 * @param {Function} html - lit-html template function
 * @param {boolean} isBig - Whether this is a big card
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderRoomCardSkeleton(html, isBig = false) {
  return html`
    <div class="room-card ${isBig ? 'big' : 'small'} skeleton-card skeleton-room-card">
      <div class="skeleton-header">
        <div class="skeleton skeleton-text" style="width: 60px;"></div>
        <div class="skeleton skeleton-icon" style="width: 40px; height: 40px;"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-text large" style="width: 50%;"></div>
        <div class="skeleton skeleton-text small"></div>
      </div>
    </div>
  `;
}

/**
 * Render a generic skeleton card
 * @param {Function} html - lit-html template function
 * @param {Object} options - Skeleton options
 * @param {string} [options.className] - Additional CSS class
 * @param {number} [options.lines] - Number of text lines to show
 * @param {boolean} [options.showIcon] - Whether to show icon placeholder
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderSkeletonCard(html, { className = '', lines = 2, showIcon = true } = {}) {
  return html`
    <div class="skeleton-card ${className}">
      ${showIcon ? html`<div class="skeleton skeleton-icon"></div>` : ''}
      ${Array.from({ length: lines }, (_, i) => html`
        <div class="skeleton skeleton-text" style="width: ${80 - i * 20}%;"></div>
      `)}
    </div>
  `;
}
