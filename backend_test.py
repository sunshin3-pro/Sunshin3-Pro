#!/usr/bin/env python3
import unittest
import subprocess
import json
import time
import sys
import os
import sqlite3
from pathlib import Path

class ElectronInvoiceAppTester(unittest.TestCase):
    """Test suite for the Electron Invoice Application"""
    
    def setUp(self):
        """Set up test environment"""
        print("Setting up test environment...")
        self.app_dir = Path('/app')
        
        # Connect to the SQLite database
        self.db_path = self.app_dir / 'test_sunshin3.db'
        self.assertTrue(self.db_path.exists(), "SQLite database file not found")
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        
    def tearDown(self):
        """Clean up after tests"""
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
    
    def test_01_database_structure(self):
        """Test database structure and initialization"""
        print("\n=== Testing Database Structure ===")
        
        # Check if database.js exists
        db_file = self.app_dir / 'src' / 'database.js'
        self.assertTrue(db_file.exists(), "database.js file not found")
        print("✅ database.js file found")
        
        # Check database tables in SQLite
        tables_query = "SELECT name FROM sqlite_master WHERE type='table';"
        self.cursor.execute(tables_query)
        tables = [row['name'] for row in self.cursor.fetchall()]
        
        # Check for essential tables
        essential_tables = ['users', 'sessions']
        for table in essential_tables:
            self.assertIn(table, tables, f"Essential table '{table}' not found in database")
            print(f"✅ Essential table '{table}' exists in database")
        
        # Check for test user in database
        self.cursor.execute("SELECT * FROM users WHERE email = 'test@sunshin3.pro'")
        test_user = self.cursor.fetchone()
        self.assertIsNotNone(test_user, "Test user not found in database")
        print("✅ Test user exists in database")
    
    def test_02_user_authentication(self):
        """Test user authentication in the database"""
        print("\n=== Testing User Authentication ===")
        
        # Check if test user exists
        self.cursor.execute("SELECT * FROM users WHERE email = 'test@sunshin3.pro'")
        test_user = self.cursor.fetchone()
        self.assertIsNotNone(test_user, "Test user not found in database")
        print(f"✅ Test user found: {test_user['email']}")
        
        # Check if password is hashed
        self.assertTrue(test_user['password'].startswith('$2'), "Password is not hashed with bcrypt")
        print("✅ Password is properly hashed with bcrypt")
        
        # Check user fields
        required_fields = ['id', 'email', 'password', 'first_name', 'last_name', 'company_name']
        for field in required_fields:
            self.assertIn(field, dict(test_user).keys(), f"Field '{field}' missing from user record")
        print("✅ User record has all required fields")
    
    def test_03_session_management(self):
        """Test session management in the database"""
        print("\n=== Testing Session Management ===")
        
        # Check sessions table structure
        self.cursor.execute("PRAGMA table_info(sessions)")
        columns = {row['name']: row for row in self.cursor.fetchall()}
        
        required_columns = ['id', 'user_id', 'token', 'created_at', 'expires_at']
        for column in required_columns:
            self.assertIn(column, columns, f"Column '{column}' missing from sessions table")
        print("✅ Sessions table has all required columns")
        
        # Check if there are any active sessions
        self.cursor.execute("SELECT COUNT(*) as count FROM sessions")
        session_count = self.cursor.fetchone()['count']
        print(f"ℹ️ Found {session_count} sessions in database")

