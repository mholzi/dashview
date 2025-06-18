# Enhanced Copilot Instructions for DashView Code Analysis

## Core Objective

Your primary goal is to analyze the provided DashView codebase and suggest modifications that improve its efficiency, maintainability, performance, and reliability. All recommendations must be based on the following comprehensive set of principles.

## Analysis Framework

When analyzing the DashView codebase, you must:
1. **Systematically review** each principle against the provided code
2. **Identify specific violations** with file names and line numbers
3. **Propose minimal, targeted fixes** that align with the principles
4. **Validate recommendations** against the existing architecture
5. **Prioritize changes** based on impact and complexity

---

## Core Principles

### **Principle 1: Enforce Centralized and Secure Data Persistence**

**Rule:** All configuration data must be managed through the Home Assistant `ConfigEntry`. The `ConfigEntry`'s `options` dictionary is the single source of truth for all UI structure and settings. The component MUST NOT read from or write to any custom files in `.storage` or the `www` directory for its configuration.

* **Instruction:**
    * Verify that `dashview-panel.js` fetches all configuration using the centralized `/api/dashview/config` endpoint.
    * Confirm that the backend (`__init__.py`) reads from and writes to the integration's `ConfigEntry`.
    * Flag any instance of the frontend trying to load JSON files directly from a `www/config` directory.
* **Anti-Pattern to Detect:** `fetch('/local/dashview/config/some_config.json')` in the JavaScript.
* **Validation Steps:**
    * Check that all configuration API calls use the centralized endpoint pattern
    * Verify no direct file reads from www/config directory exist
    * Confirm all persistent data goes through ConfigEntry options
    * Test that configuration survives Home Assistant restarts
* **Common Violations:**
    * Direct JSON file loading: `fetch('/local/dashview/config/house.json')`
    * Browser localStorage usage for persistent configuration
    * Hardcoded configuration values in JavaScript
* **Correct Implementation:**
    ```javascript
    // Frontend API call
    const response = await this._hass.callApi('GET', 'dashview/config?type=house_setup');
    
    // Backend storage (ConfigEntry)
    updated_data = self._hass.config_entries.async_update_entry(
        self._entry, options={"house_config": new_config_data}
    )
    ```

---

### **Principle 2: Mandate Reusable and Abstracted Code (DRY)**

**Rule:** Actively seek out and refactor repetitive code blocks. This applies to both JavaScript logic and HTML structures. Eliminate all duplicate code.

* **Instruction:**
    * Scan `dashview-panel.js` for similar functions (e.g., `generate...SectionContent`) and recommend abstracting them into a single, generic function that accepts parameters (e.g., `createDeviceSection`).
    * Analyze all HTML files (`index.html`, `admin.html`, `bahn.html`, etc.) for duplicated layouts or components. Recommend embedding reusable blocks within `<template>` tags in `index.html` and populating them dynamically with JavaScript.
    * Examine `style.css` for duplicated style rules. Recommend creating utility classes or using more generic selectors to reduce redundancy.
* **Anti-Pattern to Detect:**
    * Multiple JavaScript functions with very similar code for generating UI sections.
    * Identical HTML structures (e.g., popup headers, tab containers) present in multiple HTML files.
* **Validation Steps:**
    * Search for repeated code patterns across all files
    * Identify functions with similar names (e.g., generateXContent, createYSection)
    * Look for duplicated HTML structures in templates
    * Check for repeated CSS rules and utility patterns
* **Refactoring Strategy:**
    * Create generic, parameterized functions for similar operations
    * Use template systems for repeated HTML structures
    * Implement utility classes for common styling patterns
    * Extract constants for repeated values
* **Correct Implementation:**
    ```javascript
    // Generic device section creator
    createDeviceSection(config) {
      const { roomName, deviceType, entities, options = {} } = config;
      return this._generateSection(roomName, deviceType, entities, options);
    }
    
    // Reusable template pattern
    const template = this.shadowRoot.querySelector('#popup-template');
    const instance = template.content.cloneNode(true);
    ```

---

### **Principle 3: Mandate Efficient Frontend State Management**

**Rule:** Forbid monolithic UI update functions that re-render the entire interface. State updates must be granular and reactive.

