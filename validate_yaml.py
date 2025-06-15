#!/usr/bin/env python3
"""
Simple validation script for the light section YAML files
"""

import yaml
import os
import sys
from pathlib import Path

def validate_yaml_file(file_path):
    """Validate that a YAML file can be parsed"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Skip files with Jinja2 templating or Home Assistant includes
            content = f.read()
            if '{%' in content or '{{' in content or '!include' in content:
                print(f"✓ {file_path} - Skipped (contains templating or includes)")
                return True
            
            # Reset file pointer and parse
            f.seek(0)
            yaml.safe_load(f)
            print(f"✓ {file_path} - Valid YAML")
            return True
    except yaml.YAMLError as e:
        print(f"✗ {file_path} - YAML Error: {e}")
        return False
    except Exception as e:
        print(f"✗ {file_path} - Error: {e}")
        return False

def main():
    """Main validation function"""
    base_path = Path(__file__).parent
    lovelace_path = base_path / "lovelace"
    
    if not lovelace_path.exists():
        print("Error: lovelace directory not found")
        sys.exit(1)
    
    yaml_files = list(lovelace_path.rglob("*.yaml")) + list(lovelace_path.rglob("*.yml"))
    
    if not yaml_files:
        print("No YAML files found")
        sys.exit(1)
    
    print(f"Validating {len(yaml_files)} YAML files...")
    all_valid = True
    
    for yaml_file in sorted(yaml_files):
        if not validate_yaml_file(yaml_file):
            all_valid = False
    
    if all_valid:
        print("\n✓ All files validated successfully!")
        sys.exit(0)
    else:
        print("\n✗ Some files failed validation")
        sys.exit(1)

if __name__ == "__main__":
    main()