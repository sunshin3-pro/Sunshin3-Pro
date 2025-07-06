// Globale Variablen
let currentLanguage = 'de';
let translations = {};
let currentUser = null;
let isAdminMode = false;
let adminEmail = '';
let isInitialized = false;

// Mobile Menu Handler
function initializeMobileMenu() {
    const header = document.querySelector('.modern-header');
    if (header && !document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.onclick = toggleMobileMenu;
        header.insertBefore(menuBtn, header.firstChild);
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = closeMobileMenu;
        document.body.appendChild(overlay);
    }
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.modern-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.modern-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Fehlerbehandlung mit Animation
function showErrorWithAnimation(message) {
    console.log('🚨 Showing error:', message);
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        loginBox.classList.add('shake');
        setTimeout(() => loginBox.classList.remove('shake'), 500);
    }
    showError(message);
}

// Bessere Initialisierung
async function initializeApp() {
    if (isInitialized) return;
    
    console.log('🚀 Initializing app...');
    
    try {
        // API Check
        if (!window.api) {
            throw new Error('window.api not available');
        }
        console.log('✅ API available');

        // Sprache laden
        const savedLanguage = await window.api.getLanguage();
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            await loadTranslations();
            showLoginScreen();
        } else {
            showLanguageSelection();
        }

        // Event Listener initialisieren
        initializeEventListeners();
        
        isInitialized = true;
        console.log('✅ App initialization complete');

    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showError('Anwendung konnte nicht initialisiert werden: ' + error.message);
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, starting initialization...');
    
    // Sofortige Initialisierung mit Fallback
    setTimeout(() => {
        initializeApp();
    }, 100);

    // Sprachauswahl Event Listener
    if (window.api && window.api.on) {
        window.api.on('show-language-selection', () => {
            showLanguageSelection();
        });
    }
});

// Event Listener initialisieren
function initializeEventListeners() {
    console.log('🔧 Initializing event listeners...');
    
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const adminCodeSection = document.getElementById('adminCodeSection');
    const codeInputs = document.querySelectorAll('.code-input');
    
    console.log('Form elements found:', {
        loginForm: !!loginForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        adminCodeSection: !!adminCodeSection,
        codeInputs: codeInputs.length
    });

    // Code-Input Auto-Advance (6-stellig)
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < 5) {
                codeInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // Admin Login Button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', async () => {
            const code = Array.from(codeInputs).map(input => input.value).join('');
            
            if (code.length !== 6) {
                showErrorWithAnimation('Bitte geben Sie einen 6-stelligen Code ein');
                return;
            }

            try {
                const result = await window.api.adminLogin(adminEmail, code);
                
                if (result.success) {
                    window.api.openAdminWindow();
                    resetLoginForm();
                } else {
                    showErrorWithAnimation(result.error || 'Falscher Code');
                    codeInputs.forEach(input => input.value = '');
                    codeInputs[0].focus();
                }
            } catch (error) {
                showErrorWithAnimation('Verbindungsfehler beim Admin-Login');
            }
        });
    }

    // Cancel Admin Mode Button
    const cancelAdminBtn = document.getElementById('cancelAdminBtn');
    if (cancelAdminBtn) {
        cancelAdminBtn.addEventListener('click', () => {
            resetLoginForm();
        });
    }

    // LOGIN FORM - Verbessert
    if (loginForm) {
        console.log('🔐 Setting up login form event listener');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🚀 Login form submitted');
            
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            
            console.log('Login attempt:', { 
                email: email, 
                password: password ? '***' : 'EMPTY',
                emailLength: email.length,
                passwordLength: password.length
            });
            
            if (!email || !password) {
                console.error('❌ Email or password missing');
                showErrorWithAnimation('Bitte E-Mail und Passwort eingeben');
                return;
            }
            
            // Loading state
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Anmelden...';
            }
            
            try {
                console.log('🔄 Calling window.api.userLogin...');
                
                if (!window.api || !window.api.userLogin) {
                    throw new Error('window.api.userLogin not available');
                }
                
                const result = await window.api.userLogin(email, password);
                console.log('✅ Login API response:', result);
                
                if (result && result.success) {
                    console.log('🎉 Login successful!');
                    showMainApp(result.user);
                } else {
                    console.log('❌ Login failed:', result ? result.error : 'No result');
                    if (result && result.needsVerification) {
                        showEmailVerificationMessage(email);
                    } else {
                        showErrorWithAnimation(result ? result.error : 'Anmeldung fehlgeschlagen');
                    }
                }
            } catch (error) {
                console.error('❌ Login error:', error);
                showErrorWithAnimation('Verbindungsfehler. Bitte versuchen Sie es erneut.');
            } finally {
                // Reset button
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<span>Anmelden</span><i class="fas fa-arrow-right"></i>';
                }
            }
        });
        
        console.log('✅ Login form event listener added');
    } else {
        console.error('❌ Login form not found!');
    }

    // Language Dropdown
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdown = document.getElementById('langDropdown');

    if (langDropdownBtn) {
        langDropdownBtn.addEventListener('click', () => {
            langDropdown.classList.toggle('hidden');
        });
    }

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (langDropdownBtn && !langDropdownBtn.contains(e.target) && 
            langDropdown && !langDropdown.contains(e.target)) {
            langDropdown.classList.add('hidden');
        }
    });

    // Navigation setup
    setupNavigationListeners();

    // Register Link
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegistrationForm();
        });
    }
    
    console.log('✅ All event listeners initialized');
}