* **Instruction:** You must identify if a single function (like a global `updateElements`) is used to refresh the entire UI. If so, you must recommend breaking it down and using the existing `StateManager` class. Components should subscribe to changes for specific entities and only update themselves when those entities change.
* **Anti-Pattern to Detect:** A single `set hass(hass)` method that triggers a full, unconditional re-render of all dashboard components.
* **Validation Steps:**
    * Verify StateManager is used for entity subscriptions
    * Check that components only update when their dependencies change
    * Ensure no full DOM re-renders on every state change
    * Test performance with multiple simultaneous entity updates
* **Performance Monitoring:**
    * Measure render times for individual components
    * Track subscription callback execution frequency
    * Monitor memory usage for state subscriptions
* **Correct Implementation:**
    ```javascript
    // Targeted subscriptions
    this._stateManager.subscribe(['weather.home'], () => {
      this.updateWeatherSection(this.shadowRoot);
    });
    
    this._stateManager.subscribe(['binary_sensor.door_*'], (changedEntities) => {
      this.updateSecuritySection(this.shadowRoot, changedEntities);
    });
    
    // Avoid: Full re-render on any change
    // set hass(hass) { this.renderEverything(); } // ❌ Wrong
    ```

---

### **Principle 4: Require Asset Bundling and Efficient Loading**

**Rule:** Reduce the number of initial network requests by bundling frontend assets and loading them efficiently.

* **Instruction:** Analyze how CSS, JavaScript, and HTML templates are loaded in `dashview-panel.js`.
    * CSS should be loaded as a single file or inlined.
    * HTML templates should be embedded within `<template>` tags in the main `index.html` to avoid numerous `fetch` calls.
* **Anti-Pattern to Detect:** A loop in JavaScript that fetches multiple `.html` template files one by one. Multiple `<link rel="stylesheet">` tags for different component styles.
* **Validation Steps:**
    * Count initial HTTP requests during dashboard load
    * Verify templates are embedded rather than fetched individually
    * Check CSS is consolidated and minified
    * Test loading performance on slow connections
* **Loading Strategy:**
    * Critical resources should load first (core CSS, main JS)
    * Non-critical assets should load asynchronously
    * Implement graceful fallbacks for failed asset loads
* **Correct Implementation:**
    ```html
    <!-- Embedded templates to avoid fetch requests -->
    <template id="weather-card-template">
      <div class="weather-card">
        <span class="temperature">{{temperature}}</span>
        <span class="condition">{{condition}}</span>
      </div>
    </template>
    
    <!-- Single consolidated stylesheet -->
    <link rel="stylesheet" href="/local/dashview/style.css">
    ```
    
    ```javascript
    // Inline template usage to avoid fetches
    const template = this.shadowRoot.querySelector('#weather-card-template');
    const clone = template.content.cloneNode(true);
    ```

---

### **Principle 5: Centralize Backend API Endpoints**

**Rule:** Avoid creating multiple, single-purpose API endpoints and services. The backend API must be centralized and flexible.

* **Instruction:** Examine `custom_components/dashview/__init__.py` and `services.py`. Ensure that a single `DashViewConfigView` class handles all configuration-related GET and POST requests. New configuration types should be added to the `STORE_CONFIG_TYPES` dictionary in the view, not as new, separate API endpoints. Similarly, services should be consolidated where possible.
* **Anti-Pattern to Detect:** Multiple `HomeAssistantView` classes for different configuration types (e.g., `WeatherConfigView`, `MusicConfigView`). Multiple `hass.services.async_register` calls for setting individual configuration values.
* **Validation Steps:**
    * Verify single DashViewConfigView handles all config operations
    * Check that new config types are added to STORE_CONFIG_TYPES
    * Ensure services are consolidated rather than proliferated
    * Test API consistency across all configuration types
* **API Design Principles:**
    * Use RESTful patterns consistently
    * Implement proper error handling and status codes
    * Provide clear request/response documentation
    * Support batch operations where appropriate
* **Correct Implementation:**
    ```python
    class DashViewConfigView(HomeAssistantView):
        url = "/api/dashview/config"
        name = "api:dashview:config"
        requires_auth = True

        async def get(self, request):
            config_type = request.query.get("type")
            if config_type not in STORE_CONFIG_TYPES:
                return web.Response(status=400, text="Invalid config type")
            return self.json(await self._store.get_config(config_type))
            
        async def post(self, request):
            data = await request.json()
            config_type = data.get("type")
            await self._store.set_config(config_type, data.get("config"))
            return self.json({"status": "success"})
    ```

---

