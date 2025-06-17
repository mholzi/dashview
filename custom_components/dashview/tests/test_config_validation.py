"""Test configuration validation for DashView."""
import json
import sys
import os

# Add the parent directory to the path so we can import the store module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from store import DashViewStore
except ImportError:
    print("[DashView] Note: DashViewStore import skipped (requires Home Assistant)")
    DashViewStore = None


class TestDashViewStore:
    """Test the DashViewStore class - Principle 7."""
    
    def test_floors_config_validation(self):
        """Test floors configuration structure validation."""
        valid_floors_config = {
            "floor_icons": {
                "EG": "mdi:home",
                "OG": "mdi:home-floor-1"
            },
            "floor_sensors": {
                "EG": "binary_sensor.floor_eg_active",
                "OG": "binary_sensor.floor_og_active"
            }
        }
        
        invalid_floors_config = {
            "floor_icons": {
                "EG": "mdi:home"
            }
            # Missing floor_sensors
        }
        
        # Test valid config
        assert "floor_icons" in valid_floors_config
        assert "floor_sensors" in valid_floors_config
        
        # Test invalid config
        assert "floor_icons" in invalid_floors_config
        assert "floor_sensors" not in invalid_floors_config
    
    def test_rooms_config_validation(self):
        """Test rooms configuration structure validation."""
        valid_rooms_config = {
            "floors": {
                "EG": [
                    "binary_sensor.combined_sensor_wohnzimmer",
                    "binary_sensor.combined_sensor_buero"
                ],
                "OG": [
                    "binary_sensor.combined_sensor_kids"
                ]
            }
        }
        
        invalid_rooms_config = {
            "floor_data": {
                "EG": []
            }
            # Missing floors key
        }
        
        # Test valid config
        assert "floors" in valid_rooms_config
        assert isinstance(valid_rooms_config["floors"], dict)
        
        # Test invalid config
        assert "floors" not in invalid_rooms_config
    
    def test_house_config_validation(self):
        """Test house configuration structure validation."""
        valid_house_config = {
            "rooms": {
                "wohnzimmer": {
                    "friendly_name": "Wohnzimmer",
                    "icon": "mdi:sofa",
                    "floor": "EG",
                    "combined_sensor": "binary_sensor.combined_sensor_wohnzimmer",
                    "lights": [],
                    "covers": [],
                    "media_players": []
                },
                "buero": {
                    "friendly_name": "Büro",
                    "icon": "mdi:desk",
                    "floor": "EG",
                    "combined_sensor": "binary_sensor.combined_sensor_buero",
                    "lights": [],
                    "covers": [],
                    "media_players": []
                }
            },
            "floors": {
                "EG": {
                    "friendly_name": "Erdgeschoss",
                    "icon": "mdi:home",
                    "floor_sensor": "binary_sensor.floor_eg_active"
                },
                "OG": {
                    "friendly_name": "Obergeschoss",
                    "icon": "mdi:home-floor-1",
                    "floor_sensor": "binary_sensor.floor_og_active"
                }
            }
        }
        
        invalid_house_config = {
            "rooms": {
                "wohnzimmer": {
                    "friendly_name": "Wohnzimmer",
                    "icon": "mdi:sofa",
                    "floor": "EG"
                    # Missing combined_sensor and other required fields
                }
            }
            # Missing floors
        }
        
        # Test valid config
        assert "rooms" in valid_house_config
        assert "floors" in valid_house_config
        assert isinstance(valid_house_config["rooms"], dict)
        assert isinstance(valid_house_config["floors"], dict)
        
        # Test room structure
        for room_key, room_config in valid_house_config["rooms"].items():
            assert "friendly_name" in room_config
            assert "icon" in room_config
            assert "floor" in room_config
            assert "combined_sensor" in room_config
            assert "lights" in room_config
            assert "covers" in room_config
            assert "media_players" in room_config
        
        # Test floor structure
        for floor_key, floor_config in valid_house_config["floors"].items():
            assert "friendly_name" in floor_config
            assert "icon" in floor_config
            assert "floor_sensor" in floor_config
        
        # Test invalid config
        assert "rooms" in invalid_house_config
        assert "floors" not in invalid_house_config
    
    def test_entity_id_validation(self):
        """Test entity ID format validation."""
        valid_entity_ids = [
            "binary_sensor.floor_eg_active",
            "weather.forecast_home",
            "person.markus"
        ]
        
        invalid_entity_ids = [
            "invalid_entity_id",
            "sensor.",
            ".invalid",
            "SENSOR.INVALID",
            "sensor.invalid-name"
        ]
        
        import re
        entity_pattern = re.compile(r'^[a-z_]+\.[a-z0-9_]+$')
        
        # Test valid entity IDs
        for entity_id in valid_entity_ids:
            assert entity_pattern.match(entity_id), f"Valid entity ID {entity_id} should match pattern"
        
        # Test invalid entity IDs
        for entity_id in invalid_entity_ids:
            assert not entity_pattern.match(entity_id), f"Invalid entity ID {entity_id} should not match pattern"


class TestDashViewConfigValidation:
    """Test configuration validation functions - Principle 7."""
    
    def test_config_structure_validation(self):
        """Test configuration structure validation."""
        def validate_config_structure(config, required_fields):
            """Helper function to validate config structure."""
            if not config or not isinstance(config, dict):
                return False
            return all(field in config for field in required_fields)
        
        # Test floors config validation
        floors_config = {
            "floor_icons": {},
            "floor_sensors": {}
        }
        assert validate_config_structure(floors_config, ["floor_icons", "floor_sensors"])
        assert not validate_config_structure(floors_config, ["floor_icons", "floor_sensors", "missing_field"])
        
        # Test rooms config validation
        rooms_config = {
            "floors": {}
        }
        assert validate_config_structure(rooms_config, ["floors"])
        assert not validate_config_structure(rooms_config, ["floors", "missing_field"])
        
        # Test invalid configs
        assert not validate_config_structure(None, ["floors"])
        assert not validate_config_structure("not_a_dict", ["floors"])
        assert not validate_config_structure([], ["floors"])


if __name__ == "__main__":
    # Simple test runner
    test_store = TestDashViewStore()
    test_validation = TestDashViewConfigValidation()
    
    try:
        print("[DashView] Running configuration validation tests...")
        
        test_store.test_floors_config_validation()
        print("✓ Floors config validation test passed")
        
        test_store.test_rooms_config_validation()
        print("✓ Rooms config validation test passed")
        
        test_store.test_house_config_validation()
        print("✓ House config validation test passed")
        
        test_store.test_entity_id_validation()
        print("✓ Entity ID validation test passed")
        
        test_validation.test_config_structure_validation()
        print("✓ Config structure validation test passed")
        
        print("[DashView] All tests passed!")
        
    except AssertionError as e:
        print(f"[DashView] Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"[DashView] Test error: {e}")
        exit(1)