// Navigation Setup - Verbessert
function setupNavigationListeners() {
    console.log('🧭 Setting up navigation listeners...');
    
    // Warte kurz auf moderne-app.js
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item, .nav-btn[data-page]');
        console.log('Found nav items:', navItems.length);
        
        navItems.forEach(item => {
            item.removeEventListener('click', handleNavClick);
            item.addEventListener('click', handleNavClick);
        });
        
        // Onclick handlers für Sidebar
        const sidebarLinks = document.querySelectorAll('.nav-item[onclick]');
        console.log('Found sidebar links with onclick:', sidebarLinks.length);
        
        sidebarLinks.forEach(link => {
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('navigateTo')) {
                const page = onclickAttr.match(/navigateTo\('(.+)'\)/)?.[1];
                if (page) {
                    link.removeAttribute('onclick');
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log('🧭 Navigating to:', page);
                        if (typeof window.navigateTo === 'function') {
                            window.navigateTo(page);
                        } else {
                            console.error('❌ navigateTo function not available');
                        }
                    });
                }
            }
        });
    }, 500);
}

// Navigation click handler
function handleNavClick(e) {
    e.preventDefault();
    
    const page = e.currentTarget.getAttribute('data-page') || 
                 e.currentTarget.getAttribute('onclick')?.match(/navigateTo\('(.+)'\)/)?.[1];
    
    if (page) {
        console.log('🧭 Navigation clicked:', page);
        
        if (typeof window.navigateTo === 'function') {
            window.navigateTo(page);
        } else {
            console.error('❌ navigateTo function not available');
        }
        
        // Update active state
        document.querySelectorAll('.nav-item, .nav-btn').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
    }
}

// Show Main App - Verbessert
function showMainApp(user) {
    console.log('🎉 Showing main app for user:', user);
    currentUser = user;
    
    // User für moderne-app.js verfügbar machen
    window.currentUserFromRenderer = user;
    
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const userName = document.getElementById('userName');
    
    if (loginScreen) {
        loginScreen.classList.add('hidden');
        console.log('✅ Login screen hidden');
    }
    if (mainApp) {
        mainApp.classList.remove('hidden');
        console.log('✅ Main app shown');
    }
    if (userName) {
        userName.textContent = user.first_name || user.email;
        console.log('✅ User name updated');
    }
    
    // Moderne App initialisieren - Einfacher Ansatz
    setTimeout(() => {
        console.log('🎯 Initializing modern app...');
        
        if (typeof window.initializeModernApp === 'function') {
            console.log('🎯 initializeModernApp found, calling...');
            window.initializeModernApp();
            
            // Navigation setup
            setTimeout(() => {
                setupNavigationListeners();
                
                if (typeof window.navigateTo === 'function') {
                    console.log('🏠 Navigating to dashboard...');
                    window.navigateTo('dashboard');
                }
            }, 200);
            
        } else {
            console.log('⏳ initializeModernApp not found yet, retrying...');
            setTimeout(() => showMainApp(user), 300);
        }
    }, 200);
    
    // Mobile menu
    setTimeout(() => {
        initializeMobileMenu();
    }, 300);
}