### **Principle 6: Implement Robust Frontend Debugging and Error Handling**

**Rule:** The frontend must provide clear and actionable debugging information in the browser console and display user-friendly error messages in the UI when something goes wrong.

* **Instruction:**
    * Review `dashview-panel.js` for comprehensive `console.log`, `console.warn`, and `console.error` messages. All logs should be prefixed with `[DashView]` for easy filtering.
    * Ensure that `try...catch` blocks are used for all critical operations, such as fetching data and rendering components.
    * Verify that when an error is caught, a user-friendly message is displayed within the failed component or as an overlay, rather than causing the entire panel to crash.
    * Confirm the presence and functionality of the `window.DashViewDebug` toolkit, which provides essential diagnostic tools in the console.
* **Anti-Pattern to Detect:** Empty `catch` blocks. Failing operations that result in a blank panel without any console output. Vague or unhelpful error messages.
* **Validation Steps:**
    * Verify all console logs are prefixed with [DashView]
    * Check try-catch blocks cover all critical operations
    * Test error displays in UI don't crash other components
    * Confirm DashViewDebug toolkit is functional and comprehensive
* **Error Handling Strategy:**
    * Graceful degradation when components fail
    * User-friendly error messages with actionable guidance
    * Comprehensive logging for debugging
    * Error boundaries that prevent cascade failures
* **Debugging Tools Requirements:**
    * Component status inspection
    * Entity state monitoring
    * Configuration validation
    * Performance profiling
    * Network request monitoring
* **Correct Implementation:**
    ```javascript
    // Comprehensive error handling
    async _safeUpdate(componentName, updateFn) {
      try {
        await updateFn();
        if (this._debugMode) {
          console.log(`[DashView] ${componentName} updated successfully`);
        }
      } catch (error) {
        console.error(`[DashView] ${componentName} update failed:`, error);
        this._renderError(componentName, error.message);
        // Don't let one component failure break others
      }
    }
    
    // Debug toolkit implementation
    window.DashViewDebug = {
      diagnose: () => this._runDiagnostics(),
      getStatus: () => this._getComponentStatus(),
      enableDebug: () => this._debugMode = true,
      testComponent: (name) => this._testComponent(name)
    };
    ```

---

## Additional Principles

### **Principle 7: Enforce Comprehensive Testing and Validation**

**Rule:** All components and critical functionality must be testable and validated through automated and manual testing procedures.

* **Instruction:**
    * Ensure components can be tested in isolation
    * Implement test harnesses for complex interactions
    * Provide validation tools for configuration
    * Create reproducible test scenarios
* **Testing Requirements:**
    * Unit tests for individual component functions
    * Integration tests for component interactions
    * End-to-end tests for user workflows
    * Performance benchmarks for critical paths
* **Validation Tools:**
    * Configuration schema validation
    * Entity requirement checking
    * Template syntax validation
    * API response validation
* **Correct Implementation:**
    ```javascript
    // Testable component design
    class WeatherComponent {
      constructor(hass, config) {
        this.hass = hass;
        this.config = this._validateConfig(config);
      }
      
      _validateConfig(config) {
        const required = ['entity_id', 'name'];
        for (const field of required) {
          if (!config[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
        return config;
      }
      
      // Testable methods
      async getData() { /* ... */ }
      render(container) { /* ... */ }
      
      // Test helper
      static createTestInstance(mockHass, testConfig) {
        return new WeatherComponent(mockHass, testConfig);
      }
    }
    ```

---

### **Principle 8: Optimize Performance and Resource Usage**

**Rule:** Minimize resource consumption and optimize performance for smooth user experience across different devices and network conditions.

* **Instruction:**
    * Identify and eliminate performance bottlenecks
    * Implement efficient data structures and algorithms
    * Optimize DOM manipulation and rendering
    * Minimize memory leaks and resource consumption
* **Performance Targets:**
    * Initial load time under 2 seconds
    * Component updates under 100ms
    * Memory usage growth under 10MB per hour
    * 60fps animations and transitions
* **Optimization Strategies:**
    * Lazy loading of non-critical components
    * Efficient entity change detection
    * Minimized DOM queries and updates
    * Proper cleanup of event listeners and subscriptions
