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
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        loginBox.classList.add('shake');
        setTimeout(() => loginBox.classList.remove('shake'), 500);
    }
    showError(message);
}

// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', async () => {
    // Prüfe ob erste Installation
    const savedLanguage = await window.api.getLanguage();
    
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        await loadTranslations();
        showLoginScreen();
    } else {
        // Zeige Sprachauswahl bei erster Installation
        showLanguageSelection();
    }
    
    // Event Listener für Sprachauswahl
    window.api.on('show-language-selection', () => {
        showLanguageSelection();
    });
    
    // Initialisiere alle Event Listener
    initializeEventListeners();
});

// Event Listener initialisieren
function initializeEventListeners() {
    // Initialisiere Remember Me und Passwort-Stärke
    if (typeof initializeRememberMe === 'function') {
        initializeRememberMe();
    }
    if (typeof enhanceLoginForm === 'function') {
        enhanceLoginForm();
    }
    
    // Admin-Email Erkennung
    const emailInput = document.getElementById('emailInput');
    const passwordGroup = document.getElementById('passwordGroup');
    const loginForm = document.getElementById('loginForm');
    const adminCodeSection = document.getElementById('adminCodeSection');
    const codeInputs = document.querySelectorAll('.code-input');
    
    // E-Mail Input Handler
    if (emailInput) {
        emailInput.addEventListener('input', async (e) => {
            const email = e.target.value;
            
            // Prüfe ob Admin-Email
            const isAdmin = await window.api.checkAdminEmail(email);
            
            if (isAdmin && !isAdminMode) {
                // Aktiviere Admin-Modus mit Animation
                isAdminMode = true;
                adminEmail = email;
                
                passwordGroup.style.opacity = '0';
                passwordGroup.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    passwordGroup.style.display = 'none';
                    loginForm.style.display = 'none';
                    adminCodeSection.classList.remove('hidden');
                    
                    // Focus auf ersten Code-Input
                    codeInputs[0].focus();
                }, 300);
            }
        });
    }

    // Code-Input Auto-Advance
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < 3) {
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
            
            if (code.length !== 4) {
                showErrorWithAnimation('Bitte geben Sie einen 4-stelligen Code ein');
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

    // Normal Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value;
            const password = document.getElementById('passwordInput').value;
            
            // Speichere E-Mail wenn Remember Me aktiviert
            if (typeof saveEmail === 'function') {
                saveEmail(email);
            }
            
            const result = await window.api.userLogin(email, password);
            
            if (result.success) {
                showMainApp(result.user);
            } else {
                if (result.needsVerification) {
                    showEmailVerificationMessage(email);
                } else {
                    showErrorWithAnimation(result.error || 'Anmeldung fehlgeschlagen');
                }
            }
        });
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

    // Navigation Buttons
    const navButtons = document.querySelectorAll('.nav-btn[data-page]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.getAttribute('data-page');
            loadPage(page);
            
            // Update active state
            navButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Register Link
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegistrationForm();
        });
    }
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
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
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
        console.error('Fehler beim Laden der Übersetzungen:', error);
        // Fallback zu Deutsch
        try {
            const response = await fetch('../locales/de.json');
            translations = await response.json();
        } catch (fallbackError) {
            console.error('Fehler beim Laden der Fallback-Übersetzungen:', fallbackError);
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

// Show Main App
function showMainApp(user) {
    currentUser = user;
    
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    const userName = document.getElementById('userName');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    if (userName) userName.textContent = user.first_name || user.email;
    
    // Initialize modern app if available
    if (typeof initializeModernApp === 'function') {
        initializeModernApp();
    }
}

// Registrierungsformular anzeigen
function showRegistrationForm() {
    const loginBox = document.querySelector('.login-box');
    
    loginBox.innerHTML = `
        <div class="login-header">
            <img src="../assets/icon.png" alt="Logo" class="login-logo">
            <h1>${getTranslation('register.title')}</h1>
            <p>${getTranslation('register.subtitle')}</p>
        </div>

        <form id="registerForm" class="login-form">
            <div class="form-row">
                <div class="form-group">
                    <label>${getTranslation('register.firstName')} *</label>
                    <input type="text" id="regFirstName" required>
                </div>
                <div class="form-group">
                    <label>${getTranslation('register.lastName')} *</label>
                    <input type="text" id="regLastName" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>${getTranslation('register.email')} *</label>
                <input type="email" id="regEmail" required>
            </div>
            
            <div class="form-group">
                <label>${getTranslation('register.phone')}</label>
                <input type="tel" id="regPhone" placeholder="+49 123 456789">
            </div>
            
            <div class="form-group">
                <label>${getTranslation('register.companyName')}</label>
                <input type="text" id="regCompanyName" placeholder="Optional">
            </div>
            
            <div class="form-group">
                <label>${getTranslation('register.password')} *</label>
                <input type="password" id="regPassword" required minlength="6">
                <div class="password-strength-indicator">
                    <div class="strength-bar-container">
                        <div class="strength-bar" id="regStrengthBar"></div>
                    </div>
                    <div class="strength-details">
                        <span class="strength-text" id="regStrengthText">Passwort-Stärke</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label>${getTranslation('register.confirmPassword')} *</label>
                <input type="password" id="regPasswordConfirm" required>
            </div>
            
            <div class="form-checkbox">
                <input type="checkbox" id="regTerms" required>
                <label for="regTerms">${getTranslation('register.terms')} *</label>
            </div>
            
            <button type="submit" class="btn-primary">
                <span>${getTranslation('register.button')}</span>
                <i class="fas fa-user-plus"></i>
            </button>
        </form>

        <div class="login-footer">
            <a href="#" onclick="showLoginForm(); return false;">${getTranslation('register.alreadyHaveAccount')} ${getTranslation('register.login')}</a>
        </div>
    `;
    
    // Passwort-Stärke für Registrierung
    const regPassword = document.getElementById('regPassword');
    if (regPassword && typeof calculatePasswordStrength === 'function') {
        regPassword.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            
            const strengthBar = document.getElementById('regStrengthBar');
            const strengthText = document.getElementById('regStrengthText');
            
            if (strengthBar && strengthText) {
                strengthBar.style.width = strength.score + '%';
                strengthBar.style.backgroundColor = strength.level.color;
                strengthText.textContent = password ? strength.level.text : 'Passwort-Stärke';
                strengthText.style.color = password ? strength.level.color : 'var(--text-secondary)';
            }
        });
    }
    
    // Registrierungs-Event
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        
        if (password !== passwordConfirm) {
            showError(getTranslation('errors.passwordMatch'));
            return;
        }
        
        // Warnung bei schwachem Passwort
        if (typeof calculatePasswordStrength === 'function') {
            const strength = calculatePasswordStrength(password);
            if (strength.score < 50) {
                if (!confirm('Ihr Passwort ist relativ schwach. Möchten Sie trotzdem fortfahren?')) {
                    return;
                }
            }
        }
        
        const userData = {
            firstName: document.getElementById('regFirstName').value,
            lastName: document.getElementById('regLastName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value || null,
            companyName: document.getElementById('regCompanyName').value || null,
            password: password,
            language: currentLanguage
        };
        
        const result = await window.api.userRegister(userData);
        
        if (result.success) {
            showSuccess('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
            showLoginForm();
        } else {
            showError(result.error || 'Registrierung fehlgeschlagen');
        }
    });
}

