#!/usr/bin/env python3
import subprocess
import sys
import time
import json
import os
from datetime import datetime

class ElectronFixesTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, test_func):
        """Run a single test and track results"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            result = test_func()
            if result:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
            else:
                print(f"❌ Failed - {name}")
            return result
        except Exception as e:
            print(f"❌ Failed with error: {str(e)}")
            return False

    def check_login_response_timing(self):
        """Check if showMainApp() has improved timing logic (1000ms instead of 200ms)"""
        try:
            with open('/app/src/renderer.js', 'r') as f:
                content = f.read()
                # Look for setTimeout with 1000ms delay
                return 'setTimeout(tryInitializeModernApp, 1000)' in content
        except Exception as e:
            print(f"Error checking timing logic: {str(e)}")
            return False

    def check_retry_mechanism(self):
        """Check if retry mechanism for modern-app.js initialization exists with max 10 retries"""
        try:
            with open('/app/src/renderer.js', 'r') as f:
                content = f.read()
                has_retry_count = 'retryCount' in content
                has_max_retries = 'maxRetries = 10' in content
                has_progressive_delay = 'setTimeout(tryInitializeModernApp, 500 * retryCount)' in content
                return has_retry_count and has_max_retries and has_progressive_delay
        except Exception as e:
            print(f"Error checking retry mechanism: {str(e)}")
            return False

    def check_forgot_password_link_id(self):
        """Check if forgot password link has proper ID"""
        try:
            with open('/app/views/index.html', 'r') as f:
                content = f.read()
                return 'id="forgotPasswordLink"' in content
        except Exception as e:
            print(f"Error checking forgot password link: {str(e)}")
            return False

    def check_alert_removal(self):
        """Check if alert() popups have been removed"""
        try:
            with open('/app/src/renderer.js', 'r') as f:
                content = f.read()
                # Check if alert() is used in login form submission
                login_form_section = content.split('async function handleLoginSubmit(e)')[1].split('function initializeEventListeners()')[0]
                return 'alert(' not in login_form_section
        except Exception as e:
            print(f"Error checking alert removal: {str(e)}")
            return False

    def check_error_handling(self):
        """Check if improved error handling with showErrorWithAnimation() exists"""
        try:
            with open('/app/src/renderer.js', 'r') as f:
                content = f.read()
                has_function = 'function showErrorWithAnimation(message)' in content
                is_used = 'showErrorWithAnimation(' in content
                return has_function and is_used
        except Exception as e:
            print(f"Error checking error handling: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests for the specific fixes"""
        print("🚀 Testing Sunshin3 Invoice Pro Electron App Fixes")
        
        # Check login response timing
        self.run_test("Login Response Timing (1000ms delay)", self.check_login_response_timing)
        
        # Check retry mechanism
        self.run_test("Retry Mechanism (max 10 attempts with progressive delay)", self.check_retry_mechanism)
        
        # Check forgot password link ID
        self.run_test("Forgot Password Link ID", self.check_forgot_password_link_id)
        
        # Check alert removal
        self.run_test("Alert Popups Removal", self.check_alert_removal)
        
        # Check error handling
        self.run_test("Improved Error Handling with showErrorWithAnimation()", self.check_error_handling)
        
        # Print summary
        print(f"\n📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.tests_passed == self.tests_run:
            print("✅ All fixes have been implemented correctly!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} fixes are missing or incomplete")
            return 1

if __name__ == "__main__":
    tester = ElectronFixesTester()
    sys.exit(tester.run_all_tests())