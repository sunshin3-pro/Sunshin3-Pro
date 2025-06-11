// Globale Variablen
let currentLanguage = 'de';
let translations = {};
let currentUser = null;
let isAdminMode = false;
let adminEmail = '';

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
                showError('Bitte geben Sie einen 4-stelligen Code ein');
                return;
            }

            const result = await window.api.adminLogin(adminEmail, code);
            
            if (result.success) {
                // Öffne Admin-Panel
                window.api.openAdminWindow();
                resetLoginForm();
            } else {
                showError(result.error || 'Falscher Code');
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
    
    // Zeige Abo-Status
    showSubscriptionStatus();
    
    // Lade Dashboard
    loadPage('dashboard');
}

// Abo-Status anzeigen
function showSubscriptionStatus() {
    const mainApp = document.getElementById('mainApp');
    const existingBar = mainApp.querySelector('.user-info-bar');
    
    if (!existingBar) {
        const subscriptionBar = document.createElement('div');
        subscriptionBar.className = 'user-info-bar';
        subscriptionBar.innerHTML = `
            <div class="user-subscription">
                <div class="subscription-badge ${currentUser.subscription_type || 'trial'}">
                    <i class="fas ${getSubscriptionIcon(currentUser.subscription_type)}"></i>
                    <span>${getSubscriptionName(currentUser.subscription_type)}</span>
                </div>
                <div class="subscription-info">
                    ${getSubscriptionInfo(currentUser)}
                </div>
            </div>
            <button class="btn-secondary" onclick="loadPage('settings'); showSettingsSection('subscription');">
                <i class="fas fa-arrow-up"></i> Upgrade
            </button>
        `;
        
        // Füge nach der Top-Nav ein
        const topNav = mainApp.querySelector('.top-nav');
        topNav.insertAdjacentElement('afterend', subscriptionBar);
    }
}

function getSubscriptionIcon(type) {
    switch(type) {
        case 'pro': return 'fa-crown';
        case 'basic': return 'fa-star';
        default: return 'fa-clock';
    }
}

function getSubscriptionName(type) {
    switch(type) {
        case 'pro': return 'Professional';
        case 'basic': return 'Basic';
        default: return 'Trial';
    }
}

function getSubscriptionInfo(user) {
    if (user.subscription_expires) {
        const expiryDate = new Date(user.subscription_expires);
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
            return `Noch ${daysLeft} Tage gültig`;
        } else {
            return `<span style="color: var(--error)">Abgelaufen</span>`;
        }
    }
    return '';
}

// Seite laden
async function loadPage(page) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Zeige Ladeindikator
    mainContent.innerHTML = '<div class="loading">Laden...</div>';
    
    try {
        switch(page) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'invoices':
                await loadInvoices();
                break;
            case 'customers':
                await loadCustomers();
                break;
            case 'products':
                await loadProducts();
                break;
            case 'settings':
                await loadSettings();
                break;
            default:
                mainContent.innerHTML = '<p>Seite nicht gefunden</p>';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Seite:', error);
        mainContent.innerHTML = '<p>Fehler beim Laden der Seite</p>';
    }
}

