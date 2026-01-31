# Research Findings: AC/Windows Rule Not Detecting Thermostats (Issue #148)

## 1. Root Cause Identified: Enabled Entity Mismatch

**Critical Bug Found:** The suggestion engine expects enabled entities to be explicitly marked as `true`, but the main component treats entities as enabled by default unless explicitly set to `false`.

### Current Flow:
1. Main component: `_enabledClimates = { "climate.thermostat": undefined }` (enabled by default)
2. Suggestion engine calls: `getEnabledEntityIds(enabledClimates)`
3. `getEnabledEntityIds` returns: `[]` (empty! because no entity has `true` value)
4. AC/Windows rule gets no climate entities → never triggers

### Evidence:

**File:** `utils/helpers.js:240`
```javascript
export function getEnabledEntityIds(enabledMap) {
  if (!enabledMap) return [];
  return Object.entries(enabledMap)
    .filter(([_, enabled]) => enabled)  // ❌ Only entities with explicit `true`
    .map(([id]) => id);
}
```

**File:** `dashview-panel.js:3607`
```javascript
_getEnabledEntityIdsFromRegistry(labelId, enabledMap) {
  // Skip only explicitly disabled entities (enabled by default)
  if (enabledMap[e.entity_id] === false) return;  // ✅ Default enabled
  filtered.push(e.entity_id);
}
```

**This mismatch means the suggestion engine receives ZERO climate entities, even when thermostats are active.**

## 2. AC/Windows Rule Analysis

**File:** `services/suggestion-engine.js:149-192`

The `evaluateACWindowsConflict` function itself is **correctly implemented**:

✅ **Climate States:** Properly checks `['cool', 'heat', 'heat_cool', 'auto', 'heating', 'cooling']`
✅ **Window Detection:** Correctly finds open windows (`'on'` state for binary sensors)  
✅ **Logic Flow:** Sound evaluation logic once it receives entities

```javascript
function evaluateACWindowsConflict(hass, context) {
  const enabledClimates = context.enabledMaps?.enabledClimates || {};
  const enabledWindows = context.enabledMaps?.enabledWindows || {};

  // ❌ BUG: getEnabledEntityIds returns [] for default-enabled entities
  let climateIds = getEnabledEntityIds(enabledClimates);
  let windowIds = getEnabledEntityIds(enabledWindows);

  if (climateIds.length === 0 || windowIds.length === 0) return null; // ❌ Always fails here!
  
  // ... rest is correct but never reached
}
```

## 3. Context Building Issues

**Current Problem:** The suggestion engine is **never called** from the main component.

**Evidence:** 
- `evaluateSuggestions` is exported but never imported/used in `dashview-panel.js`
- No integration in home tab, room popups, or anywhere else
- Rule works in isolation but has no UI integration

**Missing Integration Points:**
```javascript
// Should be called from dashboard render (doesn't exist yet)
const suggestions = evaluateSuggestions(this.hass, {
  enabledMaps: {
    enabledClimates: this._enabledClimates,  // ❌ Wrong format
    enabledWindows: this._enabledWindows,    // ❌ Wrong format
  },
  labelIds: {
    climate: this._climateLabelId,
    window: this._windowLabelId,
  },
  entityHasLabel: (id, labelId) => this._entityHasCurrentLabel(id, labelId),
});
```

## 4. Climate Entity States in HA

**All valid climate states that should trigger the rule:**
- `heat` - Actively heating
- `cool` - Actively cooling  
- `heat_cool` - Auto mode (heating or cooling)
- `auto` - Automatic temperature control
- `dry` - Dehumidifying mode
- `fan_only` - Fan circulation (less critical)

**Current rule correctly includes:** `['cool', 'heat', 'heat_cool', 'auto', 'heating', 'cooling']`

**Missing state:** Should consider adding `'dry'` for dehumidifier conflicts with open windows.

## 5. Comparison with Working Climate Code

**File:** `dashview-panel.js:2676-2680` (Room popup climate entities)

