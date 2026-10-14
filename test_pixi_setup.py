#!/usr/bin/env python3
"""
Test script to verify Pixi setup for AlsaniaMCP Python environment.

This script tests that all required Python dependencies are properly installed
and that the basic functionality works as expected.
"""

import sys
import json
from pathlib import Path

def test_python_version():
    """Test that Python version is compatible."""
    print("🔍 Testing Python version...")
    major, minor = sys.version_info.major, sys.version_info.minor
    if major == 3 and minor >= 10:
        print(f"✅ Python {major}.{minor} is compatible")
        return True
    else:
        print(f"❌ Python {major}.{minor} is not compatible (requires 3.10+)")
        return False

def test_fastapi_import():
    """Test that FastAPI can be imported."""
    print("🔍 Testing FastAPI import...")
    try:
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__} imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import FastAPI: {e}")
        return False

def test_uvicorn_import():
    """Test that Uvicorn can be imported."""
    print("🔍 Testing Uvicorn import...")
    try:
        import uvicorn
        print(f"✅ Uvicorn {uvicorn.__version__} imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import Uvicorn: {e}")
        return False

def test_router_import():
    """Test that the router module can be imported."""
    print("🔍 Testing router module import...")
    try:
        # Test importing the router module
        import router
        print("✅ Router module imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Failed to import router module: {e}")
        return False
    except Exception as e:
        print(f"❌ Error importing router module: {e}")
        return False

def test_config_file():
    """Test that the config file can be loaded."""
    print("🔍 Testing config file loading...")
    try:
        config_path = Path("config/mcp_config.json")
        if config_path.exists():
            with config_path.open("r", encoding="utf-8") as f:
                config = json.load(f)
            print("✅ Config file loaded successfully")
            return True
        else:
            print("ℹ️  Config file not found (this is OK if not running router)")
            return True
    except Exception as e:
        print(f"❌ Error loading config file: {e}")
        return False

def test_pixi_environment():
    """Test that we're running in a Pixi environment."""
    print("🔍 Testing Pixi environment...")
    # Check if we can detect Pixi environment
    pixi_env = sys.prefix.endswith('.pixi-env') or 'PIXI_ENV' in sys.environ
    if pixi_env:
        print("✅ Running in Pixi environment")
    else:
        print("ℹ️  Not running in Pixi environment (may be using system Python)")
    return True

def main():
    """Run all tests and report results."""
    print("🚀 Testing AlsaniaMCP Pixi Setup")
    print("=" * 40)
    
    tests = [
        test_python_version,
        test_fastapi_import,
        test_uvicorn_import,
        test_router_import,
        test_config_file,
        test_pixi_environment,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
            results.append(False)
        print()
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print("=" * 40)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Pixi setup is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())