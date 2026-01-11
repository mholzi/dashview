/**
 * Dashview Admin - Users Tab
 * User photo configuration per person entity with drag-and-drop upload
 */

import { t } from './shared.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

// Upload configuration (must match backend)
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PHOTO_URL_PREFIX = '/local/dashview/user_photos';

/**
 * Convert a file to base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a photo to the server
 * @param {Object} hass - Home Assistant instance
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, path?: string, error?: string}>}
 */
async function uploadPhoto(hass, file) {
  try {
    const base64Data = await fileToBase64(file);
    const result = await hass.callWS({
      type: 'dashview/upload_photo',
      filename: file.name,
      data: base64Data
    });
    return result;
  } catch (err) {
    console.error('Photo upload failed:', err);
    return { success: false, error: err.message || 'Upload failed' };
  }
}

/**
 * Delete a photo from the server
 * @param {Object} hass - Home Assistant instance
 * @param {string} path - The photo path to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deletePhoto(hass, path) {
  try {
    const result = await hass.callWS({
      type: 'dashview/delete_photo',
      path: path
    });
    return result;
  } catch (err) {
    console.error('Photo delete failed:', err);
    return { success: false, error: err.message || 'Delete failed' };
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
 * Features: User photo configuration per person entity with drag-and-drop upload
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

  // Initialize upload states if needed
  if (!panel._photoUploadStates) {
    panel._photoUploadStates = {};
  }

  // Helper to get the display photo for a person
  const getDisplayPhoto = (personEntity) => {
    const customPhoto = panel._userPhotos?.[personEntity.entity_id];
    if (customPhoto) return customPhoto;
    return null; // Don't fallback to HA entity_picture
  };

  // Helper to update user photo in settings
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

    // Delete old photo if it's from our upload directory
    const oldPhoto = panel._userPhotos?.[personId];
    if (oldPhoto && oldPhoto.startsWith(PHOTO_URL_PREFIX)) {
      await deletePhoto(panel.hass, oldPhoto);
    }

    // Upload new photo
    const result = await uploadPhoto(panel.hass, file);

    if (result.success && result.path) {
      updateUserPhoto(personId, result.path);
      setUploadState(personId, { success: true });
      // Clear success state after 2 seconds
      setTimeout(() => setUploadState(personId, {}), 2000);
    } else {
      setUploadState(personId, { error: result.error || 'Upload failed' });
    }
  };

  // Handle drag over
  const handleDragOver = (e, personId) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.add('dragover');
  };

  // Handle drag leave
  const handleDragLeave = (e, personId) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('dragover');
  };

  // Handle drop
  const handleDrop = (e, personId) => {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('dragover');

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

    // Delete from server if it's from our upload directory
    if (currentPhoto.startsWith(PHOTO_URL_PREFIX)) {
      await deletePhoto(panel.hass, currentPhoto);
    }

    // Remove from settings
    updateUserPhoto(personId, '');
    setUploadState(personId, {});
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
            const displayPhoto = getDisplayPhoto(person);
            const hasCustomPhoto = !!panel._userPhotos?.[personId];
            const uploadState = panel._photoUploadStates?.[personId] || {};

            return html`
              <div class="user-photo-item" style="display: flex; gap: 16px; padding: 16px; border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 12px; align-items: flex-start;">
                <!-- Photo Drop Zone -->
                <div
                  class="photo-drop-zone ${uploadState.uploading ? 'uploading' : ''}"
                  @dragover=${(e) => handleDragOver(e, personId)}
                  @dragleave=${(e) => handleDragLeave(e, personId)}
                  @drop=${(e) => handleDrop(e, personId)}
                  @click=${() => !uploadState.uploading && handleClick(personId)}
                  style="
                    flex-shrink: 0;
                    width: 100px;
                    height: 100px;
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
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                      <ha-icon icon="mdi:loading" style="--mdc-icon-size: 32px; color: var(--dv-blue500); animation: spin 1s linear infinite;"></ha-icon>
                    </div>
                  ` : displayPhoto ? html`
                    <img src="${displayPhoto}" alt="${personName}" style="width: 100%; height: 100%; object-fit: cover;" />
                  ` : html`
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px; text-align: center;">
                      <ha-icon icon="mdi:cloud-upload" style="--mdc-icon-size: 28px; color: var(--dv-gray500);"></ha-icon>
                      <span style="font-size: 10px; color: var(--dv-gray500); line-height: 1.2;">Drop or<br>Click</span>
                    </div>
                  `}
                </div>

                <!-- Person Info -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 16px;">${personName}</span>
                    <span style="font-size: 12px; color: var(--dv-gray500);">${personId}</span>
                    ${hasCustomPhoto ? html`
                      <span style="font-size: 11px; background: var(--dv-blue100); color: var(--dv-blue600); padding: 2px 8px; border-radius: 12px;">Custom</span>
                    ` : ''}
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 13px; color: var(--dv-gray500);">
                      Status: <strong style="color: ${person.state === 'home' ? 'var(--dv-green600)' : 'var(--dv-gray600)'};">
                        ${person.state === 'home' ? 'Home' : person.state === 'not_home' ? 'Away' : person.state}
                      </strong>
                    </span>
                  </div>

                  <!-- Upload Status Messages -->
                  ${uploadState.error ? html`
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--dv-red100); border-radius: 8px; margin-bottom: 8px;">
                      <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 18px; color: var(--dv-red600);"></ha-icon>
                      <span style="font-size: 13px; color: var(--dv-red600);">${uploadState.error}</span>
                      <button
                        @click=${() => setUploadState(personId, {})}
                        style="margin-left: auto; background: none; border: none; cursor: pointer; padding: 4px;"
                      >
                        <ha-icon icon="mdi:close" style="--mdc-icon-size: 16px; color: var(--dv-red600);"></ha-icon>
                      </button>
                    </div>
                  ` : ''}

                  ${uploadState.success ? html`
                    <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--dv-green100); border-radius: 8px; margin-bottom: 8px;">
                      <ha-icon icon="mdi:check-circle" style="--mdc-icon-size: 18px; color: var(--dv-green600);"></ha-icon>
                      <span style="font-size: 13px; color: var(--dv-green600);">Photo uploaded successfully!</span>
                    </div>
                  ` : ''}

                  <!-- Actions -->
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button
                      @click=${() => handleClick(personId)}
                      ?disabled=${uploadState.uploading || uploadState.deleting}
                      style="
                        padding: 8px 16px;
                        border: 1px solid var(--dv-gray300);
                        border-radius: 8px;
                        background: var(--dv-gray50);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 13px;
                        color: var(--dv-gray700);
                        transition: all 0.2s ease;
                      "
                    >
                      <ha-icon icon="mdi:upload" style="--mdc-icon-size: 18px;"></ha-icon>
                      ${hasCustomPhoto ? 'Change Photo' : 'Upload Photo'}
                    </button>

                    ${hasCustomPhoto ? html`
                      <button
                        @click=${() => handleDelete(personId)}
                        ?disabled=${uploadState.uploading || uploadState.deleting}
                        style="
                          padding: 8px 16px;
                          border: 1px solid var(--dv-red200);
                          border-radius: 8px;
                          background: var(--dv-red50);
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          gap: 6px;
                          font-size: 13px;
                          color: var(--dv-red600);
                          transition: all 0.2s ease;
                        "
                        title="Remove photo"
                      >
                        <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon>
                        ${uploadState.deleting ? 'Removing...' : 'Remove'}
                      </button>
                    ` : ''}
                  </div>

                  <span style="display: block; font-size: 11px; color: var(--dv-gray500); margin-top: 8px;">
                    Drag and drop an image or click to upload. Max size: 5MB. Formats: JPG, PNG, GIF, WebP.
                  </span>
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
