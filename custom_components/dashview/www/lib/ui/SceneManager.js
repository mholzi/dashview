// custom_components/dashview/www/lib/ui/SceneManager.js

export class SceneManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
  }

  setHass(hass) {
    this._hass = hass;
  }

  renderSceneButtons() {
    const container = this._panel.shadowRoot.getElementById('scenes-container');
    if (!container) return;

    const scenes = this._config?.scenes || [];
    container.innerHTML = ''; // Clear existing buttons
    scenes.forEach(scene => {
        const buttonElement = this._createSceneButtonElement(scene);
        if (buttonElement) {
            container.appendChild(buttonElement);
        }
    });

    this._initializeSceneButtonListeners();
  }

  /**
   * Render scene buttons for a specific room
   * @param {HTMLElement} container - Container element to render scenes in
   * @param {string} roomKey - Room key to filter scenes for
   * @param {Object} roomConfig - Room configuration
   */
  renderRoomSceneButtons(container, roomKey, roomConfig) {
    if (!container) return;

    const roomScenes = this._getRoomScenes(roomKey, roomConfig);
    container.innerHTML = ''; // Clear existing buttons
    
    roomScenes.forEach(scene => {
        const buttonElement = this._createSceneButtonElementFromHTML(scene);
        if (buttonElement) {
            container.appendChild(buttonElement);
        }
    });

    this._initializeSceneButtonListeners(container);
  }

  /**
   * Get scenes relevant for a specific room
   * @param {string} roomKey - Room key
   * @param {Object} roomConfig - Room configuration
   * @returns {Array} Array of scenes for the room
   */
  _getRoomScenes(roomKey, roomConfig) {
    const scenes = this._config?.scenes || [];
    return scenes.filter(scene => {
        // Include auto-generated scenes for this room
        if (scene.auto_generated && scene.room_key === roomKey) {
            return true;
        }
        // Include manual scenes that control entities in this room
        if (scene.entities) {
            const roomEntities = [
                ...(roomConfig.lights || []),
                ...(roomConfig.covers || []),
                ...(roomConfig.media_players?.map(mp => mp.entity) || [])
            ];
            return scene.entities.some(entity => roomEntities.includes(entity));
        }
        return false;
    });
  }

  _createSceneButtonElement(scene) {
    const template = this._panel.shadowRoot.querySelector('#scene-button-template');
    if (!template) return null;
    
    const sceneButton = template.content.cloneNode(true).firstElementChild;
    const name = this._getButtonName(scene);
    const icon = this._getButtonIcon(scene);
    const styles = this._getButtonStyles(scene);
    
    sceneButton.dataset.sceneId = scene.id;
    sceneButton.style.cssText = styles.card;
    
    const iconElement = sceneButton.querySelector('.scene-button-icon i');
    iconElement.className = `mdi ${icon}`;
    iconElement.style.color = styles.icon;
    
    const nameElement = sceneButton.querySelector('.scene-button-name');
    nameElement.textContent = name;
    nameElement.style.color = styles.name;
    
    return sceneButton;
  }

  /**
   * Create scene button element from HTML (for room popups)
   * @param {Object} scene - Scene configuration
   * @returns {HTMLElement|null} Scene button element
   */
  _createSceneButtonElementFromHTML(scene) {
    const name = this._getButtonName(scene);
    const icon = this._getButtonIcon(scene);
    const styles = this._getButtonStyles(scene);
    
    const sceneButton = document.createElement('div');
    sceneButton.className = 'scene-button';
    sceneButton.dataset.sceneId = scene.id;
    sceneButton.style.cssText = styles.card;
    
    sceneButton.innerHTML = `
      <div class="scene-button-icon">
        <i class="mdi ${icon}" style="color: ${styles.icon}"></i>
      </div>
      <div class="scene-button-name" style="color: ${styles.name}">${name}</div>
    `;
    
    return sceneButton;
  }

  _initializeSceneButtonListeners(container = null) {
    const searchRoot = container || this._panel.shadowRoot;
    searchRoot.querySelectorAll('.scene-button').forEach(button => {
      // Avoid double-attaching listeners
      if (button.hasAttribute('data-listener-attached')) return;
      
      button.addEventListener('click', () => {
        const sceneId = button.dataset.sceneId;
        const scene = this._config.scenes.find(s => s.id === sceneId);
        if (scene) {
          const action = this._getTapAction(scene);
          if (this._hass) {
            this._hass.callService(action.service, action.service_data);
          }
        }
      });
      
      button.setAttribute('data-listener-attached', 'true');
    });
  }

  _getButtonName(scene) {
    if (!this._hass) return scene.name;

    switch (scene.type) {
      case 'cover':
        return (scene.entities || []).some(e => this._hass.states[e]?.attributes.current_position < 90)
          ? 'Rollos auf'
          : 'Rollos schließen';
      case 'all_covers':
        return (scene.entities || []).some(e => {
          const pos = this._hass.states[e]?.attributes.current_position;
          return typeof pos === 'number' && pos <= 30;
        })
          ? 'Rollos hoch'
          : 'Rollos schließen';
      case 'roof_window':
        const pos = this._hass.states[(scene.entities || [])[0]]?.attributes.current_position;
        return (typeof pos === 'number' && pos === 0) ? 'Dach öffnen' : 'Dach schliessen';
      case 'dimm_desk':
        return 'Ambient Desk';
      case 'computer':
        return (scene.entities || []).some(e => this._hass.states[e]?.state === 'on')
          ? 'Computer aus'
          : 'Computer an';
      case 'all_lights_out':
        return 'Lichter aus';
      case 'wohnzimmer_ambiente':
        return (scene.entities || []).some(e => this._hass.states[e]?.state === 'on')
          ? 'Ambiente aus'
          : 'Ambiente';
      case 'auto_room_lights_off':
        return scene.name || 'Lichter aus';
      case 'auto_room_covers':
        // Calculate average position for the room's covers
        const avgPosition = this._calculateAverageCoverPosition(scene.entities || []);
        return avgPosition < 30 ? 'Rollos hoch' : 'Rollos runter';
      case 'auto_global_covers':
        // Calculate average position for all covers
        const globalAvgPosition = this._calculateAverageCoverPosition(scene.entities || []);
        return globalAvgPosition < 30 ? 'Alle Rollos hoch' : 'Alle Rollos runter';
      default:
        return scene.name;
    }
  }

  _calculateAverageCoverPosition(entities) {
    if (!this._hass || !entities || entities.length === 0) return 50;
    
    const positions = entities
      .map(entityId => {
        const state = this._hass.states[entityId];
        const pos = state?.attributes?.current_position;
        return typeof pos === 'number' ? pos : 50; // Default to 50% if unknown
      })
      .filter(pos => pos !== null);
    
    if (positions.length === 0) return 50;
    
    return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
  }

  _getButtonIcon(scene) {
    switch (scene.type) {
      case 'cover':
      case 'all_covers':
      case 'auto_room_covers':
      case 'auto_global_covers':
        return 'mdi:window-shutter';
      case 'roof_window':
        return 'mdi:window-open';
      case 'dimm_desk':
        return 'mdi:desk-lamp';
      case 'computer':
        return 'mdi:desktop-tower';
      case 'all_lights_out':
      case 'auto_room_lights_off':
        return 'mdi:lightbulb-off';
      case 'wohnzimmer_ambiente':
        return 'mdi:sofa';
      default:
        return scene.icon || 'mdi:flash';
    }
  }

  _getButtonStyles(scene) {
    if (!this._hass) return { card: '', icon: '', name: '' };

    let cardColor = 'var(--gray100)';
    let textColor = 'var(--gray800)';
    let iconColor = 'var(--gray800)';

    switch (scene.type) {
      case 'cover':
        const allClosedCovers = (scene.entities || []).every(e => {
          const pos = this._hass.states[e]?.attributes.current_position;
          return typeof pos === 'number' && pos >= 90;
        });
        if (!allClosedCovers) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
      case 'all_covers':
        const allCoversAtPosition = (scene.entities || []).every(e => {
          const pos = this._hass.states[e]?.attributes.current_position;
          return typeof pos === 'number' && pos > 30;
        });
        if (!allCoversAtPosition) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
      case 'roof_window':
        const roofPos = this._hass.states[(scene.entities || [])[0]]?.attributes.current_position;
        if (typeof roofPos === 'number' && roofPos !== 0) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
      case 'dimm_desk':
        const brightness = this._hass.states[(scene.entities || [])[0]]?.attributes.brightness;
        if (typeof brightness === 'number' && brightness > 76) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
      case 'auto_room_covers':
      case 'auto_global_covers':
        const avgPos = this._calculateAverageCoverPosition(scene.entities || []);
        // Highlight the button if covers are not fully open (position < 100)
        if (avgPos < 100) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
      case 'computer':
      case 'all_lights_out':
      case 'auto_room_lights_off':
      case 'wohnzimmer_ambiente':
        if ((scene.entities || []).some(e => this._hass.states[e]?.state === 'on')) {
          cardColor = 'var(--gray800)';
          textColor = 'var(--gray100)';
          iconColor = 'var(--gray100)';
        }
        break;
    }
    
    return {
      card: `background-color: ${cardColor};`,
      name: textColor,
      icon: iconColor
    };
  }

  _getTapAction(scene) {
    if (!this._hass) return { service: 'none', service_data: {} };
    
    let service = 'script.turn_on';
    let service_data = { entity_id: scene.entities };

    switch (scene.type) {
      case 'cover':
      case 'all_covers':
        const openNeeded = (scene.entities || []).some(e => {
          const pos = this._hass.states[e]?.attributes.current_position;
          return typeof pos === 'number' && pos < 90;
        });
        service = openNeeded ? 'cover.open_cover' : 'cover.close_cover';
        break;
      case 'roof_window':
        const pos = this._hass.states[(scene.entities || [])[0]]?.attributes.current_position;
        service = (typeof pos === 'number' && pos === 0) ? 'script.dach_fenster_offnen' : 'script.dach_fenster_schliessen';
        service_data = {};
        break;
      case 'dimm_desk':
        service = 'light.turn_on';
        const brightness = this._hass.states[(scene.entities || [])[0]]?.attributes.brightness;
        if (typeof brightness === 'number' && brightness > 76) {
          service_data = { entity_id: scene.entities, brightness: 76 };
        }
        break;
      case 'computer':
        service = 'homeassistant.toggle';
        break;
      case 'auto_room_covers':
      case 'auto_global_covers':
        const avgPosition = this._calculateAverageCoverPosition(scene.entities || []);
        service = avgPosition < 30 ? 'cover.open_cover' : 'cover.close_cover';
        break;
      case 'all_lights_out':
      case 'auto_room_lights_off':
        service = 'light.turn_off';
        break;
      case 'wohnzimmer_ambiente':
        service = 'homeassistant.toggle';
        break;
    }

    return { service, service_data };
  }
}