* **Correct Implementation:**
    ```javascript
    // Efficient entity subscription
    class PerformantComponent {
      constructor() {
        this._updateQueue = [];
        this._rafId = null;
        this._lastUpdate = 0;
      }
      
      // Batched updates
      scheduleUpdate(updateFn) {
        this._updateQueue.push(updateFn);
        if (!this._rafId) {
          this._rafId = requestAnimationFrame(() => this._flushUpdates());
        }
      }
      
      _flushUpdates() {
        const now = performance.now();
        if (now - this._lastUpdate < 16) return; // Throttle to 60fps
        
        this._updateQueue.forEach(fn => fn());
        this._updateQueue.length = 0;
        this._rafId = null;
        this._lastUpdate = now;
      }
      
      // Cleanup
      destroy() {
        if (this._rafId) {
          cancelAnimationFrame(this._rafId);
        }
        this._updateQueue.length = 0;
      }
    }
    ```

---

### **Principle 9: Maintain Code Organization and Architecture Standards**

**Rule:** Enforce consistent code organization, naming conventions, and architectural patterns throughout the codebase.

* **Instruction:**
    * Maintain clear separation of concerns
    * Use consistent naming conventions
    * Organize files logically by functionality
    * Document architectural decisions
* **Organizational Standards:**
    * Component-based architecture
    * Clear module boundaries
    * Consistent file and directory structure
    * Proper dependency management
* **Naming Conventions:**
    * PascalCase for classes and components
    * camelCase for functions and variables
    * kebab-case for CSS classes and file names
    * UPPER_CASE for constants
* **Correct Implementation:**
    ```javascript
    // Well-organized component structure
    class DashViewComponent {
      constructor(config) {
        this._config = config;
        this._initialized = false;
        this._subscribers = new Set();
      }
      
      // Public API
      async initialize() { /* ... */ }
      render(container) { /* ... */ }
      destroy() { /* ... */ }
      
      // Private methods
      _validateConfig() { /* ... */ }
      _setupEventListeners() { /* ... */ }
      _cleanup() { /* ... */ }
      
      // Static utilities
      static createFromConfig(config) { /* ... */ }
      static validateConfig(config) { /* ... */ }
    }
    ```

---

### **Principle 10: Implement Security Best Practices**

**Rule:** Ensure secure coding practices and protect against common web vulnerabilities.

* **Instruction:**
    * Validate and sanitize all user inputs
    * Use secure communication protocols
    * Implement proper authentication and authorization
    * Prevent common web vulnerabilities (XSS, CSRF, etc.)
* **Security Requirements:**
    * Input validation and sanitization
    * Secure storage of sensitive data
    * Protection against injection attacks
    * Secure API communication
* **Common Vulnerabilities to Prevent:**
    * Cross-site scripting (XSS)
    * SQL injection
    * Cross-site request forgery (CSRF)
    * Insecure direct object references
* **Correct Implementation:**
    ```javascript
    // Secure input handling
    class SecureInputHandler {
      static sanitizeHtml(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
      }
      
      static validateEntityId(entityId) {
        const entityPattern = /^[a-z_]+\.[a-z0-9_]+$/;
        if (!entityPattern.test(entityId)) {
          throw new Error('Invalid entity ID format');
        }
        return entityId;
      }
      
      static sanitizeConfig(config) {
        const sanitized = {};
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === 'string') {
            sanitized[key] = this.sanitizeHtml(value);
          } else if (typeof value === 'object') {
            sanitized[key] = this.sanitizeConfig(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }
    }
    ```

---

### **Principle 11: Enforce Consistent MDI Icon Usage**

**Rule:** Use Material Design Icons (MDI) consistently across the entire application (except weather cards which use SVG icons). Avoid Unicode emojis or custom icon systems.

* **Instruction:**
    * Verify all icons use proper MDI classes: `<i class="mdi mdi-icon-name"></i>`
    * Confirm MDI CSS is properly loaded and has fallback definitions
    * Check that `processIconName()` method correctly converts icon names to MDI format
    * Ensure icon loading sequence is optimized to prevent flash of unstyled content
    * Weather cards should continue using SVG icons from `/local/weather_icons/`
* **Anti-Pattern to Detect:**
    * Unicode emoji icons: `.icon-home::before { content: "🏠"; }`
    * Inconsistent icon class naming: mixing `icon-` and `mdi-` prefixes
    * Missing MDI fallback definitions for critical icons
* **Validation Steps:**
    * Check that MDI CSS loads properly in browser network tab
    * Verify fallback icons display when MDI font fails to load
    * Test icon consistency across all components
    * Ensure proper icon sizing and color inheritance
