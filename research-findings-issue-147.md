# Research Findings: Smart Suggestions in Room Popups (Issue #147)

## 1. Room Popup Current Implementation 

**File:** `features/popups/room-popup.js`

Room popups receive `areaId` and have access to the full component context. The main render function:
```javascript
export function renderRoomPopup(component, html) {
  if (!component._popupRoom) return '';
  
  const areaId = component._popupRoom.area_id;
  // ... renders all room sections
}
```

**Key finding:** Room popups have all the context needed to filter suggestions by area.

## 2. Suggestion Engine Analysis

**File:** `services/suggestion-engine.js`

The suggestion engine exists but is **not yet integrated** into the UI. Key points:
- `evaluateSuggestions(hass, context)` is exported but never called from main component
- Takes `context` object with `enabledMaps`, `labelIds`, and `entityHasLabel` function
- Returns filtered suggestions array, max 2 items
- Has built-in cooldowns and session dismissals

**Rules implemented:**
1. **Lights Left On** - After 23:00, 2+ lights still on
2. **AC/Windows Conflict** - Climate heating/cooling + window open ⚠️
3. **Sunset Lights** - Sun below horizon, no lights on

## 3. Room Context Filtering Strategy

To filter suggestions by room, we need to:
1. **Modify suggestion rules** to accept `areaId` parameter
2. **Filter entities by area** before evaluation 
3. **Update AC/Windows rule** to check if climate + window are in same room

**Proposed `evaluateACWindowsConflict` modification:**
```javascript
function evaluateACWindowsConflict(hass, context, areaId = null) {
  // ... existing logic ...
  
  // NEW: Filter by area if areaId provided
  if (areaId && context.getAreaIdForEntity) {
    climateIds = climateIds.filter(id => context.getAreaIdForEntity(id) === areaId);
    windowIds = windowIds.filter(id => context.getAreaIdForEntity(id) === areaId);
  }
  
  // ... rest of logic unchanged ...
}
```

## 4. Injection Point in Room Popup

**File:** `features/popups/room-popup.js`, line 112

Suggestions should appear after `renderClimateNotification` but before content sections:

```javascript
${renderClimateNotification(component, html, areaId)}
${renderRoomSuggestions(component, html, areaId)}  // <-- NEW
${renderThermostatSection(component, html, areaId)}
```

**Styling pattern:** Reuse existing `popup-notification` CSS classes (already used for climate notifications).

## 5. Existing Notification Patterns

**Current climate notification in room popup:**
```javascript
function renderClimateNotification(component, html, areaId) {
  const notification = component._getRoomClimateNotification(areaId);
  
  return html`
    <div class="popup-notification">
      <div class="popup-notification-icon">⚠️</div>
      <div class="popup-notification-title">${notification.title}</div>
      <div class="popup-notification-subtitle">${notification.subtitle}</div>
    </div>
  `;
}
```

**Perfect template** for suggestion banners!

## 6. Implementation Plan

### New Files:
1. **`features/popups/room-suggestions.js`**
   - `renderRoomSuggestions(component, html, areaId)` 
   - Calls modified `evaluateSuggestions()` with room filter

### Modified Files:
1. **`services/suggestion-engine.js`**
   - Add optional `areaId` parameter to rule functions
   - Update context to include `getAreaIdForEntity` function

2. **`features/popups/room-popup.js`** 
   - Import and call `renderRoomSuggestions()` 
   - Add suggestion action handlers

3. **`dashview-panel.js`**
   - Add `_handleRoomSuggestionAction()` method
   - Add `_dismissRoomSuggestion()` method

### Context Flow:
```javascript
// In room popup
const suggestions = evaluateSuggestions(component.hass, {
  enabledMaps: component._getEnabledMaps(),
  labelIds: component._getLabelIds(), 
  entityHasLabel: (id, labelId) => component._entityHasCurrentLabel(id, labelId),
  getAreaIdForEntity: (entityId) => component._getAreaIdForEntity(entityId)
}, areaId);  // <-- Room filter
```

## 7. Effort Estimate

**Medium effort (2-3 days)**

- ✅ **Infrastructure exists**: Suggestion engine, notification styling, room context
- ✅ **Clear injection point**: Room popup render function 
- 🔨 **Main work**: Modifying rules for area filtering + integration
- ⚡ **Quick wins**: Reuse existing CSS patterns and notification components

**Next Steps:**
1. Modify `evaluateSuggestions()` to accept `areaId` parameter
2. Create `renderRoomSuggestions()` function
3. Wire up action handlers for dismissal/actions
4. Test with AC/windows scenario in specific rooms

The foundation is solid - this is primarily a **filtering and integration task** rather than building new systems.