/**
 * Media Popup Module
 * Renders the global media player popup with area tabs and player controls
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { t } from '../../utils/i18n.js';

// Cache for Spotify artwork URLs (media_content_id -> image_url)
const spotifyArtworkCache = new Map();

/**
 * Get artwork URL for a preset, fetching from Spotify oEmbed if needed
 * @param {Object} preset - Media preset object
 * @param {Object} component - DashviewPanel instance for triggering updates
 * @returns {string|null} Image URL or null
 */
function getPresetArtwork(preset, component) {
  // If manually set image_url exists, use it
  if (preset.image_url) return preset.image_url;

  // Only fetch for Spotify URIs
  if (!preset.media_content_id?.startsWith('spotify:')) return null;

  // Check cache first
  if (spotifyArtworkCache.has(preset.media_content_id)) {
    return spotifyArtworkCache.get(preset.media_content_id);
  }

  // Fetch from Spotify oEmbed (async, will update cache and trigger re-render)
  fetchSpotifyArtwork(preset.media_content_id, component);

  return null; // Return null for now, will re-render when fetched
}

/**
 * Fetch artwork from Spotify oEmbed endpoint
 * @param {string} mediaContentId - Spotify URI
 * @param {Object} component - DashviewPanel instance
 */
async function fetchSpotifyArtwork(mediaContentId, component) {
  // Mark as fetching to prevent duplicate requests
  spotifyArtworkCache.set(mediaContentId, null);

  // Create unique request ID for this fetch
  const requestId = `spotify-artwork-${mediaContentId}`;

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(mediaContentId)}`;
    // Use request registry for abort handling on component unmount
    const signal = component._requestRegistry?.register(requestId);
    const fetchOptions = signal ? { signal } : {};
    const response = await fetch(oembedUrl, fetchOptions);
    // Mark request complete to clean up registry
    component._requestRegistry?.complete(requestId);

    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail_url) {
        spotifyArtworkCache.set(mediaContentId, data.thumbnail_url);
        component.requestUpdate();
      }
    }
  } catch (e) {
    // Gracefully handle abort errors (component unmounted)
    if (e.name === 'AbortError') {
      return;
    }
    // Clean up registry on error
    component._requestRegistry?.complete(requestId);
    console.warn('Failed to fetch Spotify artwork:', e);
  }
}

/**
 * Render the complete media popup
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Media popup template
 */
export function renderMediaPopup(component, html) {
  if (!component._mediaPopupOpen) return '';

  return html`
    <div class="popup-overlay" @click=${component._handleMediaPopupOverlayClick}>
      <div class="popup-container" @click=${(e) => e.stopPropagation()}>
        ${renderPopupHeader(html, {
          icon: 'mdi:music',
          title: t('ui.sections.music'),
          onClose: component._closeMediaPopup,
          iconStyle: 'background: var(--dv-gradient-media);'
        })}

        ${renderMediaContent(component, html)}
      </div>
    </div>
  `;
}

/**
 * Render media popup content with area tabs
 */
function renderMediaContent(component, html) {
  // Only show media players that are enabled in Admin AND assigned to a room
  const allMediaPlayers = component._getAllMediaPlayers().filter(p => p.enabled && p.areaId);

  if (allMediaPlayers.length === 0) {
    return html`
      <div class="popup-content">
        <div class="media-popup-empty">
          <ha-icon icon="mdi:speaker-off"></ha-icon>
          <div class="media-popup-empty-text">${t('ui.errors.no_media_players')}</div>
          <div class="media-popup-empty-subtext">${t('ui.errors.activate_in_admin')}</div>
        </div>
      </div>
    `;
  }

  // Group media players by area
  const areaGroups = {};
  allMediaPlayers.forEach(player => {
    if (!areaGroups[player.areaId]) {
      areaGroups[player.areaId] = {
        areaName: player.areaName,
        players: []
      };
    }
    areaGroups[player.areaId].players.push(player);
  });

  const areaIds = Object.keys(areaGroups);

  // Set active tab if not set
  if (!component._activeMediaTab && areaIds.length > 0) {
    component._activeMediaTab = areaIds[0];
  }

  const activeAreaPlayers = areaGroups[component._activeMediaTab]?.players || [];

  return html`
    <!-- Tabs for different areas -->
    <div class="media-popup-tabs">
      ${areaIds.map(areaId => html`
        <button
          class="media-popup-tab ${component._activeMediaTab === areaId ? 'active' : ''}"
          @click=${() => { component._activeMediaTab = areaId; component.requestUpdate(); }}
        >
          ${areaGroups[areaId].areaName}
        </button>
      `)}
    </div>

    <div class="popup-content">
      ${activeAreaPlayers.map(player => renderMediaPlayer(component, html, player))}
    </div>
  `;
}

/**
 * Render playlist buttons for quick selection
 */
function renderPlaylistButtons(component, html, entityId) {
  const presets = component._mediaPresets || [];
  if (presets.length === 0) return '';

  return html`
    <div class="popup-media-playlists">
      <div class="popup-media-playlists-scroll">
        ${presets.map(preset => {
          const artworkUrl = getPresetArtwork(preset, component);
          return html`
            <button
              class="popup-media-playlist-btn ${artworkUrl ? 'has-image' : ''}"
              @click=${() => component._playMediaPreset(entityId, preset.media_content_id)}
              title="${preset.name}"
            >
              ${artworkUrl ? html`
                <img class="popup-media-playlist-img" src="${artworkUrl}" alt="${preset.name}" />
              ` : html`
                <span class="popup-media-playlist-name">${preset.name}</span>
              `}
            </button>
          `;
        })}
      </div>
    </div>
  `;
}

/**
 * Render a single media player card
 */
function renderMediaPlayer(component, html, player) {
  const state = component.hass.states[player.entity_id];
  if (!state) return '';

  const isPlaying = state.state === 'playing';
  const isPaused = state.state === 'paused';
  const isOff = state.state === 'off' || state.state === 'unavailable';
  // Show full player for all states except off/unavailable (allows starting playback from idle/standby)
  const showControls = !isOff;
  const volumePercent = state.attributes?.volume_level !== undefined
    ? Math.round(state.attributes.volume_level * 100)
    : 0;

  return html`
    <div class="popup-media-player">
      <!-- Playlist Quick Select Buttons -->
      ${renderPlaylistButtons(component, html, player.entity_id)}

      ${showControls ? html`
        <!-- Artwork (show placeholder when idle/standby) -->
        <div class="popup-media-artwork-container">
          ${state.attributes?.entity_picture ? html`
            <img class="popup-media-artwork" src="${state.attributes.entity_picture}" alt="Album art">
          ` : html`
            <div class="popup-media-artwork-placeholder">
              <ha-icon icon="mdi:music"></ha-icon>
            </div>
          `}
        </div>

        <!-- Title and Artist (show state when not playing) -->
        <div class="popup-media-info">
          ${(isPlaying || isPaused) && state.attributes?.media_title ? html`
            <div class="popup-media-track-title">${state.attributes.media_title}</div>
            <div class="popup-media-track-artist">${state.attributes?.media_artist || t('media.unknown_artist')}</div>
          ` : html`
            <div class="popup-media-track-title">${player.name}</div>
            <div class="popup-media-track-artist">${state.state === 'idle' ? t('media.idle') : state.state === 'standby' ? t('media.standby', 'Bereit') : state.state}</div>
          `}
        </div>

        <!-- Controls -->
        <div class="popup-media-controls">
          <button class="popup-media-control-btn ${state.attributes?.repeat !== 'off' ? 'active' : ''}"
                  @click=${() => component._mediaToggleRepeat(player.entity_id)}>
            <ha-icon icon="${state.attributes?.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat'}"></ha-icon>
          </button>
          <button class="popup-media-control-btn"
                  @click=${() => component._mediaPrevious(player.entity_id)}>
            <ha-icon icon="mdi:skip-previous"></ha-icon>
          </button>
          <button class="popup-media-control-btn popup-media-play-btn"
                  @click=${() => component._mediaPlayPause(player.entity_id)}>
            <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
          </button>
          <button class="popup-media-control-btn"
                  @click=${() => component._mediaNext(player.entity_id)}>
            <ha-icon icon="mdi:skip-next"></ha-icon>
          </button>
          <button class="popup-media-control-btn ${state.attributes?.shuffle ? 'active' : ''}"
                  @click=${() => component._mediaToggleShuffle(player.entity_id)}>
            <ha-icon icon="mdi:shuffle"></ha-icon>
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="popup-media-volume-row">
          <div class="popup-media-volume-icon">
            <ha-icon icon="${state.attributes?.is_volume_muted ? 'mdi:volume-off' : volumePercent > 50 ? 'mdi:volume-high' : volumePercent > 0 ? 'mdi:volume-medium' : 'mdi:volume-low'}"></ha-icon>
          </div>
          <div class="popup-media-volume-slider"
            @click=${(e) => component._handleMediaVolumeSliderClick(e, player.entity_id)}
            @touchstart=${(e) => component._handleMediaVolumeSliderTouchStart(e, player.entity_id)}
            @touchmove=${(e) => component._handleMediaVolumeSliderTouchMove(e, player.entity_id)}
            @touchend=${(e) => component._handleMediaVolumeSliderTouchEnd(e)}
          >
            <div class="popup-media-volume-fill" style="width: ${volumePercent}%"></div>
            <div class="popup-media-volume-thumb" style="left: ${volumePercent}%"></div>
          </div>
          <div class="popup-media-volume-percent">${volumePercent}%</div>
        </div>
      ` : html`
        <div class="popup-media-idle">
          ${state.state === 'off' ? t('media.off') : t('media.unavailable', 'Nicht verfügbar')}
        </div>
      `}
    </div>
  `;
}

export default { renderMediaPopup };
