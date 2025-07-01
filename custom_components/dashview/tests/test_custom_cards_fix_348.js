/**
 * Test custom cards functionality - Issue #348 fix
 * 
 * Tests for:
 * 1. Custom cards persistence to House Config
 * 2. Visibility toggle controls for custom cards
 * 3. Integration with main dashboard display
 */

// Mock dependencies
const mockHass = {
  callApi: async (method, endpoint, data) => {
    if (method === 'GET' && endpoint === 'dashview/config?type=custom_cards') {
      return mockCustomCardsAPI.getCustomCards();
    }
    if (method === 'POST' && endpoint === 'dashview/config') {
      return mockCustomCardsAPI.saveCustomCards(data);
    }
    throw new Error(`Unexpected API call: ${method} ${endpoint}`);
  }
};

// Mock API backend for custom cards
const mockCustomCardsAPI = {
  _storage: {},
  
  getCustomCards() {
    return this._storage.custom_cards || {};
  },
  
  saveCustomCards(data) {
    if (data.type === 'custom_cards') {
      this._storage.custom_cards = data.config;
      return { status: 'success' };
    }
    throw new Error('Invalid save request');
  },
  
  reset() {
    this._storage = {};
  }
};

// Mock Shadow DOM
const mockShadowRoot = {
  _elements: {},
  
  getElementById(id) {
    return this._elements[id] || null;
  },
  
  addElement(id, element) {
    this._elements[id] = element;
  },
  
  querySelector(selector) {
    // Basic mock implementation
    if (selector === '#custom-cards-main-container') {
      return this._elements['custom-cards-main-container'] || null;
    }
    return null;
  }
};

// Mock AdminManager for testing
class MockAdminManager {
  constructor() {
    this._hass = mockHass;
    this._shadowRoot = mockShadowRoot;
    this._adminLocalState = { houseConfig: { custom_cards: {} } };
    
    // Setup mock DOM elements
    this._setupMockElements();
  }
  
  _setupMockElements() {
    const elements = {
      'new-card-id': { value: '', readOnly: false, style: {} },
      'new-card-name': { value: '' },
      'new-card-yaml': { value: '' },
      'new-card-visible': { checked: true },
      'custom-cards-status': { textContent: '' },
      'custom-cards-list': { innerHTML: '' }
    };
    
    Object.entries(elements).forEach(([id, element]) => {
      this._shadowRoot.addElement(id, element);
    });
  }
  
  _setStatusMessage(element, message, type) {
    if (element) {
      element.textContent = message;
      element.className = type;
    }
  }
  
  async _saveConfigViaAPI(configType, configData) {
    return await this._hass.callApi('POST', 'dashview/config', { type: configType, config: configData });
  }
  
