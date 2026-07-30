#!/usr/bin/env python3
"""
Backend API tests for NEXUS Real Settings routes.
Tests all 4 new API endpoints.

NOTE: This test runs in a containerized environment without external network access.
Full integration testing with Supabase requires an environment with internet connectivity.
This test verifies:
1. Route existence and basic structure
2. Authentication guards (401 responses)
3. Request/response formats
"""

import os
import sys
import requests
import json

# Configuration
BASE_URL = "https://nexus-ai-collab.preview.emergentagent.com"

def test_get_users_me():
    """Test GET /api/users/me - Authentication guard only"""
    print("\n=== TEST: GET /api/users/me ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        response = requests.get(f"{BASE_URL}/api/users/me")
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_patch_users_me():
    """Test PATCH /api/users/me - Authentication guard only"""
    print("\n=== TEST: PATCH /api/users/me ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        payload = {"full_name": "Test Name"}
        response = requests.patch(f"{BASE_URL}/api/users/me", json=payload)
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_get_api_keys():
    """Test GET /api/users/me/api-keys - Authentication guard only"""
    print("\n=== TEST: GET /api/users/me/api-keys ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        response = requests.get(f"{BASE_URL}/api/users/me/api-keys")
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_patch_api_keys():
    """Test PATCH /api/users/me/api-keys - Authentication guard only"""
    print("\n=== TEST: PATCH /api/users/me/api-keys ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        payload = {"anthropic_api_key": "sk-test-key"}
        response = requests.patch(f"{BASE_URL}/api/users/me/api-keys", json=payload)
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_patch_orgs():
    """Test PATCH /api/orgs/[id] - Authentication guard only"""
    print("\n=== TEST: PATCH /api/orgs/[id] ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        test_org_id = "00000000-0000-0000-0000-000000000000"  # Dummy UUID
        payload = {"name": "Test Org"}
        response = requests.patch(f"{BASE_URL}/api/orgs/{test_org_id}", json=payload)
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_patch_org_members():
    """Test PATCH /api/org-members/[id] - Authentication guard only"""
    print("\n=== TEST: PATCH /api/org-members/[id] ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        test_member_id = "00000000-0000-0000-0000-000000000000"  # Dummy UUID
        payload = {"role": "member"}
        response = requests.patch(f"{BASE_URL}/api/org-members/{test_member_id}", json=payload)
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_delete_org_members():
    """Test DELETE /api/org-members/[id] - Authentication guard only"""
    print("\n=== TEST: DELETE /api/org-members/[id] ===")
    
    try:
        # Test: Unauthenticated request should return 401
        print("\n1. Testing unauthenticated request (should return 401)...")
        test_member_id = "00000000-0000-0000-0000-000000000000"  # Dummy UUID
        response = requests.delete(f"{BASE_URL}/api/org-members/{test_member_id}")
        
        if response.status_code == 401:
            print("✓ Route exists and returns 401 for unauthenticated requests")
            data = response.json()
            if "error" in data:
                print(f"✓ Error message present: '{data['error']}'")
            return True
        else:
            print(f"✗ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("NEXUS Real Settings API Tests")
    print("=" * 60)
    print("\nNOTE: Running in containerized environment without external")
    print("network access. Testing authentication guards only.")
    print("Full integration testing requires Supabase connectivity.")
    print("=" * 60)
    
    # Run tests (no setup/cleanup needed for auth-only tests)
    results = {}
    
    results["GET /api/users/me"] = test_get_users_me()
    results["PATCH /api/users/me"] = test_patch_users_me()
    results["GET /api/users/me/api-keys"] = test_get_api_keys()
    results["PATCH /api/users/me/api-keys"] = test_patch_api_keys()
    results["PATCH /api/orgs/[id]"] = test_patch_orgs()
    results["PATCH /api/org-members/[id]"] = test_patch_org_members()
    results["DELETE /api/org-members/[id]"] = test_delete_org_members()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} authentication guard tests passed")
    
    print("\n" + "=" * 60)
    print("LIMITATION NOTICE")
    print("=" * 60)
    print("This container environment cannot reach external Supabase.")
    print("Only authentication guards (401 responses) were tested.")
    print("\nFor full integration testing, please test in an environment")
    print("with internet connectivity to verify:")
    print("  - Profile updates and metadata merge")
    print("  - API key masking and storage")
    print("  - RLS policies (admin vs non-admin)")
    print("  - Slug normalization")
    print("  - Field truncation")
    print("  - Soft delete behavior")
    print("=" * 60)
    
    if passed == total:
        print("\n✓ All authentication guard tests passed!")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
