/**
 * User Popup Module
 * Renders the user profile popup with photo, status, and presence history
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { calculateTimeDifference } from '../../utils/helpers.js';
import { t } from '../../utils/i18n.js';

/**
 * Format a timestamp to a human-readable "time ago" string
 * @param {string} lastChanged - ISO timestamp
 * @returns {string} Formatted time string
 */
function formatTimeAgo(lastChanged) {
  if (!lastChanged) return '';

  const last = new Date(lastChanged);
  if (isNaN(last.getTime())) return '';

  const now = new Date();
  const diffMs = now - last;

  if (isNaN(diffMs) || diffMs < 0) return '';

  const { days, hours, minutes } = calculateTimeDifference(diffMs);

  if (isNaN(minutes)) return '';

  if (days >= 2) return t('time.days_ago', { count: days }, `${days} days ago`);
  if (days >= 1) return t('time.yesterday', 'Yesterday');
  if (hours >= 1) return t('time.hours_ago', { count: hours }, `${hours}h ago`);
  if (minutes >= 1) return t('time.minutes_ago', { count: minutes }, `${minutes}m ago`);
  return t('time.just_now', 'Just now');
}

/**
 * Format a timestamp for history display (includes time of day)
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
 */
function formatHistoryTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `${t('time.today', 'Today')} ${timeStr}`;
  } else if (isYesterday) {
    return `${t('time.yesterday', 'Yesterday')} ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr} ${timeStr}`;
  }
}

/**
 * Render the complete user popup
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} User popup template
 */
export function renderUserPopup(component, html) {
  if (!component._userPopupOpen) return '';

  const person = component._getUserPopupData();
  if (!person) return '';

  const presenceHistory = component._presenceHistory || [];

  return html`
    <div class="popup-overlay" @click=${component._handleUserPopupOverlayClick}>
      <div class="popup-container" @click=${(e) => e.stopPropagation()}>
        ${renderPopupHeader(html, {
          icon: 'mdi:account',
          title: person.name,
          onClose: component._closeUserPopup,
          iconStyle: person.state === 'home'
            ? 'background: var(--success-color, var(--dv-green500));'
            : 'background: var(--dv-gray500);'
        })}

        <div class="popup-content">
          ${renderProfileCard(component, html, person)}
          ${renderPresenceHistory(component, html, presenceHistory)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the profile card section (Items 1-4: Photo, Name, Status, Time)
 */
function renderProfileCard(component, html, person) {
  const timeAgo = formatTimeAgo(person.lastChanged);

  return html`
    <div class="user-popup-profile-card">
      <!-- Item 1: Profile Photo -->
      <div class="user-popup-avatar ${person.state === 'home' ? 'home' : 'away'}">
        ${person.picture
          ? html`<img src="${person.picture}" alt="${person.name}" />`
          : html`<ha-icon icon="mdi:account"></ha-icon>`
        }
      </div>

      <!-- Item 2: Name and Entity ID -->
      <div class="user-popup-identity">
        <div class="user-popup-name">${person.name}</div>
        <div class="user-popup-entity-id">@${person.entityId.split('.')[1]}</div>
      </div>

      <!-- Items 3+4: Status Chip + Time -->
      <div class="user-popup-status-section">
        <div class="user-popup-status-chip ${person.state === 'home' ? 'home' : 'away'}">
          <ha-icon icon="${person.state === 'home' ? 'mdi:home' : 'mdi:map-marker'}"></ha-icon>
          <span>${person.state === 'home' ? t('status.home', 'Home') : t('status.away', 'Away')}</span>
        </div>
        ${timeAgo ? html`
          <div class="user-popup-status-time">
            ${t('status.since', 'since')} ${timeAgo}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render the presence history section (Item 5)
 */
function renderPresenceHistory(component, html, history) {
  // If history is still loading or empty
  if (!history || history.length === 0) {
    return html`
      <div class="user-popup-history-section">
        <div class="user-popup-history-header" @click=${component._togglePresenceHistoryExpanded}>
          <ha-icon icon="mdi:history"></ha-icon>
          <span class="user-popup-history-title">${t('user.presence_history', 'Presence History')}</span>
          <span class="user-popup-history-count">${t('user.no_history', 'No recent activity')}</span>
        </div>
      </div>
    `;
  }

  return html`
    <div class="user-popup-history-section">
      <div class="user-popup-history-header" @click=${component._togglePresenceHistoryExpanded}>
        <ha-icon icon="mdi:history"></ha-icon>
        <span class="user-popup-history-title">${t('user.presence_history', 'Presence History')}</span>
        <span class="user-popup-history-count">${history.length} ${t('common.events', 'events')}</span>
      </div>

      <div class="user-popup-history-content ${component._presenceHistoryExpanded ? 'expanded' : ''}">
        <div class="user-popup-history-list">
          ${history.map(item => html`
            <div class="user-popup-history-card ${item.state === 'home' ? 'active' : 'inactive'}">
              <div class="user-popup-history-icon">
                <ha-icon icon="${item.state === 'home' ? 'mdi:home' : 'mdi:map-marker-outline'}"></ha-icon>
              </div>
              <div class="user-popup-history-info">
                <div class="user-popup-history-action">
                  ${item.state === 'home'
                    ? t('user.arrived_home', 'Arrived home')
                    : t('user.left_home', 'Left home')}
                </div>
                <div class="user-popup-history-time">
                  ${formatHistoryTime(item.last_changed)}
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  `;
}

export default { renderUserPopup };
