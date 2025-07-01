# Custom YAML Cards - Testing Examples

This document provides examples to test the new Custom YAML Cards feature in DashView.

## Example 1: Markdown Card

**Card ID:** `weather_info`
**Name:** `Weather Information`

**YAML Configuration:**
```yaml
type: markdown
title: Current Weather
content: |
  # Weather Dashboard
  
  **Current Temperature:** {{ states('sensor.temperature') }}°C
  **Humidity:** {{ states('sensor.humidity') }}%
  **Pressure:** {{ states('sensor.pressure') }} hPa
  
  *Last updated: {{ relative_time(states.sensor.temperature.last_changed) }}*
```

## Example 2: Entity Card

**Card ID:** `living_room_light`
**Name:** `Living Room Light Control`

**YAML Configuration:**
```yaml
type: entity
entity: light.living_room
name: Living Room Light
show_state: true
icon: mdi:lightbulb
```

## Example 3: Button Card

**Card ID:** `all_lights_toggle`
**Name:** `All Lights Toggle`

**YAML Configuration:**
```yaml
type: button
name: Toggle All Lights
icon: mdi:lightbulb-group
entity: switch.all_lights
```

## Example 4: Picture Card

**Card ID:** `security_camera`
**Name:** `Front Door Camera`

**YAML Configuration:**
```yaml
type: picture
title: Front Door
image: /local/images/front_door_camera.jpg
```

## Example 5: Complex Markdown with Multiple Entities

**Card ID:** `home_status`
**Name:** `Home Status Overview`

**YAML Configuration:**
```yaml
type: markdown
title: Home Status
content: |
  ## 🏠 Home Overview
  
  ### 🌡️ Climate
  - Living Room: {{ states('sensor.living_room_temperature') }}°C
  - Bedroom: {{ states('sensor.bedroom_temperature') }}°C
  - Outdoor: {{ states('sensor.outdoor_temperature') }}°C
  
  ### 💡 Lighting
  - Lights On: {{ states('sensor.lights_on_count') }}
  - Total Power: {{ states('sensor.total_light_power') }}W
  
  ### 🔒 Security
  - All Doors: {{ states('binary_sensor.all_doors') }}
  - All Windows: {{ states('binary_sensor.all_windows') }}
  - Alarm: {{ states('alarm_control_panel.home') }}
  
  ---
  *Updated: {{ now().strftime('%H:%M') }}*
```

## Testing Steps

1. **Add Custom Cards via Admin Panel:**
   - Navigate to DashView admin panel
   - Go to "Custom Cards" tab
   - Add each example using the provided Card ID, Name, and YAML

2. **Configure Floor Layout:**
   - Go to "Floor Layouts" tab
   - Select a slot and change type to "Custom Card"
   - Choose one of your created custom cards

3. **Test in Main View:**
   - Return to main DashView dashboard
   - Verify custom cards render correctly
   - Check entity state updates work

## Expected Behavior

- **Markdown cards** should render formatted text with entity values
- **Entity cards** should show entity state and be clickable
- **Button cards** should be styled as buttons and be interactive
- **Picture cards** should display images properly
- **Entity templates** like `{{ states('sensor.temperature') }}` should show current values
- **Real-time updates** should occur when entity states change

## Error Handling

Test these scenarios to verify error handling:

1. **Invalid YAML:**
```yaml
type: markdown
content: |
  Invalid YAML: {{{{ malformed template
```

2. **Missing Entity:**
```yaml
type: entity
entity: sensor.non_existent_sensor
```

3. **Unknown Card Type:**
```yaml
type: unknown_card_type
some_property: value
```

Each should display appropriate error messages without breaking the dashboard.

## Notes

- Custom cards integrate with DashView's existing theming (light/dark mode)
- Entity state monitoring automatically includes entities referenced in YAML
- Complex card types fall back to informative placeholders
- Cards can be used in both big and small layout slots