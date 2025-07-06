// Globale Variablen
let currentLanguage = 'de';
let translations = {};
let currentUser = null;
let isAdminMode = false;
let adminEmail = '';

// Mobile Menu Handler
function initializeMobileMenu() {
    // Erstelle Mobile Menu Button
    const header = document.querySelector('.modern-header');
    if (header && !document.querySelector('.mobile-menu-btn')) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.onclick = toggleMobileMenu;
        header.insertBefore(menuBtn, header.firstChild);
        
        // Erstelle Overlay
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

// Füge Error-Animation für Login hinzu
function showErrorWithAnimation(message) {
    console.log('🚨 Showing error:', message);
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        loginBox.classList.add('shake');
        setTimeout(() => loginBox.classList.remove('shake'), 500);
    }
    showError(message);
}

// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM loaded, initializing app...');
    
    // Wait a bit for all scripts to load
    setTimeout(async () => {
        console.log('🔧 Starting initialization...');
        
        // Check API availability
        if (window.api) {
            console.log('✅ window.api available');
        } else {
            console.error('❌ window.api not available!');
        }
        
        // Prüfe ob erste Installation
        try {
            const savedLanguage = await window.api.getLanguage();
            
            if (savedLanguage) {
                currentLanguage = savedLanguage;
                await loadTranslations();
                showLoginScreen();
            } else {
                // Zeige Sprachauswahl bei erster Installation
                showLanguageSelection();
            }
        } catch (error) {
            console.error('❌ Error getting language:', error);
            // Fallback to login screen
            showLoginScreen();
        }
        
        // Event Listener für Sprachauswahl
        if (window.api && window.api.on) {
            window.api.on('show-language-selection', () => {
                showLanguageSelection();
            });
        }
        
        // Initialisiere alle Event Listener
        initializeEventListeners();
        
        console.log('✅ Initialization complete');
    }, 500);
});

// Event Listener initialisieren
function initializeEventListeners() {
    console.log('🔧 Initializing event listeners...');
    
    // Find form elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const adminCodeSection = document.getElementById('adminCodeSection');
    const codeInputs = document.querySelectorAll('.code-input');
    
    console.log('Form elements found:', {
        loginForm: !!loginForm,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        adminCodeSection: !!adminCodeSection
    });

    // E-Mail Input Handler - NO ADMIN MODE DETECTION
    if (emailInput) {
        emailInput.addEventListener('input', async (e) => {
            console.log('📧 Email input:', e.target.value);
        });
    }

    // Code-Input Auto-Advance
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

            const result = await window.api.adminLogin(adminEmail, code);
            
            if (result.success) {
                // Öffne Admin-Panel
                window.api.openAdminWindow();
                resetLoginForm();
            } else {
                showErrorWithAnimation(result.error || 'Falscher Code');
                codeInputs.forEach(input => input.value = '');
                codeInputs[0].focus();
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

    // LOGIN FORM - ENHANCED WITH DEBUGGING
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
            
            // Show loading state
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

    // Navigation Buttons - Enhanced
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

// Enhanced Navigation Setup
function setupNavigationListeners() {
    console.log('🧭 Setting up navigation listeners...');
    
    // Wait for DOM to be fully loaded and moderne-app.js to be available
    const initNavigation = () => {
        // Try to find navigation items
        const navItems = document.querySelectorAll('.nav-item, .nav-btn[data-page]');
        console.log('Found nav items:', navItems.length);
        
        navItems.forEach(item => {
            // Remove existing listeners to avoid duplicates
            item.removeEventListener('click', handleNavClick);
            item.addEventListener('click', handleNavClick);
        });
        
        // Setup direct onclick handlers for sidebar navigation
        setTimeout(() => {
            const sidebarLinks = document.querySelectorAll('.nav-item[onclick]');
            console.log('Found sidebar links with onclick:', sidebarLinks.length);
            
            sidebarLinks.forEach(link => {
                const onclickAttr = link.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes('navigateTo')) {
                    const page = onclickAttr.match(/navigateTo\('(.+)'\)/)?.[1];
                    if (page) {
                        // Remove onclick and add proper event listener
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
        }, 200);
    };
    
    // Run immediately and retry after short delay
    initNavigation();
    setTimeout(initNavigation, 500);
    setTimeout(initNavigation, 1000);
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

// Show Main App - Enhanced with user transfer
function showMainApp(user) {
    console.log('🎉 Showing main app for user:', user);
    currentUser = user;
    
    // Transfer user to moderne-app.js
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
    
    // Initialize modern app functionality with retries
    let retryCount = 0;
    const maxRetries = 5;
    
    const initializeApp = () => {
        console.log(`🔄 Attempting to initialize app (attempt ${retryCount + 1}/${maxRetries})`);
        
        if (typeof window.initializeModernApp === 'function') {
            console.log('🎯 initializeModernApp found, calling...');
            window.initializeModernApp();
            
            // Setup navigation after app initialization
            setTimeout(() => {
                setupNavigationListeners();
                
                // Force navigate to dashboard
                if (typeof window.navigateTo === 'function') {
                    console.log('🏠 Navigating to dashboard...');
                    window.navigateTo('dashboard');
                } else {
                    console.log('⏳ navigateTo not available yet');
                }
            }, 100);
            
        } else {
            console.log('⏳ initializeModernApp not found');
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(initializeApp, 200 * retryCount);
            } else {
                console.error('❌ Failed to find initializeModernApp after', maxRetries, 'attempts');
            }
        }
    };
    
    // Start initialization
    setTimeout(initializeApp, 100);
    
    // Initialize mobile menu
    setTimeout(() => {
        initializeMobileMenu();
    }, 150);
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
    currentLanguage = language;
    await window.api.saveLanguage(language);
    await loadTranslations();
    
    // Verstecke Sprachauswahl und zeige Login
    document.getElementById('languageSelection').classList.add('hidden');
    showLoginScreen();
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
    currentLanguage = language;
    await window.api.saveLanguage(language);
    await loadTranslations();
    
    // Dropdown schließen
    const langDropdown = document.getElementById('langDropdown');
    if (langDropdown) langDropdown.classList.add('hidden');
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
    // Implementation for registration form
    showToast('Registrierung coming soon...', 'info');
}

// E-Mail-Bestätigungs-Nachricht
function showEmailVerificationMessage(email) {
    console.log('📧 Showing email verification for:', email);
    // Implementation for email verification
    showToast('E-Mail-Bestätigung erforderlich', 'info');
}

// Verification Email erneut senden
async function resendVerificationEmail(email) {
    const result = await window.api.resendVerificationEmail(email);
    if (result.success) {
        showSuccess('Bestätigungs-E-Mail wurde erneut gesendet');
    } else {
        showError('Fehler beim Senden der E-Mail');
    }
}

// Zurück zum Login
function showLoginForm() {
    location.reload(); // Einfachste Lösung: Seite neu laden
}

// Error Display
function showError(message) {
    console.log('🚨 Error:', message);
    // Use moderne-app.js showToast if available, otherwise fallback
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    } else {
        showToast(message, 'error');
    }
}

// Success Display
function showSuccess(message) {
    console.log('✅ Success:', message);
    // Use moderne-app.js showToast if available, otherwise fallback
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'success');
    } else {
        showToast(message, 'success');
    }
}

// Toast Notification (Fallback if moderne-app.js not loaded)
function showToast(message, type = 'info') {
    console.log(`🔔 Toast (${type}): ${message}`);
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Basic toast styling
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

// Globale Funktionen für HTML onclick
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