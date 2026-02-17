## Dashview v1.5.0

### 🔐 Alarm Control Panel

Full alarm system integration based on Home Assistant's `alarm_control_panel` entity:

- **Auto-detection**: Automatically discovers your alarm entity (#151)
- **Complete UI**: Arm Home, Arm Away, Disarm with optional code input when `code_arm_required` is set (#40, #151)
- **Security status bar**: State-aware coloring with alarm triggered banner (#152, #165)
- **Security summary card**: Dedicated card in the floor grid showing current security state (#40, #143)

### 💡 Smart Suggestions

Contextual suggestions that help you configure rooms faster:

- **Room popup suggestions**: Automatically recommends relevant entities based on room context (#150)
- **Suggestion engine**: Filters and ranks entities intelligently, excluding automations, scripts, and scenes (#53, #144)

### 🏠 Extended Entity Support

New entity types integrated across the dashboard:

- **Doors**: Chips in room popups when open, security popup integration, admin panel support (#109, #131)
- **Roof windows**: Dedicated section in room popups with own touch handlers (#108, #131)
- **Smoke detectors**: Alert integration in main dashboard info text (#111, #131)
- **Locks**: Collapsible section in room popups with quick action buttons (#105, #124)

### ⚠️ Smart Alerts

Proactive notifications that surface important state changes:

- **Open-too-long alerts**: Configurable alerts for roof windows, covers, locks, and doors left open (#110, #129)
- **Rate-of-change detection**: Temperature and humidity anomaly detection with trend indicators
- **Dismissible status bar alerts**: Non-intrusive notifications that can be dismissed

### ☀️ Weather Enhancements

- **UV index display**: Added to weather popup for sun exposure awareness (#42, #142)
- **Pollen forecast translations**: Fixed fallback language for pollen popup

### 🎯 Quick Actions & Interactions

- **Quick action buttons**: One-tap control for locks, TVs, garages, and media players (#107, #128)
- **Long-press everywhere**: Long-press any entity to open its Home Assistant detail dialog (#104, #131)
- **Gesture handler fix**: Mouse drag now continues tracking outside element boundaries — slider values no longer get lost when the cursor leaves the element (#171, #174)

### 🌐 Internationalization

Complete i18n overhaul removing all hardcoded strings:

- Replaced hardcoded German strings in alarm status, anomaly detector, and admin panel (#112, #113, #120, #157, #159)
- Replaced hardcoded English strings in anomaly detector duration formatting (#158, #161)
- Removed deprecated `german-text.js` — all translations now live in locale files (#145)
- Added 19 missing locale keys to both `en.json` and `de.json` (#141, #145)

### 🏗️ Admin UX

- **Entity preview**: See entity states directly in admin configuration (#46, #47)
- **Setup tab improvements**: Streamlined onboarding experience (#70, #72)
- **Configurable vacuum mapping**: Removed hardcoded room names, added configurable mapping (#79, #114, #137)

### 🐛 Bug Fixes

- Fixed version mismatch between frontend and backend causing cache invalidation (#172, #173)
- Fixed waterLeak settings not persisting in saveSettings() (#168)
- Path traversal fix in delete_photo using validate_and_sanitize_filename (#169)
- Fixed entity filtering to exclude automations, scripts, and scenes from room lists (#138, #139)
- Fixed cover/roof window slider layout with percentage gap and title wrapping
- Fixed garage item height normalization (#99, #100, #101)
- Fixed light slider mouse handling to use core events (#73, #95)
- Deduplicated concurrent settings load calls (#74, #96)
- Removed hardcoded washer entity ID fallback (#118, #125)

### 🧹 Code Quality

- **Backend split**: Extracted `security.py` and `websocket.py` from `__init__.py` (661 → 170 lines) (#175)
- **Polyfill deduplication**: `structuredClone` polyfill now has a single source of truth instead of two copies (#175)
- **Dead code cleanup**: Removed unused motion provider and dryer code from status-service (#164)
- **Shared helpers**: Extracted common utilities in status-service for reuse (#154, #163)
- **Test coverage**: Added 31 gesture handler tests, updated 16 test expectations for refactored code (#174)
- **Debug cleanup**: Removed console.log statements left in production (#80, #98)
- **Resource cleanup**: Proper cleanup in `async_unload_entry` (#77, #97)
- **Settings deduplication**: Concurrent settings load calls are now deduplicated (#74, #96)
- **Code review fixes**: Addressed findings from multiple PRs (#156, #159, #161, #162)
