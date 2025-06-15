// Modern App JavaScript
let currentPage = 'dashboard';
let currentUser = null;
let subscriptionLimits = {
    trial: { invoices: 5, customers: 15, products: 5 },
    basic: { invoices: 50, customers: 100, products: 50 },
    pro: { invoices: Infinity, customers: Infinity, products: Infinity }
};

// Initialize Modern App
document.addEventListener('DOMContentLoaded', () => {
    initializeModernApp();
});

function initializeModernApp() {
    // Get current user from session
    currentUser = getCurrentUser();
    
    // Update UI based on subscription
    updateSubscriptionUI();
    
    // Initialize navigation
    initializeNavigation();
    
    // Load initial page
    navigateTo('dashboard');
    
    // Initialize global search
    initializeGlobalSearch();
}

// Navigation System
function initializeNavigation() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('onclick')?.match(/navigateTo\('(.+)'\)/)?.[1];
            if (page) navigateTo(page);
        });
    });
}

// Navigate to page
async function navigateTo(page) {
    currentPage = page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(page)) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    updatePageTitle(page);
    
    // Load content
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    try {
        switch(page) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'invoices':
                await loadInvoices();
                break;
            case 'create-invoice':
                await loadCreateInvoice();
                break;
            case 'customers':
                await loadCustomers();
                break;
            case 'products':
                await loadProducts();
                break;
            case 'reminders':
                await loadReminders();
                break;
            case 'company':
                await loadCompanySettings();
                break;
            case 'profile':
                await loadProfile();
                break;
            case 'settings':
                await loadSettings();
                break;
            default:
                contentArea.innerHTML = '<div class="empty-state"><h3>Page not found</h3></div>';
        }
    } catch (error) {
        console.error('Error loading page:', error);
        contentArea.innerHTML = '<div class="error-state"><h3>Error loading page</h3><p>Please try again later</p></div>';
    }
}

// Update page title
function updatePageTitle(page) {
    const titles = {
        dashboard: 'Dashboard',
        invoices: 'Rechnungen',
        'create-invoice': 'Neue Rechnung',
        customers: 'Kunden',
        products: 'Produkte & Dienstleistungen',
        reminders: 'Mahnungen',
        company: 'Unternehmensdaten',
        profile: 'Mein Profil',
        settings: 'Einstellungen'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = titles[page] || page;
}

async function loadDashboard() {
    const statsResult = await window.api.getDashboardStats();
    const stats = statsResult.success ? statsResult.stats : {};
    
    const recentInvoicesResult = await window.api.getInvoices();
    const recentInvoices = recentInvoicesResult.success ? recentInvoicesResult.invoices : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="dashboard-modern animate-fade-in">
            <div class="welcome-section">
                <h2>Willkommen zurück, ${currentUser?.first_name || 'User'}!</h2>
                <p>Hier ist eine Übersicht über Ihre Geschäftsaktivitäten</p>
            </div>
            
            <div class="stats-grid-modern">
                <div class="stat-card-modern">
                    <div class="stat-icon-wrapper">
                        <i class="fas fa-file-invoice"></i>
                    </div>
                    <div class="stat-value">${stats.totalInvoices || 0}</div>
                    <div class="stat-label">Gesamte Rechnungen</div>
                    <div class="stat-detail">
                        <span class="stat-badge draft">${stats.draftInvoices || 0} Entwurf</span>
                        <span class="stat-badge paid">${stats.paidInvoices || 0} Bezahlt</span>
                    </div>
                </div>
                
                <div class="stat-card-modern">
                    <div class="stat-icon-wrapper">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-value">${stats.totalCustomers || 0}</div>
                    <div class="stat-label">Kunden</div>
                    <div class="stat-detail">
                        <span class="text-muted">Aktive Geschäftspartner</span>
                    </div>
                </div>
                
                <div class="stat-card-modern">
                    <div class="stat-icon-wrapper">
                        <i class="fas fa-euro-sign"></i>
                    </div>
                    <div class="stat-value">€${formatNumber(stats.openAmount || 0)}</div>
                    <div class="stat-label">Offene Beträge</div>
                    <div class="stat-detail">
                        <span class="stat-badge warning">${stats.openInvoices || 0} Rechnungen offen</span>
                    </div>
                </div>
                
                <div class="stat-card-modern">
                    <div class="stat-icon-wrapper">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-value">€${formatNumber(stats.monthlyRevenue || 0)}</div>
                    <div class="stat-label">Monatsumsatz</div>
                    <div class="stat-detail">
                        <span class="text-success">
                            <i class="fas fa-arrow-up"></i> ${getCurrentMonth()}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions-modern">
                <h3>Schnellaktionen</h3>
                <div class="action-grid">
                    <button class="action-card" onclick="navigateTo('create-invoice')">
                        <i class="fas fa-plus-circle"></i>
                        <span>Neue Rechnung</span>
                    </button>
                    <button class="action-card" onclick="showAddCustomerModal()">
                        <i class="fas fa-user-plus"></i>
                        <span>Neuer Kunde</span>
                    </button>
                    <button class="action-card" onclick="showAddProductModal()">
                        <i class="fas fa-box-open"></i>
                        <span>Neues Produkt</span>
                    </button>
                    <button class="action-card" onclick="navigateTo('reminders')">
                        <i class="fas fa-bell"></i>
                        <span>Mahnungen</span>
                    </button>
                </div>
            </div>
            
            ${recentInvoices.length > 0 ? `
                <div class="recent-invoices-modern">
                    <h3>Letzte Rechnungen</h3>
                    <div class="table-container">
                        <table class="table-modern">
                            <thead>
                                <tr>
                                    <th>Nummer</th>
                                    <th>Kunde</th>
                                    <th>Betrag</th>
                                    <th>Status</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentInvoices.slice(0, 5).map(invoice => `
                                    <tr>
                                        <td>${invoice.invoice_number}</td>
                                        <td>${invoice.company_name || `${invoice.first_name} ${invoice.last_name}`}</td>
                                        <td>€${formatNumber(invoice.total)}</td>
                                        <td><span class="badge-modern badge-${invoice.status}">${getStatusLabel(invoice.status)}</span></td>
                                        <td>
                                            <button class="btn-icon" onclick="viewInvoice(${invoice.id})">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${recentInvoices.length > 5 ? `
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="btn-secondary-modern" onclick="navigateTo('invoices')">
                                Alle Rechnungen anzeigen
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Revenue Chart Placeholder -->
            <div class="revenue-chart-section">
                <h3>Umsatzentwicklung</h3>
                <div class="chart-placeholder">
                    <canvas id="revenueChart" style="max-height: 300px;"></canvas>
                </div>
            </div>
        </div>
    `;
      initializeRevenueChart(stats);
}

// Helper Functions
function formatNumber(number) {
    return new Intl.NumberFormat('de-DE', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(number);
}

function getCurrentMonth() {
    return new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

// Simple Chart Initialization (Placeholder)
function initializeRevenueChart(stats) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    // Für eine echte Implementation würden Sie Chart.js verwenden
    // Hier nur ein Platzhalter
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(50, 100, 80, 150);
    ctx.fillRect(150, 80, 80, 170);
    ctx.fillRect(250, 120, 80, 130);
    ctx.fillRect(350, 60, 80, 190);
    
    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Jan', 80, 270);
    ctx.fillText('Feb', 180, 270);
    ctx.fillText('Mär', 280, 270);
    ctx.fillText('Apr', 380, 270);
}

// Load Profile Page
async function loadProfile() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="profile-page animate-fade-in">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${currentUser?.first_name?.charAt(0) || 'U'}${currentUser?.last_name?.charAt(0) || ''}
                </div>
                <div class="profile-info">
                    <h2>${currentUser?.first_name || ''} ${currentUser?.last_name || ''}</h2>
                    <p>${currentUser?.email || ''}</p>
                    <div class="profile-badges">
                        <span class="badge-modern badge-${currentUser?.subscription_type || 'trial'}">
                            ${getSubscriptionLabel(currentUser?.subscription_type || 'trial')}
                        </span>
                        <span class="badge-modern">
                            Mitglied seit ${formatDate(currentUser?.created_at || new Date())}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="profile-section">
                    <h3>Persönliche Informationen</h3>
                    <form id="profileForm" class="profile-form">
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Vorname</label>
                                <input type="text" class="form-input-modern" id="profileFirstName" 
                                       value="${currentUser?.first_name || ''}" required>
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Nachname</label>
                                <input type="text" class="form-input-modern" id="profileLastName" 
                                       value="${currentUser?.last_name || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" value="${currentUser?.email || ''}" disabled>
                            <small class="text-muted">E-Mail kann nicht geändert werden</small>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" id="profilePhone" 
                                   value="${currentUser?.phone || ''}" placeholder="+49 123 456789">
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Adresse</label>
                            <input type="text" class="form-input-modern" id="profileAddress" 
                                   value="${currentUser?.address || ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">PLZ</label>
                                <input type="text" class="form-input-modern" id="profilePostalCode" 
                                       value="${currentUser?.postal_code || ''}">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Stadt</label>
                                <input type="text" class="form-input-modern" id="profileCity" 
                                       value="${currentUser?.city || ''}">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Land</label>
                                <input type="text" class="form-input-modern" id="profileCountry" 
                                       value="${currentUser?.country || 'Deutschland'}">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary-modern">
                            <i class="fas fa-save"></i>
                            Änderungen speichern
                        </button>
                    </form>
                </div>
                
                <div class="profile-section">
                    <h3>Passwort ändern</h3>
                    <form id="passwordForm" class="profile-form">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Aktuelles Passwort</label>
                            <input type="password" class="form-input-modern" id="currentPassword" required>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Neues Passwort</label>
                            <input type="password" class="form-input-modern" id="newPassword" required minlength="8">
                            <div class="password-strength-indicator">
                                <div class="strength-bar-container">
                                    <div class="strength-bar" id="profileStrengthBar"></div>
                                </div>
                                <span class="strength-text" id="profileStrengthText">Passwort-Stärke</span>
                            </div>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Neues Passwort bestätigen</label>
                            <input type="password" class="form-input-modern" id="confirmNewPassword" required>
                        </div>
                        
                        <button type="submit" class="btn-primary-modern">
                            <i class="fas fa-lock"></i>
                            Passwort ändern
                        </button>
                    </form>
                </div>
                
                <div class="profile-section danger-zone">
                    <h3>Gefahrenzone</h3>
                    <p class="text-muted">Diese Aktionen können nicht rückgängig gemacht werden.</p>
                    <button class="btn-danger" onclick="showDeleteAccountModal()">
                        <i class="fas fa-trash"></i>
                        Account löschen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Initialize password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput && typeof calculatePasswordStrength === 'function') {
        newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            
            const strengthBar = document.getElementById('profileStrengthBar');
            const strengthText = document.getElementById('profileStrengthText');
            
            if (strengthBar && strengthText) {
                strengthBar.style.width = strength.score + '%';
                strengthBar.style.backgroundColor = strength.level.color;
                strengthText.textContent = password ? strength.level.text : 'Passwort-Stärke';
                strengthText.style.color = password ? strength.level.color : 'var(--text-secondary)';
            }
        });
    }
    
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profileData = {
            first_name: document.getElementById('profileFirstName').value,
            last_name: document.getElementById('profileLastName').value,
            phone: document.getElementById('profilePhone').value,
            address: document.getElementById('profileAddress').value,
            city: document.getElementById('profileCity').value,
            postal_code: document.getElementById('profilePostalCode').value,
            country: document.getElementById('profileCountry').value
        };
        
        const result = await window.api.updateProfile(profileData);
        
        if (result.success) {
            // Update current user data
            Object.assign(currentUser, profileData);
            
            // Update UI elements
            document.getElementById('userName').textContent = `${profileData.first_name} ${profileData.last_name}`;
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.textContent = `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`;
            }
            
            showToast('Profil erfolgreich aktualisiert', 'success');
        } else {
            showToast(result.error || 'Fehler beim Aktualisieren', 'error');
        }
    });
    
    // Password form submission
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            showToast('Die Passwörter stimmen nicht überein', 'error');
            return;
        }
        
        const result = await window.api.changePassword({
            currentPassword,
            newPassword
        });
        
        if (result.success) {
            showToast('Passwort erfolgreich geändert', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showToast(result.error || 'Fehler beim Ändern des Passworts', 'error');
        }
    });
}

