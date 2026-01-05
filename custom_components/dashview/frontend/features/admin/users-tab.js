/**
 * Dashview Admin - Users Tab
 * User photo configuration per person entity
 */

import { t } from './shared.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

/**
 * Render the Users tab
 * Features: User photo configuration per person entity
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Users tab HTML
 */
export function renderUsersTab(panel, html) {
  // Get all person entities from Home Assistant
  const personEntities = Object.values(panel.hass?.states || {})
    .filter(entity => entity.entity_id.startsWith('person.'))
    .sort((a, b) => {
      const nameA = a.attributes.friendly_name || a.entity_id;
      const nameB = b.attributes.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });

  // Helper to get the display photo for a person
  const getDisplayPhoto = (personEntity) => {
    const customPhoto = panel._userPhotos?.[personEntity.entity_id];
    if (customPhoto) return customPhoto;
    return personEntity.attributes.entity_picture || null;
  };

  // Helper to update user photo
  const updateUserPhoto = (personId, photoUrl) => {
    panel._userPhotos = {
      ...panel._userPhotos,
      [personId]: photoUrl || ''
    };
    // Remove empty entries
    if (!photoUrl) {
      delete panel._userPhotos[personId];
      panel._userPhotos = { ...panel._userPhotos };
    }
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:account-group"></ha-icon>
      ${t('admin.users.title')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.users.description')}
    </p>

    ${personEntities.length > 0 ? html`
      <div class="card-config-section">
        <div class="card-config-section-content expanded">
          ${personEntities.map(person => {
            const personId = person.entity_id;
            const personName = person.attributes.friendly_name || personId;
            const customPhoto = panel._userPhotos?.[personId] || '';
            const displayPhoto = getDisplayPhoto(person);
            const hasCustomPhoto = !!panel._userPhotos?.[personId];

            return html`
              <div class="user-photo-item" style="display: flex; gap: 16px; padding: 16px; border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 12px; align-items: flex-start;">
                <!-- Photo Preview -->
                <div class="user-photo-preview" style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: var(--dv-gray200); display: flex; align-items: center; justify-content: center;">
                  ${displayPhoto
                    ? html`<img src="${displayPhoto}" alt="${personName}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : html`<ha-icon icon="mdi:account" style="--mdc-icon-size: 40px; color: var(--dv-gray500);"></ha-icon>`
                  }
                </div>

                <!-- Person Info & Photo URL -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 16px;">${personName}</span>
                    <span style="font-size: 12px; color: var(--dv-gray500);">${personId}</span>
                    ${hasCustomPhoto ? html`
                      <span style="font-size: 11px; background: var(--dv-blue100); color: var(--dv-blue600); padding: 2px 8px; border-radius: 12px;">Custom</span>
                    ` : ''}
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--dv-gray500);">
                      Status: <strong style="color: ${person.state === 'home' ? 'var(--dv-green600)' : 'var(--dv-gray600)'};">
                        ${person.state === 'home' ? 'Home' : person.state === 'not_home' ? 'Away' : person.state}
                      </strong>
                    </span>
                  </div>

                  <div style="margin-top: 12px;">
                    <label style="display: block; font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 4px;">
                      Custom Photo URL
                    </label>
                    <div style="display: flex; gap: 8px;">
                      <input
                        type="text"
                        placeholder="https://example.com/photo.jpg"
                        .value=${customPhoto}
                        @change=${(e) => updateUserPhoto(personId, e.target.value)}
                        style="flex: 1; padding: 8px 12px; border: 1px solid var(--dv-gray300); border-radius: 8px; font-size: 14px;"
                      />
                      ${customPhoto ? html`
                        <button
                          @click=${() => updateUserPhoto(personId, '')}
                          style="padding: 8px 12px; border: 1px solid var(--dv-gray300); border-radius: 8px; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--dv-red600);"
                          title="Remove custom photo"
                        >
                          <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon>
                        </button>
                      ` : ''}
                    </div>
                    <span style="display: block; font-size: 11px; color: var(--dv-gray500); margin-top: 4px;">
                      ${person.attributes.entity_picture
                        ? 'Leave empty to use the photo from Home Assistant.'
                        : 'No photo set in Home Assistant. Add a URL to set a custom photo.'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    ` : renderEmptyState(html, {
      icon: 'mdi:account-off',
      title: t('admin.users.noUsers'),
      description: 'Add person entities in Home Assistant to display user status',
      hint: t('admin.users.noUsersHint')
    })}
  `;
}
