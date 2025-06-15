class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
  }

  // When the HASS object is passed to the panel, store it and update content
  set hass(hass) {
    this._hass = hass;
    if (this._contentReady) {
      this.updateElements();
    }
  }

  connectedCallback() {
    this.loadContent();
  }

  async loadContent() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    try {
      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.ok ? res.text() : Promise.reject('Failed to load stylesheet')),
        fetch('/local/dashview/index.yaml').then(res => res.ok ? res.text() : Promise.reject('Failed to load HTML content'))
      ]);

      const style = document.createElement('style');
      style.textContent = styleText;
      shadow.appendChild(style);

      const content = document.createElement('div');
      content.innerHTML = htmlText;
      shadow.appendChild(content);
      
      await this.loadTemplates(shadow);
      this.initializeCard(shadow);

      this._contentReady = true;
      if (this._hass) {
        this.updateElements();
      }

    } catch (error) {
      shadow.innerHTML = `<div style="color: red; padding: 16px;">Error loading DashView panel: ${error.message}</div>`;
      console.error('Error loading DashView panel:', error);
    }
  }

  // New method to find all data-template placeholders and load their HTML
  async loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    for (const el of placeholders) {
      const templateName = el.dataset.template;
      try {
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) {
          el.innerHTML = await response.text();
        } else {
          el.innerHTML = `Failed to load template: ${templateName}`;
        }
      } catch (err) {
        el.innerHTML = `Error loading template: ${templateName}`;
      }
    }
  }

  // New method to update elements based on hass state
  updateElements() {
    if (!this._hass) return;
    const shadow = this.shadowRoot;

    // Update Weather Button
    const weatherState = this._hass.states['weather.forecast_home'];
    if (weatherState) {
        shadow.querySelector('.weather-button .name').textContent = weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}°C` : '-- °C';
        const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
        shadow.querySelector('.weather-button .label').innerHTML = temp ? `${temp.toFixed(1)}<sup>°C</sup>` : '-- °C';
        shadow.querySelector('.weather-button .icon-container').innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`;
    }

    // Update Person Button
    const personState = this._hass.states['person.markus'];
    if (personState) {
        const img_src = personState.attributes.entity_picture || (personState.state === 'home' ? '/local/weather_icons/IMG_0421.jpeg' : '/local/weather_icons/IMG_0422.jpeg');
        shadow.querySelector('.person-button .image-container').innerHTML = `<img src="${img_src}" width="45" height="45">`;
    }
  }

  initializeCard(context) {
    // --- This section is the same as before ---
    const handleHashChange = async () => {
      const hash = window.location.hash || '#home';
      context.querySelectorAll('.popup').forEach(popup => popup.classList.remove('active'));
      context.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));

      if (hash && hash !== '#home') {
        const popupId = hash.substring(1) + '-popup';
        let targetPopup = context.querySelector('#' + popupId);
        if (!targetPopup) {
            targetPopup = document.createElement('div');
            targetPopup.id = popupId;
            targetPopup.className = 'popup';
            context.appendChild(targetPopup);
        }
        if (targetPopup.innerHTML.trim() === '') {
            try {
                const response = await fetch(`/local/dashview/${hash.substring(1)}.html`);
                if (!response.ok) throw new Error(`File not found`);
                const html = await response.text();
                targetPopup.innerHTML = html;
                this.reinitializePopupContent(targetPopup);
            } catch (err) {
                targetPopup.innerHTML = `<div class="popup-content"><span class="popup-close">&times;</span>Error loading: ${err.message}</div>`;
                 this.reinitializePopupContent(targetPopup);
            }
        }
        targetPopup.classList.add('active');
      }

      const activeButton = context.querySelector(`.nav-button[data-hash="${hash}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    };
    window.addEventListener('hashchange', handleHashChange, true);
    handleHashChange();

    context.addEventListener('click', (e) => {
        const target = e.target.closest('[data-hash]');
        if (target) {
            e.preventDefault();
            const newHash = target.getAttribute('data-hash');
            if (window.location.hash !== newHash) {
               window.location.hash = newHash;
            }
        }

        const kioskButton = e.target.closest('.kiosk-button');
        if (kioskButton) {
            this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
        }
    });
  }
  
  reinitializePopupContent(popup) {
    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.onclick = () => window.history.back();
    }
    popup.querySelectorAll('.tabs-container').forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabContents = container.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                tabContents.forEach(content => content.classList.toggle('active', content.id === targetId));
            });
        });
        if(tabButtons.length > 0) tabButtons[0].click();
    });
  }
}

customElements.define('dashview-panel', DashviewPanel);