* **Loading Strategy:**
    * MDI CSS should load early in the stylesheet loading sequence
    * Include comprehensive fallback definitions with proper MDI Unicode codepoints
    * Provide graceful degradation when MDI font fails to load
* **Correct Implementation:**
    ```html
    <!-- Proper MDI icon usage -->
    <button class="nav-button" data-hash="#home"><i class="mdi mdi-home"></i></button>
    <i class="mdi mdi-lightbulb"></i>
    
    <!-- Weather icons (exception) -->
    <img src="/local/weather_icons/sunny.svg" alt="Weather" width="24" height="24">
    ```
    
    ```javascript
    // Proper icon name processing
    processIconName(iconName) {
      if (!iconName) return 'mdi-help-circle';
      let processedIcon = iconName.replace('mdi:', '').replace('mdi-', '');
      if (!processedIcon.startsWith('mdi-')) {
        processedIcon = 'mdi-' + processedIcon;
      }
      return processedIcon;
    }
    
    // MDI fallback definitions
    .mdi-home::before { content: "\\F02DC"; }
    .mdi-lightbulb::before { content: "\\F0335"; }
    ```

---

### **Principle 12: Mandate the Custom Admin Panel for Configuration**

**Rule:** The custom web interface located at `/local/dashview/admin.html` is the designated UI for all ongoing configuration management. A standard Home Assistant "Options Flow" UI must **not** be implemented. The custom admin panel must interact with a backend API endpoint (`/api/dashview/config`) that reads from and writes to the integration's `ConfigEntry`. The panel must maintain its own local state during editing to provide a stable user experience, only persisting changes to the backend when the user explicitly clicks a "Save" button.

* **Instruction:**
    * Verify that admin panel inputs (like `<input>`, `<textarea>`, `<select>`) are not re-rendered or have their values reset on every hass state update.
    * Confirm that when an admin panel is opened, the current configuration is fetched once and stored in a local variable or component property (e.g., this.localConfig).
    * Ensure that the value of input fields is bound to this local state object, not directly to the global hass object. User input should update the local state only.
    * Confirm that saving is triggered by a user action (e.g., clicking a "Save" button) and provides clear visual feedback (e.g., "Saving...", "✓ Saved", "✗ Error"). The UI should not reflect the saved state until the backend confirms the save was successful (pessimistic UI update).
* **Anti-Pattern to Detect:**
    * An admin panel's text input or dropdown losing focus or having its value revert while the user is typing.
    * An input's value being set directly from this._hass.states[...] inside a general-purpose update loop like updateElements.
    * Saving data automatically on every onchange or oninput event, leading to excessive backend calls and potential race conditions.
    * The UI updating to show a new value before the backend has confirmed the save, and then reverting if the save fails.
* **Validation Steps:**
    * Open an admin panel and start typing in a text field. While typing, trigger other entity state changes in Home Assistant. The cursor and input value in the admin panel must not be affected.
    * Change a value in a dropdown. The selection should remain stable.
    * Click "Save" and verify that a status indicator appears.
    * After a successful save and a full page reload, confirm the newly saved value is correctly loaded from the backend.
    * Test that if a save operation fails, the UI clearly shows an error and does not keep the unsaved value.
* **Correct Implementation:**
    ```javascript
    // Example of the custom admin panel working with ConfigEntry backend
    class CustomAdminPanel {
      constructor(hass) {
        this.hass = hass;
        this.localConfig = {}; // Local state for the form
        this.isLoaded = false;
      }

      // 1. Load data ONCE when the panel is shown
      async show() {
        if (!this.isLoaded) {
          const response = await this.hass.callApi('GET', 'dashview/config');
          this.localConfig = response;
          this.isLoaded = true;
        }
        this.render();
      }

      // 2. Render the form using the LOCAL state
      render() {
        const textarea = this.shadowRoot.querySelector('#house-config');
        textarea.value = JSON.stringify(this.localConfig, null, 2);

        // Add listener for user input
        textarea.oninput = (e) => {
          try {
            // 3. Update the LOCAL state only, not the backend
            this.localConfig = JSON.parse(e.target.value);
          } catch (error) {
            // Invalid JSON, keep local state unchanged
          }
        };
      }

      // 4. Save data to ConfigEntry ONLY on explicit user action
      async save() {
        const statusEl = this.shadowRoot.querySelector('.status');
        statusEl.textContent = 'Saving...';

        try {
          await this.hass.callApi('POST', 'dashview/config', this.localConfig);
          statusEl.textContent = '✓ Saved to ConfigEntry successfully!';
        } catch (error) {
          statusEl.textContent = `✗ Error: ${error.message}`;
        }
      }
    }
    ```

