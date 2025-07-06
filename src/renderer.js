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

// Bessere Initialisierung - Vereinfacht und robuster
async function initializeApp() {
    if (isInitialized) return;
    
    console.log('🚀 Initializing app...');
    
    try {
        // API Check
        if (!window.api) {
            console.warn('⚠️ window.api not available yet, using fallback');
            // Fallback für Spracheinstellungen
            currentLanguage = 'de';
            await loadTranslations();
            showLoginScreen();
            return;
        }
        console.log('✅ API available');

        // Sprache laden
        try {
            const savedLanguage = await window.api.getLanguage();
            if (savedLanguage) {
                currentLanguage = savedLanguage;
                await loadTranslations();
                showLoginScreen();
            } else {
                showLanguageSelection();
            }
        } catch (error) {
            console.warn('⚠️ Language loading failed, using default:', error);
            currentLanguage = 'de';
            await loadTranslations();
            showLoginScreen();
        }

        // Event Listener initialisieren - OHNE setupNavigationListeners!
        initializeEventListeners();
        
        isInitialized = true;
        console.log('✅ App initialization complete');

    } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Fallback auch bei komplettem Fehler
        currentLanguage = 'de';
        await loadTranslations();
        showLoginScreen();
        initializeEventListeners();
        isInitialized = true;
    }
}

// DOM Content Loaded - Vereinfacht und direkt
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, starting direct initialization...');
    
    // SOFORTIGE Button-Handler ohne komplexe Initialisierung
    setupDirectButtonHandlers();
    
    // Normale Initialisierung
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// Direkte Button Handler - Funktioniert SOFORT
function setupDirectButtonHandlers() {
    console.log('🔘 Setting up DIRECT button handlers...');
    
    // Warte kurz auf DOM-Elemente
    setTimeout(() => {
        const loginBtn = document.getElementById('loginBtn');
        const registerLink = document.getElementById('registerLink');
        const forgotPasswordLink = document.querySelector('a[data-i18n="login.forgotPassword"]');
        
        console.log('Direct handlers - Found elements:', {
            loginBtn: !!loginBtn,
            registerLink: !!registerLink,
            forgotPasswordLink: !!forgotPasswordLink
        });
        
        // LOGIN BUTTON - Direkt an Button
        if (loginBtn) {
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🔘 LOGIN BUTTON CLICKED!');
                
                const emailInput = document.getElementById('emailInput');
                const passwordInput = document.getElementById('passwordInput');
                
                const email = emailInput ? emailInput.value.trim() : '';
                const password = passwordInput ? passwordInput.value : '';
                
                if (!email || !password) {
                    alert('Bitte E-Mail und Passwort eingeben');
                    return;
                }
                
                try {
                    console.log('🔄 Trying login with:', email);
                    
                    if (window.api && window.api.userLogin) {
                        const result = await window.api.userLogin(email, password);
                        console.log('Login result:', result);
                        
                        if (result && result.success) {
                            alert('Login erfolgreich!');
                            showMainApp(result.user);
                        } else {
                            alert('Login fehlgeschlagen: ' + (result?.error || 'Unbekannter Fehler'));
                        }
                    } else {
                        alert('API nicht verfügbar');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    alert('Fehler beim Login: ' + error.message);
                }
            });
            console.log('✅ LOGIN button handler added');
        }
        
        // REGISTER LINK - Direkt an Link
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 REGISTER LINK CLICKED!');
                alert('Registrierung wird geladen...');
                showRegistrationForm();
            });
            console.log('✅ REGISTER link handler added');
        }
        
        // FORGOT PASSWORD LINK - Direkt an Link
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 FORGOT PASSWORD LINK CLICKED!');
                alert('Passwort vergessen wird geladen...');
                showForgotPasswordForm();
            });
            console.log('✅ FORGOT PASSWORD link handler added');
        }
        
    }, 100);
}

// Login Submit Handler - Separiert für bessere Performance
async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('🚀 Login form submitted');
    
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
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
}

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

    // LOGIN FORM - Verbessert mit mehr Debug-Logs
    if (loginForm) {
        console.log('🔐 Setting up login form event listener');
        
        // Entferne alle existierenden Event Listener
        loginForm.removeEventListener('submit', handleLoginSubmit);
        
        // Füge neuen Event Listener hinzu
        loginForm.addEventListener('submit', handleLoginSubmit);
        
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
    
    // Forgot Password Link
    const forgotPasswordLink = document.querySelector('a[data-i18n="login.forgotPassword"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordForm();
        });
    }
    
    console.log('✅ All event listeners initialized');
}