// E-Mail-Bestätigungs-Nachricht
function showEmailVerificationMessage(email) {
    const loginBox = document.querySelector('.login-box');
    
    loginBox.innerHTML = `
        <div class="email-verification">
            <div class="verification-icon">
                <i class="fas fa-envelope-open-text"></i>
            </div>
            <h2>Bestätigen Sie Ihre E-Mail</h2>
            <p>Wir haben eine Bestätigungs-E-Mail an <strong>${email}</strong> gesendet.</p>
            <p>Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.</p>
            <div class="verification-info">
                <i class="fas fa-info-circle"></i>
                <small>Keine E-Mail erhalten? Prüfen Sie Ihren Spam-Ordner oder fordern Sie eine neue an.</small>
            </div>
            <button class="btn-secondary" onclick="resendVerificationEmail('${email}')">
                <i class="fas fa-redo"></i> E-Mail erneut senden
            </button>
            <button class="btn-primary" onclick="showLoginForm()">
                Zur Anmeldung
            </button>
        </div>
    `;
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
    showToast(message, 'error');
}

// Success Display
function showSuccess(message) {
    showToast(message, 'success');
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Globale Funktionen für HTML onclick
window.selectLanguage = selectLanguage;
window.changeLanguage = changeLanguage;
window.showLoginForm = showLoginForm;
window.resendVerificationEmail = resendVerificationEmail;