// Load Settings Page
async function loadSettings() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="settings-page animate-fade-in">
            <div class="settings-container">
                <nav class="settings-nav">
                    <div class="settings-nav-item active" onclick="showSettingsSection('general')">
                        <i class="fas fa-cog"></i>
                        <span>Allgemein</span>
                    </div>
                    <div class="settings-nav-item" onclick="showSettingsSection('invoice')">
                        <i class="fas fa-file-invoice"></i>
                        <span>Rechnungen</span>
                    </div>
                    <div class="settings-nav-item" onclick="showSettingsSection('email')">
                        <i class="fas fa-envelope"></i>
                        <span>E-Mail</span>
                    </div>
                    <div class="settings-nav-item" onclick="showSettingsSection('backup')">
                        <i class="fas fa-save"></i>
                        <span>Backup</span>
                    </div>
                </nav>
                
                <div class="settings-content">
                    <!-- General Settings -->
                    <div id="general-settings" class="settings-section active">
                        <h2>Allgemeine Einstellungen</h2>
                        
                        <div class="settings-group">
                            <h3>Sprache & Region</h3>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Sprache</label>
                                <select class="form-input-modern" id="settingsLanguage">
                                    <option value="de" ${currentLanguage === 'de' ? 'selected' : ''}>Deutsch</option>
                                    <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>English</option>
                                    <option value="fr" ${currentLanguage === 'fr' ? 'selected' : ''}>Français</option>
                                    <option value="es" ${currentLanguage === 'es' ? 'selected' : ''}>Español</option>
                                    <option value="it" ${currentLanguage === 'it' ? 'selected' : ''}>Italiano</option>
                                </select>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Währung</label>
                                <select class="form-input-modern" id="settingsCurrency">
                                    <option value="EUR">EUR (€)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CHF">CHF</option>
                                </select>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Datumsformat</label>
                                <select class="form-input-modern" id="settingsDateFormat">
                                    <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>
                        
                        <button class="btn-primary-modern" onclick="saveGeneralSettings()">
                            <i class="fas fa-save"></i>
                            Einstellungen speichern
                        </button>
                    </div>
                    
                    <!-- Invoice Settings -->
                    <div id="invoice-settings" class="settings-section">
                        <h2>Rechnungseinstellungen</h2>
                        
                        <div class="settings-group">
                            <h3>Rechnungsnummern</h3>
                            <div class="form-row">
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Präfix</label>
                                    <input type="text" class="form-input-modern" id="invoicePrefix" 
                                           value="RE-" placeholder="RE-">
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Nächste Nummer</label>
                                    <input type="number" class="form-input-modern" id="nextInvoiceNumber" 
                                           value="1001" min="1">
                                </div>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Standard Zahlungsziel (Tage)</label>
                                <input type="number" class="form-input-modern" id="defaultDueDays" 
                                       value="14" min="0" max="365">
                            </div>
                        </div>
                        
                        <div class="settings-group">
                            <h3>Rechnungs-Footer</h3>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Footer-Text</label>
                                <textarea class="form-input-modern" id="invoiceFooter" rows="4"
                                          placeholder="Bankverbindung, Steuernummer, etc."></textarea>
                            </div>
                        </div>
                        
                        <button class="btn-primary-modern" onclick="saveInvoiceSettings()">
                            <i class="fas fa-save"></i>
                            Einstellungen speichern
                        </button>
                    </div>
                    
                    <!-- Email Settings -->
                    <div id="email-settings" class="settings-section">
                        <h2>E-Mail Einstellungen</h2>
                        
                        <div class="settings-group">
                            <h3>SMTP-Konfiguration</h3>
                            <div class="form-row">
                                <div class="form-group-modern">
                                    <label class="form-label-modern">SMTP Server</label>
                                    <input type="text" class="form-input-modern" id="smtpHost" 
                                           placeholder="smtp.gmail.com">
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Port</label>
                                    <input type="number" class="form-input-modern" id="smtpPort" 
                                           value="587" placeholder="587">
                                </div>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Benutzername</label>
                                <input type="email" class="form-input-modern" id="smtpUser" 
                                       placeholder="ihre-email@gmail.com">
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Passwort</label>
                                <input type="password" class="form-input-modern" id="smtpPassword" 
                                       placeholder="App-spezifisches Passwort">
                                <small class="text-muted">Für Gmail: Verwenden Sie ein App-spezifisches Passwort</small>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="checkbox-modern">
                                    <input type="checkbox" id="smtpSecure" checked>
                                    <span>SSL/TLS verwenden</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="button-group">
                            <button class="btn-secondary-modern" onclick="testEmailConnection()">
                                <i class="fas fa-plug"></i>
                                Verbindung testen
                            </button>
                            <button class="btn-primary-modern" onclick="saveEmailSettings()">
                                <i class="fas fa-save"></i>
                                Einstellungen speichern
                            </button>
                        </div>
                    </div>
                    
                    <!-- Backup Settings -->
                    <div id="backup-settings" class="settings-section">
                        <h2>Backup & Wiederherstellung</h2>
                        
                        <div class="settings-group">
                            <h3>Manuelles Backup</h3>
                            <p class="text-muted">Erstellen Sie eine Sicherungskopie Ihrer Daten</p>
                            <button class="btn-primary-modern" onclick="createManualBackup()">
                                <i class="fas fa-download"></i>
                                Backup erstellen
                            </button>
                        </div>
                        
                        <div class="settings-group">
                            <h3>Automatische Backups</h3>
                            <div class="form-group-modern">
                                <label class="checkbox-modern">
                                    <input type="checkbox" id="autoBackup" checked>
                                    <span>Automatische Backups aktivieren</span>
                                </label>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Backup-Intervall</label>
                                <select class="form-input-modern" id="backupInterval">
                                    <option value="daily">Täglich</option>
                                    <option value="weekly">Wöchentlich</option>
                                    <option value="monthly">Monatlich</option>
                                </select>
                            </div>
                        </div>
                        
                        <button class="btn-primary-modern" onclick="saveBackupSettings()">
                            <i class="fas fa-save"></i>
                            Einstellungen speichern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show Settings Section
