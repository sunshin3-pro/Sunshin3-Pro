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
    
    def test_02_ipc_handlers(self):
        """Test IPC handlers for API endpoints"""
        print("\n=== Testing IPC Handlers ===")
        
        # Check if ipc-handlers.js exists
        ipc_file = self.app_dir / 'src' / 'ipc-handlers.js'
        self.assertTrue(ipc_file.exists(), "ipc-handlers.js file not found")
        print("✅ ipc-handlers.js file found")
        
        # Check for required API endpoints
        with open(ipc_file, 'r') as f:
            ipc_content = f.read()
            
        required_endpoints = [
            'get-dashboard-stats', 'get-customers', 'add-customer', 
            'get-products', 'add-product', 'get-invoices', 'create-invoice',
            'update-invoice-status', 'get-company-settings', 'update-company-settings',
            'get-reminders', 'create-payment', 'update-subscription'
        ]
        
        for endpoint in required_endpoints:
            self.assertIn(f"ipcMain.handle('{endpoint}'", ipc_content, 
                         f"API endpoint '{endpoint}' not implemented")
            print(f"✅ API endpoint '{endpoint}' implemented")
    
    def test_03_session_management(self):
        """Test session management implementation"""
        print("\n=== Testing Session Management ===")
        
        # Check if ipc-handlers.js has session management
        ipc_file = self.app_dir / 'src' / 'ipc-handlers.js'
        with open(ipc_file, 'r') as f:
            ipc_content = f.read()
        
        # Check for session management functions
        session_functions = [
            'getCurrentUserId', 'setCurrentSession', 'clearSession',
            'get-current-session', 'clear-session'
        ]
        
        for func in session_functions:
            if func.startswith('get-') or func.startswith('clear-'):
                self.assertIn(f"ipcMain.handle('{func}'", ipc_content, 
                             f"Session function '{func}' not implemented")
            else:
                self.assertIn(f"function {func}", ipc_content, 
                             f"Session function '{func}' not implemented")
            print(f"✅ Session function '{func}' implemented")
        
        # Check for session table in database.js
        db_file = self.app_dir / 'src' / 'database.js'
        with open(db_file, 'r') as f:
            db_content = f.read()
        
        self.assertIn("CREATE TABLE IF NOT EXISTS sessions", db_content, 
                     "Sessions table not defined in database.js")
        print("✅ Sessions table defined in database.js")
        
        # Check for no hard-coded user IDs in ipc-handlers.js
        self.assertNotIn("userId = 1", ipc_content, "Hard-coded user ID found in ipc-handlers.js")
        print("✅ No hard-coded user IDs found in ipc-handlers.js")
    
    def test_04_admin_authentication(self):
        """Test admin authentication"""
        print("\n=== Testing Admin Authentication ===")
        
        # Check if admin code is 6-digit in database.js
        db_file = self.app_dir / 'src' / 'database.js'
        with open(db_file, 'r') as f:
            db_content = f.read()
        
        # Check for 6-digit admin code generation
        self.assertIn("100000 + Math.random() * 900000", db_content, 
                     "6-digit admin code generation not found")
        print("✅ 6-digit admin code generation implemented")
        
        # Check for 6 code input fields in index.html
        html_file = self.app_dir / 'views' / 'index.html'
        with open(html_file, 'r') as f:
            html_content = f.read()
        
        code_inputs = html_content.count('class="code-input"')
        self.assertEqual(code_inputs, 6, f"Expected 6 code input fields, found {code_inputs}")
        print(f"✅ Found {code_inputs} code input fields for admin authentication")
    
    def test_05_moderne_app_functions(self):
        """Test moderne-app.js functions"""
        print("\n=== Testing moderne-app.js Functions ===")
        
        # Check if moderne-app.js exists
        app_file = self.app_dir / 'src' / 'moderne-app.js'
        self.assertTrue(app_file.exists(), "moderne-app.js file not found")
        print("✅ moderne-app.js file found")
        
        # Check for required functions
        with open(app_file, 'r') as f:
            app_content = f.read()
            
        required_functions = [
            'initializeModernApp', 'navigateTo', 'loadDashboard', 
            'getCurrentUsage', 'escapeHtml', 'showToast', 
            'showUpgradeModal', 'upgradeSubscription'
        ]
        
        for func in required_functions:
            self.assertIn(f"function {func}", app_content, 
                         f"Function '{func}' not implemented in moderne-app.js")
            print(f"✅ Function '{func}' implemented in moderne-app.js")
    
    def test_06_ui_components(self):
        """Test UI components in index.html"""
        print("\n=== Testing UI Components ===")
        
        # Check if index.html exists
        html_file = self.app_dir / 'views' / 'index.html'
        self.assertTrue(html_file.exists(), "index.html file not found")
        print("✅ index.html file found")
        
        # Check for required UI components
        with open(html_file, 'r') as f:
            html_content = f.read()
            
        required_components = [
            'languageSelection', 'loginScreen', 'mainApp', 
            'modern-sidebar', 'modern-header', 'contentArea',
            'modalContainer', 'subscriptionInfo'
        ]
        
        for component in required_components:
            self.assertIn(f'id="{component}"', html_content, 
                         f"UI component '{component}' not found in index.html")
            print(f"✅ UI component '{component}' found in index.html")
    
    def test_07_app_initialization(self):
        """Test app initialization in renderer.js"""
        print("\n=== Testing App Initialization ===")
        
        # Check if renderer.js exists
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        self.assertTrue(renderer_file.exists(), "renderer.js file not found")
        print("✅ renderer.js file found")
        
        # Check for improved initialization
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
        
        # Check for initialization improvements
        self.assertIn("function initializeApp()", renderer_content, 
                     "initializeApp function not found in renderer.js")
        print("✅ initializeApp function found in renderer.js")
        
        # Check for timing issue fixes
        self.assertIn("isInitialized", renderer_content, 
                     "Initialization state tracking not found")
        print("✅ Initialization state tracking implemented")
        
        # Check for error handling
        self.assertIn("try {", renderer_content, 
                     "Error handling not found in initialization")
        print("✅ Error handling implemented in initialization")

def run_tests():
    """Run the test suite"""
    suite = unittest.TestLoader().loadTestsFromTestCase(ElectronInvoiceAppTester)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)