  // Copy the actual methods we're testing
  async loadCustomCards() {
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');
    this._setStatusMessage(statusEl, 'Loading custom cards...', 'loading');
    
    try {
      const customCards = await this._hass.callApi('GET', 'dashview/config?type=custom_cards');
      this._adminLocalState.houseConfig.custom_cards = customCards || {};
      this._renderCustomCardsList();
      this._clearCustomCardInputs();
      this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }
  
  _renderCustomCardsList() {
    const container = this._shadowRoot.getElementById('custom-cards-list');
    if (!container) return;

    const customCards = this._adminLocalState.houseConfig.custom_cards || {};
    let html = '';

    Object.entries(customCards).forEach(([cardId, cardData]) => {
      const isVisible = cardData.visible !== false;
      const visibilityIcon = isVisible ? 'eye' : 'eye-off';
      const visibilityLabel = isVisible ? 'Visible' : 'Hidden';
      
      html += `
        <div class="entity-list-item">
          <div class="entity-info">
            <div class="entity-name">${cardData.name}</div>
            <div class="entity-details">ID: ${cardId} • ${visibilityLabel}</div>
          </div>
          <div class="entity-actions">
            <button class="action-button" onclick="window.dashviewAdmin.toggleCustomCardVisibility('${cardId}')" title="Toggle visibility">
              <i class="mdi mdi-${visibilityIcon}"></i>
            </button>
            <button class="action-button" onclick="window.dashviewAdmin.editCustomCard('${cardId}')">Edit</button>
            <button class="action-button" onclick="window.dashviewAdmin.removeCustomCard('${cardId}')">Remove</button>
          </div>
        </div>
      `;
    });

    if (html === '') {
      html = '<div class="placeholder">No custom cards configured yet.</div>';
    }

    container.innerHTML = html;
    window.dashviewAdmin = this;
  }
  
  addCustomCard() {
    const idInput = this._shadowRoot.getElementById('new-card-id');
    const nameInput = this._shadowRoot.getElementById('new-card-name');
    const yamlInput = this._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = this._shadowRoot.getElementById('new-card-visible');
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');

    const cardId = idInput.value.trim();
    const cardName = nameInput.value.trim();
    const yamlConfig = yamlInput.value.trim();
    const isVisible = visibleInput ? visibleInput.checked : true;

    if (!cardId || !cardName || !yamlConfig) {
      this._setStatusMessage(statusEl, 'All fields are required', 'error');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cardId)) {
      this._setStatusMessage(statusEl, 'Card ID must contain only lowercase letters, numbers, and underscores', 'error');
      return;
    }

    if (this._adminLocalState.houseConfig.custom_cards && this._adminLocalState.houseConfig.custom_cards[cardId]) {
      this._setStatusMessage(statusEl, 'Card ID already exists', 'error');
      return;
    }

    if (!this._adminLocalState.houseConfig.custom_cards) {
      this._adminLocalState.houseConfig.custom_cards = {};
    }

    this._adminLocalState.houseConfig.custom_cards[cardId] = {
      name: cardName,
      yaml_config: yamlConfig,
      visible: isVisible
    };

    this._renderCustomCardsList();
    this._clearCustomCardInputs();
    this._setStatusMessage(statusEl, 'Card added successfully', 'success');
  }
  
  toggleCustomCardVisibility(cardId) {
    if (!this._adminLocalState.houseConfig.custom_cards || !this._adminLocalState.houseConfig.custom_cards[cardId]) {
      return;
    }

    const card = this._adminLocalState.houseConfig.custom_cards[cardId];
    card.visible = !card.visible;
    
    this._renderCustomCardsList();
    this._setStatusMessage(this._shadowRoot.getElementById('custom-cards-status'), 
      `Card visibility ${card.visible ? 'enabled' : 'disabled'}`, 'success');
  }
  
  async saveCustomCards() {
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');
    this._setStatusMessage(statusEl, 'Saving custom cards...', 'loading');

    try {
      await this._saveConfigViaAPI('custom_cards', this._adminLocalState.houseConfig.custom_cards || {});
      this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }
  
  _clearCustomCardInputs() {
    const idInput = this._shadowRoot.getElementById('new-card-id');
    const nameInput = this._shadowRoot.getElementById('new-card-name');
    const yamlInput = this._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = this._shadowRoot.getElementById('new-card-visible');

    if (idInput) {
      idInput.value = '';
      idInput.readOnly = false;
      idInput.style.backgroundColor = '';
    }
    if (nameInput) nameInput.value = '';
    if (yamlInput) yamlInput.value = '';
    if (visibleInput) visibleInput.checked = true;
  }
}

// Mock FloorManager for testing
class MockFloorManager {
  constructor() {
    this._houseConfig = { custom_cards: {} };
    this._shadowRoot = mockShadowRoot;
    
    // Setup mock container
    this._shadowRoot.addElement('custom-cards-main-container', { innerHTML: '', style: {} });
  }
  
  async renderCustomCardsMain() {
    const container = this._shadowRoot.querySelector('#custom-cards-main-container');
    if (!container) return;

    const customCards = this._houseConfig.custom_cards || {};

    if (Object.keys(customCards).length === 0) {
      container.innerHTML = '';
      return;
    }

    // Render all visible custom cards
    const cardPromises = Object.entries(customCards)
      .filter(([cardId, cardConfig]) => cardConfig.visible !== false)
      .map(async ([cardId, cardConfig]) => {
        return await this._renderCustomCardMain(cardId, cardConfig);
      });

    const cardHTMLArray = await Promise.all(cardPromises);
    container.innerHTML = cardHTMLArray.filter(html => html).join('');
  }
  
