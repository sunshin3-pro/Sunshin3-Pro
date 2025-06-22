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
    
    def test_03_preload_api_exposure(self):
        """Test API exposure in preload.js"""
        print("\n=== Testing API Exposure ===")
        
        # Check if preload.js exists
        preload_file = self.app_dir / 'src' / 'preload.js'
        self.assertTrue(preload_file.exists(), "preload.js file not found")
        print("✅ preload.js file found")
        
        # Check for API exposure
        with open(preload_file, 'r') as f:
            preload_content = f.read()
            
        required_apis = [
            'getDashboardStats', 'getCustomers', 'addCustomer', 
            'getProducts', 'addProduct', 'getInvoices', 'createInvoice',
            'updateInvoiceStatus', 'getCompanySettings', 'updateCompanySettings',
            'getReminders', 'createPayment', 'updateSubscription'
        ]
        
        for api in required_apis:
            self.assertIn(f"{api}:", preload_content, 
                         f"API '{api}' not exposed in preload.js")
            print(f"✅ API '{api}' exposed in preload.js")
    
    def test_04_moderne_app_functions(self):
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
    
    def test_05_ui_components(self):
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
    
    def test_06_css_styles(self):
        """Test CSS styles in modern-styles.css"""
        print("\n=== Testing CSS Styles ===")
        
        # Check if modern-styles.css exists
        css_file = self.app_dir / 'assets' / 'modern-styles.css'
        self.assertTrue(css_file.exists(), "modern-styles.css file not found")
        print("✅ modern-styles.css file found")
        
        # Check for required CSS classes
        with open(css_file, 'r') as f:
            css_content = f.read()
            
        required_classes = [
            '.modern-app', '.modern-sidebar', '.modern-header', 
            '.btn-primary-modern', '.btn-secondary-modern', 
            '.toast-modern', '.modal-backdrop', '.form-input-modern'
        ]
        
        for css_class in required_classes:
            self.assertIn(css_class, css_content, 
                         f"CSS class '{css_class}' not defined in modern-styles.css")
            print(f"✅ CSS class '{css_class}' defined in modern-styles.css")
    
    def test_07_integration_points(self):
        """Test integration points between components"""
        print("\n=== Testing Integration Points ===")
        
        # Check renderer.js for integration with moderne-app.js
        renderer_file = self.app_dir / 'src' / 'renderer.js'
        self.assertTrue(renderer_file.exists(), "renderer.js file not found")
        print("✅ renderer.js file found")
        
        with open(renderer_file, 'r') as f:
            renderer_content = f.read()
            
        # Check for integration with moderne-app.js
        self.assertIn("initializeModernApp", renderer_content, 
                     "No integration with moderne-app.js found in renderer.js")
        print("✅ Integration with moderne-app.js found in renderer.js")
        
        # Check for API usage in moderne-app.js
        with open(self.app_dir / 'src' / 'moderne-app.js', 'r') as f:
            app_content = f.read()
            
        self.assertIn("window.api.", app_content, 
                     "No API usage found in moderne-app.js")
        print("✅ API usage found in moderne-app.js")
        
        # Check for script inclusion in index.html
        with open(self.app_dir / 'views' / 'index.html', 'r') as f:
            html_content = f.read()
            
        self.assertIn('<script src="../src/renderer.js"></script>', html_content, 
                     "renderer.js not included in index.html")
        self.assertIn('<script src="../src/moderne-app.js"></script>', html_content, 
                     "moderne-app.js not included in index.html")
        print("✅ All required scripts included in index.html")

def run_tests():
    """Run the test suite"""
    suite = unittest.TestLoader().loadTestsFromTestCase(ElectronInvoiceAppTester)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)