class AuthenticationAPITester(unittest.TestCase):
    """Test suite for the Authentication API functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_dir = Path('/app')
        
        # Check if required files exist
        self.assertTrue((self.app_dir / 'src' / 'ipc-handlers.js').exists(), "ipc-handlers.js not found")
        self.assertTrue((self.app_dir / 'src' / 'database.js').exists(), "database.js not found")
        self.assertTrue((self.app_dir / 'src' / 'preload.js').exists(), "preload.js not found")
        
        # Connect to the SQLite database
        self.db_path = self.app_dir / 'test_sunshin3.db'
        self.assertTrue(self.db_path.exists(), "SQLite database file not found")
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
    
    def tearDown(self):
        """Clean up after tests"""
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
    
    def test_01_login_functionality(self):
        """Test login functionality"""
        print("\n=== Testing Login Functionality ===")
        
        # Check if test user exists
        self.cursor.execute("SELECT * FROM users WHERE email = 'test@sunshin3.pro'")
        test_user = self.cursor.fetchone()
        self.assertIsNotNone(test_user, "Test user not found in database")
        print(f"✅ Test user found: {test_user['email']}")
        
        # Check if ipc-handlers.js has user-login handler
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("ipcMain.handle('user-login'", ipc_content, "user-login handler not found")
        self.assertIn("userFunctions.loginUser(email, password)", ipc_content, "loginUser function not called")
        print("✅ user-login handler properly implemented")
        
        # Check if preload.js exposes userLogin API
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("userLogin: (email, password) =>", preload_content, "userLogin API not exposed")
        print("✅ userLogin API properly exposed in preload.js")
        
        # Check if database.js has loginUser function
        with open(self.app_dir / 'src' / 'database.js', 'r') as f:
            db_content = f.read()
        
        self.assertIn("async loginUser(email, password)", db_content, "loginUser function not found")
        self.assertIn("bcrypt.compare(password, user.password)", db_content, "Password comparison not implemented")
        print("✅ loginUser function properly implemented with bcrypt")
    
    def test_02_registration_functionality(self):
        """Test registration functionality"""
        print("\n=== Testing Registration Functionality ===")
        
        # Check if ipc-handlers.js has user-register handler
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("ipcMain.handle('user-register'", ipc_content, "user-register handler not found")
        self.assertIn("userFunctions.createUser(userData)", ipc_content, "createUser function not called")
        print("✅ user-register handler properly implemented")
        
        # Check if preload.js exposes userRegister API
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("userRegister: (userData) =>", preload_content, "userRegister API not exposed")
        print("✅ userRegister API properly exposed in preload.js")
        
        # Check if database.js has createUser function
        with open(self.app_dir / 'src' / 'database.js', 'r') as f:
            db_content = f.read()
        
        self.assertIn("async createUser(userData)", db_content, "createUser function not found")
        self.assertIn("await bcrypt.hash(", db_content, "Password hashing not implemented")
        print("✅ createUser function properly implemented with bcrypt")
    
    def test_03_session_functionality(self):
        """Test session management functionality"""
        print("\n=== Testing Session Management Functionality ===")
        
        # Check if ipc-handlers.js has session management
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("let currentSession", ipc_content, "currentSession variable not found")
        self.assertIn("function setCurrentSession", ipc_content, "setCurrentSession function not found")
        self.assertIn("function clearSession", ipc_content, "clearSession function not found")
        print("✅ Session management functions properly implemented")
        
        # Check if ipc-handlers.js has get-current-session handler
        self.assertIn("ipcMain.handle('get-current-session'", ipc_content, "get-current-session handler not found")
        self.assertIn("ipcMain.handle('clear-session'", ipc_content, "clear-session handler not found")
        print("✅ Session IPC handlers properly implemented")
        
        # Check if preload.js exposes session APIs
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("getCurrentSession: () =>", preload_content, "getCurrentSession API not exposed")
        self.assertIn("clearSession: () =>", preload_content, "clearSession API not exposed")
        print("✅ Session APIs properly exposed in preload.js")
    
    def test_04_dashboard_functionality(self):
        """Test dashboard functionality"""
        print("\n=== Testing Dashboard Functionality ===")
        
        # Check if ipc-handlers.js has get-dashboard-stats handler
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("ipcMain.handle('get-dashboard-stats'", ipc_content, "get-dashboard-stats handler not found")
        print("✅ get-dashboard-stats handler properly implemented")
        
        # Check if preload.js exposes getDashboardStats API
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("getDashboardStats: () =>", preload_content, "getDashboardStats API not exposed")
        print("✅ getDashboardStats API properly exposed in preload.js")
        
        # Check if dashboard stats include required metrics
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        dashboard_metrics = [
            'totalInvoices', 'totalCustomers', 'totalProducts', 
            'totalRevenue', 'pendingAmount', 'paidInvoices'
        ]
        
        for metric in dashboard_metrics:
            self.assertIn(metric, ipc_content, f"Dashboard metric '{metric}' not implemented")
        print("✅ Dashboard metrics properly implemented")

class BusinessFeaturesTester(unittest.TestCase):
    """Test suite for business features"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_dir = Path('/app')
        
        # Connect to the SQLite database
        self.db_path = self.app_dir / 'test_sunshin3.db'
        self.assertTrue(self.db_path.exists(), "SQLite database file not found")
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
    
    def tearDown(self):
        """Clean up after tests"""
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
    
    def test_01_customer_management_api(self):
        """Test customer management API"""
        print("\n=== Testing Customer Management API ===")
        
        # Check if ipc-handlers.js has customer management handlers
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        customer_handlers = [
            "ipcMain.handle('get-customers'", 
            "ipcMain.handle('add-customer'", 
            "ipcMain.handle('update-customer'", 
            "ipcMain.handle('delete-customer'"
        ]
        
        for handler in customer_handlers:
            self.assertIn(handler, ipc_content, f"{handler} not found")
        print("✅ Customer management handlers properly implemented")
        
        # Check if preload.js exposes customer management APIs
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        customer_apis = [
            "getCustomers: () =>", 
            "addCustomer: (customer) =>", 
            "updateCustomer: (id, customer) =>", 
            "deleteCustomer: (id) =>"
        ]
        
        for api in customer_apis:
            self.assertIn(api, preload_content, f"{api} not exposed")
        print("✅ Customer management APIs properly exposed in preload.js")
    
    def test_02_invoice_management_api(self):
        """Test invoice management API"""
        print("\n=== Testing Invoice Management API ===")
        
        # Check if ipc-handlers.js has invoice management handlers
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        invoice_handlers = [
            "ipcMain.handle('get-invoices'", 
            "ipcMain.handle('get-invoice'", 
            "ipcMain.handle('create-invoice'", 
            "ipcMain.handle('update-invoice'", 
            "ipcMain.handle('delete-invoice'",
            "ipcMain.handle('update-invoice-status'"
        ]
        
        for handler in invoice_handlers:
            self.assertIn(handler, ipc_content, f"{handler} not found")
        print("✅ Invoice management handlers properly implemented")
        
        # Check if preload.js exposes invoice management APIs
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        invoice_apis = [
            "getInvoices: () =>", 
            "getInvoice: (id) =>", 
            "createInvoice: (invoice) =>", 
            "updateInvoice: (id, invoice) =>", 
            "deleteInvoice: (id) =>",
            "updateInvoiceStatus: (invoiceId, status) =>"
        ]
        
        for api in invoice_apis:
            self.assertIn(api, preload_content, f"{api} not exposed")
        print("✅ Invoice management APIs properly exposed in preload.js")
    
    def test_03_product_management_api(self):
        """Test product management API"""
        print("\n=== Testing Product Management API ===")
        
        # Check if ipc-handlers.js has product management handlers
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        product_handlers = [
            "ipcMain.handle('get-products'", 
            "ipcMain.handle('add-product'", 
            "ipcMain.handle('update-product'", 
            "ipcMain.handle('delete-product'"
        ]
        
        for handler in product_handlers:
            self.assertIn(handler, ipc_content, f"{handler} not found")
        print("✅ Product management handlers properly implemented")
        
        # Check if preload.js exposes product management APIs
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        product_apis = [
            "getProducts: () =>", 
            "addProduct: (product) =>", 
            "updateProduct: (id, product) =>", 
            "deleteProduct: (id) =>"
        ]
        
        for api in product_apis:
            self.assertIn(api, preload_content, f"{api} not exposed")
        print("✅ Product management APIs properly exposed in preload.js")
    
    def test_04_pdf_generation_api(self):
        """Test PDF generation API"""
        print("\n=== Testing PDF Generation API ===")
        
        # Check if ipc-handlers.js has PDF generation handler
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("ipcMain.handle('generate-invoice-pdf'", ipc_content, "generate-invoice-pdf handler not found")
        self.assertIn("const doc = new PDFDocument", ipc_content, "PDFDocument creation not found")
        print("✅ PDF generation handler properly implemented")
        
        # Check if preload.js exposes PDF generation API
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("generateInvoicePDF: (invoiceId) =>", preload_content, "generateInvoicePDF API not exposed")
        print("✅ PDF generation API properly exposed in preload.js")
    
    def test_05_company_settings_api(self):
        """Test company settings API"""
        print("\n=== Testing Company Settings API ===")
        
        # Check if ipc-handlers.js has company settings handlers
        with open(self.app_dir / 'src' / 'ipc-handlers.js', 'r') as f:
            ipc_content = f.read()
        
        self.assertIn("ipcMain.handle('get-company-settings'", ipc_content, "get-company-settings handler not found")
        self.assertIn("ipcMain.handle('update-company-settings'", ipc_content, "update-company-settings handler not found")
        print("✅ Company settings handlers properly implemented")
        
        # Check if preload.js exposes company settings APIs
        with open(self.app_dir / 'src' / 'preload.js', 'r') as f:
            preload_content = f.read()
        
        self.assertIn("getCompanySettings: () =>", preload_content, "getCompanySettings API not exposed")
        self.assertIn("updateCompanySettings: (companyData) =>", preload_content, "updateCompanySettings API not exposed")
        print("✅ Company settings APIs properly exposed in preload.js")

def run_tests():
    """Run the test suite"""
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    suite.addTest(loader.loadTestsFromTestCase(ElectronInvoiceAppTester))
    suite.addTest(loader.loadTestsFromTestCase(AuthenticationAPITester))
    suite.addTest(loader.loadTestsFromTestCase(BusinessFeaturesTester))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)