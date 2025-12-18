/**
 * Media Popup Styles
 * Media player controls, TV section, and media-specific popup styles
 */

export const mediaPopupStyles = `
  /* ==================== POPUP TV SECTION ==================== */
  .popup-tv-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-tv-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
  }

  .popup-tv-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-tv-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-tv-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--dv-gray600);
    padding-right: 12px;
  }

  .popup-tv-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 8px 8px 8px;
  }

  .popup-tv-item {
    display: flex;
    align-items: center;
    padding: 4px 20px 4px 4px;
    height: 68px;
    gap: 12px;
    border-radius: 12px;
    cursor: pointer;
    box-sizing: border-box;
    transition: background var(--dv-transition-normal) ease;
  }

  .popup-tv-item.on {
    background: var(--dv-gradient-active);
  }

  .popup-tv-item.off {
    background: var(--dv-gray000);
  }

  .popup-tv-item:active {
    transform: scale(0.98);
  }

  .popup-tv-item-icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .popup-tv-item.on .popup-tv-item-icon {
    background: var(--dv-white);
  }

  .popup-tv-item.off .popup-tv-item-icon {
    background: rgba(var(--dv-highlight-rgb), 0.3);
  }

  .popup-tv-item-icon ha-icon {
    --mdc-icon-size: 22px;
  }

  .popup-tv-item.on .popup-tv-item-icon ha-icon {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-icon ha-icon {
    color: var(--dv-gray800);
  }

  .popup-tv-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .popup-tv-item-name {
    font-size: 14px;
    font-weight: 500;
  }

  .popup-tv-item.on .popup-tv-item-name {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-name {
    color: var(--dv-gray800);
  }

  .popup-tv-item-state {
    font-size: 12px;
    opacity: 0.7;
  }

  .popup-tv-item.on .popup-tv-item-state {
    color: var(--dv-black);
  }

  .popup-tv-item.off .popup-tv-item-state {
    color: var(--dv-gray600);
  }

  /* ==================== POPUP MEDIA PLAYER SECTION ==================== */
  .popup-media-section {
    margin: 0 12px 16px 12px;
    background: var(--dv-gray200);
    border-radius: 12px;
    overflow: hidden;
  }

  .popup-media-header {
    display: flex;
    align-items: center;
    padding: 6px 0;
    min-height: 46px;
    cursor: pointer;
  }

  .popup-media-header ha-icon {
    width: 22px;
    padding: 8px 14px;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-media-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--dv-gray800, var(--primary-text-color));
  }

  .popup-media-count {
    margin-left: auto;
    font-size: 14px;
    color: var(--dv-gray600);
    padding-right: 20px;
    margin-right: 10px;
  }

  .popup-media-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height var(--dv-transition-slow) ease;
  }

  .popup-media-content.expanded {
    max-height: 1000px;
  }

  .popup-media-player {
    padding: 12px;
    background: var(--dv-gray000);
    margin: 4px;
    border-radius: 10px;
  }

  .popup-media-player-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray800);
    margin-bottom: 8px;
  }

  .popup-media-artwork-container {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .popup-media-artwork {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    object-fit: cover;
    background: var(--dv-gray300);
  }

  .popup-media-artwork-placeholder {
    width: 100%;
    max-width: 250px;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    background: var(--dv-gray300);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .popup-media-artwork-placeholder ha-icon {
    --mdc-icon-size: 64px;
    color: var(--dv-gray500);
  }

  .popup-media-info {
    text-align: center;
    margin-bottom: 16px;
  }

  .popup-media-track-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-media-track-artist {
    font-size: 14px;
    color: var(--dv-gray600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Media Presets */
  .popup-media-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding: 0 4px;
  }

  .popup-media-preset-btn {
    flex: 1;
    min-width: 70px;
    max-width: 100px;
    padding: 10px 8px;
    border: none;
    border-radius: var(--dv-radius-md);
    background: var(--dv-gray000);
    color: var(--dv-gray800);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .popup-media-preset-btn:hover {
    background: var(--dv-gray200);
  }

  .popup-media-preset-btn:active {
    transform: scale(0.95);
  }

  .popup-media-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .popup-media-control-btn {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--dv-gray200);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--dv-transition-normal) ease;
  }

  .popup-media-control-btn:active {
    transform: scale(0.95);
  }

  .popup-media-control-btn ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-gray800);
  }

  .popup-media-control-btn.active {
    background: var(--primary-color, #03a9f4);
  }

  .popup-media-control-btn.active ha-icon {
    color: var(--dv-white);
  }

  .popup-media-play-btn {
    width: 56px;
    height: 56px;
    background: var(--dv-gradient-media);
  }

  .popup-media-play-btn ha-icon {
    --mdc-icon-size: 28px;
    color: var(--dv-black);
  }

  .popup-media-volume-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 8px;
  }

  .popup-media-volume-icon {
    width: 24px;
    display: flex;
    justify-content: center;
  }

  .popup-media-volume-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray600);
  }

  .popup-media-volume-slider {
    flex: 1;
    height: 6px;
    background: var(--dv-gray300);
    border-radius: 3px;
    cursor: pointer;
    position: relative;
  }

  .popup-media-volume-fill {
    height: 100%;
    background: var(--dv-gradient-media-horizontal);
    border-radius: 3px;
    transition: width var(--dv-transition-fast) ease;
  }

  .popup-media-volume-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    background: var(--dv-white);
    border-radius: 50%;
    box-shadow: 0 2px 4px var(--dv-shadow-heavy);
    transition: left var(--dv-transition-fast) ease;
  }

  .popup-media-volume-percent {
    width: 40px;
    text-align: right;
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .popup-media-idle {
    padding: 16px;
    text-align: center;
    color: var(--dv-gray600);
    font-size: 14px;
  }

  /* Media Playlist Buttons (Horizontal Scrolling) */
  .popup-media-playlists {
    margin-bottom: 16px;
    overflow: hidden;
  }

  .popup-media-playlists-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .popup-media-playlists-scroll::-webkit-scrollbar {
    display: none;
  }

  .popup-media-playlist-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    border: none;
    border-radius: var(--dv-radius-full);
    background: var(--dv-gray100);
    color: var(--dv-gray800);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--dv-transition-normal) ease;
    white-space: nowrap;
    overflow: hidden;
  }

  .popup-media-playlist-btn.has-image {
    padding: 0;
    width: 56px;
    height: 56px;
    border-radius: var(--dv-radius-sm);
    background: var(--dv-gray200);
  }

  .popup-media-playlist-btn:hover {
    background: var(--dv-gray200);
    transform: scale(1.05);
  }

  .popup-media-playlist-btn.has-image:hover {
    box-shadow: 0 4px 12px var(--dv-shadow-medium);
  }

  .popup-media-playlist-btn:active {
    transform: scale(0.95);
    background: var(--dv-gradient-media);
  }

  .popup-media-playlist-btn.has-image:active {
    background: var(--dv-gray200);
  }

  .popup-media-playlist-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--dv-radius-sm);
  }

  .popup-media-playlist-name {
    display: block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ==================== MEDIA POPUP SPECIFIC ==================== */
  /* Media popup uses shared .popup-* styles, only media-specific content styles here */

  .media-popup-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .media-popup-tabs::-webkit-scrollbar {
    display: none;
  }

  .media-popup-tab {
    padding: 8px 16px;
    border: none;
    border-radius: 20px;
    background: var(--dv-gray300);
    color: var(--dv-gray800);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--dv-transition-normal) ease;
    flex-shrink: 0;
  }

  .media-popup-tab.active {
    background: var(--dv-gradient-media);
    color: var(--dv-gray000);
  }

  .media-popup-empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--dv-gray600);
  }

  .media-popup-empty ha-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .media-popup-empty-text {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .media-popup-empty-subtext {
    font-size: 14px;
    opacity: 0.8;
  }
`;
