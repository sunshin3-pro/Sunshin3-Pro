// Passwort-Stärke-Berechnung
function calculatePasswordStrength(password) {
    let strength = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    // Punkte vergeben
    if (checks.length) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;
    if (checks.lowercase) strength += 15;
    if (checks.uppercase) strength += 15;
    if (checks.numbers) strength += 15;
    if (checks.special) strength += 15;
    
    // Bonus für Vielfalt
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 10) strength += 10;
    
    return {
        score: Math.min(100, strength),
        checks: checks,
        level: getStrengthLevel(strength)
    };
}

function getStrengthLevel(score) {
    if (score < 30) return { text: 'Sehr schwach', color: '#EF4444', level: 1 };
    if (score < 50) return { text: 'Schwach', color: '#F59E0B', level: 2 };
    if (score < 70) return { text: 'Mittel', color: '#F59E0B', level: 3 };
    if (score < 90) return { text: 'Stark', color: '#10B981', level: 4 };
    return { text: 'Sehr stark', color: '#10B981', level: 5 };
}

// Passwort-Stärke-Anzeige HTML erstellen
function createPasswordStrengthIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'password-strength-indicator';
    indicator.innerHTML = `
        <div class="strength-bar-container">
            <div class="strength-bar" id="strengthBar"></div>
        </div>
        <div class="strength-details">
            <span class="strength-text" id="strengthText">Passwort-Stärke</span>
            <div class="strength-tips" id="strengthTips" style="display: none;">
                <div class="tip" data-check="length">
                    <i class="fas fa-times"></i>
                    <span>Mindestens 8 Zeichen</span>
                </div>
                <div class="tip" data-check="lowercase">
                    <i class="fas fa-times"></i>
                    <span>Kleinbuchstaben (a-z)</span>
                </div>
                <div class="tip" data-check="uppercase">
                    <i class="fas fa-times"></i>
                    <span>Großbuchstaben (A-Z)</span>
                </div>
                <div class="tip" data-check="numbers">
                    <i class="fas fa-times"></i>
                    <span>Zahlen (0-9)</span>
                </div>
                <div class="tip" data-check="special">
                    <i class="fas fa-times"></i>
                    <span>Sonderzeichen (!@#$...)</span>
                </div>
            </div>
        </div>
    `;
    return indicator;
}

// Remember Me Funktionalität
function initializeRememberMe() {
    const rememberMeCheckbox = `
        <div class="form-checkbox remember-me">
            <input type="checkbox" id="rememberMe" checked>
            <label for="rememberMe">E-Mail merken</label>
        </div>
    `;
    
    // Füge Remember Me nach dem Passwort-Feld ein
    const passwordGroup = document.getElementById('passwordGroup');
    if (passwordGroup) {
        passwordGroup.insertAdjacentHTML('afterend', rememberMeCheckbox);
    }
    
    // Lade gespeicherte E-Mail
    loadSavedEmail();
}

// E-Mail speichern/laden
function saveEmail(email) {
    if (document.getElementById('rememberMe')?.checked) {
        localStorage.setItem('savedEmail', email);
    } else {
        localStorage.removeItem('savedEmail');
    }
}

function loadSavedEmail() {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
        const emailInput = document.getElementById('emailInput');
        if (emailInput) {
            emailInput.value = savedEmail;
            // Trigger input event für Admin-Check
            emailInput.dispatchEvent(new Event('input'));
        }
    }
}

// Update der Event Listener für Login
function enhanceLoginForm() {
    const passwordInput = document.getElementById('passwordInput');
    const passwordGroup = document.getElementById('passwordGroup');
    
    if (passwordInput && passwordGroup) {
        // Füge Passwort-Stärke-Anzeige hinzu
        const indicator = createPasswordStrengthIndicator();
        passwordGroup.appendChild(indicator);
        
        // Passwort-Eingabe-Listener
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            updatePasswordStrength(password);
        });
        
        // Fokus-Events für Tipps
        passwordInput.addEventListener('focus', () => {
            document.getElementById('strengthTips').style.display = 'block';
        });
        
        passwordInput.addEventListener('blur', () => {
            setTimeout(() => {
                document.getElementById('strengthTips').style.display = 'none';
            }, 200);
        });
    }
    
    // Update Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            
            // Speichere E-Mail wenn Remember Me aktiviert
            saveEmail(email);
            
            const result = await window.api.userLogin(email, password);
            
            if (result.success) {
                showMainApp(result.user);
            } else {
                if (result.needsVerification) {
                    showEmailVerificationMessage(email);
                } else {
                    showError(result.error || 'Anmeldung fehlgeschlagen');
                }
            }
        });
    }
}

