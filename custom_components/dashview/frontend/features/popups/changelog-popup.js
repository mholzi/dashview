/**
 * Changelog Popup Module
 * Renders the "What's New" popup showing version updates
 */

import { renderPopupHeader } from '../../components/layout/popup-header.js';
import { getNewChanges } from '../../constants/changelog.js';

/**
 * Get icon for change type
 */
function getChangeTypeIcon(type) {
  switch (type) {
    case 'feature': return 'mdi:star';
    case 'improvement': return 'mdi:trending-up';
    case 'fix': return 'mdi:bug-check';
    case 'breaking': return 'mdi:alert';
    default: return 'mdi:information';
  }
}

/**
 * Get label for change type
 */
function getChangeTypeLabel(type) {
  switch (type) {
    case 'feature': return 'Neu';
    case 'improvement': return 'Verbessert';
    case 'fix': return 'Behoben';
    case 'breaking': return 'Achtung';
    default: return 'Info';
  }
}

/**
 * Render the changelog popup
 */
export function renderChangelogPopup(component, html) {
  if (!component._changelogPopupOpen) return '';

  const lastSeenVersion = component._lastSeenVersion;
  const newChanges = getNewChanges(lastSeenVersion);
  const currentIndex = component._changelogPageIndex || 0;
  const totalPages = newChanges.length;
  const currentEntry = newChanges[currentIndex];

  if (!currentEntry) {
    component._closeChangelogPopup();
    return '';
  }

  const isLastPage = currentIndex >= totalPages - 1;
  const isFirstPage = currentIndex === 0;

  return html`
    <div class="popup-overlay" @click=${component._handleChangelogOverlayClick}>
      <div class="popup-container changelog-popup" @click=${(e) => e.stopPropagation()}>
        ${renderPopupHeader(html, {
          icon: 'mdi:party-popper',
          title: 'Was ist neu?',
          onClose: component._closeChangelogPopup,
          iconStyle: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
        })}

        <div class="changelog-content">
          <!-- Page indicator -->
          ${totalPages > 1 ? html`
            <div class="changelog-page-indicator">
              ${currentIndex + 1} / ${totalPages}
            </div>
          ` : ''}

          <!-- Title & Subtitle -->
          <h3 class="changelog-title">${currentEntry.title}</h3>
          ${currentEntry.subtitle ? html`
            <p class="changelog-subtitle">${currentEntry.subtitle}</p>
          ` : ''}

          <!-- Changes list -->
          <div class="changelog-changes">
            ${currentEntry.changes.map(change => html`
              <div class="changelog-change-item ${change.type}">
                <div class="changelog-change-icon">
                  <ha-icon icon="${getChangeTypeIcon(change.type)}"></ha-icon>
                </div>
                <div class="changelog-change-content">
                  <span class="changelog-change-type">${getChangeTypeLabel(change.type)}</span>
                  <span class="changelog-change-description">${change.description}</span>
                </div>
              </div>
            `)}
          </div>

          <!-- Pagination dots -->
          ${totalPages > 1 ? html`
            <div class="changelog-pagination">
              ${newChanges.map((_, index) => html`
                <span class="changelog-dot ${index === currentIndex ? 'active' : ''}"
                      @click=${() => { component._changelogPageIndex = index; component.requestUpdate(); }}></span>
              `)}
            </div>
          ` : ''}
        </div>

        <!-- Footer with buttons -->
        <div class="changelog-footer">
          <!-- Skip button (always visible except on last page) -->
          ${!isLastPage ? html`
            <button class="changelog-button secondary" @click=${component._closeChangelogPopup}>
              <span>Überspringen</span>
            </button>
          ` : ''}

          <!-- Spacer -->
          <div class="changelog-footer-spacer"></div>

          <!-- Next or Close button -->
          ${isLastPage ? html`
            <button class="changelog-button primary" @click=${component._closeChangelogPopup}>
              <ha-icon icon="mdi:check"></ha-icon>
              <span>Los geht's!</span>
            </button>
          ` : html`
            <button class="changelog-button primary" @click=${component._nextChangelogPage}>
              <span>Weiter</span>
              <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

export default { renderChangelogPopup };
