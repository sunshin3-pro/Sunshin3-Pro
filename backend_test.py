#!/usr/bin/env python3
import unittest
import subprocess
import json
import time
import sys
import os
from pathlib import Path

class ElectronInvoiceAppTester(unittest.TestCase):
    """Test suite for the Electron Invoice Application"""
    
    def setUp(self):
        """Set up test environment"""
        print("Setting up test environment...")
        # Check if the app is running
        self.app_dir = Path('/app')
        
    def test_01_database_structure(self):
        """Test database structure and initialization"""
        print("\n=== Testing Database Structure ===")
        
        # Check if database.js exists
        db_file = self.app_dir / 'src' / 'database.js'
        self.assertTrue(db_file.exists(), "database.js file not found")
        print("✅ database.js file found")
        
        # Check database tables
        with open(db_file, 'r') as f:
            db_content = f.read()
            
        required_tables = [
            'admins', 'admin_activities', 'users', 'customers', 
            'products', 'invoices', 'invoice_items', 'settings', 'sessions'
        ]
        
        for table in required_tables:
            self.assertIn(f'CREATE TABLE IF NOT EXISTS {table}', db_content, 
                         f"Table '{table}' not defined in database.js")
            print(f"✅ Table '{table}' defined in database.js")
        
        # Check for test user creation function
        self.assertIn('async function createTestUser()', db_content,
                     "createTestUser() function not found in database.js")
        print("✅ createTestUser() function found in database.js")
        
        # Check for test user creation in initDatabase
        self.assertIn('await createTestUser()', db_content,
                     "Test user creation not called in initDatabase()")
        print("✅ Test user creation called in initDatabase()")
        
        # Check test user credentials
        self.assertIn('email: \'test@sunshin3.pro\'', db_content,
                     "Test user email not found in database.js")
        self.assertIn('password: \'test123\'', db_content,
                     "Test user password not found in database.js")
        print("✅ Test user credentials found in database.js")
    
    def test_02_authentication_functions(self):
        """Test authentication functions in database.js"""
        print("\n=== Testing Authentication Functions ===")
        
        # Check if database.js exists
        db_file = self.app_dir / 'src' / 'database.js'
        with open(db_file, 'r') as f:
            db_content = f.read()
        
        # Check for user login function
        self.assertIn('async loginUser(email, password)', db_content,
                     "loginUser() function not found in database.js")
        print("✅ loginUser() function found in database.js")
        
        # Check for user creation function
        self.assertIn('async createUser(userData)', db_content,
                     "createUser() function not found in database.js")
        print("✅ createUser() function found in database.js")
        
        # Check for password hashing with bcrypt
        self.assertIn('await bcrypt.hash(', db_content,
                     "bcrypt password hashing not found in database.js")
        print("✅ bcrypt password hashing found in database.js")
        
        # Check for session token creation
        self.assertIn('crypto.randomBytes', db_content,
                     "crypto.randomBytes not found for token generation")
        print("✅ Session token generation with crypto found in database.js")
        
        # Check for getUserByToken function
        self.assertIn('getUserByToken(token)', db_content,
                     "getUserByToken() function not found in database.js")
        print("✅ getUserByToken() function found in database.js")
    
    def test_03_ipc_handlers(self):
        """Test IPC handlers for authentication endpoints"""
        print("\n=== Testing IPC Handlers for Authentication ===")
        
        # Check if ipc-handlers.js exists
        ipc_file = self.app_dir / 'src' / 'ipc-handlers.js'
        self.assertTrue(ipc_file.exists(), "ipc-handlers.js file not found")
        print("✅ ipc-handlers.js file found")
        
        # Check for required API endpoints
        with open(ipc_file, 'r') as f:
            ipc_content = f.read()
            
        auth_endpoints = [
            'user-login', 'user-register', 'user-logout', 'get-current-user'
        ]
        
        for endpoint in auth_endpoints:
            self.assertIn(f"ipcMain.handle('{endpoint}'", ipc_content, 
                         f"API endpoint '{endpoint}' not implemented")
            print(f"✅ API endpoint '{endpoint}' implemented")
    
    def test_04_preload_api_exposure(self):
        """Test API exposure in preload.js"""
        print("\n=== Testing API Exposure for Authentication ===")
        
        # Check if preload.js exists
        preload_file = self.app_dir / 'src' / 'preload.js'
        self.assertTrue(preload_file.exists(), "preload.js file not found")
        print("✅ preload.js file found")
        
        # Check for API exposure
        with open(preload_file, 'r') as f:
            preload_content = f.read()
            
        auth_apis = [
            'userLogin', 'userRegister', 'userLogout', 'getCurrentUser'
        ]
        
        for api in auth_apis:
            self.assertIn(f"{api}:", preload_content, 
                         f"API '{api}' not exposed in preload.js")
            print(f"✅ API '{api}' exposed in preload.js")
    
    def test_05_renderer_login_functions(self):
        """Test login functions in renderer.js"""
        print("\n=== Testing Login Functions in renderer.js ===")
        
        # Check if renderer.js exists
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        self.assertTrue(renderer_file.exists(), "renderer.js file not found")
        print("✅ renderer.js file found")
        
        # Check for login form handling
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
            
        # Check for login form submission
        self.assertIn('loginForm.addEventListener(\'submit\'', renderer_content, 
                     "Login form submission handler not found in renderer.js")
        print("✅ Login form submission handler found in renderer.js")
        
        # Check for window.api.userLogin call
        self.assertIn('window.api.userLogin(email, password)', renderer_content, 
                     "window.api.userLogin call not found in renderer.js")
        print("✅ window.api.userLogin call found in renderer.js")
        
        # Check for registration form
        self.assertIn('showRegistrationForm()', renderer_content, 
                     "showRegistrationForm() function not found in renderer.js")
        print("✅ showRegistrationForm() function found in renderer.js")
        
        # Check for forgot password link
        self.assertIn('forgotPasswordLink', renderer_content, 
                     "Forgot password link handler not found in renderer.js")
        print("✅ Forgot password link handler found in renderer.js")
        
        # Check for showForgotPasswordForm function
        self.assertIn('showForgotPasswordForm()', renderer_content, 
                     "showForgotPasswordForm() function not found in renderer.js")
        print("✅ showForgotPasswordForm() function found in renderer.js")
    
    def test_06_ui_components(self):
        """Test authentication UI components in index.html"""
        print("\n=== Testing Authentication UI Components ===")
        
        # Check if index.html exists
        html_file = self.app_dir / 'views' / 'index.html'
        self.assertTrue(html_file.exists(), "index.html file not found")
        print("✅ index.html file found")
        
        # Check for required UI components
        with open(html_file, 'r') as f:
            html_content = f.read()
            
        auth_components = [
            'loginForm', 'emailInput', 'passwordInput', 'loginBtn',
            'registerLink', 'forgotPassword'
        ]
        
        for component in auth_components:
            if component == 'forgotPassword':
                self.assertIn(f'data-i18n="login.{component}"', html_content, 
                             f"UI component '{component}' not found in index.html")
            else:
                self.assertIn(f'id="{component}"', html_content, 
                             f"UI component '{component}' not found in index.html")
            print(f"✅ UI component '{component}' found in index.html")

