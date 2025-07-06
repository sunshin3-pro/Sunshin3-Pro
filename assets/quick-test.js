// Quick Test Script for Login Functionality
console.log('🧪 Quick Test Script loaded');

// Create test button
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 Creating test button...');
    
    // Create test button
    const testButton = document.createElement('button');
    testButton.id = 'testLoginButton';
    testButton.innerHTML = '🧪 TEST LOGIN';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff3333;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-weight: bold;
        z-index: 10000;
        cursor: pointer;
    `;
    
    // Add test button to body
    document.body.appendChild(testButton);
    
    // Add event listener
    testButton.addEventListener('click', () => {
        console.log('🧪 TEST LOGIN button clicked');
        runLoginTest();
    });
    
    console.log('✅ Test button created');
});

// Auto-fill test credentials
function autoFillTestCredentials() {
    console.log('🧪 Auto-filling test credentials...');
    
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    if (emailInput && passwordInput) {
        emailInput.value = 'test@sunshin3.pro';
        passwordInput.value = 'test123';
        console.log('✅ Test credentials filled');
    } else {
        console.error('❌ Login form elements not found');
    }
}

// Run login test
async function runLoginTest() {
    console.log('🧪 Running login test...');
    
    // Auto-fill credentials
    autoFillTestCredentials();
    
    // Test direct API call
    try {
        console.log('🧪 Testing direct API call...');
        
        if (window.api && window.api.userLogin) {
            const result = await window.api.userLogin('test@sunshin3.pro', 'test123');
            console.log('🧪 API login result:', result);
            
            if (result && result.success) {
                console.log('✅ API login successful!');
                alert('API Login successful! User: ' + result.user.email);
                
                // Show main app
                if (typeof window.showMainApp === 'function') {
                    window.showMainApp(result.user);
                }
            } else {
                console.error('❌ API login failed:', result?.error || 'Unknown error');
                alert('API Login failed: ' + (result?.error || 'Unknown error'));
            }
        } else {
            console.error('❌ window.api.userLogin not available');
            alert('API not available');
        }
    } catch (error) {
        console.error('❌ API login error:', error);
        alert('API Login error: ' + error.message);
    }
}

// Auto-run test on load (after a delay)
setTimeout(() => {
    console.log('🧪 Auto-running login test...');
    autoFillTestCredentials();
}, 2000);

// Add to window for manual testing
window.runLoginTest = runLoginTest;
window.autoFillTestCredentials = autoFillTestCredentials;

console.log('✅ Quick test script ready');