// Navigation Setup - Verbessert und sicherer
function setupNavigationListeners() {
    console.log('🧭 Setting up navigation listeners...');
    
    // Nur ausführen wenn wir NICHT im Login-Screen sind
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen && !loginScreen.classList.contains('hidden')) {
        console.log('⚠️ Login screen active - skipping navigation setup');
        return;
    }
    
    if (!mainApp || mainApp.classList.contains('hidden')) {
        console.log('⚠️ Main app not visible - skipping navigation setup');
        return;
    }
    
    // Warte kurz auf moderne-app.js - aber nur im Main App Kontext
    setTimeout(() => {
        // Sehr spezifische Selektoren - NUR Navigation Items in der Sidebar
        const navItems = document.querySelectorAll('.modern-sidebar .nav-item:not(.login-related)');
        console.log('Found nav items:', navItems.length);
        
        navItems.forEach(item => {
            // Entferne nur alte Navigation Event Listener
            item.removeEventListener('click', handleNavClick);
            item.addEventListener('click', handleNavClick);
        });
        
        // Onclick handlers für Sidebar - nur wenn nicht login-bezogen
        const sidebarLinks = document.querySelectorAll('.modern-sidebar .nav-item[onclick]:not(.login-related)');
        console.log('Found sidebar links with onclick:', sidebarLinks.length);
        
        sidebarLinks.forEach(link => {
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('navigateTo') && !onclickAttr.includes('login')) {
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
    }, 200); // Reduziert von 500ms
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

// Show Main App - Verbessert mit besserem Timing und Retry-Logik
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
    
    // Retry-Zähler für moderne-app.js Initialisierung
    let retryCount = 0;
    const maxRetries = 10;
    
    function tryInitializeModernApp() {
        retryCount++;
        console.log(`🎯 Attempting to initialize modern app (attempt ${retryCount}/${maxRetries})...`);
        
        if (typeof window.initializeModernApp === 'function') {
            console.log('🎯 initializeModernApp found, calling...');
            try {
                window.initializeModernApp();
                
                // Navigation setup nach erfolgreicher Initialisierung
                setTimeout(() => {
                    setupNavigationListeners(); // Jetzt sicher, da Login-Screen hidden ist
                    
                    if (typeof window.navigateTo === 'function') {
                        console.log('🏠 Navigating to dashboard...');
                        window.navigateTo('dashboard');
                    } else {
                        console.log('⚠️ navigateTo not available yet, setting up manual dashboard...');
                        // Fallback: Zeige Dashboard-Inhalte direkt
                        const contentArea = document.getElementById('contentArea');
                        if (contentArea) {
                            contentArea.innerHTML = '<div class="page-content"><h2>Dashboard</h2><p>Willkommen zurück, ' + user.first_name + '!</p></div>';
                        }
                    }
                }, 300);
                
                console.log('✅ Modern app initialization successful!');
            } catch (error) {
                console.error('❌ Error during modern app initialization:', error);
            }
            
        } else if (retryCount < maxRetries) {
            console.log(`⏳ initializeModernApp not found yet, retrying in ${500 * retryCount}ms...`);
            setTimeout(tryInitializeModernApp, 500 * retryCount); // Progressive delay
        } else {
            console.error('❌ Failed to initialize modern app after', maxRetries, 'attempts');
            // Fallback: Zeige wenigstens einfache Inhalte
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div class="page-content">
                        <h2>Willkommen, ${user.first_name || user.email}!</h2>
                        <p>Login erfolgreich. Dashboard wird geladen...</p>
                        <button onclick="location.reload()">App neu laden</button>
                    </div>
                `;
            }
        }
    }
    
    // Starte Initialisierung mit längerem initialen Timeout
    setTimeout(tryInitializeModernApp, 1000); // Erhöht von 200ms auf 1000ms
    
    // Mobile menu setup
    setTimeout(() => {
        initializeMobileMenu();
    }, 1200);
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
    
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.innerHTML = `
            <div class="login-container">
                <div class="login-box animate-slide-in">
                    <div class="login-header">
                        <img src="../assets/icon.png" alt="Sunshin3 Pro" class="login-logo">
                        <h2 data-i18n="auth.register.title">Registrierung</h2>
                        <p data-i18n="auth.register.subtitle">Erstellen Sie Ihr Konto</p>
                    </div>
                    
                    <form id="registerForm" class="login-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="regFirstName">Vorname</label>
                                <input type="text" id="regFirstName" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="regLastName">Nachname</label>
                                <input type="text" id="regLastName" class="form-input" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="regCompanyName">Firmenname</label>
                            <input type="text" id="regCompanyName" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="regEmail">E-Mail</label>
                            <input type="email" id="regEmail" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="regPassword">Passwort</label>
                            <input type="password" id="regPassword" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="regPasswordConfirm">Passwort bestätigen</label>
                            <input type="password" id="regPasswordConfirm" class="form-input" required>
                        </div>
                        
                        <button type="submit" class="login-btn" id="registerBtn">
                            <span>Registrieren</span>
                            <i class="fas fa-user-plus"></i>
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <p>Bereits ein Konto? 
                            <a href="#" id="backToLoginLink" class="auth-link">Anmelden</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Event Listener für Registrierung
        setupRegistrationListeners();
    }
}

// Setup Registration Event Listeners
function setupRegistrationListeners() {
    const registerForm = document.getElementById('registerForm');
    const backToLoginLink = document.getElementById('backToLoginLink');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const firstName = document.getElementById('regFirstName').value.trim();
            const lastName = document.getElementById('regLastName').value.trim();
            const companyName = document.getElementById('regCompanyName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;
            
            // Validierung
            if (!firstName || !lastName || !companyName || !email || !password) {
                showError('Bitte füllen Sie alle Felder aus');
                return;
            }
            
            if (password !== passwordConfirm) {
                showError('Passwörter stimmen nicht überein');
                return;
            }
            
            if (password.length < 6) {
                showError('Passwort muss mindestens 6 Zeichen lang sein');
                return;
            }
            
            // Loading state
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registriere...';
            }
            
            try {
                const userData = {
                    firstName,
                    lastName,
                    companyName,
                    email,
                    password,
                    language: currentLanguage
                };
                
                const result = await window.api.userRegister(userData);
                
                if (result.success) {
                    showSuccess('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
                    setTimeout(() => {
                        showLoginForm();
                    }, 2000);
                } else {
                    showError(result.error || 'Registrierung fehlgeschlagen');
                }
            } catch (error) {
                console.error('❌ Registration error:', error);
                showError('Verbindungsfehler bei der Registrierung');
            } finally {
                if (registerBtn) {
                    registerBtn.disabled = false;
                    registerBtn.innerHTML = '<span>Registrieren</span><i class="fas fa-user-plus"></i>';
                }
            }
        });
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// Passwort vergessen anzeigen
function showForgotPasswordForm() {
    console.log('🔑 Showing forgot password form');
    
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        loginScreen.innerHTML = `
            <div class="login-container">
                <div class="login-box animate-slide-in">
                    <div class="login-header">
                        <img src="../assets/icon.png" alt="Sunshin3 Pro" class="login-logo">
                        <h2>Passwort zurücksetzen</h2>
                        <p>Geben Sie Ihre E-Mail-Adresse ein</p>
                    </div>
                    
                    <form id="forgotPasswordForm" class="login-form">
                        <div class="form-group">
                            <label for="forgotEmail">E-Mail</label>
                            <input type="email" id="forgotEmail" class="form-input" required>
                        </div>
                        
                        <button type="submit" class="login-btn" id="forgotPasswordBtn">
                            <span>Link senden</span>
                            <i class="fas fa-envelope"></i>
                        </button>
                    </form>
                    
                    <div class="login-footer">
                        <p><a href="#" id="backToLoginFromForgot" class="auth-link">Zurück zur Anmeldung</a></p>
                    </div>
                </div>
            </div>
        `;
        
        setupForgotPasswordListeners();
    }
}

// Setup Forgot Password Event Listeners
function setupForgotPasswordListeners() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const backLink = document.getElementById('backToLoginFromForgot');
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value.trim();
            
            if (!email) {
                showError('Bitte geben Sie Ihre E-Mail-Adresse ein');
                return;
            }
            
            const forgotBtn = document.getElementById('forgotPasswordBtn');
            if (forgotBtn) {
                forgotBtn.disabled = true;
                forgotBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sende...';
            }
            
            try {
                // Für Demo: Zeige einfach eine Bestätigung
                showSuccess('Falls diese E-Mail registriert ist, erhalten Sie einen Reset-Link.');
                
                setTimeout(() => {
                    showLoginForm();
                }, 3000);
                
            } catch (error) {
                console.error('❌ Forgot password error:', error);
                showError('Fehler beim Senden des Reset-Links');
            } finally {
                if (forgotBtn) {
                    forgotBtn.disabled = false;
                    forgotBtn.innerHTML = '<span>Link senden</span><i class="fas fa-envelope"></i>';
                }
            }
        });
    }
    
    if (backLink) {
        backLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// Login Form neu laden
function showLoginForm() {
    console.log('🔓 Reloading login form');
    location.reload();
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