// Sprachauswahl anzeigen
function showLanguageSelection() {
    const langSelection = document.getElementById('languageSelection');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (langSelection) langSelection.classList.remove('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

// Sprache auswählen
async function selectLanguage(language) {
    try {
        currentLanguage = language;
        await window.api.saveLanguage(language);
        await loadTranslations();
        
        document.getElementById('languageSelection').classList.add('hidden');
        showLoginScreen();
    } catch (error) {
        console.error('Error selecting language:', error);
        showError('Fehler beim Speichern der Sprache');
    }
}

// Login Screen anzeigen
function showLoginScreen() {
    console.log('🔓 Showing login screen');
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) {
        loginScreen.classList.remove('hidden');
        console.log('✅ Login screen visible');
    }
    if (mainApp) mainApp.classList.add('hidden');
    
    updateUI();
}

// Übersetzungen laden
async function loadTranslations() {
    try {
        const response = await fetch(`../locales/${currentLanguage}.json`);
        translations = await response.json();
        updateUI();
        updateLanguageFlag();
    } catch (error) {
        console.error('❌ Fehler beim Laden der Übersetzungen:', error);
        // Fallback zu Deutsch
        try {
            const response = await fetch('../locales/de.json');
            translations = await response.json();
        } catch (fallbackError) {
            console.error('❌ Fehler beim Laden der Fallback-Übersetzungen:', fallbackError);
        }
    }
}

// UI mit Übersetzungen aktualisieren
function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation) {
            element.textContent = translation;
        }
    });
}

// Übersetzung abrufen
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            return key; // Fallback zum Key
        }
    }
    
    return value;
}

// Sprache ändern
async function changeLanguage(language) {
    try {
        currentLanguage = language;
        await window.api.saveLanguage(language);
        await loadTranslations();
        
        const langDropdown = document.getElementById('langDropdown');
        if (langDropdown) langDropdown.classList.add('hidden');
    } catch (error) {
        console.error('Error changing language:', error);
        showError('Fehler beim Ändern der Sprache');
    }
}

// Sprachflagge aktualisieren
function updateLanguageFlag() {
    const flagImg = document.getElementById('currentLangFlag');
    if (flagImg) {
        flagImg.src = `../assets/flags/${currentLanguage}.svg`;
        flagImg.alt = currentLanguage.toUpperCase();
    }
}

// Reset Login Form
function resetLoginForm() {
    isAdminMode = false;
    adminEmail = '';
    
    const passwordGroup = document.getElementById('passwordGroup');
    const loginForm = document.getElementById('loginForm');
    const adminCodeSection = document.getElementById('adminCodeSection');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const codeInputs = document.querySelectorAll('.code-input');
    
    if (passwordGroup) {
        passwordGroup.style.display = 'block';
        passwordGroup.style.opacity = '1';
        passwordGroup.style.transform = 'translateY(0)';
    }
    
    if (loginForm) loginForm.style.display = 'block';
    if (adminCodeSection) adminCodeSection.classList.add('hidden');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    codeInputs.forEach(input => input.value = '');
}

// Registrierungsformular anzeigen
function showRegistrationForm() {
    console.log('📝 Showing registration form');
    showToast('Registrierung coming soon...', 'info');
}

// E-Mail-Bestätigungs-Nachricht
function showEmailVerificationMessage(email) {
    console.log('📧 Showing email verification for:', email);
    showToast('E-Mail-Bestätigung erforderlich', 'info');
}

// Verification Email erneut senden
async function resendVerificationEmail(email) {
    try {
        const result = await window.api.resendVerificationEmail(email);
        if (result.success) {
            showSuccess('Bestätigungs-E-Mail wurde erneut gesendet');
        } else {
            showError('Fehler beim Senden der E-Mail');
        }
    } catch (error) {
        showError('Verbindungsfehler beim Senden der E-Mail');
    }
}

// Zurück zum Login
function showLoginForm() {
    location.reload();
}

// Error Display
function showError(message) {
    console.log('🚨 Error:', message);
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    } else {
        showToast(message, 'error');
    }
}

// Success Display
function showSuccess(message) {
    console.log('✅ Success:', message);
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        showToast(message, 'success');
    }
}

// Toast Notification (Fallback)
function showToast(message, type = 'info') {
    console.log(`🔔 Toast (${type}): ${message}`);
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

// Globale Funktionen
window.selectLanguage = selectLanguage;
window.changeLanguage = changeLanguage;
window.showLoginForm = showLoginForm;
window.resendVerificationEmail = resendVerificationEmail;
window.setupNavigationListeners = setupNavigationListeners;
window.showMainApp = showMainApp;

// Debug functions
window.testLogin = async (email, password) => {
    console.log('🧪 Manual test login:', email);
    try {
        const result = await window.api.userLogin(email, password);
        console.log('Test result:', result);
        if (result.success) {
            showMainApp(result.user);
        }
        return result;
    } catch (error) {
        console.error('Test login error:', error);
        return { success: false, error: error.message };
    }
};

console.log('✅ Renderer script loaded successfully');