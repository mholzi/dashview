/**
 * Dashview Admin - Users Tab
 * User photo configuration and language settings
 */

import { t, createSectionHelpers } from './shared.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';
import { initI18n, getCurrentLang } from '../../utils/i18n.js';
import { withTimeout, TIMEOUT_DEFAULTS, mapPhotoError } from '../../utils/index.js';

// Upload configuration (must match backend)
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PHOTO_URL_PREFIX = '/local/dashview/user_photos';

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

/**
 * Convert a file to base64 data URL with timeout protection
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 data URL
 * @throws {Error} If file reading times out after 10 seconds
 */
function fileToBase64(file) {
  const readPromise = new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(new Error(`File read error: ${e.target?.error?.message || 'Unknown error'}`));
    reader.readAsDataURL(file);
  });

  return withTimeout(readPromise, TIMEOUT_DEFAULTS.FILE_READ, 'File reading');
}

/**
 * Upload a photo to the server with timeout protection
 * @param {Object} hass - Home Assistant instance
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
async function uploadPhoto(hass, file) {
  try {
    // File reading has 10s timeout
    const base64Data = await fileToBase64(file);

    // WebSocket upload has 30s timeout
    const result = await withTimeout(
      hass.callWS({
        type: 'dashview/upload_photo',
        filename: file.name,
        data: base64Data
      }),
      TIMEOUT_DEFAULTS.PHOTO_UPLOAD,
      'Photo upload'
    );
    return result;
  } catch (err) {
    // Use centralized error mapping for user-friendly messages
    // Technical details are logged inside mapPhotoError
    return { success: false, error: mapPhotoError(err) };
  }
}

/**
 * Delete a photo from the server with timeout protection
 * @param {Object} hass - Home Assistant instance
 * @param {string} path - The photo path to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deletePhoto(hass, path) {
  try {
    const result = await withTimeout(
      hass.callWS({
        type: 'dashview/delete_photo',
        path: path
      }),
      TIMEOUT_DEFAULTS.WS_CALL,
      'Photo delete'
    );
    return result;
  } catch (err) {
    // Use centralized error mapping for user-friendly messages
    // Technical details are logged inside mapPhotoError
    return { success: false, error: mapPhotoError(err) };
  }
}

/**
 * Validate a file for upload
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Use JPG, PNG, GIF, or WebP.' };
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return { valid: false, error: `File too large. Maximum size: ${MAX_PHOTO_SIZE / (1024 * 1024)}MB` };
  }
  return { valid: true };
}

/**
 * Render the Users tab
 * Features: User photo configuration and language settings
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Users tab HTML
 */
