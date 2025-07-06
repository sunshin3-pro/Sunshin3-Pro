#!/usr/bin/env python3
import unittest
import sys
from pathlib import Path

class LoginFixesTester(unittest.TestCase):
    """Test suite for the login functionality fixes"""
    
    def setUp(self):
        """Set up test environment"""
        print("Setting up test environment...")
        self.app_dir = Path('/app')
        
    def test_01_direct_button_handlers(self):
        """Test direct button handlers implementation"""
        print("\n=== Testing Direct Button Handlers ===")
        
        # Check if renderer.js exists
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        self.assertTrue(renderer_file.exists(), "renderer.js file not found")
        print("✅ renderer.js file found")
        
        # Check for setupDirectButtonHandlers function
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
            
        self.assertIn('function setupDirectButtonHandlers()', renderer_content, 
                     "setupDirectButtonHandlers() function not found in renderer.js")
        print("✅ setupDirectButtonHandlers() function found in renderer.js")
        
        # Check for immediate call to setupDirectButtonHandlers
        self.assertIn('setupDirectButtonHandlers()', renderer_content, 
                     "setupDirectButtonHandlers() not called in renderer.js")
        print("✅ setupDirectButtonHandlers() called in renderer.js")
        
        # Check for direct login button handler
        self.assertIn('loginBtn.addEventListener(\'click\'', renderer_content, 
                     "Direct login button click handler not found in renderer.js")
        print("✅ Direct login button click handler found in renderer.js")
        
        # Check for console log on button click
        self.assertIn('🔘 LOGIN BUTTON CLICKED', renderer_content, 
                     "Login button click console log not found in renderer.js")
        print("✅ Login button click console log found in renderer.js")
    
    def test_02_simplified_event_listeners(self):
        """Test simplified event listeners without navigation interference"""
        print("\n=== Testing Simplified Event Listeners ===")
        
        # Check if renderer.js exists
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        
        # Check for navigation setup code
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
            
        # Check for comment about not calling setupNavigationListeners during initialization
        self.assertIn('// NICHT setupNavigationListeners() hier aufrufen', renderer_content, 
                     "Comment about not calling setupNavigationListeners() not found")
        print("✅ Comment about not calling setupNavigationListeners() found")
        
        # Check for conditional navigation setup
        self.assertIn('if (loginScreen && !loginScreen.classList.contains(\'hidden\'))', renderer_content, 
                     "Conditional navigation setup not found")
        print("✅ Conditional navigation setup found")
        
        # Check for skipping navigation setup during login
        self.assertIn('console.log(\'⚠️ Login screen active - skipping navigation setup\')', renderer_content, 
                     "Skipping navigation setup during login not found")
        print("✅ Skipping navigation setup during login found")
    
    def test_03_debug_script(self):
        """Test debug script for login functionality"""
        print("\n=== Testing Debug Script ===")
        
        # Check if quick-test.js exists
        quick_test_file = self.app_dir / 'assets' / 'quick-test.js'
        self.assertTrue(quick_test_file.exists(), "quick-test.js file not found")
        print("✅ quick-test.js file found")
        
        # Check for test button in quick-test.js
        with open(quick_test_file, 'r') as f:
            quick_test_content = f.read()
            
        self.assertIn('testLoginButton', quick_test_content, 
                     "Test login button not found in quick-test.js")
        print("✅ Test login button found in quick-test.js")
        
        # Check for auto-fill function
        self.assertIn('autoFillTestCredentials', quick_test_content, 
                     "autoFillTestCredentials() function not found in quick-test.js")
        print("✅ autoFillTestCredentials() function found in quick-test.js")
        
        # Check for test credentials
        self.assertIn('test@sunshin3.pro', quick_test_content, 
                     "Test email not found in quick-test.js")
        self.assertIn('test123', quick_test_content, 
                     "Test password not found in quick-test.js")
        print("✅ Test credentials found in quick-test.js")
        
        # Check for direct API call test
        self.assertIn('window.api.userLogin(\'test@sunshin3.pro\', \'test123\')', quick_test_content, 
                     "Direct API call test not found in quick-test.js")
        print("✅ Direct API call test found in quick-test.js")
        
        # Check for inclusion in index.html
        html_file = self.app_dir / 'views' / 'index.html'
        with open(html_file, 'r') as f:
            html_content = f.read()
            
        self.assertIn('quick-test.js', html_content, 
                     "quick-test.js script not included in index.html")
        print("✅ quick-test.js script included in index.html")
    
    def test_04_separate_login_handler(self):
        """Test separate login handler function"""
        print("\n=== Testing Separate Login Handler Function ===")
        
        # Check if renderer.js exists
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        
        # Check for handleLoginSubmit function
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
            
        self.assertIn('async function handleLoginSubmit(e)', renderer_content, 
                     "handleLoginSubmit() function not found in renderer.js")
        print("✅ handleLoginSubmit() function found in renderer.js")
        
        # Check for form submission handler
        self.assertIn('loginForm.addEventListener(\'submit\', handleLoginSubmit)', renderer_content, 
                     "Login form submission handler not found in renderer.js")
        print("✅ Login form submission handler found in renderer.js")
        
        # Check for loading state
        self.assertIn('loginBtn.disabled = true', renderer_content, 
                     "Button disabled state not found in handleLoginSubmit()")
        self.assertIn('loginBtn.innerHTML = \'<i class="fas fa-spinner fa-spin"></i> Anmelden...\'', renderer_content, 
                     "Loading state not found in handleLoginSubmit()")
        print("✅ Loading state found in handleLoginSubmit()")
        
        # Check for error handling
        self.assertIn('showErrorWithAnimation', renderer_content, 
                     "Error handling not found in handleLoginSubmit()")
        print("✅ Error handling found in handleLoginSubmit()")
        
        # Check for reset button state
        self.assertIn('loginBtn.disabled = false', renderer_content, 
                     "Button reset state not found in handleLoginSubmit()")
        print("✅ Button reset state found in handleLoginSubmit()")

def run_tests():
    """Run the test suite"""
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(LoginFixesTester))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)