---

## Implementation Guidelines

### **Code Review Checklist**

When reviewing DashView code, verify:

- [ ] **Data Persistence**: All config uses backend API, no direct file access
- [ ] **Code Reuse**: No duplicate code patterns, proper abstraction
- [ ] **State Management**: Granular updates, proper StateManager usage
- [ ] **Asset Loading**: Bundled assets, embedded templates
- [ ] **API Design**: Centralized endpoints, consistent patterns
- [ ] **Error Handling**: Comprehensive try-catch, user-friendly errors
- [ ] **Testing**: Testable components, validation tools
- [ ] **Performance**: Optimized updates, efficient algorithms
- [ ] **Organization**: Clear structure, consistent naming
- [ ] **Security**: Input validation, secure practices
- [ ] **MDI Icons**: Consistent MDI usage, proper fallbacks
- [ ] **Admin UI State**: Stable form inputs, intentional persistence

### **Priority Levels**

1. **Critical**: Security vulnerabilities, data corruption risks
2. **High**: Performance issues, error handling gaps
3. **Medium**: Code duplication, architectural inconsistencies
4. **Low**: Naming conventions, minor optimizations

### **Documentation Requirements**

- Complex algorithms must be documented
- API endpoints must have clear specifications
- Configuration options must be explained
- Error codes must be documented
- Performance considerations must be noted

---

## PR Validation Process

### **Post-PR Validation Guidelines**

After each Pull Request is merged, the following comprehensive validation process must be executed to ensure all changes comply with the established principles. This validation serves as a quality gate to maintain code standards and architectural integrity.

### **Validation Execution Steps**

1. **Immediate Post-Merge Validation** (within 1 hour of merge)
2. **Comprehensive Principle Review** (within 24 hours of merge) 
3. **Integration Testing** (within 48 hours of merge)
4. **Documentation Updates** (as needed based on changes)

### **Comprehensive Principle Validation Checklist**

For each merged PR, systematically validate against **ALL** principles:

#### **Core Principles Validation (1-6)**

**✅ Principle 1: Centralized and Secure Data Persistence**
- [ ] Verify no new direct file access patterns in `/www/config/`
- [ ] Confirm all new configuration uses `/api/dashview/config` endpoint
- [ ] Check that any new persistent data goes through `ConfigEntry`
- [ ] Test configuration persistence across Home Assistant restarts
- [ ] Validate no hardcoded configuration values were introduced

**✅ Principle 2: Reusable and Abstracted Code (DRY)**
- [ ] Scan for duplicate code patterns in the changed files
- [ ] Verify similar functions are properly abstracted
- [ ] Check for repeated HTML structures or CSS rules
- [ ] Confirm template reuse for UI components
- [ ] Validate utility functions are used instead of code duplication

**✅ Principle 3: Efficient Frontend State Management**
- [ ] Verify no new monolithic update functions were introduced
- [ ] Confirm StateManager usage for entity subscriptions
- [ ] Check that components only update when dependencies change
- [ ] Test granular updates don't cause full DOM re-renders
- [ ] Validate performance with multiple simultaneous entity updates

**✅ Principle 4: Asset Bundling and Efficient Loading**
- [ ] Count HTTP requests - ensure no increase in initial load requests
- [ ] Verify new templates are embedded rather than fetched
- [ ] Check CSS consolidation is maintained
- [ ] Test loading performance on slow connections
- [ ] Validate critical resources load first

**✅ Principle 5: Centralized Backend API Endpoints**
- [ ] Verify no new single-purpose API endpoints were created
- [ ] Confirm new config types use existing `DashViewConfigView`
- [ ] Check new config types are added to `STORE_CONFIG_TYPES`
- [ ] Validate API consistency and error handling
- [ ] Test RESTful patterns are maintained

**✅ Principle 6: Robust Frontend Debugging and Error Handling**
- [ ] Verify all new console logs use `[DashView]` prefix
- [ ] Check try-catch blocks cover all new critical operations
- [ ] Test error displays don't crash other components
- [ ] Confirm `DashViewDebug` toolkit remains functional
- [ ] Validate user-friendly error messages are provided

