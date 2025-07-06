#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time
import os

def test_electron_app():
    """Test the Electron app UI"""
    print("Starting Electron app UI test...")
    
    with sync_playwright() as p:
        # Launch a browser with the correct display
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Navigate to the index.html file
            page.goto('file:///app/views/index.html')
            print("Navigated to index.html")
            
            # Take a screenshot of the initial state
            page.screenshot(path="01_initial_state.png")
            print("Took screenshot of initial state")
            
            # Check if login form exists
            login_form = page.locator('#loginForm')
            if login_form.count() > 0:
                print("Login form found")
                
                # Fill in login credentials
                page.fill('#emailInput', 'test@sunshin3.pro')
                page.fill('#passwordInput', 'test123')
                print("Filled login credentials")
                
                # Take a screenshot of the filled form
                page.screenshot(path="02_filled_credentials.png")
                
                # Click login button
                login_button = page.locator('#loginBtn')
                if login_button.count() > 0:
                    login_button.click()
                    print("Clicked login button")
                    
                    # Wait for login to complete
                    time.sleep(3)
                    
                    # Take a screenshot after login attempt
                    page.screenshot(path="03_after_login.png")
                    
                    # Check if we're still on the login screen or if we've moved to the main app
                    main_app = page.locator('#mainApp:not(.hidden)')
                    login_screen = page.locator('#loginScreen.hidden')
                    
                    print(f"Main app visible: {main_app.count() > 0}")
                    print(f"Login screen hidden: {login_screen.count() > 0}")
                    
                    # Check for any error messages
                    error_elements = page.locator('.error, [class*="error"], [id*="error"]')
                    if error_elements.count() > 0:
                        for i in range(error_elements.count()):
                            print(f"Error message found: {error_elements.nth(i).inner_text()}")
                    
                    # Check console logs
                    console_logs = []
                    page.on("console", lambda msg: console_logs.append(msg.text))
                    print(f"Console logs: {console_logs}")
                    
                    if main_app.count() > 0 and login_screen.count() > 0:
                        print("Successfully logged in to the app")
                        
                        # Test navigation between different sections
                        print("\nTesting Navigation")
                        
                        # Define sections to test
                        sections = [
                            {"name": "Dashboard", "selector": 'button.nav-item:has-text("Dashboard")'},
                            {"name": "Invoices", "selector": 'button.nav-item:has-text("Rechnungen")'},
                            {"name": "Create Invoice", "selector": 'button.nav-item:has-text("Rechnung erstellen")'},
                            {"name": "Customers", "selector": 'button.nav-item:has-text("Kunden")'},
                            {"name": "Reminders", "selector": 'button.nav-item:has-text("Mahnungen")'},
                            {"name": "Company", "selector": 'button.nav-item:has-text("Unternehmen")'},
                            {"name": "Products", "selector": 'button.nav-item:has-text("Produkte")'}
                        ]
                        
                        # Test each navigation section
                        for i, section in enumerate(sections):
                            nav_button = page.locator(section["selector"])
                            if nav_button.count() > 0:
                                nav_button.click()
                                print(f"Clicked on {section['name']} navigation")
                                time.sleep(1)
                                
                                # Take screenshot of the section
                                page.screenshot(path=f"04_{i+1}_{section['name'].lower()}_section.png")
                                
                                # Verify page title changed
                                page_title = page.locator('#pageTitle')
                                if page_title.count() > 0:
                                    title_text = page_title.inner_text()
                                    print(f"  Current page title: {title_text}")
                                else:
                                    print("  Could not find page title element")
                            else:
                                print(f"Could not find {section['name']} navigation button")
                        
                        # Test customer management UI
                        print("\nTesting Customer Management UI")
                        customers_nav = page.locator('button.nav-item:has-text("Kunden")')
                        if customers_nav.count() > 0:
                            customers_nav.click()
                            print("Navigated to Customers section")
                            time.sleep(1)
                            
                            # Check if customer management UI elements are present
                            customer_search = page.locator('#customerSearch')
                            add_customer_button = page.locator('button:has-text("Neuer Kunde")')
                            
                            if customer_search.count() > 0 and add_customer_button.count() > 0:
                                print("Customer management UI elements found")
                                page.screenshot(path="05_customer_management.png")
                                
                                # Test add customer modal
                                add_customer_button.click()
                                print("Clicked on Add Customer button")
                                time.sleep(1)
                                
                                add_customer_modal = page.locator('#addCustomerModal')
                                if add_customer_modal.count() > 0:
                                    print("Add Customer modal opened successfully")
                                    page.screenshot(path="06_add_customer_modal.png")
                                    
                                    # Close the modal
                                    close_button = page.locator('#addCustomerModal button:has-text("Abbrechen")')
                                    if close_button.count() > 0:
                                        close_button.click()
                                        print("Closed Add Customer modal")
                                    else:
                                        print("Could not find close button for Add Customer modal")
                                else:
                                    print("Add Customer modal did not open")
                            else:
                                print("Customer management UI elements not found")
                        else:
                            print("Could not navigate to Customers section")
                        
                        # Test language switcher
                        print("\nTesting Language Switcher")
                        lang_dropdown_btn = page.locator('#langDropdownBtn')
                        if lang_dropdown_btn.count() > 0:
                            lang_dropdown_btn.click()
                            print("Clicked on language dropdown")
                            time.sleep(1)
                            
                            lang_dropdown = page.locator('#langDropdown:not(.hidden)')
                            if lang_dropdown.count() > 0:
                                print("Language dropdown opened")
                                page.screenshot(path="07_language_dropdown.png")
                                
                                # Try switching to English
                                english_option = page.locator('#langDropdown button:has-text("English")')
                                if english_option.count() > 0:
                                    english_option.click()
                                    print("Switched language to English")
                                    time.sleep(1)
                                    page.screenshot(path="08_english_language.png")
                                else:
                                    print("Could not find English language option")
                            else:
                                print("Language dropdown did not open")
                        else:
                            print("Could not find language dropdown button")
                    else:
                        print("Login was not successful")
                else:
                    print("Login button not found")
            else:
                print("Login form not found")
                
                # Check if there's an emergency login button
                emergency_button = page.locator('button:has-text("EMERGENCY LOGIN TEST")')
                if emergency_button.count() > 0:
                    print("Found emergency login button, using it as fallback")
                    emergency_button.click()
                    time.sleep(1)
                    
                    # Handle potential alert
                    page.on("dialog", lambda dialog: dialog.accept())
                    print("Set up dialog handler")
                    
                    # Take a screenshot after emergency login
                    page.screenshot(path="emergency_login.png")
                else:
                    print("No emergency login button found")
        except Exception as e:
            print(f"Error testing Electron app: {str(e)}")
            page.screenshot(path="error_state.png")
        finally:
            # Close the browser
            browser.close()
            print("Test completed")

if __name__ == "__main__":
    # Set the display to the Xvfb display
    os.environ["DISPLAY"] = ":99"
    test_electron_app()