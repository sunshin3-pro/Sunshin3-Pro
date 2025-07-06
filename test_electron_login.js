// Test script to verify Electron window.api functionality
const { app, BrowserWindow } = require('electron');
const path = require('path');

async function testElectronApp() {
  console.log('🧪 Testing Electron App Login Functionality...');
  
  // Get the main window
  const allWindows = BrowserWindow.getAllWindows();
  console.log(`Found ${allWindows.length} windows`);
  
  if (allWindows.length === 0) {
    console.log('❌ No Electron windows found');
    return;
  }
  
  const mainWindow = allWindows[0];
  console.log('✅ Main window found');
  
  // Test if window.api is available
  const apiTest = await mainWindow.webContents.executeJavaScript(`
    const result = {
      apiAvailable: typeof window.api !== 'undefined',
      processAvailable: typeof process !== 'undefined',
      loginButtonExists: !!document.querySelector('#loginButton'),
      emailInputExists: !!document.querySelector('#email'),
      passwordInputExists: !!document.querySelector('#password'),
      mainAppExists: !!document.querySelector('#mainApp'),
      loginScreenExists: !!document.querySelector('#loginScreen')
    };
    
    console.log('🧪 API Test Results:', result);
    result;
  `);
  
  console.log('🧪 Test Results:', apiTest);
  
  // If window.api is available, test login
  if (apiTest.apiAvailable) {
    console.log('✅ window.api is available - Testing login...');
    
    const loginTest = await mainWindow.webContents.executeJavaScript(`
      (async () => {
        try {
          if (window.api && window.api.userLogin) {
            console.log('🔐 Testing login with test credentials...');
            const result = await window.api.userLogin('test@sunshin3.pro', 'test123');
            console.log('🔐 Login result:', result);
            return { success: true, result };
          } else {
            return { success: false, error: 'window.api.userLogin not available' };
          }
        } catch (error) {
          console.error('❌ Login test error:', error);
          return { success: false, error: error.message };
        }
      })();
    `);
    
    console.log('🔐 Login Test Results:', loginTest);
  } else {
    console.log('❌ window.api is not available');
  }
  
  console.log('✅ Test complete');
}

// Run the test
testElectronApp().catch(console.error);