export function renderUsersTab(panel, html) {
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  // Get all person entities from Home Assistant
  const personEntities = Object.values(panel.hass?.states || {})
    .filter(entity => entity.entity_id.startsWith('person.'))
    .sort((a, b) => {
      const nameA = a.attributes.friendly_name || a.entity_id;
      const nameB = b.attributes.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });

  // Initialize upload states if needed
  if (!panel._photoUploadStates) {
    panel._photoUploadStates = {};
  }

  // Get current language
  const currentLang = getCurrentLang() || 'en';
  const haLang = panel.hass?.language?.split('-')[0] || 'en';

  // Check if using manual override
  const manualLangOverride = panel._manualLanguage;
  const effectiveLang = manualLangOverride || currentLang;

  // Helper to get the display photo for a person
  const getDisplayPhoto = (personEntity) => {
    const customPhoto = panel._userPhotos?.[personEntity.entity_id];
    if (customPhoto) return customPhoto;
    return null;
  };

  // Helper to update user photo in settings
  const updateUserPhoto = (personId, photoUrl) => {
    panel._userPhotos = {
      ...panel._userPhotos,
      [personId]: photoUrl || ''
    };
    if (!photoUrl) {
      delete panel._userPhotos[personId];
      panel._userPhotos = { ...panel._userPhotos };
    }
    panel._saveSettings();
    panel.requestUpdate();
  };

  // Set upload state for a person
  const setUploadState = (personId, state) => {
    panel._photoUploadStates = {
      ...panel._photoUploadStates,
      [personId]: state
    };
    panel.requestUpdate();
  };

  // Handle file selection (from drop or click)
  const handleFileSelect = async (personId, file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState(personId, { error: validation.error });
      return;
    }

    setUploadState(personId, { uploading: true });

    const oldPhoto = panel._userPhotos?.[personId];
    if (oldPhoto && oldPhoto.startsWith(PHOTO_URL_PREFIX)) {
      await deletePhoto(panel.hass, oldPhoto);
    }

    const result = await uploadPhoto(panel.hass, file);

    if (result.success && result.path) {
      updateUserPhoto(personId, result.path);
      setUploadState(personId, { success: true });
      setTimeout(() => setUploadState(personId, {}), 2000);
    } else {
      setUploadState(personId, { error: result.error || 'Upload failed' });
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  };

  // Handle drop
  const handleDrop = (e, personId) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileSelect(personId, file);
    }
  };

  // Handle click to open file picker
  const handleClick = (personId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED_TYPES.join(',');
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(personId, file);
      }
    };
    input.click();
  };

  // Handle delete photo
  const handleDelete = async (personId) => {
    const currentPhoto = panel._userPhotos?.[personId];
    if (!currentPhoto) return;

    setUploadState(personId, { deleting: true });

    if (currentPhoto.startsWith(PHOTO_URL_PREFIX)) {
      await deletePhoto(panel.hass, currentPhoto);
    }

    updateUserPhoto(personId, '');
    setUploadState(personId, {});
  };

  // Handle language change
  const handleLanguageChange = async (langCode) => {
    if (langCode === 'auto') {
      // Use Home Assistant language
      panel._manualLanguage = null;
      delete panel._manualLanguage;
      await initI18n(haLang);
    } else {
      // Manual override
      panel._manualLanguage = langCode;
      await initI18n(langCode);
    }
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:account-cog"></ha-icon>
      ${t('admin.users.title', 'Users & Settings')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.users.description', 'Configure user photos and language preferences.')}
    </p>

    <!-- Language Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('language')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:translate"></ha-icon>
          ${t('admin.users.language', 'Language')}
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('language') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('language') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          ${t('admin.users.languageDesc', 'Choose the display language for Dashview. By default, it follows your Home Assistant language setting.')}
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Auto (follow HA) option -->
          <label
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 16px;
              border: 2px solid ${!manualLangOverride ? 'var(--dv-blue500)' : 'var(--dv-gray300)'};
              border-radius: 10px;
              cursor: pointer;
              background: ${!manualLangOverride ? 'var(--dv-blue50)' : 'transparent'};
              transition: all 0.2s ease;
            "
            @click=${() => handleLanguageChange('auto')}
          >
            <input
              type="radio"
              name="language"
              .checked=${!manualLangOverride}
              style="width: 18px; height: 18px; accent-color: var(--dv-blue500);"
            />
            <span style="font-size: 20px;">🌐</span>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 14px; color: var(--dv-gray800);">
                ${t('admin.users.autoLanguage', 'Automatic')}
              </div>
              <div style="font-size: 12px; color: var(--dv-gray500);">
                ${t('admin.users.autoLanguageDesc', 'Follow Home Assistant language')} (${haLang.toUpperCase()})
              </div>
            </div>
            ${!manualLangOverride ? html`
              <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 20px; color: var(--dv-blue500);"></ha-icon>
            ` : ''}
          </label>

          <!-- Manual language options -->
          ${SUPPORTED_LANGUAGES.map(lang => html`
            <label
              style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border: 2px solid ${manualLangOverride === lang.code ? 'var(--dv-blue500)' : 'var(--dv-gray300)'};
                border-radius: 10px;
                cursor: pointer;
                background: ${manualLangOverride === lang.code ? 'var(--dv-blue50)' : 'transparent'};
                transition: all 0.2s ease;
              "
              @click=${() => handleLanguageChange(lang.code)}
            >
              <input
                type="radio"
                name="language"
                .checked=${manualLangOverride === lang.code}
                style="width: 18px; height: 18px; accent-color: var(--dv-blue500);"
              />
              <span style="font-size: 20px;">${lang.flag}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 14px; color: var(--dv-gray800);">${lang.name}</div>
              </div>
              ${manualLangOverride === lang.code ? html`
                <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 20px; color: var(--dv-blue500);"></ha-icon>
              ` : ''}
            </label>
          `)}
        </div>
      </div>
    </div>

    <!-- User Photos Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('userPhotos')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:account-group"></ha-icon>
          ${t('admin.users.photosTitle', 'User Photos')}
          <span style="font-size: 12px; color: var(--dv-gray500); font-weight: normal; margin-left: 8px;">
            (${personEntities.length})
          </span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('userPhotos') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('userPhotos') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          ${t('admin.users.photosDesc', 'Upload custom profile photos for each person entity.')}
        </p>

        ${personEntities.length > 0 ? html`
          ${personEntities.map(person => {
            const personId = person.entity_id;
            const personName = person.attributes.friendly_name || personId;
            const displayPhoto = getDisplayPhoto(person);
            const hasCustomPhoto = !!panel._userPhotos?.[personId];
            const uploadState = panel._photoUploadStates?.[personId] || {};

            return html`
              <div class="user-photo-item" style="display: flex; gap: 16px; padding: 16px; border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 12px; align-items: flex-start;">
                <!-- Photo Drop Zone -->
                <div
                  class="photo-drop-zone ${uploadState.uploading ? 'uploading' : ''}"
                  @dragover=${handleDragOver}
                  @dragleave=${handleDragLeave}
                  @drop=${(e) => handleDrop(e, personId)}
                  @click=${() => !uploadState.uploading && handleClick(personId)}
                  style="
                    flex-shrink: 0;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: var(--dv-gray200);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: ${uploadState.uploading ? 'wait' : 'pointer'};
                    border: 2px dashed var(--dv-gray400);
                    transition: all 0.2s ease;
                    position: relative;
                  "
                >
                  ${uploadState.uploading ? html`
                    <ha-icon icon="mdi:loading" style="--mdc-icon-size: 28px; color: var(--dv-blue500); animation: spin 1s linear infinite;"></ha-icon>
                  ` : displayPhoto ? html`
                    <img src="${displayPhoto}" alt="${personName}" style="width: 100%; height: 100%; object-fit: cover;" />
                  ` : html`
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px; text-align: center;">
                      <ha-icon icon="mdi:cloud-upload" style="--mdc-icon-size: 24px; color: var(--dv-gray500);"></ha-icon>
                      <span style="font-size: 9px; color: var(--dv-gray500); line-height: 1.2;">Drop/Click</span>
                    </div>
                  `}
                </div>

                <!-- Person Info -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                    <span style="font-weight: 600; font-size: 15px;">${personName}</span>
                    ${hasCustomPhoto ? html`
                      <span style="font-size: 10px; background: var(--dv-blue100); color: var(--dv-blue600); padding: 2px 6px; border-radius: 10px;">${t('admin.users.custom')}</span>
                    ` : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--dv-gray500); margin-bottom: 8px;">${personId}</div>

                  <!-- Status -->
                  <div style="font-size: 12px; color: var(--dv-gray500); margin-bottom: 8px;">
                    Status: <strong style="color: ${person.state === 'home' ? 'var(--dv-green600)' : 'var(--dv-gray600)'};">
                      ${person.state === 'home' ? t('admin.users.statusHome', 'Home') : person.state === 'not_home' ? t('admin.users.statusAway', 'Away') : person.state}
                    </strong>
                  </div>

                  <!-- Upload Status Messages -->
                  ${uploadState.error ? html`
                    <div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--dv-red100); border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
                      <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 16px; color: var(--dv-red600);"></ha-icon>
                      <span style="color: var(--dv-red600); flex: 1;">${uploadState.error}</span>
                      <button @click=${() => setUploadState(personId, {})} style="background: none; border: none; cursor: pointer; padding: 2px;">
                        <ha-icon icon="mdi:close" style="--mdc-icon-size: 14px; color: var(--dv-red600);"></ha-icon>
                      </button>
                    </div>
                  ` : ''}

                  ${uploadState.success ? html`
                    <div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--dv-green100); border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
                      <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 16px; color: var(--dv-green600);"></ha-icon>
                      <span style="color: var(--dv-green600);">${t('admin.users.uploadSuccess', 'Photo uploaded!')}</span>
                    </div>
                  ` : ''}

                  <!-- Actions -->
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button
                      @click=${() => handleClick(personId)}
                      ?disabled=${uploadState.uploading || uploadState.deleting}
                      style="
                        padding: 6px 12px;
                        border: 1px solid var(--dv-gray300);
                        border-radius: 6px;
                        background: var(--dv-gray50);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        color: var(--dv-gray700);
                      "
                    >
                      <ha-icon icon="mdi:upload" style="--mdc-icon-size: 16px;"></ha-icon>
                      ${hasCustomPhoto ? t('admin.users.changePhoto', 'Change') : t('admin.users.uploadPhoto', 'Upload')}
                    </button>

                    ${hasCustomPhoto ? html`
                      <button
                        @click=${() => handleDelete(personId)}
                        ?disabled=${uploadState.uploading || uploadState.deleting}
                        style="
                          padding: 6px 12px;
                          border: 1px solid var(--dv-red200);
                          border-radius: 6px;
                          background: var(--dv-red50);
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          gap: 4px;
                          font-size: 12px;
                          color: var(--dv-red600);
                        "
                      >
                        <ha-icon icon="mdi:delete" style="--mdc-icon-size: 16px;"></ha-icon>
                        ${uploadState.deleting ? '...' : t('admin.users.removePhoto', 'Remove')}
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          })}
        ` : renderEmptyState(html, {
          icon: 'mdi:account-off',
          title: t('admin.users.noUsers'),
          description: t('admin.users.noUsersHint', 'Add person entities in Home Assistant to configure their photos.')
        })}
      </div>
    </div>

    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .photo-drop-zone:hover:not(.uploading) {
        border-color: var(--dv-blue500) !important;
        background: var(--dv-blue50) !important;
      }
      .photo-drop-zone.dragover {
        border-color: var(--dv-blue500) !important;
        background: var(--dv-blue100) !important;
        transform: scale(1.05);
      }
      .photo-drop-zone img {
        transition: opacity 0.2s ease;
      }
      .photo-drop-zone:hover:not(.uploading) img {
        opacity: 0.7;
      }
    </style>
  `;
}
