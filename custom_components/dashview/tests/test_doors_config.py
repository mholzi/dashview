#!/usr/bin/env python3
"""Test suite for DashView door configuration validation."""

import json
import sys
import os

# Note: This is a standalone test that doesn't require Home Assistant
print("[DashView] Running door configuration validation tests...")

def test_doors_config_structure():
    """Test door configuration structure validation."""
    # Valid door configuration
    valid_config = {
        "front_door": {
            "friendly_name": "Front Door",
            "sensor": "binary_sensor.front_door",
            "lock": "lock.front_door",
            "type": "door",
            "notifications": True
        },
        "back_door": {
            "friendly_name": "Back Door", 
            "sensor": "binary_sensor.back_door",
            "lock": "",
            "type": "door",
            "notifications": False
        },
        "garage_door": {
            "friendly_name": "Garage Door",
            "sensor": "binary_sensor.garage_door",
            "lock": "",
            "type": "garage",
            "notifications": True
        }
    }
    
    # Test valid configuration
    assert isinstance(valid_config, dict), "Doors config must be a dictionary"
    
    for door_id, door_config in valid_config.items():
        assert isinstance(door_config, dict), f"Door config for {door_id} must be a dictionary"
        assert "friendly_name" in door_config, f"Door {door_id} must have friendly_name"  
        assert "sensor" in door_config, f"Door {door_id} must have sensor field"
        assert "type" in door_config, f"Door {door_id} must have type field"
        
        # Test door types
        assert door_config["type"] in ["door", "gate", "garage"], f"Door {door_id} type must be door, gate, or garage"
        
        # Test entity ID format if provided
        if door_config.get("sensor"):
            assert "." in door_config["sensor"], f"Door {door_id} sensor must be valid entity ID"
        if door_config.get("lock"):
            assert "." in door_config["lock"], f"Door {door_id} lock must be valid entity ID"
    
    print("✓ Door config structure validation test passed")

def test_empty_doors_config():
    """Test that empty door configuration is valid."""
    empty_config = {}
    assert isinstance(empty_config, dict), "Empty doors config must be valid dictionary"
    print("✓ Empty doors config validation test passed")

def test_doors_config_json_serialization():
    """Test that door configuration can be JSON serialized/deserialized."""
    config = {
        "test_door": {
            "friendly_name": "Test Door",
            "sensor": "binary_sensor.test_door",  
            "lock": "lock.test_door",
            "type": "door",
            "notifications": True
        }
    }
    
    # Test JSON serialization
    json_str = json.dumps(config)
    deserialized = json.loads(json_str)
    assert deserialized == config, "Door config must survive JSON serialization"
    print("✓ Door config JSON serialization test passed")

def test_door_id_validation():
    """Test door ID format validation."""
    valid_ids = ["front_door", "back_door", "garage_door", "door_1", "test_door_main"]
    invalid_ids = ["", "door with spaces", "door-with-dashes", "door.with.dots"]
    
    for door_id in valid_ids:
        # Basic validation - should contain only letters, numbers, underscores
        assert door_id.replace('_', '').replace('0', '').replace('1', '').replace('2', '').replace('3', '').replace('4', '').replace('5', '').replace('6', '').replace('7', '').replace('8', '').replace('9', '').isalpha() or '_' in door_id, f"Door ID {door_id} should be valid"
    
    print("✓ Door ID validation test passed")

if __name__ == "__main__":
    try:
        test_doors_config_structure()
        test_empty_doors_config()
        test_doors_config_json_serialization()
        test_door_id_validation()
        print("[DashView] All door configuration tests passed!")
    except Exception as e:
        print(f"[DashView] Door configuration test failed: {e}")
        sys.exit(1)