#### **Additional Principles Validation (7-12)**

**✅ Principle 7: Comprehensive Testing and Validation**
- [ ] Verify new components can be tested in isolation
- [ ] Check test harnesses for complex interactions are provided
- [ ] Confirm validation tools for new configuration options
- [ ] Test reproducible scenarios for new functionality
- [ ] Validate unit tests for new component functions

**✅ Principle 8: Performance and Resource Usage**
- [ ] Measure initial load time remains under 2 seconds
- [ ] Test component updates complete under 100ms
- [ ] Monitor memory usage growth under 10MB per hour
- [ ] Verify 60fps animations and transitions
- [ ] Check efficient data structures and algorithms are used

**✅ Principle 9: Code Organization and Architecture Standards**
- [ ] Verify consistent naming conventions are maintained
- [ ] Check component-based architecture is preserved
- [ ] Confirm clear separation of concerns
- [ ] Validate file organization follows established patterns
- [ ] Review architectural decisions are documented

**✅ Principle 10: Security Best Practices**
- [ ] Verify input validation and sanitization for new inputs
- [ ] Check secure communication protocols are used
- [ ] Confirm authentication and authorization requirements
- [ ] Test protection against common web vulnerabilities
- [ ] Validate secure storage of any sensitive data

**✅ Principle 11: MDI Icon Usage**
- [ ] Verify all icons use proper MDI classes (except weather)
- [ ] Check MDI CSS loads properly with fallbacks
- [ ] Confirm icon naming consistency across components
- [ ] Test icon display when MDI font fails to load
- [ ] Validate processIconName() method handles MDI correctly

**✅ Principle 12: Stable and Intentional Admin UI State**
- [ ] Verify admin form inputs maintain stable state during global hass updates
- [ ] Check admin panels load configuration once and store in local state
- [ ] Confirm input values are bound to local state, not global hass object
- [ ] Test form inputs don't lose focus or reset values during typing
- [ ] Validate save operations require explicit user action with visual feedback
- [ ] Check pessimistic UI updates - changes reflected only after backend confirmation

### **Validation Tools and Commands**

Use these tools to systematically validate principles:

```bash
# Code analysis for duplicate patterns
grep -r "function.*generate.*Content" custom_components/dashview/www/
grep -r "fetch('/local/dashview/config/" custom_components/dashview/www/

# Performance testing
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:8123/local/dashview/"

# Security validation
grep -r "innerHTML\|outerHTML" custom_components/dashview/www/
grep -r "eval\|Function" custom_components/dashview/www/
```

```javascript
// Browser console validation commands
DashViewDebug.diagnose();
DashViewDebug.getStatus();
DashViewDebug.performanceProfile();

// Test component isolation
DashViewDebug.testComponent('weather');
DashViewDebug.testComponent('lights');

// Validate error handling
DashViewDebug.simulateError('network');
DashViewDebug.simulateError('config');
```

### **Validation Report Template**

After completing validation, document results using this template:

```markdown
## PR Validation Report

**PR Number:** #XXX
**Validation Date:** YYYY-MM-DD
**Validator:** [Name]

### Core Principles Compliance
- [ ] Principle 1: Data Persistence ✅/❌
- [ ] Principle 2: Code Reuse ✅/❌
- [ ] Principle 3: State Management ✅/❌
- [ ] Principle 4: Asset Loading ✅/❌
- [ ] Principle 5: API Centralization ✅/❌
- [ ] Principle 6: Error Handling ✅/❌

### Additional Principles Compliance
- [ ] Principle 7: Testing ✅/❌
- [ ] Principle 8: Performance ✅/❌
- [ ] Principle 9: Organization ✅/❌
- [ ] Principle 10: Security ✅/❌
- [ ] Principle 11: MDI Icons ✅/❌
- [ ] Principle 12: Admin UI State ✅/❌

### Issues Found
[List any violations or concerns]

### Recommendations
[Specific actions to address issues]

### Overall Status: ✅ PASS / ❌ FAIL
```

### **Escalation Process**

If validation fails:

1. **Minor Issues**: Create immediate follow-up PR
2. **Major Issues**: Consider reverting the problematic PR
3. **Critical Issues**: Immediate rollback and emergency fix

### **Continuous Improvement**

- Update validation checklist based on recurring issues
- Enhance validation tools and scripts
- Refine the process based on team feedback
- Document lessons learned from validation failures