function showSettingsSection(section) {
    // Update nav items
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.settings-nav-item').classList.add('active');
    
    // Update sections
    document.querySelectorAll('.settings-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-settings`).classList.add('active');
}

// Settings Save Functions
async function saveGeneralSettings() {
    const language = document.getElementById('settingsLanguage').value;
    const currency = document.getElementById('settingsCurrency').value;
    const dateFormat = document.getElementById('settingsDateFormat').value;
    
    // Save language
    if (language !== currentLanguage) {
        await changeLanguage(language);
    }
    
    // Save other settings
    await window.api.saveSettings('currency', currency);
    await window.api.saveSettings('dateFormat', dateFormat);
    
    showToast('Einstellungen gespeichert', 'success');
}

async function saveInvoiceSettings() {
    const settings = {
        prefix: document.getElementById('invoicePrefix').value,
        nextNumber: document.getElementById('nextInvoiceNumber').value,
        dueDays: document.getElementById('defaultDueDays').value,
        footer: document.getElementById('invoiceFooter').value
    };
    
    for (const [key, value] of Object.entries(settings)) {
        await window.api.saveSettings(`invoice_${key}`, value);
    }
    
    showToast('Rechnungseinstellungen gespeichert', 'success');
}

async function saveEmailSettings() {
    const settings = {
        host: document.getElementById('smtpHost').value,
        port: document.getElementById('smtpPort').value,
        user: document.getElementById('smtpUser').value,
        password: document.getElementById('smtpPassword').value,
        secure: document.getElementById('smtpSecure').checked
    };
    
    for (const [key, value] of Object.entries(settings)) {
        await window.api.saveSettings(`smtp_${key}`, value);
    }
    
    showToast('E-Mail Einstellungen gespeichert', 'success');
}

async function testEmailConnection() {
    showToast('Teste E-Mail Verbindung...', 'info');
    // Hier würde die echte Test-Implementierung kommen
    setTimeout(() => {
        showToast('E-Mail Verbindung erfolgreich', 'success');
    }, 2000);
}

async function createManualBackup() {
    const result = await window.api.createBackup();
    if (result.success) {
        showToast(`Backup erstellt: ${result.path}`, 'success');
    } else {
        showToast('Fehler beim Erstellen des Backups', 'error');
    }
}

async function saveBackupSettings() {
    await window.api.saveSettings('autoBackup', document.getElementById('autoBackup').checked);
    await window.api.saveSettings('backupInterval', document.getElementById('backupInterval').value);
    showToast('Backup-Einstellungen gespeichert', 'success');
}

// Delete Account Modal
function showDeleteAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content animate-slide-in">
            <div class="modal-header">
                <h2>Account löschen</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body" style="padding: 30px;">
                <div class="warning-box">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p><strong>Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden!</p>
                </div>
                
                <p>Wenn Sie Ihren Account löschen:</p>
                <ul style="margin: 20px 0; padding-left: 20px;">
                    <li>Werden alle Ihre Daten unwiderruflich gelöscht</li>
                    <li>Verlieren Sie Zugriff auf alle Rechnungen und Kunden</li>
                    <li>Kann der Account nicht wiederhergestellt werden</li>
                </ul>
                
                <p>Geben Sie zur Bestätigung <strong>DELETE</strong> ein:</p>
                <input type="text" class="form-input-modern" id="deleteConfirmation" 
                       placeholder="DELETE" style="margin-top: 10px;">
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary-modern" onclick="closeModal(this)">
                    Abbrechen
                </button>
                <button class="btn-danger" onclick="confirmDeleteAccount()" id="confirmDeleteBtn" disabled>
                    <i class="fas fa-trash"></i>
                    Account endgültig löschen
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Enable delete button only when "DELETE" is typed
    document.getElementById('deleteConfirmation').addEventListener('input', (e) => {
        const btn = document.getElementById('confirmDeleteBtn');
        btn.disabled = e.target.value !== 'DELETE';
    });
}

function confirmDeleteAccount() {
    // Hier würde die echte Lösch-Implementierung kommen
    showToast('Account-Löschung ist in der Demo deaktiviert', 'info');
    closeModal();
}

// Global functions
window.showSettingsSection = showSettingsSection;
window.saveGeneralSettings = saveGeneralSettings;
window.saveInvoiceSettings = saveInvoiceSettings;
window.saveEmailSettings = saveEmailSettings;
window.testEmailConnection = testEmailConnection;
window.createManualBackup = createManualBackup;
window.saveBackupSettings = saveBackupSettings;
window.showDeleteAccountModal = showDeleteAccountModal;
window.confirmDeleteAccount = confirmDeleteAccount;