```javascript
_getEnabledClimatesForRoom(areaId) {
  return this._getEnabledEntitiesForRoom(areaId, this._enabledClimates, s => ({
    state: s.state, hvacAction: s.attributes?.hvac_action,
    currentTemp: s.attributes?.current_temperature, targetTemp: s.attributes?.temperature,
  }), this._climateLabelId);
}
```

**This works because `_getEnabledEntitiesForRoom()` uses the registry-based approach (enabled by default), not `getEnabledEntityIds()`.**

## 6. Proposed Fix

### Option A: Fix the Helper Function (Recommended)
Create a new helper function that matches the main component's logic:

**File:** `utils/helpers.js`
```javascript
/**
 * Get enabled entity IDs using "enabled by default" logic
 * Entities are enabled unless explicitly set to false
 */
export function getEnabledEntityIdsDefault(enabledMap) {
  if (!enabledMap) return [];
  return Object.entries(enabledMap)
    .filter(([_, enabled]) => enabled !== false)  // ✅ Enabled by default
    .map(([id]) => id);
}
```

**File:** `services/suggestion-engine.js`
```javascript
// Import the new helper
import { getEnabledEntityIdsDefault as getEnabledEntityIds } from '../utils/helpers.js';

// Now the rule will receive actual climate entities!
```

### Option B: Fix the Context Building
Build the context with explicitly enabled entities:

```javascript
// In main component when calling evaluateSuggestions
const buildExplicitlyEnabledMap = (labelId, enabledMap) => {
  const explicitMap = {};
  this._getEnabledEntityIdsFromRegistry(labelId, enabledMap)
    .forEach(id => explicitMap[id] = true);
  return explicitMap;
};

const context = {
  enabledMaps: {
    enabledClimates: buildExplicitlyEnabledMap(this._climateLabelId, this._enabledClimates),
    enabledWindows: buildExplicitlyEnabledMap(this._windowLabelId, this._enabledWindows),
  },
  // ... rest
};
```

## 7. Integration Requirements

**Missing Integration Steps:**
1. **Import suggestion engine** in `dashview-panel.js`
2. **Call `evaluateSuggestions()`** in home tab render
3. **Render suggestion banners** in home content
4. **Add action handlers** for suggestion dismiss/actions
5. **Wire up popup navigation** for "View Windows" action

**Suggested Integration Point:**
```javascript
// In home tab render, after room cards
${this._renderSuggestionBanners()}

// New method
_renderSuggestionBanners() {
  const suggestions = evaluateSuggestions(this.hass, this._buildSuggestionContext());
  return suggestions.map(suggestion => this._renderSuggestionBanner(suggestion));
}
```

## 8. Testing Requirements

**Test Case for AC/Windows Rule:**
1. Set thermostat to "heat" mode with target temp > current temp
2. Open window sensor (state: 'on') in same area as thermostat  
3. Ensure both entities have same area assignment
4. Verify both entities are labeled with climate/window labels
5. Check that suggestion banner appears

**Debug Steps:**
```javascript
// Add debug logging to suggestion engine
console.log('Climate IDs found:', climateIds);
console.log('Window IDs found:', windowIds);
console.log('Active climates:', activeClimates);
console.log('Open windows:', openWindows);
```

## 9. Effort Estimate

**Low effort (1 day)** 

✅ **Root cause identified**: Simple helper function mismatch
✅ **Rule logic is correct**: No changes needed to AC/Windows evaluation  
✅ **Integration pattern exists**: Can follow climate notification patterns

**Work Required:**
1. **Fix helper function** - 15 minutes
2. **Add suggestion engine integration** - 2-3 hours  
3. **Test with real climate entities** - 1-2 hours
4. **Polish UI integration** - 1-2 hours

## 10. Additional Findings

**Climate entities should be receiving context via:**
- `this._enabledClimates` - Main enabled map
- `this._climateLabelId` - Label for filtering
- `this._entityHasCurrentLabel()` - Label checking function
- `this._getAreaIdForEntity()` - Area assignment

**All infrastructure exists, it's purely a data format mismatch between:**
- Helper function expecting explicit `true` values
- Main component using "enabled unless `false`" logic

**Once fixed, the AC/Windows rule should work immediately with all valid climate states.**