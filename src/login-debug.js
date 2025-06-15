// Login Debug Script - Add this temporarily to test login
console.log('🔍 Login Debug Script loaded');

// Test API connection
async function testAPI() {
    console.log('🧪 Testing API connection...');
    
    if (window.api) {
        console.log('✅ window.api is available');
        console.log('Available API methods:', Object.keys(window.api));
        
        // Test a simple API call
        try {
            const result = await window.api.getDashboardStats();
            console.log('✅ API call successful:', result);
        } catch (error) {
            console.error('❌ API call failed:', error);
        }
    } else {
        console.error('❌ window.api is not available');
    }
}

// Test login form elements
function testLoginForm() {
    console.log('🧪 Testing login form elements...');
    
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    console.log('Login form:', loginForm);
    console.log('Email input:', emailInput);
    console.log('Password input:', passwordInput);
    
    if (loginForm && emailInput && passwordInput) {
        console.log('✅ All login form elements found');
        
        // Add test values
        emailInput.value = 'test@example.com';
        passwordInput.value = 'testpassword';
        console.log('✅ Test values added');
        
        // Test form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('🚀 Form submitted with:', {
                email: emailInput.value,
                password: passwordInput.value
            });
            
            // Try manual login
            testLogin(emailInput.value, passwordInput.value);
        });
        
        console.log('✅ Test event listener added');
    } else {
        console.error('❌ Login form elements not found');
    }
}

// Test manual login
async function testLogin(email, password) {
    console.log('🔐 Testing manual login...');
    
    try {
        const result = await window.api.userLogin(email, password);
        console.log('Login result:', result);
        
        if (result.success) {
            console.log('✅ Login successful!', result.user);
            
            // Try to show main app
            if (typeof showMainApp === 'function') {
                showMainApp(result.user);
            } else {
                console.error('❌ showMainApp function not available');
            }
        } else {
            console.log('❌ Login failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Login error:', error);
    }
}

// Test when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, starting tests...');
    
    setTimeout(() => {
        testAPI();
        testLoginForm();
    }, 1000);
});

// Add to window for manual testing
window.testAPI = testAPI;
window.testLoginForm = testLoginForm;
window.testLogin = testLogin;

console.log('🔍 Login debug script ready. Use testAPI(), testLoginForm(), or testLogin(email, password) in console');