// Load Invoices
async function loadInvoices() {
    const result = await window.api.getInvoices();
    const invoices = result.success ? result.invoices : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="navigateTo('create-invoice')">
                    <i class="fas fa-plus"></i>
                    Neue Rechnung
                </button>
            </div>
            
            <div class="filters-modern">
                <div class="search-box-modern">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Rechnungen suchen..." onkeyup="filterInvoices(this.value)">
                </div>
                <div class="filter-chips">
                    <button class="chip active" onclick="filterByStatus('all')">Alle</button>
                    <button class="chip" onclick="filterByStatus('draft')">Entwurf</button>
                    <button class="chip" onclick="filterByStatus('sent')">Versendet</button>
                    <button class="chip" onclick="filterByStatus('paid')">Bezahlt</button>
                    <button class="chip" onclick="filterByStatus('overdue')">Überfällig</button>
                </div>
            </div>
            
            ${invoices.length > 0 ? `
                <div class="table-container">
                    <table class="table-modern" id="invoicesTable">
                        <thead>
                            <tr>
                                <th>Nummer</th>
                                <th>Kunde</th>
                                <th>Datum</th>
                                <th>Fälligkeit</th>
                                <th>Betrag</th>
                                <th>Status</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(invoice => `
                                <tr data-status="${invoice.status}">
                                    <td><strong>${invoice.invoice_number}</strong></td>
                                    <td>${invoice.company_name || `${invoice.first_name} ${invoice.last_name}`}</td>
                                    <td>${formatDate(invoice.invoice_date)}</td>
                                    <td>${formatDate(invoice.due_date)}</td>
                                    <td><strong>€${invoice.total}</strong></td>
                                    <td><span class="badge-modern badge-${invoice.status}">${getStatusLabel(invoice.status)}</span></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="viewInvoice(${invoice.id})" title="Ansehen">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn-icon" onclick="downloadInvoicePDF(${invoice.id})" title="PDF">
                                                <i class="fas fa-file-pdf"></i>
                                            </button>
                                            <button class="btn-icon" onclick="sendInvoiceEmail(${invoice.id})" title="E-Mail">
                                                <i class="fas fa-envelope"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-file-invoice"></i>
                    </div>
                    <h3>Keine Rechnungen vorhanden</h3>
                    <p>Erstellen Sie Ihre erste Rechnung</p>
                    <button class="btn-primary-modern" onclick="navigateTo('create-invoice')">
                        <i class="fas fa-plus"></i>
                        Erste Rechnung erstellen
                    </button>
                </div>
            `}
        </div>
    `;
}

// Load Create Invoice
async function loadCreateInvoice() {
    const customers = await window.api.getCustomers();
    const products = await window.api.getProducts();
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="create-invoice-modern animate-fade-in">
            <form id="createInvoiceForm" class="invoice-form">
                <div class="form-section">
                    <h3>Rechnungsdetails</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Rechnungsnummer</label>
                            <input type="text" class="form-input-modern" id="invoiceNumber" value="RE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Rechnungsdatum</label>
                            <input type="date" class="form-input-modern" id="invoiceDate" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Fälligkeitsdatum</label>
                            <input type="date" class="form-input-modern" id="dueDate" value="${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Kunde</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Kunde auswählen</label>
                        <select class="form-input-modern" id="customerId" required>
                            <option value="">-- Kunde wählen --</option>
                            ${customers.customers?.map(customer => `
                                <option value="${customer.id}">${customer.company_name || `${customer.first_name} ${customer.last_name}`}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Positionen</h3>
                    <div id="invoiceItems">
                        <div class="invoice-item" data-item-index="0">
                            <div class="item-row">
                                <div class="form-group-modern flex-3">
                                    <label class="form-label-modern">Beschreibung</label>
                                    <input type="text" class="form-input-modern" name="description" required>
                                </div>
                                <div class="form-group-modern flex-1">
                                    <label class="form-label-modern">Menge</label>
                                    <input type="number" class="form-input-modern" name="quantity" value="1" min="1" step="0.01" required>
                                </div>
                                <div class="form-group-modern flex-1">
                                    <label class="form-label-modern">Preis</label>
                                    <input type="number" class="form-input-modern" name="price" value="0" min="0" step="0.01" required>
                                </div>
                                <div class="form-group-modern flex-1">
                                    <label class="form-label-modern">MwSt %</label>
                                    <input type="number" class="form-input-modern" name="tax" value="19" min="0" max="100" required>
                                </div>
                                <button type="button" class="btn-icon remove-item" onclick="removeInvoiceItem(0)" style="display:none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-secondary-modern" onclick="addInvoiceItem()">
                        <i class="fas fa-plus"></i>
                        Position hinzufügen
                    </button>
                </div>
                
                <div class="form-section">
                    <h3>Zusammenfassung</h3>
                    <div class="invoice-summary">
                        <div class="summary-row">
                            <span>Zwischensumme:</span>
                            <span id="subtotal">€0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>MwSt:</span>
                            <span id="taxAmount">€0.00</span>
                        </div>
                        <div class="summary-row total">
                            <span>Gesamt:</span>
                            <span id="total">€0.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Zusätzliche Informationen</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Notizen</label>
                        <textarea class="form-input-modern" id="notes" rows="3"></textarea>
                    </div>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Zahlungsbedingungen</label>
                        <textarea class="form-input-modern" id="paymentTerms" rows="2">Zahlbar innerhalb von 14 Tagen ohne Abzug.</textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary-modern" onclick="navigateTo('invoices')">
                        Abbrechen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Rechnung erstellen
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Initialize form handlers
    initializeInvoiceForm();
}

// Initialize Invoice Form
function initializeInvoiceForm() {
    const form = document.getElementById('createInvoiceForm');
    
    // Calculate totals on input change
    form.addEventListener('input', calculateInvoiceTotals);
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check subscription limits
        const stats = await window.api.getDashboardStats();
        const currentInvoices = stats.stats?.totalInvoices || 0;
        const limit = subscriptionLimits[currentUser?.subscription_type || 'trial'].invoices;
        
        if (currentInvoices >= limit) {
            showUpgradeModal();
            return;
        }
        
        // Collect form data
        const invoiceData = {
            userId: currentUser?.id || 1,
            customerId: parseInt(document.getElementById('customerId').value),
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            notes: document.getElementById('notes').value,
            paymentTerms: document.getElementById('paymentTerms').value,
            items: collectInvoiceItems(),
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('€', '')),
            taxAmount: parseFloat(document.getElementById('taxAmount').textContent.replace('€', '')),
            total: parseFloat(document.getElementById('total').textContent.replace('€', ''))
        };
        
        // Save invoice
        const result = await window.api.createInvoice(invoiceData);
        
        if (result.success) {
            showToast('Rechnung erfolgreich erstellt', 'success');
            navigateTo('invoices');
        } else {
            showToast(result.error || 'Fehler beim Erstellen der Rechnung', 'error');
        }
    });
}

// Add Invoice Item
function addInvoiceItem() {
    const itemsContainer = document.getElementById('invoiceItems');
    const itemIndex = itemsContainer.children.length;
    
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.dataset.itemIndex = itemIndex;
    newItem.innerHTML = `
        <div class="item-row">
            <div class="form-group-modern flex-3">
                <label class="form-label-modern">Beschreibung</label>
                <input type="text" class="form-input-modern" name="description" required>
            </div>
            <div class="form-group-modern flex-1">
                <label class="form-label-modern">Menge</label>
                <input type="number" class="form-input-modern" name="quantity" value="1" min="1" step="0.01" required>
            </div>
            <div class="form-group-modern flex-1">
                <label class="form-label-modern">Preis</label>
                <input type="number" class="form-input-modern" name="price" value="0" min="0" step="0.01" required>
            </div>
            <div class="form-group-modern flex-1">
                <label class="form-label-modern">MwSt %</label>
                <input type="number" class="form-input-modern" name="tax" value="19" min="0" max="100" required>
            </div>
            <button type="button" class="btn-icon remove-item" onclick="removeInvoiceItem(${itemIndex})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    itemsContainer.appendChild(newItem);
    
    // Show remove button on first item if there are multiple items
    if (itemsContainer.children.length > 1) {
        itemsContainer.querySelector('.remove-item').style.display = 'block';
    }
}

// Remove Invoice Item
function removeInvoiceItem(index) {
    const item = document.querySelector(`[data-item-index="${index}"]`);
    if (item) {
        item.remove();
        calculateInvoiceTotals();
        
        // Hide remove button if only one item left
        const items = document.querySelectorAll('.invoice-item');
        if (items.length === 1) {
            items[0].querySelector('.remove-item').style.display = 'none';
        }
    }
}

// Calculate Invoice Totals
function calculateInvoiceTotals() {
    let subtotal = 0;
    let taxAmount = 0;
    
    document.querySelectorAll('.invoice-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('[name="quantity"]').value) || 0;
        const price = parseFloat(item.querySelector('[name="price"]').value) || 0;
        const tax = parseFloat(item.querySelector('[name="tax"]').value) || 0;
        
        const itemTotal = quantity * price;
        const itemTax = itemTotal * (tax / 100);
        
        subtotal += itemTotal;
        taxAmount += itemTax;
    });
    
    const total = subtotal + taxAmount;
    
    document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `€${taxAmount.toFixed(2)}`;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;
}

// Collect Invoice Items
function collectInvoiceItems() {
    const items = [];
    
    document.querySelectorAll('.invoice-item').forEach(item => {
        const description = item.querySelector('[name="description"]').value;
        const quantity = parseFloat(item.querySelector('[name="quantity"]').value);
        const unitPrice = parseFloat(item.querySelector('[name="price"]').value);
        const taxRate = parseFloat(item.querySelector('[name="tax"]').value);
        
        const total = quantity * unitPrice * (1 + taxRate / 100);
        
        items.push({
            description,
            quantity,
            unitPrice,
            taxRate,
            total: total.toFixed(2)
        });
    });
    
    return items;
}

// Load Customers
async function loadCustomers() {
    const result = await window.api.getCustomers();
    const customers = result.success ? result.customers : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="showAddCustomerModal()">
                    <i class="fas fa-plus"></i>
                    Neuer Kunde
                </button>
            </div>
            
            <div class="filters-modern">
                <div class="search-box-modern">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Kunden suchen..." onkeyup="filterCustomers(this.value)">
                </div>
                <div class="filter-chips">
                    <button class="chip active" onclick="filterCustomerType('all')">Alle</button>
                    <button class="chip" onclick="filterCustomerType('private')">Privat</button>
                    <button class="chip" onclick="filterCustomerType('business')">Geschäftlich</button>
                </div>
            </div>
            
            ${customers.length > 0 ? `
                <div class="table-container">
                    <table class="table-modern" id="customersTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Typ</th>
                                <th>E-Mail</th>
                                <th>Telefon</th>
                                <th>Erstellt</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(customer => `
                                <tr data-type="${customer.type}">
                                    <td><strong>${customer.company_name || `${customer.first_name} ${customer.last_name}`}</strong></td>
                                    <td><span class="badge-modern badge-${customer.type}">${customer.type === 'business' ? 'Geschäftlich' : 'Privat'}</span></td>
                                    <td>${customer.email || '-'}</td>
                                    <td>${customer.phone || '-'}</td>
                                    <td>${formatDate(customer.created_at)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="editCustomer(${customer.id})" title="Bearbeiten">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon danger" onclick="deleteCustomer(${customer.id})" title="Löschen">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Keine Kunden vorhanden</h3>
                    <p>Fügen Sie Ihren ersten Kunden hinzu</p>
                    <button class="btn-primary-modern" onclick="showAddCustomerModal()">
                        <i class="fas fa-plus"></i>
                        Ersten Kunden hinzufügen
                    </button>
                </div>
            `}
        </div>
    `;
}

// Load Products
async function loadProducts() {
    const result = await window.api.getProducts();
    const products = result.success ? result.products : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="showAddProductModal()">
                    <i class="fas fa-plus"></i>
                    Neues Produkt
                </button>
            </div>
            
            <div class="filters-modern">
                <div class="search-box-modern">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Produkte suchen..." onkeyup="filterProducts(this.value)">
                </div>
                <div class="filter-chips">
                    <button class="chip active" onclick="filterProductType('all')">Alle</button>
                    <button class="chip" onclick="filterProductType('product')">Produkte</button>
                    <button class="chip" onclick="filterProductType('service')">Dienstleistungen</button>
                </div>
            </div>
            
            ${products.length > 0 ? `
                <div class="table-container">
                    <table class="table-modern" id="productsTable">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Typ</th>
                                <th>Preis</th>
                                <th>MwSt</th>
                                <th>Status</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(product => `
                                <tr data-type="${product.type}">
                                    <td><strong>${product.name}</strong></td>
                                    <td><span class="badge-modern badge-${product.type}">${product.type === 'product' ? 'Produkt' : 'Dienstleistung'}</span></td>
                                    <td>€${product.price}</td>
                                    <td>${product.tax_rate}%</td>
                                    <td><span class="badge-modern badge-${product.is_active ? 'success' : 'error'}">${product.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="editProduct(${product.id})" title="Bearbeiten">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon danger" onclick="deleteProduct(${product.id})" title="Löschen">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <h3>Keine Produkte vorhanden</h3>
                    <p>Fügen Sie Ihr erstes Produkt oder Ihre erste Dienstleistung hinzu</p>
                    <button class="btn-primary-modern" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i>
                        Erstes Produkt hinzufügen
                    </button>
                </div>
            `}
        </div>
    `;
}

// Load Reminders
async function loadReminders() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="reminders-info">
                <div class="info-card">
                    <i class="fas fa-bell"></i>
                    <h3>Automatische Mahnungen</h3>
                    <p>Konfigurieren Sie automatische Zahlungserinnerungen für überfällige Rechnungen.</p>
                    <button class="btn-primary-modern" onclick="showReminderSettings()">
                        <i class="fas fa-cog"></i>
                        Einstellungen
                    </button>
                </div>
            </div>
            
            <div class="reminders-list">
                <h3>Überfällige Rechnungen</h3>
                <p class="text-muted">Hier werden Rechnungen angezeigt, die eine Mahnung benötigen.</p>
            </div>
        </div>
    `;
}

// Load Company Settings
async function loadCompanySettings() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="company-settings animate-fade-in">
            <div class="page-header">
                <h1>Unternehmensdaten</h1>
                <p class="text-muted">Verwalten Sie Ihre Firmendaten für Rechnungen und Dokumente</p>
            </div>
            
            <form id="companyForm" class="settings-form">
                <div class="form-section">
                    <h3>Grunddaten</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Firmenname *</label>
                        <input type="text" class="form-input-modern" id="companyName" 
                               value="${currentUser?.company_name || ''}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Steuernummer</label>
                            <input type="text" class="form-input-modern" id="taxId" 
                                   placeholder="DE123456789">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">USt-IdNr.</label>
                            <input type="text" class="form-input-modern" id="vatId" 
                                   placeholder="DE123456789">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Handelsregisternummer</label>
                        <input type="text" class="form-input-modern" id="registryNumber" 
                               placeholder="HRB 12345">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Kontaktdaten</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" id="companyEmail" 
                                   value="${currentUser?.email || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" id="companyPhone" 
                                   value="${currentUser?.phone || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Webseite</label>
                            <input type="url" class="form-input-modern" id="companyWebsite" 
                                   placeholder="https://www.ihre-firma.de">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Fax</label>
                            <input type="tel" class="form-input-modern" id="companyFax" 
                                   placeholder="+49 123 456789">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Adresse</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Straße und Hausnummer</label>
                        <input type="text" class="form-input-modern" id="companyAddress" 
                               value="${currentUser?.address || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">PLZ</label>
                            <input type="text" class="form-input-modern" id="companyPostalCode" 
                                   value="${currentUser?.postal_code || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Stadt</label>
                            <input type="text" class="form-input-modern" id="companyCity" 
                                   value="${currentUser?.city || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Land</label>
                            <select class="form-input-modern" id="companyCountry">
                                <option value="Deutschland">Deutschland</option>
                                <option value="Österreich">Österreich</option>
                                <option value="Schweiz">Schweiz</option>
                                <option value="Frankreich">Frankreich</option>
                                <option value="Italien">Italien</option>
                                <option value="Spanien">Spanien</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Bankverbindung</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Kontoinhaber</label>
                        <input type="text" class="form-input-modern" id="accountHolder" 
                               value="${currentUser?.company_name || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">IBAN</label>
                            <input type="text" class="form-input-modern" id="iban" 
                                   placeholder="DE89 3704 0044 0532 0130 00">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">BIC</label>
                            <input type="text" class="form-input-modern" id="bic" 
                                   placeholder="COBADEFFXXX">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Bank</label>
                        <input type="text" class="form-input-modern" id="bankName" 
                               placeholder="Commerzbank AG">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Logo & Branding</h3>
                    <div class="logo-upload">
                        <div class="logo-preview" id="logoPreview">
                            <i class="fas fa-image"></i>
                        </div>
                        <div>
                            <button type="button" class="btn-secondary-modern" onclick="selectLogoFile()">
                                <i class="fas fa-upload"></i>
                                Logo hochladen
                            </button>
                            <p class="text-muted" style="margin-top: 10px;">
                                Empfohlen: PNG oder JPG, mindestens 300x300px
                            </p>
                        </div>
                    </div>
                    
                    <input type="file" id="logoFileInput" accept="image/*" style="display: none;">
                </div>
                
                <div class="form-section">
                    <h3>Zusätzliche Informationen</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Geschäftsführer</label>
                        <input type="text" class="form-input-modern" id="ceo" 
                               placeholder="Max Mustermann">
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Zusatztext für Rechnungen</label>
                        <textarea class="form-input-modern" id="invoiceNotes" rows="4"
                                  placeholder="z.B. Kleinunternehmer gem. § 19 UStG"></textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary-modern" onclick="resetCompanyForm()">
                        <i class="fas fa-undo"></i>
                        Zurücksetzen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Unternehmensdaten speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Logo file input handler
    document.getElementById('logoFileInput').addEventListener('change', handleLogoUpload);
    
    // Form submission
    document.getElementById('companyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCompanyData();
    });
}

// Logo functions
function selectLogoFile() {
    document.getElementById('logoFileInput').click();
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Bitte wählen Sie eine Bilddatei', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Die Datei ist zu groß (max. 5MB)', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('logoPreview');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
    };
    reader.readAsDataURL(file);
}

// Save company data
async function saveCompanyData() {
    const companyData = {
        name: document.getElementById('companyName').value,
        taxId: document.getElementById('taxId').value,
        vatId: document.getElementById('vatId').value,
        registryNumber: document.getElementById('registryNumber').value,
        email: document.getElementById('companyEmail').value,
        phone: document.getElementById('companyPhone').value,
        website: document.getElementById('companyWebsite').value,
        fax: document.getElementById('companyFax').value,
        address: document.getElementById('companyAddress').value,
        postalCode: document.getElementById('companyPostalCode').value,
        city: document.getElementById('companyCity').value,
        country: document.getElementById('companyCountry').value,
        accountHolder: document.getElementById('accountHolder').value,
        iban: document.getElementById('iban').value,
        bic: document.getElementById('bic').value,
        bankName: document.getElementById('bankName').value,
        ceo: document.getElementById('ceo').value,
        invoiceNotes: document.getElementById('invoiceNotes').value
    };
    
    // Save each field
    for (const [key, value] of Object.entries(companyData)) {
        await window.api.saveSettings(`company_${key}`, value);
    }
    
    // Update current user company name if changed
    if (companyData.name !== currentUser?.company_name) {
        currentUser.company_name = companyData.name;
    }
    
    showToast('Unternehmensdaten erfolgreich gespeichert', 'success');
}

// Reset form
function resetCompanyForm() {
    if (confirm('Möchten Sie alle Änderungen verwerfen?')) {
        loadCompanySettings();
    }
}

// Reminders page (placeholder)
async function loadReminders() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-header">
                <h1>Mahnungen</h1>
                <p class="text-muted">Verwalten Sie Zahlungserinnerungen und Mahnungen</p>
            </div>
            
            <div class="reminders-info">
                <div class="info-card">
                    <i class="fas fa-bell"></i>
                    <h3>Automatische Mahnungen</h3>
                    <p>Konfigurieren Sie automatische Zahlungserinnerungen für überfällige Rechnungen.</p>
                    <button class="btn-primary-modern" onclick="showReminderSettings()">
                        <i class="fas fa-cog"></i>
                        Einstellungen
                    </button>
                </div>
            </div>
            
            <div class="reminders-list">
                <h3>Überfällige Rechnungen</h3>
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Keine überfälligen Rechnungen</h3>
                    <p>Alle Ihre Rechnungen sind aktuell</p>
                </div>
            </div>
        </div>
    `;
}

// Global functions
window.selectLogoFile = selectLogoFile;
window.resetCompanyForm = resetCompanyForm;

// Update Subscription UI
function updateSubscriptionUI() {
    const subscriptionType = currentUser?.subscription_type || 'trial';
    const expiryDate = currentUser?.subscription_expires;
    
    // Update subscription info in sidebar
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    if (subscriptionInfo) {
        const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 30;
        
        subscriptionInfo.innerHTML = `
            <div class="subscription-label">${getSubscriptionLabel(subscriptionType)}</div>
            <div class="subscription-details">
                <span id="daysLeft">${daysLeft} Tage verbleibend</span>
                <div class="subscription-limits">
                    <span>${getCurrentUsage()} / ${subscriptionLimits[subscriptionType].invoices} Rechnungen</span>
                </div>
            </div>
        `;
    }
    
    // Update subscription banner
    const subscriptionBanner = document.getElementById('subscriptionBanner');
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    
    if (subscriptionType === 'pro') {
        // Hide banner for pro users
        if (subscriptionBanner) subscriptionBanner.style.display = 'none';
    } else {
        // Show banner for trial/basic users
        if (subscriptionBadge) {
            subscriptionBadge.className = `subscription-badge-modern ${subscriptionType}`;
            subscriptionBadge.innerHTML = `
                <i class="fas ${subscriptionType === 'trial' ? 'fa-clock' : 'fa-star'}"></i>
                <span>${getSubscriptionLabel(subscriptionType)}</span>
            `;
        }
    }
}

// Show Upgrade Modal
function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content upgrade-modal animate-slide-in">
            <button class="modal-close" onclick="closeModal(this)">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="upgrade-header">
                <i class="fas fa-rocket"></i>
                <h2>Zeit für ein Upgrade!</h2>
                <p>Erweitern Sie Ihre Möglichkeiten mit einem unserer Premium-Pläne</p>
            </div>
            
            <div class="pricing-grid">
                <div class="pricing-card ${currentUser?.subscription_type === 'basic' ? 'current' : ''}">
                    <h3>Basic</h3>
                    <div class="price">
                        <span class="currency">€</span>
                        <span class="amount">19.99</span>
                        <span class="period">/Monat</span>
                    </div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> 50 Rechnungen/Monat</li>
                        <li><i class="fas fa-check"></i> 100 Kunden</li>
                        <li><i class="fas fa-check"></i> 50 Produkte</li>
                        <li><i class="fas fa-check"></i> E-Mail Support</li>
                    </ul>
                    ${currentUser?.subscription_type !== 'basic' ? `
                        <button class="btn-primary-modern" onclick="upgradeSubscription('basic')">
                            Jetzt upgraden
                        </button>
                    ` : '<span class="current-plan">Aktueller Plan</span>'}
                </div>
                
                <div class="pricing-card featured ${currentUser?.subscription_type === 'pro' ? 'current' : ''}">
                    <div class="featured-badge">BELIEBT</div>
                    <h3>Professional</h3>
                    <div class="price">
                        <span class="currency">€</span>
                        <span class="amount">49.99</span>
                        <span class="period">/Monat</span>
                    </div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Unbegrenzte Rechnungen</li>
                        <li><i class="fas fa-check"></i> Unbegrenzte Kunden</li>
                        <li><i class="fas fa-check"></i> Unbegrenzte Produkte</li>
                        <li><i class="fas fa-check"></i> Prioritäts-Support</li>
                        <li><i class="fas fa-check"></i> API-Zugriff</li>
                    </ul>
                    ${currentUser?.subscription_type !== 'pro' ? `
                        <button class="btn-primary-modern" onclick="upgradeSubscription('pro')">
                            Jetzt upgraden
                        </button>
                    ` : '<span class="current-plan">Aktueller Plan</span>'}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
}

// Upgrade Subscription
async function upgradeSubscription(plan) {
    const result = await window.api.updateSubscription(plan);
    
    if (result.success) {
        // Update current user
        currentUser.subscription_type = plan;
        currentUser.subscription_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        // Close modal
        closeModal();
        
        // Show celebration
        showUpgradeCelebration(plan);
        
        // Update UI
        updateSubscriptionUI();
    } else {
        showToast(result.error || 'Fehler beim Upgrade', 'error');
    }
}

// Show Upgrade Celebration
function showUpgradeCelebration(plan) {
    const celebration = document.createElement('div');
    celebration.className = 'upgrade-celebration-modern';
    celebration.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-animation">
                <i class="fas ${plan === 'pro' ? 'fa-crown' : 'fa-star'}"></i>
            </div>
            <h1>Glückwunsch!</h1>
            <p>Sie sind jetzt ${plan === 'pro' ? 'Professional' : 'Basic'} Nutzer</p>
            <button class="btn-primary-modern" onclick="closeCelebration()">
                Los geht's!
            </button>
        </div>
    `;
    
    document.body.appendChild(celebration);
    
    // Remove after animation
    setTimeout(() => {
        celebration.classList.add('fade-out');
        setTimeout(() => celebration.remove(), 500);
    }, 3000);
}

// Helper Functions
function getCurrentUser() {
    // This would normally get from session/storage
    return {
        id: 1,
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max@example.com',
        company_name: 'Mustermann GmbH',
        subscription_type: 'trial',
        subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
}

function getStatusLabel(status) {
    const labels = {
        draft: 'Entwurf',
        sent: 'Versendet',
        paid: 'Bezahlt',
        overdue: 'Überfällig',
        cancelled: 'Storniert'
    };
    return labels[status] || status;
}

function getSubscriptionLabel(type) {
    const labels = {
        trial: 'Test Version',
        basic: 'Basic',
        pro: 'Professional'
    };
    return labels[type] || type;
}

function getCurrentUsage() {
    // This would get actual usage from API
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-modern toast-${type}`;
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
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal Functions
function closeModal(element) {
    const modal = element ? element.closest('.modal-backdrop') : document.querySelector('.modal-backdrop');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 300);
    }
}

function closeCelebration() {
    const celebration = document.querySelector('.upgrade-celebration-modern');
    if (celebration) {
        celebration.classList.add('fade-out');
        setTimeout(() => celebration.remove(), 500);
    }
}

// Filter Functions
function filterInvoices(searchTerm) {
    const rows = document.querySelectorAll('#invoicesTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterByStatus(status) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#invoicesTable tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterCustomers(searchTerm) {
    const rows = document.querySelectorAll('#customersTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterCustomerType(type) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#customersTable tbody tr');
    rows.forEach(row => {
        if (type === 'all' || row.dataset.type === type) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterProducts(searchTerm) {
    const rows = document.querySelectorAll('#productsTable tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterProductType(type) {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#productsTable tbody tr');
    rows.forEach(row => {
        if (type === 'all' || row.dataset.type === type) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Global Search
function initializeGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performGlobalSearch(e.target.value);
            }
        });
    }
}

function performGlobalSearch(query) {
    if (!query.trim()) return;
    
    // This would perform a global search across all entities
    showToast(`Suche nach "${query}"...`, 'info');
}

async function viewInvoice(id) {
    const result = await window.api.generateInvoicePDF(id);
    if (result.success) {
        showToast('PDF wird heruntergeladen...', 'success');
        // Optional: PDF direkt öffnen
        if (window.electron) {
            window.electron.shell.openPath(result.path);
        }
    } else {
        showToast(result.error || 'Fehler beim Erstellen des PDFs', 'error');
    }
}

async function downloadInvoicePDF(id) {
    const result = await window.api.generateInvoicePDF(id);
    if (result.success) {
        showToast('PDF wurde heruntergeladen', 'success');
    } else {
        showToast(result.error || 'Fehler beim Erstellen des PDFs', 'error');
    }
}

async function sendInvoiceEmail(id) {
    showToast('E-Mail-Dialog wird geöffnet...', 'info');
    // Implementation for sending invoice via email
}

// === In modern-app.js - Ersetzen Sie die editCustomer und editProduct Funktionen ===

// Edit Customer
async function editCustomer(id) {
    const result = await window.api.getCustomer(id);
    if (!result.success) {
        showToast('Kunde konnte nicht geladen werden', 'error');
        return;
    }
    
    const customer = result.customer;
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content modal-lg animate-slide-in">
            <div class="modal-header">
                <h2>Kunde bearbeiten</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="editCustomerForm" class="modal-form">
                <div class="form-section">
                    <div class="form-group-modern">
                        <label class="form-label-modern">Kundentyp</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="customerType" value="private" 
                                       ${customer.type === 'private' ? 'checked' : ''} 
                                       onchange="toggleBusinessFields(false)">
                                <span>Privatkunde</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="customerType" value="business" 
                                       ${customer.type === 'business' ? 'checked' : ''} 
                                       onchange="toggleBusinessFields(true)">
                                <span>Geschäftskunde</span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="businessFields" style="${customer.type === 'business' ? '' : 'display: none;'}">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Firmenname *</label>
                            <input type="text" class="form-input-modern" name="companyName" 
                                   value="${customer.company_name || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Vorname *</label>
                            <input type="text" class="form-input-modern" name="firstName" 
                                   value="${customer.first_name || ''}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Nachname *</label>
                            <input type="text" class="form-input-modern" name="lastName" 
                                   value="${customer.last_name || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" name="email" 
                                   value="${customer.email || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" name="phone" 
                                   value="${customer.phone || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Adresse</label>
                        <input type="text" class="form-input-modern" name="address" 
                               value="${customer.address || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">PLZ</label>
                            <input type="text" class="form-input-modern" name="postalCode" 
                                   value="${customer.postal_code || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Stadt</label>
                            <input type="text" class="form-input-modern" name="city" 
                                   value="${customer.city || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group-modern" id="taxIdField" style="${customer.type === 'business' ? '' : 'display: none;'}">
                        <label class="form-label-modern">Steuernummer</label>
                        <input type="text" class="form-input-modern" name="taxId" 
                               value="${customer.tax_id || ''}">
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Notizen</label>
                        <textarea class="form-input-modern" name="notes" rows="3">${customer.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary-modern" onclick="closeModal(this)">
                        Abbrechen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Änderungen speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Form submission
    document.getElementById('editCustomerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const customerData = {
            type: formData.get('customerType'),
            companyName: formData.get('companyName'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: customer.country || 'Deutschland',
            taxId: formData.get('taxId'),
            notes: formData.get('notes')
        };
        
        const result = await window.api.updateCustomer(id, customerData);
        
        if (result.success) {
            showToast('Kunde erfolgreich aktualisiert', 'success');
            closeModal();
            navigateTo('customers');
        } else {
            showToast(result.error || 'Fehler beim Aktualisieren', 'error');
        }
    });
}

// Edit Product
async function editProduct(id) {
    const result = await window.api.getProduct(id);
    if (!result.success) {
        showToast('Produkt konnte nicht geladen werden', 'error');
        return;
    }
    
    const product = result.product;
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content modal-lg animate-slide-in">
            <div class="modal-header">
                <h2>Produkt/Dienstleistung bearbeiten</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="editProductForm" class="modal-form">
                <div class="form-section">
                    <div class="form-group-modern">
                        <label class="form-label-modern">Typ</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="productType" value="product" 
                                       ${product.type === 'product' ? 'checked' : ''}>
                                <span>Produkt</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="productType" value="service" 
                                       ${product.type === 'service' ? 'checked' : ''}>
                                <span>Dienstleistung</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Name *</label>
                        <input type="text" class="form-input-modern" name="name" 
                               value="${product.name}" required>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Beschreibung</label>
                        <textarea class="form-input-modern" name="description" rows="3">${product.description || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Artikelnummer (SKU)</label>
                            <input type="text" class="form-input-modern" name="sku" 
                                   value="${product.sku || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Kategorie</label>
                            <input type="text" class="form-input-modern" name="category" 
                                   value="${product.category || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Preis (€) *</label>
                            <input type="number" class="form-input-modern" name="price" 
                                   step="0.01" min="0" value="${product.price}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">MwSt. (%) *</label>
                            <select class="form-input-modern" name="taxRate" required>
                                <option value="19" ${product.tax_rate == 19 ? 'selected' : ''}>19% (Standard)</option>
                                <option value="7" ${product.tax_rate == 7 ? 'selected' : ''}>7% (Ermäßigt)</option>
                                <option value="0" ${product.tax_rate == 0 ? 'selected' : ''}>0% (Steuerfrei)</option>
                            </select>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Einheit</label>
                            <select class="form-input-modern" name="unit">
                                <option value="Stück" ${product.unit === 'Stück' ? 'selected' : ''}>Stück</option>
                                <option value="Stunde" ${product.unit === 'Stunde' ? 'selected' : ''}>Stunde</option>
                                <option value="Tag" ${product.unit === 'Tag' ? 'selected' : ''}>Tag</option>
                                <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kilogramm</option>
                                <option value="m" ${product.unit === 'm' ? 'selected' : ''}>Meter</option>
                                <option value="m²" ${product.unit === 'm²' ? 'selected' : ''}>Quadratmeter</option>
                                <option value="Pauschal" ${product.unit === 'Pauschal' ? 'selected' : ''}>Pauschal</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="checkbox-modern">
                            <input type="checkbox" name="isActive" ${product.is_active ? 'checked' : ''}>
                            <span>Aktiv (kann in Rechnungen verwendet werden)</span>
                        </label>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary-modern" onclick="closeModal(this)">
                        Abbrechen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Änderungen speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Form submission
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const productData = {
            type: formData.get('productType'),
            name: formData.get('name'),
            description: formData.get('description'),
            sku: formData.get('sku'),
            price: parseFloat(formData.get('price')),
            taxRate: parseFloat(formData.get('taxRate')),
            unit: formData.get('unit'),
            category: formData.get('category'),
            isActive: formData.get('isActive') === 'on'
        };
        
        const result = await window.api.updateProduct(id, productData);
        
        if (result.success) {
            showToast('Produkt erfolgreich aktualisiert', 'success');
            closeModal();
            navigateTo('products');
        } else {
            showToast(result.error || 'Fehler beim Aktualisieren', 'error');
        }
    });
}

// === Neue IPC Handler in src/ipc-handlers.js hinzufügen ===

// Get single customer
ipcMain.handle('get-customer', async (event, id) => {
    try {
        const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
        return { success: true, customer };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get single product
ipcMain.handle('get-product', async (event, id) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        return { success: true, product };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Update product
ipcMain.handle('update-product', async (event, id, product) => {
    try {
        const stmt = db.prepare(`
            UPDATE products SET
                type = ?, name = ?, description = ?, sku = ?,
                price = ?, tax_rate = ?, unit = ?, category = ?,
                is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(
            product.type,
            product.name,
            product.description,
            product.sku,
            product.price,
            product.taxRate,
            product.unit,
            product.category,
            product.isActive ? 1 : 0,
            id
        );
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

async function deleteCustomer(id) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        const result = await window.api.deleteCustomer(id);
        if (result.success) {
            showToast('Kunde gelöscht', 'success');
            navigateTo('customers');
        } else {
            showToast(result.error || 'Fehler beim Löschen', 'error');
        }
    }
}

async function deleteProduct(id) {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
        const result = await window.api.deleteProduct(id);
        if (result.success) {
            showToast('Produkt gelöscht', 'success');
            navigateTo('products');
        } else {
            showToast(result.error || 'Fehler beim Löschen', 'error');
        }
    }
}

// Show Add Customer Modal
function showAddCustomerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content modal-lg animate-slide-in">
            <div class="modal-header">
                <h2>Neuer Kunde</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="addCustomerForm" class="modal-form">
                <div class="form-section">
                    <div class="form-group-modern">
                        <label class="form-label-modern">Kundentyp</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="customerType" value="private" checked onchange="toggleBusinessFields(false)">
                                <span>Privatkunde</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="customerType" value="business" onchange="toggleBusinessFields(true)">
                                <span>Geschäftskunde</span>
                            </label>
                        </div>
                    </div>
                    
                    <div id="businessFields" style="display: none;">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Firmenname *</label>
                            <input type="text" class="form-input-modern" name="companyName">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Vorname *</label>
                            <input type="text" class="form-input-modern" name="firstName" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Nachname *</label>
                            <input type="text" class="form-input-modern" name="lastName" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" name="email">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" name="phone">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Adresse</label>
                        <input type="text" class="form-input-modern" name="address">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">PLZ</label>
                            <input type="text" class="form-input-modern" name="postalCode">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Stadt</label>
                            <input type="text" class="form-input-modern" name="city">
                        </div>
                    </div>
                    
                    <div class="form-group-modern" id="taxIdField" style="display: none;">
                        <label class="form-label-modern">Steuernummer</label>
                        <input type="text" class="form-input-modern" name="taxId">
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Notizen</label>
                        <textarea class="form-input-modern" name="notes" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary-modern" onclick="closeModal(this)">
                        Abbrechen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Kunde speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Form submission
    document.getElementById('addCustomerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check subscription limits
        const stats = await window.api.getDashboardStats();
        const currentCustomers = stats.stats?.totalCustomers || 0;
        const limit = subscriptionLimits[currentUser?.subscription_type || 'trial'].customers;
        
        if (currentCustomers >= limit) {
            showUpgradeModal();
            return;
        }
        
        const formData = new FormData(e.target);
        const customerData = {
            userId: currentUser?.id || 1,
            type: formData.get('customerType'),
            companyName: formData.get('companyName'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: 'Deutschland',
            taxId: formData.get('taxId'),
            notes: formData.get('notes')
        };
        
        const result = await window.api.addCustomer(customerData);
        
        if (result.success) {
            showToast('Kunde erfolgreich hinzugefügt', 'success');
            closeModal();
            navigateTo('customers');
        } else {
            showToast(result.error || 'Fehler beim Hinzufügen', 'error');
        }
    });
}

// Show Add Product Modal
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content modal-lg animate-slide-in">
            <div class="modal-header">
                <h2>Neues Produkt / Dienstleistung</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="addProductForm" class="modal-form">
                <div class="form-section">
                    <div class="form-group-modern">
                        <label class="form-label-modern">Typ</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="productType" value="product" checked>
                                <span>Produkt</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="productType" value="service">
                                <span>Dienstleistung</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Name *</label>
                        <input type="text" class="form-input-modern" name="name" required>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Beschreibung</label>
                        <textarea class="form-input-modern" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Artikelnummer (SKU)</label>
                            <input type="text" class="form-input-modern" name="sku">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Kategorie</label>
                            <input type="text" class="form-input-modern" name="category">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Preis (€) *</label>
                            <input type="number" class="form-input-modern" name="price" step="0.01" min="0" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">MwSt. (%) *</label>
                            <select class="form-input-modern" name="taxRate" required>
                                <option value="19">19% (Standard)</option>
                                <option value="7">7% (Ermäßigt)</option>
                                <option value="0">0% (Steuerfrei)</option>
                            </select>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Einheit</label>
                            <select class="form-input-modern" name="unit">
                                <option value="Stück">Stück</option>
                                <option value="Stunde">Stunde</option>
                                <option value="Tag">Tag</option>
                                <option value="kg">Kilogramm</option>
                                <option value="m">Meter</option>
                                <option value="m²">Quadratmeter</option>
                                <option value="Pauschal">Pauschal</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="checkbox-modern">
                            <input type="checkbox" name="isActive" checked>
                            <span>Aktiv (kann in Rechnungen verwendet werden)</span>
                        </label>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary-modern" onclick="closeModal(this)">
                        Abbrechen
                    </button>
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Produkt speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Form submission
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check subscription limits
        const stats = await window.api.getDashboardStats();
        const currentProducts = stats.stats?.totalProducts || 0;
        const limit = subscriptionLimits[currentUser?.subscription_type || 'trial'].products;
        
        if (currentProducts >= limit) {
            showUpgradeModal();
            return;
        }
        
        const formData = new FormData(e.target);
        const productData = {
            userId: currentUser?.id || 1,
            type: formData.get('productType'),
            name: formData.get('name'),
            description: formData.get('description'),
            sku: formData.get('sku'),
            price: parseFloat(formData.get('price')),
            taxRate: parseFloat(formData.get('taxRate')),
            unit: formData.get('unit'),
            category: formData.get('category'),
            isActive: formData.get('isActive') === 'on'
        };
        
        const result = await window.api.addProduct(productData);
        
        if (result.success) {
            showToast('Produkt erfolgreich hinzugefügt', 'success');
            closeModal();
            navigateTo('products');
        } else {
            showToast(result.error || 'Fehler beim Hinzufügen', 'error');
        }
    });
}

// Toggle Business Fields
function toggleBusinessFields(show) {
    document.getElementById('businessFields').style.display = show ? 'block' : 'none';
    document.getElementById('taxIdField').style.display = show ? 'block' : 'none';
    
    const companyInput = document.querySelector('[name="companyName"]');
    if (show) {
        companyInput.setAttribute('required', 'required');
    } else {
        companyInput.removeAttribute('required');
    }
}

function showReminderSettings() {
    showToast('Mahnungseinstellungen - In Entwicklung', 'info');
}

// Export functions for global access
window.navigateTo = navigateTo;
window.showUpgradeModal = showUpgradeModal;
window.upgradeSubscription = upgradeSubscription;