class AuthenticationAPITester(unittest.TestCase):
    """Test suite for the Authentication API functionality"""
    
    def test_01_test_user_login(self):
        """Test login with test user credentials"""
        print("\n=== Testing Test User Login ===")
        
        # Mock the IPC call to test user login
        # In a real environment, we would use Spectron or similar to test this
        # Here we're just checking if the code structure is correct
        
        # Check if the test user credentials are correctly defined
        db_file = Path('/app/src/database.js')
        with open(db_file, 'r') as f:
            db_content = f.read()
        
        # Verify test user credentials
        self.assertIn('email: \'test@sunshin3.pro\'', db_content)
        self.assertIn('password: \'test123\'', db_content)
        print("✅ Test user credentials verified in database.js")
        
        # Check if the login function handles these credentials
        ipc_file = Path('/app/src/ipc-handlers.js')
        with open(ipc_file, 'r') as f:
            ipc_content = f.read()
        
        self.assertIn('userFunctions.loginUser(email, password)', ipc_content)
        print("✅ Login function correctly calls userFunctions.loginUser")
        
        print("✓ Test user login structure verified")
    
    def test_02_registration_validation(self):
        """Test registration validation"""
        print("\n=== Testing Registration Validation ===")
        
        # Check if renderer.js has validation for registration
        renderer_file = Path('/app/src/renderer.js')
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
        
        # Check for password validation
        self.assertIn('password.length', renderer_content)
        print("✅ Password length validation found")
        
        # Check for email validation
        self.assertIn('email.includes(\'@\')', renderer_content)
        print("✅ Email validation found")
        
        print("✓ Registration validation structure verified")
    
    def test_03_password_reset(self):
        """Test password reset functionality"""
        print("\n=== Testing Password Reset ===")
        
        # Check if renderer.js has password reset function
        renderer_file = Path('/app/src/renderer.js')
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
        
        # Check for password reset form
        self.assertIn('showForgotPasswordForm()', renderer_content)
        print("✅ Password reset form function found")
        
        print("✓ Password reset structure verified")

def run_tests():
    """Run the test suite"""
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(ElectronInvoiceAppTester))
    suite.addTest(unittest.makeSuite(AuthenticationAPITester))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)