// Dashboard laden
async function loadDashboard() {
    const mainContent = document.querySelector('.main-content');
    
    // Lade Statistiken
    const statsResult = await window.api.getDashboardStats();
    const stats = statsResult.success ? statsResult.stats : {
        totalInvoices: 0,
        totalCustomers: 0,
        totalUsers: 0,
        proUsers: 0
    };
    
    const html = `
        <div class="dashboard">
            <h1>${getTranslation('dashboard.title')}</h1>
            <p>${getTranslation('dashboard.welcome').replace('{name}', currentUser?.first_name || 'User')}</p>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-file-invoice"></i>
                    <div>
                        <h3>${getTranslation('dashboard.totalInvoices')}</h3>
                        <p class="stat-number">${stats.totalInvoices}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div>
                        <h3>${getTranslation('dashboard.customers')}</h3>
                        <p class="stat-number">${stats.totalCustomers}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-euro-sign"></i>
                    <div>
                        <h3>${getTranslation('dashboard.revenue')}</h3>
                        <p class="stat-number">€0</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h3>${getTranslation('dashboard.openInvoices')}</h3>
                        <p class="stat-number">0</p>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions">
                <h2>${getTranslation('dashboard.quickActions')}</h2>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="createNewInvoice()">
                        <i class="fas fa-plus"></i> ${getTranslation('dashboard.newInvoice')}
                    </button>
                    <button class="btn-secondary" onclick="createNewCustomer()">
                        <i class="fas fa-user-plus"></i> ${getTranslation('dashboard.newCustomer')}
                    </button>
                    <button class="btn-secondary" onclick="createNewProduct()">
                        <i class="fas fa-box-plus"></i> ${getTranslation('dashboard.newProduct')}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = html;
}

// Weitere Seiten laden (Platzhalter)
// Kunden laden und anzeigen
async function loadCustomers() {
    const mainContent = document.querySelector('.main-content');
    
    const result = await window.api.getCustomers();
    const customers = result.success ? result.customers : [];
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>${getTranslation('customers.title')}</h1>
            <button class="btn-primary" onclick="showAddCustomerDialog()">
                <i class="fas fa-plus"></i> ${getTranslation('customers.new')}
            </button>
        </div>
        
        <div class="search-filter-bar">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="${getTranslation('customers.search')}" id="customerSearch" onkeyup="filterCustomers()">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterCustomerType('all')">${getTranslation('customers.type.all')}</button>
                <button class="filter-btn" onclick="filterCustomerType('private')">${getTranslation('customers.type.private')}</button>
                <button class="filter-btn" onclick="filterCustomerType('business')">${getTranslation('customers.type.business')}</button>
            </div>
        </div>
        
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>${getTranslation('customers.table.name')}</th>
                        <th>${getTranslation('customers.table.email')}</th>
                        <th>${getTranslation('customers.table.phone')}</th>
                        <th>${getTranslation('customers.table.type')}</th>
                        <th>${getTranslation('customers.table.created')}</th>
                        <th>${getTranslation('customers.table.actions')}</th>
                    </tr>
                </thead>
                <tbody id="customersTable">
                    ${customers.map(customer => `
                        <tr data-type="${customer.type}">
                            <td>${customer.company_name || `${customer.first_name} ${customer.last_name}`}</td>
                            <td>${customer.email || '-'}</td>
                            <td>${customer.phone || '-'}</td>
                            <td><span class="badge ${customer.type}">${customer.type === 'business' ? 'Geschäftlich' : 'Privat'}</span></td>
                            <td>${new Date(customer.created_at).toLocaleDateString('de-DE')}</td>
                            <td>
                                <button class="action-btn" onclick="editCustomer(${customer.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn danger" onclick="deleteCustomer(${customer.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${customers.length === 0 ? '<p class="no-data">Keine Kunden vorhanden</p>' : ''}
        </div>
    `;
}

// Produkte laden und anzeigen
async function loadProducts() {
    const mainContent = document.querySelector('.main-content');
    
    const result = await window.api.getProducts();
    const products = result.success ? result.products : [];
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>${getTranslation('products.title')}</h1>
            <button class="btn-primary" onclick="showAddProductDialog()">
                <i class="fas fa-plus"></i> ${getTranslation('products.new')}
            </button>
        </div>
        
        <div class="search-filter-bar">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="${getTranslation('products.search')}" id="productSearch" onkeyup="filterProducts()">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active" onclick="filterProductType('all')">${getTranslation('products.type.all')}</button>
                <button class="filter-btn" onclick="filterProductType('product')">${getTranslation('products.type.product')}</button>
                <button class="filter-btn" onclick="filterProductType('service')">${getTranslation('products.type.service')}</button>
            </div>
        </div>
        
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>${getTranslation('products.table.name')}</th>
                        <th>${getTranslation('products.table.type')}</th>
                        <th>${getTranslation('products.table.price')}</th>
                        <th>${getTranslation('products.table.tax')}</th>
                        <th>${getTranslation('products.table.active')}</th>
                        <th>${getTranslation('products.table.actions')}</th>
                    </tr>
                </thead>
                <tbody id="productsTable">
                    ${products.map(product => `
                        <tr data-type="${product.type}">
                            <td>${product.name}</td>
                            <td><span class="badge ${product.type}">${product.type === 'product' ? 'Produkt' : 'Dienstleistung'}</span></td>
                            <td>€ ${product.price}</td>
                            <td>${product.tax_rate}%</td>
                            <td>
                                <span class="status ${product.is_active ? 'active' : 'inactive'}">
                                    ${product.is_active ? 'Aktiv' : 'Inaktiv'}
                                </span>
                            </td>
                            <td>
                                <button class="action-btn" onclick="editProduct(${product.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn danger" onclick="deleteProduct(${product.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${products.length === 0 ? '<p class="no-data">Keine Produkte vorhanden</p>' : ''}
        </div>
    `;
}

// Rechnungen laden
async function loadInvoices() {
    const mainContent = document.querySelector('.main-content');
    
    const result = await window.api.getInvoices();
    const invoices = result.success ? result.invoices : [];
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>${getTranslation('invoices.title')}</h1>
            <button class="btn-primary" onclick="showCreateInvoiceDialog()">
                <i class="fas fa-plus"></i> ${getTranslation('invoices.new')}
            </button>
        </div>
        
        <div class="search-filter-bar">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="${getTranslation('invoices.search')}" id="invoiceSearch">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active">${getTranslation('invoices.status.all')}</button>
                <button class="filter-btn">${getTranslation('invoices.status.draft')}</button>
                <button class="filter-btn">${getTranslation('invoices.status.sent')}</button>
                <button class="filter-btn">${getTranslation('invoices.status.paid')}</button>
                <button class="filter-btn">${getTranslation('invoices.status.overdue')}</button>
            </div>
        </div>
        
        <div class="data-table">
            <table>
                <thead>
                    <tr>
                        <th>${getTranslation('invoices.table.number')}</th>
                        <th>${getTranslation('invoices.table.customer')}</th>
                        <th>${getTranslation('invoices.table.date')}</th>
                        <th>${getTranslation('invoices.table.dueDate')}</th>
                        <th>${getTranslation('invoices.table.amount')}</th>
                        <th>${getTranslation('invoices.table.status')}</th>
                        <th>${getTranslation('invoices.table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(invoice => `
                        <tr>
                            <td>${invoice.invoice_number}</td>
                            <td>${invoice.company_name || `${invoice.first_name} ${invoice.last_name}`}</td>
                            <td>${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</td>
                            <td>${new Date(invoice.due_date).toLocaleDateString('de-DE')}</td>
                            <td>€ ${invoice.total}</td>
                            <td><span class="status ${invoice.status}">${getTranslation(`invoices.status.${invoice.status}`)}</span></td>
                            <td>
                                <button class="action-btn" onclick="viewInvoice(${invoice.id})" title="${getTranslation('invoices.actions.view')}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn" onclick="downloadInvoicePDF(${invoice.id})" title="${getTranslation('invoices.actions.downloadPDF')}">
                                    <i class="fas fa-file-pdf"></i>
                                </button>
                                <button class="action-btn" onclick="sendInvoiceEmail(${invoice.id})" title="${getTranslation('invoices.actions.sendEmail')}">
                                    <i class="fas fa-envelope"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${invoices.length === 0 ? '<p class="no-data">Keine Rechnungen vorhanden</p>' : ''}
        </div>
    `;
}

// Einstellungen laden
async function loadSettings() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
        <h1>${getTranslation('settings.title')}</h1>
        
        <div class="settings-container">
            <nav class="settings-nav">
                <div class="settings-nav-item active" onclick="showSettingsSection('profile')">
                    <i class="fas fa-user"></i>
                    <span>Profil</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsSection('company')">
                    <i class="fas fa-building"></i>
                    <span>${getTranslation('settings.tabs.company')}</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsSection('invoice')">
                    <i class="fas fa-file-invoice"></i>
                    <span>${getTranslation('settings.tabs.invoice')}</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsSection('email')">
                    <i class="fas fa-envelope"></i>
                    <span>${getTranslation('settings.tabs.email')}</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsSection('subscription')">
                    <i class="fas fa-crown"></i>
                    <span>${getTranslation('settings.tabs.subscription')}</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsSection('backup')">
                    <i class="fas fa-save"></i>
                    <span>${getTranslation('settings.tabs.backup')}</span>
                </div>
            </nav>
            
            <div class="settings-content">
                <!-- Profil -->
                <div class="settings-section active" id="profile-section">
                    <h2>Mein Profil</h2>
                    
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${currentUser.first_name ? currentUser.first_name.charAt(0) : 'U'}${currentUser.last_name ? currentUser.last_name.charAt(0) : ''}
                        </div>
                        <div class="profile-info">
                            <h2>${currentUser.first_name || ''} ${currentUser.last_name || ''}</h2>
                            <p>${currentUser.email}</p>
                            <p>${currentUser.company_name || 'Keine Firma angegeben'}</p>
                        </div>
                    </div>
                    
                    <form id="profileForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vorname</label>
                                <input type="text" id="profileFirstName" value="${currentUser.first_name || ''}">
                            </div>
                            <div class="form-group">
                                <label>Nachname</label>
                                <input type="text" id="profileLastName" value="${currentUser.last_name || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>E-Mail</label>
                            <input type="email" id="profileEmail" value="${currentUser.email}" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label>Telefon</label>
                            <input type="tel" id="profilePhone" value="${currentUser.phone || ''}" placeholder="+49 123 456789">
                        </div>
                        
                        <div class="form-group">
                            <label>Adresse</label>
                            <input type="text" id="profileAddress" value="${currentUser.address || ''}">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>PLZ</label>
                                <input type="text" id="profilePostalCode" value="${currentUser.postal_code || ''}">
                            </div>
                            <div class="form-group">
                                <label>Stadt</label>
                                <input type="text" id="profileCity" value="${currentUser.city || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Land</label>
                            <input type="text" id="profileCountry" value="${currentUser.country || 'Deutschland'}">
                        </div>
                        
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Speichern
                        </button>
                    </form>
                    
                    <div class="settings-group">
                        <h3>Passwort ändern</h3>
                        <form id="passwordForm">
                            <div class="form-group">
                                <label>Aktuelles Passwort</label>
                                <input type="password" id="currentPassword" required>
                            </div>
                            <div class="form-group">
                                <label>Neues Passwort</label>
                                <input type="password" id="newPassword" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label>Neues Passwort bestätigen</label>
                                <input type="password" id="confirmNewPassword" required>
                            </div>
                            <button type="submit" class="btn-secondary">
                                <i class="fas fa-key"></i> Passwort ändern
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Firma -->
                <div class="settings-section" id="company-section">
                    <h2>${getTranslation('settings.tabs.company')}</h2>
                    <form id="companyForm">
                        <div class="form-group">
                            <label>${getTranslation('settings.company.name')}</label>
                            <input type="text" id="companyName" value="${currentUser.company_name || ''}">
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.company.taxId')}</label>
                            <input type="text" id="companyTaxId" placeholder="DE123456789">
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.company.logo')}</label>
                            <button type="button" class="btn-secondary">
                                <i class="fas fa-upload"></i> ${getTranslation('settings.company.uploadLogo')}
                            </button>
                        </div>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> ${getTranslation('common.save')}
                        </button>
                    </form>
                </div>
                
                <!-- Rechnung -->
                <div class="settings-section" id="invoice-section">
                    <h2>${getTranslation('settings.tabs.invoice')}</h2>
                    <form id="invoiceSettingsForm">
                        <div class="form-group">
                            <label>${getTranslation('settings.invoice.prefix')}</label>
                            <input type="text" id="invoicePrefix" value="RE-" placeholder="RE-">
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.invoice.nextNumber')}</label>
                            <input type="number" id="invoiceNextNumber" value="1001">
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.invoice.dueDays')}</label>
                            <input type="number" id="invoiceDueDays" value="14" min="0">
                        </div>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> ${getTranslation('common.save')}
                        </button>
                    </form>
                </div>
                
                <!-- E-Mail -->
                <div class="settings-section" id="email-section">
                    <h2>${getTranslation('settings.tabs.email')}</h2>
                    <form id="emailSettingsForm">
                        <div class="form-group">
                            <label>${getTranslation('settings.email.smtpHost')}</label>
                            <input type="text" id="smtpHost" placeholder="smtp.gmail.com">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>${getTranslation('settings.email.smtpPort')}</label>
                                <input type="number" id="smtpPort" value="587">
                            </div>
                            <div class="form-group">
                                <label>${getTranslation('settings.email.smtpSecure')}</label>
                                <select id="smtpSecure">
                                    <option value="true">SSL/TLS</option>
                                    <option value="false">Keine</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.email.smtpUser')}</label>
                            <input type="email" id="smtpUser" placeholder="ihre-email@gmail.com">
                        </div>
                        <div class="form-group">
                            <label>${getTranslation('settings.email.smtpPassword')}</label>
                            <input type="password" id="smtpPassword">
                        </div>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> ${getTranslation('common.save')}
                        </button>
                        <button type="button" class="btn-secondary" onclick="testEmailConnection()">
                            <i class="fas fa-plug"></i> ${getTranslation('settings.email.testConnection')}
                        </button>
                    </form>
                </div>
                
                <!-- Abonnement -->
                <div class="settings-section" id="subscription-section">
                    <h2>${getTranslation('settings.tabs.subscription')}</h2>
                    
                    <div class="current-subscription">
                        <h3>${getTranslation('settings.subscription.current')}</h3>
                        <div class="subscription-card ${currentUser.subscription_type || 'trial'}">
                            <h4>${getSubscriptionName(currentUser.subscription_type)}</h4>
                            <p>${getTranslation('settings.subscription.expires')}: ${currentUser.subscription_expires ? new Date(currentUser.subscription_expires).toLocaleDateString('de-DE') : 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="subscription-plans">
                        <h3>Verfügbare Pläne</h3>
                        
                        <div class="plan-grid">
                            <div class="plan-card ${currentUser.subscription_type === 'basic' ? 'current' : ''}">
                                <h4>Basic</h4>
                                <div class="plan-price">€19.99<span>/Monat</span></div>
                                <ul class="plan-features">
                                    <li><i class="fas fa-check"></i> 50 Rechnungen</li>
                                    <li><i class="fas fa-check"></i> 100 Kunden</li>
                                    <li><i class="fas fa-check"></i> 50 Produkte</li>
                                    <li><i class="fas fa-check"></i> E-Mail Support</li>
                                </ul>
                                ${currentUser.subscription_type !== 'basic' ? `
                                    <button class="btn-primary" onclick="upgradeSubscription('basic')">
                                        <i class="fas fa-arrow-up"></i> Upgrade
                                    </button>
                                ` : '<span class="current-badge">Aktueller Plan</span>'}
                            </div>
                            
                            <div class="plan-card premium ${currentUser.subscription_type === 'pro' ? 'current' : ''}">
                                <div class="premium-badge">BELIEBT</div>
                                <h4>Professional</h4>
                                <div class="plan-price">€49.99<span>/Monat</span></div>
                                <ul class="plan-features">
                                    <li><i class="fas fa-check"></i> Unbegrenzte Rechnungen</li>
                                    <li><i class="fas fa-check"></i> Unbegrenzte Kunden</li>
                                    <li><i class="fas fa-check"></i> Unbegrenzte Produkte</li>
                                    <li><i class="fas fa-check"></i> Prioritäts-Support</li>
                                    <li><i class="fas fa-check"></i> API-Zugriff</li>
                                </ul>
                                ${currentUser.subscription_type !== 'pro' ? `
                                    <button class="btn-primary" onclick="upgradeSubscription('pro')">
                                        <i class="fas fa-crown"></i> Upgrade
                                    </button>
                                ` : '<span class="current-badge">Aktueller Plan</span>'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Backup -->
                <div class="settings-section" id="backup-section">
                    <h2>${getTranslation('settings.tabs.backup')}</h2>
                    
                    <div class="backup-actions">
                        <button class="btn-primary" onclick="createBackup()">
                            <i class="fas fa-download"></i> Backup erstellen
                        </button>
                        <button class="btn-secondary" onclick="restoreBackup()">
                            <i class="fas fa-upload"></i> Backup wiederherstellen
                        </button>
                    </div>
                    
                    <div class="backup-info">
                        <h3>Automatische Backups</h3>
                        <p>Ihre Daten werden automatisch täglich gesichert.</p>
                        <p>Letztes Backup: ${new Date().toLocaleDateString('de-DE')}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Event Listener für Formulare
    setupSettingsEventListeners();
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
    
    // Registrierungs-Event
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        
        if (password !== passwordConfirm) {
            showError(getTranslation('errors.passwordMatch'));
            return;
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
            // Für Demo: Direkt zur Anmeldung
            showSuccess('Registrierung erfolgreich! Sie können sich jetzt anmelden.');
            showLoginForm();
            // Für Produktion: E-Mail-Bestätigung anzeigen
            // showEmailVerificationMessage(userData.email);
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
    // Toast Notification implementieren
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
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

// Success Display
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
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

// Globale Funktionen für Quick Actions
window.createNewInvoice = () => {
    loadPage('invoices');
    setTimeout(() => showCreateInvoiceDialog(), 100);
};

window.createNewCustomer = () => {
    loadPage('customers');
    setTimeout(() => showAddCustomerDialog(), 100);
};

window.createNewProduct = () => {
    loadPage('products');
    setTimeout(() => showAddProductDialog(), 100);
};

// Dialog-Funktionen
window.showAddCustomerDialog = () => {
    // Implementierung folgt
    alert('Kunde hinzufügen Dialog - Noch in Entwicklung');
};

window.showAddProductDialog = () => {
    // Implementierung folgt
    alert('Produkt hinzufügen Dialog - Noch in Entwicklung');
};

window.showCreateInvoiceDialog = () => {
    // Implementierung folgt
    alert('Rechnung erstellen Dialog - Noch in Entwicklung');
};

// Filter-Funktionen
window.filterCustomers = () => {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#customersTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
};

window.filterCustomerType = (type) => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#customersTable tr');
    rows.forEach(row => {
        if (type === 'all' || row.dataset.type === type) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

window.filterProducts = () => {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
};

window.filterProductType = (type) => {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#productsTable tr');
    rows.forEach(row => {
        if (type === 'all' || row.dataset.type === type) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

// CRUD Funktionen
window.editCustomer = async (id) => {
    alert(`Kunde ${id} bearbeiten - Noch in Entwicklung`);
};

window.deleteCustomer = async (id) => {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        const result = await window.api.deleteCustomer(id);
        if (result.success) {
            showSuccess('Kunde gelöscht');
            loadCustomers();
        } else {
            showError(result.error);
        }
    }
};

window.editProduct = async (id) => {
    alert(`Produkt ${id} bearbeiten - Noch in Entwicklung`);
};

window.deleteProduct = async (id) => {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
        const result = await window.api.deleteProduct(id);
        if (result.success) {
            showSuccess('Produkt gelöscht');
            loadProducts();
        } else {
            showError(result.error);
        }
    }
};

window.viewInvoice = (id) => {
    alert(`Rechnung ${id} anzeigen - Noch in Entwicklung`);
};

window.downloadInvoicePDF = async (id) => {
    const result = await window.api.generateInvoicePDF(id);
    if (result.success) {
        showSuccess('PDF wurde heruntergeladen');
    } else {
        showError(result.error);
    }
};

window.sendInvoiceEmail = (id) => {
    alert(`Rechnung ${id} per E-Mail senden - Noch in Entwicklung`);
};

// Upgrade Celebration anzeigen
function showUpgradeCelebration(newPlan) {
    const planDetails = {
        basic: {
            icon: 'fa-star',
            title: 'Willkommen bei Basic!',
            subtitle: 'Sie haben jetzt Zugriff auf erweiterte Funktionen',
            features: [
                '50 Rechnungen pro Monat',
                '100 Kunden verwalten',
                '50 Produkte & Dienstleistungen',
                'E-Mail Support',
                'Automatische Backups'
            ]
        },
        pro: {
            icon: 'fa-crown',
            title: 'Willkommen bei Professional!',
            subtitle: 'Sie haben jetzt unbegrenzten Zugriff auf alle Funktionen',
            features: [
                'Unbegrenzte Rechnungen',
                'Unbegrenzte Kunden',
                'Unbegrenzte Produkte',
                'Prioritäts-Support',
                'Cloud-Synchronisation',
                'API-Zugriff',
                'Erweiterte Reports'
            ]
        }
    };

    const plan = planDetails[newPlan] || planDetails.basic;
    
    const celebrationModal = document.createElement('div');
    celebrationModal.className = 'upgrade-celebration';
    celebrationModal.innerHTML = `
        <div class="celebration-content">
            <div class="fireworks-container" id="fireworksContainer"></div>
            <div class="celebration-icon">
                <i class="fas ${plan.icon}"></i>
            </div>
            <h1>${plan.title}</h1>
            <p>${plan.subtitle}</p>
            
            <div class="celebration-features">
                <h3>Ihre neuen Vorteile:</h3>
                <ul class="feature-list">
                    ${plan.features.map(feature => `
                        <li><i class="fas fa-check-circle"></i> ${feature}</li>
                    `).join('')}
                </ul>
            </div>
            
            <button class="btn-primary" onclick="closeUpgradeCelebration()">
                <i class="fas fa-rocket"></i> Los geht's!
            </button>
        </div>
    `;
    
    document.body.appendChild(celebrationModal);
    
    // Starte Feuerwerk Animation
    startFireworks();
    
    // Spiele Sound ab (optional)
    playUpgradeSound();
}

// Feuerwerk Animation
function startFireworks() {
    const container = document.getElementById('fireworksContainer');
    const colors = ['#4F46E5', '#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createFirework(container, colors);
        }, i * 300);
    }
    
    // Wiederhole Feuerwerk
    const interval = setInterval(() => {
        createFirework(container, colors);
    }, 500);
    
    // Stoppe nach 5 Sekunden
    setTimeout(() => clearInterval(interval), 5000);
}

function createFirework(container, colors) {
    const x = Math.random() * container.offsetWidth;
    const y = Math.random() * container.offsetHeight;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = (Math.PI * 2 * i) / 30;
        const velocity = 50 + Math.random() * 100;
        particle.style.setProperty('--x', Math.cos(angle) * velocity + 'px');
        particle.style.setProperty('--y', Math.sin(angle) * velocity + 'px');
        
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
    }
}

function playUpgradeSound() {
    // Optional: Sound abspielen
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCp9zPDaizsIGGS57OScTgwLTKXh8bllHgg1jdT0yHkwBCh+zPDbizwKFly05+2mVhYKQJvd9L5vIAUqeMzw2Y48ChVitOzqpVcVCUp7wsGsWvCqYiEELILP8diJOQg=');
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Ignoriere Fehler falls Audio nicht abgespielt werden kann
}

// Celebration schließen
window.closeUpgradeCelebration = () => {
    const modal = document.querySelector('.upgrade-celebration');
    if (modal) {
        modal.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => modal.remove(), 500);
    }
};

// Globale Funktionen für HTML onclick
window.selectLanguage = selectLanguage;
window.changeLanguage = changeLanguage;
window.showLoginForm = showLoginForm;