  async _renderCustomCardMain(customCardId, cardConfig) {
    return `<div class="custom-card-main-item" data-custom-card-id="${customCardId}">
      <div class="custom-card-content">
        ${cardConfig.name} - ${cardConfig.visible ? 'Visible' : 'Hidden'}
      </div>
    </div>`;
  }
}

// Test suite
const testCustomCards = {
  async runAllTests() {
    console.log('[DashView Test] Running custom cards tests for Issue #348...');
    
    const results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    
    const tests = [
      this.testAddCustomCard,
      this.testCustomCardPersistence,
      this.testVisibilityToggle,
      this.testVisibilityDefaultValue,
      this.testMainDashboardIntegration,
      this.testCardValidation,
      this.testEditCustomCard
    ];
    
    for (const test of tests) {
      try {
        const result = await test.call(this);
        results.tests.push(result);
        if (result.passed) {
          results.passed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.tests.push({
          name: test.name,
          passed: false,
          error: error.message
        });
        results.failed++;
      }
    }
    
    console.log(`[DashView Test] Results: ${results.passed} passed, ${results.failed} failed`);
    return results;
  },
  
  async testAddCustomCard() {
    mockCustomCardsAPI.reset();
    const admin = new MockAdminManager();
    
    // Set up form inputs
    admin._shadowRoot.getElementById('new-card-id').value = 'test_card';
    admin._shadowRoot.getElementById('new-card-name').value = 'Test Card';
    admin._shadowRoot.getElementById('new-card-yaml').value = 'type: markdown\ncontent: "Hello World"';
    admin._shadowRoot.getElementById('new-card-visible').checked = true;
    
    // Add the card
    admin.addCustomCard();
    
    // Check that card was added to local state
    const addedCard = admin._adminLocalState.houseConfig.custom_cards['test_card'];
    
    return {
      name: 'testAddCustomCard',
      passed: addedCard && 
               addedCard.name === 'Test Card' && 
               addedCard.yaml_config === 'type: markdown\ncontent: "Hello World"' &&
               addedCard.visible === true,
      details: addedCard ? 'Card added successfully with visibility' : 'Card not added'
    };
  },
  
  async testCustomCardPersistence() {
    mockCustomCardsAPI.reset();
    const admin = new MockAdminManager();
    
    // Add a card
    admin._adminLocalState.houseConfig.custom_cards = {
      'persistent_card': {
        name: 'Persistent Card',
        yaml_config: 'type: markdown\ncontent: "Persistent"',
        visible: false
      }
    };
    
    // Save cards
    await admin.saveCustomCards();
    
    // Check that card was saved to API
    const savedCards = mockCustomCardsAPI.getCustomCards();
    const savedCard = savedCards['persistent_card'];
    
    return {
      name: 'testCustomCardPersistence',
      passed: savedCard && 
               savedCard.name === 'Persistent Card' &&
               savedCard.visible === false,
      details: savedCard ? 'Card persisted correctly' : 'Card not persisted'
    };
  },
  
  async testVisibilityToggle() {
    const admin = new MockAdminManager();
    
    // Add a visible card
    admin._adminLocalState.houseConfig.custom_cards = {
      'toggle_card': {
        name: 'Toggle Card',
        yaml_config: 'type: markdown\ncontent: "Toggle"',
        visible: true
      }
    };
    
    // Toggle visibility
    admin.toggleCustomCardVisibility('toggle_card');
    
    // Check that visibility was toggled
    const card = admin._adminLocalState.houseConfig.custom_cards['toggle_card'];
    
    return {
      name: 'testVisibilityToggle',
      passed: card.visible === false,
      details: `Card visibility is now: ${card.visible}`
    };
  },
  
  async testVisibilityDefaultValue() {
    const admin = new MockAdminManager();
    
    // Add card without explicit visibility (should default to true)
    admin._adminLocalState.houseConfig.custom_cards = {
      'default_card': {
        name: 'Default Card',
        yaml_config: 'type: markdown\ncontent: "Default"'
        // No visible property
      }
    };
    
    // Render list to check how it handles missing visibility
    admin._renderCustomCardsList();
    const listHtml = admin._shadowRoot.getElementById('custom-cards-list').innerHTML;
    
    return {
      name: 'testVisibilityDefaultValue',
      passed: listHtml.includes('Visible') && !listHtml.includes('Hidden'),
      details: 'Card without explicit visibility defaults to visible'
    };
  },
  
  async testMainDashboardIntegration() {
    const floorManager = new MockFloorManager();
    
    // Set up cards with different visibility
    floorManager._houseConfig.custom_cards = {
      'visible_card': {
        name: 'Visible Card',
        yaml_config: 'type: markdown\ncontent: "Visible"',
        visible: true
      },
      'hidden_card': {
        name: 'Hidden Card',
        yaml_config: 'type: markdown\ncontent: "Hidden"',
        visible: false
      },
      'default_card': {
        name: 'Default Card',
        yaml_config: 'type: markdown\ncontent: "Default"'
        // No visible property - should default to true
      }
    };
    
    // Render main dashboard
    await floorManager.renderCustomCardsMain();
    
    const containerHtml = floorManager._shadowRoot.querySelector('#custom-cards-main-container').innerHTML;
    const visibleCount = (containerHtml.match(/custom-card-main-item/g) || []).length;
    
    return {
      name: 'testMainDashboardIntegration',
      passed: visibleCount === 2, // visible_card and default_card should be shown
      details: `Rendered ${visibleCount} cards (expected 2)`
    };
  },
  
  async testCardValidation() {
    const admin = new MockAdminManager();
    
    // Test invalid ID
    admin._shadowRoot.getElementById('new-card-id').value = 'Invalid-ID!';
    admin._shadowRoot.getElementById('new-card-name').value = 'Test';
    admin._shadowRoot.getElementById('new-card-yaml').value = 'type: markdown';
    
    admin.addCustomCard();
    
    const statusEl = admin._shadowRoot.getElementById('custom-cards-status');
    const hasValidationError = statusEl.textContent.includes('lowercase letters, numbers, and underscores');
    
    return {
      name: 'testCardValidation',
      passed: hasValidationError,
      details: hasValidationError ? 'Validation working correctly' : 'Validation not working'
    };
  },
  
  async testEditCustomCard() {
    const admin = new MockAdminManager();
    
    // Add a card to edit
    admin._adminLocalState.houseConfig.custom_cards = {
      'edit_card': {
        name: 'Original Name',
        yaml_config: 'type: markdown\ncontent: "Original"',
        visible: false
      }
    };
    
    // Edit the card
    admin.editCustomCard('edit_card');
    
    // Check that form is populated correctly
    const idInput = admin._shadowRoot.getElementById('new-card-id');
    const nameInput = admin._shadowRoot.getElementById('new-card-name');
    const yamlInput = admin._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = admin._shadowRoot.getElementById('new-card-visible');
    
    return {
      name: 'testEditCustomCard',
      passed: idInput.value === 'edit_card' &&
               nameInput.value === 'Original Name' &&
               yamlInput.value === 'type: markdown\ncontent: "Original"' &&
               visibleInput.checked === false,
      details: 'Edit form populated correctly with all fields including visibility'
    };
  }
};

// Run tests if in browser environment
if (typeof window !== 'undefined') {
  window.testCustomCards = testCustomCards;
  console.log('[DashView Test] Custom cards test suite loaded. Run with: testCustomCards.runAllTests()');
  
  // Auto-run tests
  testCustomCards.runAllTests().then(results => {
    console.log('[DashView Test] Custom cards tests completed:', results);
  });
} else {
  module.exports = testCustomCards;
}