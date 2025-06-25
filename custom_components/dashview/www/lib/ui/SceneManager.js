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
      const container = this._panel.shadowRoot.querySelector('.placeholder-grid');
      if (!container) return;
  
      const scenes = this._config?.scenes || [];
      container.innerHTML = scenes.map(scene => this._generateSceneButtonHTML(scene)).join('');
      this._initializeSceneButtonListeners();
    }
  
    _generateSceneButtonHTML(scene) {
      const name = this._getButtonName(scene);
      const icon = this._getButtonIcon(scene);
      const styles = this._getButtonStyles(scene);
      
      return `
        <div class="scene-button" data-scene-id="${scene.id}" style="${styles.card}">
          <div class="scene-button-icon" style="color: ${styles.icon};"><i class="mdi ${icon}"></i></div>
          <div class="scene-button-name" style="color: ${styles.name};">${name}</div>
        </div>
      `;
    }
  
    _initializeSceneButtonListeners() {
      this._panel.shadowRoot.querySelectorAll('.scene-button').forEach(button => {
        button.addEventListener('click', () => {
          const sceneId = button.dataset.sceneId;
          const scene = this._config.scenes.find(s => s.id === sceneId);
          if (scene) {
            const action = this._getTapAction(scene);
            this._hass.callService(action.service, action.service_data);
          }
        });
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
        default:
          return scene.name;
      }
    }
  
    _getButtonIcon(scene) {
      switch (scene.type) {
        case 'cover':
        case 'all_covers':
          return 'mdi:window-shutter';
        case 'roof_window':
          return 'mdi:window-open';
        case 'dimm_desk':
          return 'mdi:desk-lamp';
        case 'computer':
          return 'mdi:desktop-tower';
        case 'all_lights_out':
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
        case 'computer':
        case 'all_lights_out':
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
        case 'all_lights_out':
          service = 'light.turn_off';
          break;
        case 'wohnzimmer_ambiente':
          service = 'homeassistant.toggle';
          break;
      }
  
      return { service, service_data };
    }
  }
