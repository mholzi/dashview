# Light Section for DashView

This directory contains the light section implementation for room cards, designed to work with Home Assistant Lovelace dashboards and lovelace_gen.

## Files

### `light_section.yaml`
The main light section configuration that can be included in room cards using:
```yaml
- !include
  - light_section.yaml
  - room: {{ room }} # lovelace_gen
```

This file includes:
- Room-based light entity mappings for different rooms in the house
- Expandable card structure with light count display
- Custom button cards with JavaScript templating
- Integration with sensor templates

### Templates

#### `templates/sensor_small_swipe.yaml`
A decluttering card template that creates swipeable sensor cards with two views:
- Normal view showing current state
- Last changed view showing when the entity was last updated

#### `templates/sensor_small.yaml`
The core sensor template supporting multiple device types:
- `light`: Light entities with on/off states
- `motion`: Motion sensor entities
- `door`: Door sensors with lock states
- `window`: Window sensors
- `temp`: Temperature sensors
- `dishwasher`: Dishwasher status
- `dryer`: Dryer status
- `printer`: Printer status
- `cartridge`: Printer cartridge levels
- `hoover`: Robot vacuum status
- `freezer`: Freezer alarm status

## Room Mappings

The light section includes predefined room mappings for:
- Wohnzimmer (Living Room)
- Büro (Office)
- Küche (Kitchen)
- Eingang (Entrance)
- Gästeklo (Guest Toilet)
- Flur (Hallway)
- Kinderzimmer (Children's Room)
- Kinderbad (Children's Bathroom)
- Aupair (Au Pair Room)
- Eltern (Parents Room)
- Partykeller (Party Cellar)
- Heizungskeller (Heating Cellar)
- Kellerflur (Cellar Hallway)
- Wäschekeller (Laundry Cellar)
- Serverraum (Server Room)
- Kellerraum (Cellar Room)
- Aussen (Outside)
- Kinderflur (Children's Hallway)
- Sauna

## Usage

1. Install the required custom components:
   - `custom:mod-card`
   - `custom:expander-card`
   - `custom:button-card`
   - `custom:decluttering-card`
   - `custom:css-swipe-card`

2. Add the decluttering card templates to your Home Assistant configuration:
   ```yaml
   decluttering_templates: !include_dir_named lovelace/templates/
   ```

3. Include the light section in your room cards:
   ```yaml
   - !include
     - lovelace/light_section.yaml
     - room: "Wohnzimmer"  # or any other room name
   ```

## Customization

To customize for your own setup:

1. Update the `room_lights` dictionary in `light_section.yaml` with your actual light entity IDs
2. Add or remove rooms as needed
3. Modify the styling variables to match your theme
4. Extend the sensor template to support additional device types if needed

## Dependencies

This configuration requires:
- Home Assistant with Lovelace
- lovelace_gen for templating support
- The custom components listed above
- Material Design Icons (MDI) for iconography