// Passwort-Stärke aktualisieren
function updatePasswordStrength(password) {
    const strength = calculatePasswordStrength(password);
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (strengthBar && strengthText) {
        // Update Bar
        strengthBar.style.width = strength.score + '%';
        strengthBar.style.backgroundColor = strength.level.color;
        
        // Update Text
        strengthText.textContent = password ? strength.level.text : 'Passwort-Stärke';
        strengthText.style.color = password ? strength.level.color : 'var(--text-secondary)';
        
        // Update Tips
        Object.keys(strength.checks).forEach(check => {
            const tip = document.querySelector(`[data-check="${check}"]`);
            if (tip) {
                const icon = tip.querySelector('i');
                if (strength.checks[check]) {
                    icon.className = 'fas fa-check';
                    tip.classList.add('valid');
                } else {
                    icon.className = 'fas fa-times';
                    tip.classList.remove('valid');
                }
            }
        });
    }
}

// CSS für Passwort-Stärke (füge zu styles.css hinzu)
const passwordStrengthStyles = `
/* Password Strength Indicator */
.password-strength-indicator {
    margin-top: 8px;
}

.strength-bar-container {
    width: 100%;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
}

.strength-bar {
    height: 100%;
    width: 0;
    background: var(--text-secondary);
    transition: all 0.3s ease;
}

.strength-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.strength-text {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
    transition: color 0.3s ease;
}

.strength-tips {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    margin-top: 4px;
}

.tip {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 6px;
    transition: all 0.2s ease;
}

.tip:last-child {
    margin-bottom: 0;
}

.tip i {
    width: 14px;
    font-size: 10px;
    color: var(--error);
}

.tip.valid {
    color: var(--text-primary);
}

.tip.valid i {
    color: var(--success);
}

/* Remember Me Checkbox */
.remember-me {
    margin-top: 15px;
    margin-bottom: 20px;
}

.remember-me input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--accent-primary);
}

.remember-me label {
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
}

/* Enhanced Modal Styles */
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: var(--bg-secondary);
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.modal-content.modal-lg {
    max-width: 700px;
}

.modal-header {
    padding: 24px 30px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    font-size: 24px;
}

.modal-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 20px;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
}

.modal-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.modal-form {
    padding: 30px;
}

.form-section {
    margin-bottom: 30px;
}

.form-section:last-child {
    margin-bottom: 0;
}

.radio-group {
    display: flex;
    gap: 20px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.radio-option input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--accent-primary);
}

.radio-option span {
    font-size: 14px;
    color: var(--text-primary);
}

.checkbox-modern {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

.checkbox-modern input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--accent-primary);
}

.checkbox-modern span {
    font-size: 14px;
    color: var(--text-primary);
    user-select: none;
}

/* Invoice Form Enhancements */
.invoice-form .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.invoice-item {
    background: var(--bg-tertiary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    position: relative;
}

.item-row {
    display: flex;
    gap: 15px;
    align-items: flex-end;
}

.item-row .form-group-modern {
    margin-bottom: 0;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-3 { flex: 3; }

.remove-item {
    background: transparent;
    border: 1px solid var(--error);
    color: var(--error);
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.remove-item:hover {
    background: var(--error);
    color: white;
}

.invoice-summary {
    background: var(--bg-tertiary);
    border-radius: 12px;
    padding: 20px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    color: var(--text-secondary);
}

.summary-row.total {
    border-top: 2px solid var(--border);
    margin-top: 10px;
    padding-top: 15px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

/* Action Buttons */
.btn-icon {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
}

.btn-icon:hover {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
}

.btn-icon.danger:hover {
    background: var(--error);
    border-color: var(--error);
}

/* Loading Spinner */
.loading-spinner {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    font-size: 18px;
}

.loading-spinner i {
    font-size: 32px;
    margin-bottom: 20px;
    color: var(--accent-primary);
}

/* Toast Notifications Modern */
.toast-modern {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 16px 24px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 2000;
    min-width: 300px;
}

.toast-modern.show {
    transform: translateX(0);
}

.toast-modern i {
    font-size: 20px;
}

.toast-success { border-left: 4px solid var(--success); }
.toast-success i { color: var(--success); }

.toast-error { border-left: 4px solid var(--error); }
.toast-error i { color: var(--error); }

.toast-info { border-left: 4px solid var(--accent-primary); }
.toast-info i { color: var(--accent-primary); }
`;

// Export Functions
window.initializeRememberMe = initializeRememberMe;
window.enhanceLoginForm = enhanceLoginForm;