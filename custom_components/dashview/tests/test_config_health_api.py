"""
Test configuration health check API endpoints.
"""
import json
import pytest
from unittest.mock import Mock, patch, AsyncMock
from aiohttp import web
from aiohttp.test_utils import make_mocked_request

from custom_components.dashview import DashViewConfigView


class TestConfigHealthAPI:
    """Test suite for configuration health check API."""

    def setup_method(self):
        """Set up test fixtures."""
        self.hass = Mock()
        self.entry = Mock()
        self.entry.options = {
            'house_config': {
                'rooms': {
                    'living_room': {
                        'name': 'Living Room',
                        'room_lights': ['light.test_light', 'light.nonexistent'],
                        'room_sensors': ['sensor.test_sensor']
                    },
                    'kitchen': {
                        'name': 'Kitchen',
                        'room_lights': ['light.kitchen_light']
                    }
                },
                'floors': {
                    'ground_floor': {
                        'name': 'Ground Floor',
                        'rooms': ['living_room', 'nonexistent_room']
                    },
                    'empty_floor': {
                        'name': 'Empty Floor',
                        'rooms': []
                    }
                },
                'scenes': {
                    'test_scene': {
                        'name': 'Test Scene',
                        'entities': {
                            'light.test_light': {'state': 'on'},
                            'light.nonexistent': {'state': 'off'}
                        }
                    }
                }
            },
            'weather_entity': 'weather.nonexistent',
            'integrations_config': {
                'dwd': {
                    'weather_entity': 'weather.dwd_nonexistent'
                }
            }
        }
        
        # Mock HASS states
        self.hass.states.get = Mock(side_effect=lambda entity_id: {
            'light.test_light': Mock(entity_id='light.test_light'),
            'sensor.test_sensor': Mock(entity_id='sensor.test_sensor'),
        }.get(entity_id))
        
        self.view = DashViewConfigView(self.hass, self.entry)

    async def test_config_health_check_get(self):
        """Test GET request for configuration health check."""
        request = make_mocked_request('GET', '/api/dashview/config?type=config_health')
        
        response = await self.view.get(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        
        # Verify response structure
        assert 'totalIssues' in data
        assert 'errors' in data
        assert 'warnings' in data
        assert 'issues' in data
        assert isinstance(data['issues'], list)
        
        # Should find multiple issues in our test data
        assert data['totalIssues'] > 0
        
        # Verify specific issue types are detected
        issue_ids = [issue['id'] for issue in data['issues']]
        
        # Should detect unassigned room
        assert any('unassigned_room_kitchen' in id for id in issue_ids)
        
        # Should detect missing entities
        assert any('missing_entity' in id for id in issue_ids)
        
        # Should detect empty floor
        assert any('empty_floor' in id for id in issue_ids)
        
        # Should detect missing weather entity
        assert any('missing_weather_entity' in id for id in issue_ids)
        
        print(f"Health check found {data['totalIssues']} issues: {data['errors']} errors, {data['warnings']} warnings")

    async def test_room_consistency_check(self):
        """Test room consistency checking."""
        issues = await self.view._check_room_consistency(self.entry.options['house_config'])
        
        # Should find kitchen room not assigned to any floor
        unassigned_issues = [i for i in issues if 'unassigned_room_kitchen' in i['id']]
        assert len(unassigned_issues) == 1
        
        issue = unassigned_issues[0]
        assert issue['type'] == 'warning'
        assert issue['category'] == 'rooms'
        assert issue['fixable'] is True
        assert 'Kitchen' in issue['title']

    async def test_entity_references_check(self):
        """Test entity reference checking."""
        issues = await self.view._check_entity_references(self.entry.options['house_config'])
        
        # Should find missing entities
        missing_entities = [i for i in issues if 'missing_entity' in i['id']]
        assert len(missing_entities) >= 2  # light.nonexistent and light.kitchen_light
        
        # Check specific missing entity
        nonexistent_light_issues = [i for i in missing_entities if 'light.nonexistent' in i['id']]
        assert len(nonexistent_light_issues) == 1
        
        issue = nonexistent_light_issues[0]
        assert issue['type'] == 'error'
        assert issue['category'] == 'entities'
        assert issue['fixable'] is True

    async def test_floor_consistency_check(self):
        """Test floor consistency checking."""
        issues = await self.view._check_floor_consistency(self.entry.options['house_config'])
        
        # Should find empty floor
        empty_floor_issues = [i for i in issues if 'empty_floor' in i['id']]
        assert len(empty_floor_issues) == 1
        
        # Should find missing room reference
        missing_room_issues = [i for i in issues if 'missing_room_ref' in i['id']]
        assert len(missing_room_issues) == 1

    async def test_scene_consistency_check(self):
        """Test scene consistency checking."""
        issues = await self.view._check_scene_consistency(self.entry.options['house_config'])
        
        # Should find missing entity in scene
        scene_issues = [i for i in issues if 'scene_missing_entity' in i['id']]
        assert len(scene_issues) == 1
        
        issue = scene_issues[0]
        assert 'light.nonexistent' in issue['id']
        assert issue['type'] == 'error'

    async def test_weather_configuration_check(self):
        """Test weather configuration checking."""
        issues = await self.view._check_weather_configuration()
        
        # Should find missing weather entity
        weather_issues = [i for i in issues if 'missing_weather_entity' in i['id']]
        assert len(weather_issues) == 1
        
        issue = weather_issues[0]
        assert issue['type'] == 'error'
        assert issue['category'] == 'weather'

    async def test_integration_settings_check(self):
        """Test integration settings checking."""
        issues = await self.view._check_integration_settings()
        
        # Should find missing DWD entity
        dwd_issues = [i for i in issues if 'missing_dwd_entity' in i['id']]
        assert len(dwd_issues) == 1
        
        issue = dwd_issues[0]
        assert issue['type'] == 'warning'
        assert issue['category'] == 'integrations'

    async def test_apply_fix_remove_missing_entity(self):
        """Test applying fix to remove missing entity."""
        fix_data = {
            'roomKey': 'living_room',
            'field': 'room_lights',
            'entityId': 'light.nonexistent',
            'roomName': 'Living Room'
        }
        
        response = await self.view._fix_remove_missing_entity(fix_data)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert data['success'] is True
        assert 'entfernt' in data['message']

    async def test_apply_fix_remove_empty_floor(self):
        """Test applying fix to remove empty floor."""
        fix_data = {
            'floorKey': 'empty_floor',
            'floorName': 'Empty Floor'
        }
        
        response = await self.view._fix_remove_empty_floor(fix_data)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert data['success'] is True

    async def test_config_health_fix_post(self):
        """Test POST request for applying configuration fixes."""
        fix_payload = {
            'fixAction': 'remove_missing_entity',
            'fixData': {
                'roomKey': 'living_room',
                'field': 'room_lights',
                'entityId': 'light.nonexistent',
                'roomName': 'Living Room'
            }
        }
        
        request_data = {
            'type': 'config_health_fix',
            'config': fix_payload
        }
        
        request = make_mocked_request('POST', '/api/dashview/config')
        request.json = AsyncMock(return_value=request_data)
        
        response = await self.view.post(request)
        
        assert response.status == 200
        data = json.loads(response.text)
        assert data['success'] is True

    async def test_invalid_fix_action(self):
        """Test invalid fix action handling."""
        fix_payload = {
            'fixAction': 'invalid_action',
            'fixData': {}
        }
        
        request_data = {
            'type': 'config_health_fix',
            'config': fix_payload
        }
        
        request = make_mocked_request('POST', '/api/dashview/config')
        request.json = AsyncMock(return_value=request_data)
        
        response = await self.view.post(request)
        
        assert response.status == 400
        data = json.loads(response.text)
        assert data['success'] is False
        assert 'Unbekannte' in data['message']

    def test_health_check_error_handling(self):
        """Test health check error handling."""
        # Mock an error in health check
        with patch.object(self.view, '_check_room_consistency', side_effect=Exception('Test error')):
            request = make_mocked_request('GET', '/api/dashview/config?type=config_health')
            
            # This should not raise, but return error response
            response = await self.view.get(request)
            
            assert response.status == 500
            data = json.loads(response.text)
            assert data['totalIssues'] == 1
            assert data['errors'] == 1
            assert any('health_check_error' in issue['id'] for issue in data['issues'])


def test_config_health_api_integration():
    """Integration test for the full health check workflow."""
    print("\n=== Configuration Health Check API Tests ===")
    
    test_suite = TestConfigHealthAPI()
    test_suite.setup_method()
    
    # Run tests
    tests = [
        ('Config Health Check GET', test_suite.test_config_health_check_get),
        ('Room Consistency Check', test_suite.test_room_consistency_check),
        ('Entity References Check', test_suite.test_entity_references_check),
        ('Floor Consistency Check', test_suite.test_floor_consistency_check),
        ('Scene Consistency Check', test_suite.test_scene_consistency_check),
        ('Weather Configuration Check', test_suite.test_weather_configuration_check),
        ('Integration Settings Check', test_suite.test_integration_settings_check),
        ('Apply Fix - Remove Missing Entity', test_suite.test_apply_fix_remove_missing_entity),
        ('Apply Fix - Remove Empty Floor', test_suite.test_apply_fix_remove_empty_floor),
        ('Config Health Fix POST', test_suite.test_config_health_fix_post),
        ('Invalid Fix Action', test_suite.test_invalid_fix_action),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            # Run async test
            import asyncio
            asyncio.run(test_func())
            print(f"✓ {test_name}")
            passed += 1
        except Exception as e:
            print(f"✗ {test_name}: {e}")
            failed += 1
    
    print(f"\nConfiguration Health API Tests: {passed} passed, {failed} failed")
    return passed, failed


if __name__ == '__main__':
    test_config_health_api_integration()