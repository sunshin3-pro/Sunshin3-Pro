// Modern App JavaScript - Complete Implementation
let currentPage = 'dashboard';
let currentUser = null;
let subscriptionLimits = {
    trial: { invoices: 5, customers: 15, products: 5 },
    basic: { invoices: 50, customers: 100, products: 50 },
    pro: { invoices: Infinity, customers: Infinity, products: Infinity }
};

// Store dashboard stats globally for usage tracking
window.lastDashboardStats = {};

// Admin configuration
const ADMIN_EMAIL = 'ertl92@gmx.net';

// Initialize Modern App - Called by renderer.js after login
function initializeModernApp() {
    console.log('💫 initializeModernApp called');
    
    // Get current user from session
    currentUser = window.currentUserFromRenderer || getCurrentUser();
    
    // Update UI based on subscription
    updateSubscriptionUI();
    
    // Initialize navigation with delay to ensure DOM is ready
    setTimeout(() => {
        initializeNavigation();
        console.log('🧭 Navigation initialized');
        
        // Load initial page
        setTimeout(() => {
            console.log('🏠 Loading dashboard...');
            navigateTo('dashboard');
        }, 100);
    }, 50);
    
    // Initialize global search
    initializeGlobalSearch();
}

// Navigation System - Enhanced
function initializeNavigation() {
    console.log('🔧 Setting up navigation system...');
    
    // Remove all existing onclick attributes and setup proper event listeners
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        console.log(`Setting up nav item ${index}:`, item);
        
        // Get page from onclick attribute if exists
        const onclickAttr = item.getAttribute('onclick');
        let page = null;
        
        if (onclickAttr) {
            const match = onclickAttr.match(/navigateTo\('(.+)'\)/);
            if (match) {
                page = match[1];
                console.log(`Found page: ${page} for nav item ${index}`);
            }
        }
        
        // Remove onclick to avoid conflicts
        item.removeAttribute('onclick');
        
        // Add proper event listener
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log(`🔥 Nav item clicked: ${page || 'unknown'}`);
            
            if (page) {
                navigateTo(page);
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(navItem => {
                    navItem.classList.remove('active');
                });
                item.classList.add('active');
            }
        });
        
        // Store page reference for later
        item.setAttribute('data-page', page);
    });
    
    console.log('✅ Navigation setup complete');
}

// Navigate to page
async function navigateTo(page) {
    console.log(`🚀 Navigating to: ${page}`);
    currentPage = page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        const itemPage = item.getAttribute('data-page');
        if (itemPage === page) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    updatePageTitle(page);
    
    // Load content
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) {
        console.error('❌ Content area not found!');
        return;
    }
    
    contentArea.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Lade...</div>';
    
    try {
        switch(page) {
            case 'dashboard':
                console.log('📊 Loading dashboard...');
                await loadDashboard();
                break;
            case 'invoices':
                console.log('📄 Loading invoices...');
                await loadInvoices();
                break;
            case 'create-invoice':
                console.log('➕ Loading create invoice...');
                await loadCreateInvoice();
                break;
            case 'customers':
                console.log('👥 Loading customers...');
                await loadCustomers();
                break;
            case 'products':
                console.log('📦 Loading products...');
                await loadProducts();
                break;
            case 'reminders':
                console.log('⏰ Loading reminders...');
                await loadReminders();
                break;
            case 'company':
                console.log('🏢 Loading company settings...');
                await loadCompanySettings();
                break;
            case 'profile':
                console.log('👤 Loading profile...');
                await loadProfile();
                break;
            case 'settings':
                console.log('⚙️ Loading settings...');
                await loadSettings();
                break;
            default:
                console.log('❓ Unknown page:', page);
                contentArea.innerHTML = '<div class="empty-state"><h3>Seite nicht gefunden</h3></div>';
        }
        console.log(`✅ Page ${page} loaded successfully`);
    } catch (error) {
        console.error('❌ Error loading page:', error);
        contentArea.innerHTML = '<div class="error-state"><h3>Fehler beim Laden</h3><p>Bitte versuchen Sie es erneut</p></div>';
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
    if (pageTitle) {
        pageTitle.textContent = titles[page] || page;
        console.log(`📝 Page title updated to: ${titles[page] || page}`);
    }
}

// Load Dashboard with real API integration
async function loadDashboard() {
    try {
        const stats = await window.api.getDashboardStats();
        const recentInvoices = await window.api.getInvoices();
        
        // Store stats globally
        window.lastDashboardStats = stats.stats || {};
        
        console.log('📊 Dashboard stats loaded:', stats);
        
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
                        <div class="stat-content">
                            <div class="stat-value">${stats.stats?.totalInvoices || 0}</div>
                            <div class="stat-label">Gesamte Rechnungen</div>
                            <div class="stat-change positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>+12% diesen Monat</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${stats.stats?.totalCustomers || 0}</div>
                            <div class="stat-label">Kunden</div>
                            <div class="stat-change positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>+8% diesen Monat</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-euro-sign"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">€${stats.stats?.pendingAmount?.toFixed(2) || '0.00'}</div>
                            <div class="stat-label">Offene Beträge</div>
                            <div class="stat-change">
                                <i class="fas fa-clock"></i>
                                <span>Zu erhalten</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">€${stats.stats?.totalRevenue?.toFixed(2) || '0.00'}</div>
                            <div class="stat-label">Gesamtumsatz</div>
                            <div class="stat-change positive">
                                <i class="fas fa-arrow-up"></i>
                                <span>+15% diesen Monat</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="quick-actions-modern">
                    <h3>Schnellaktionen</h3>
                    <div class="action-grid">
                        <button class="action-card" onclick="window.navigateTo('create-invoice')">
                            <i class="fas fa-plus-circle"></i>
                            <span>Neue Rechnung</span>
                        </button>
                        <button class="action-card" onclick="window.showAddCustomerModal()">
                            <i class="fas fa-user-plus"></i>
                            <span>Neuer Kunde</span>
                        </button>
                        <button class="action-card" onclick="window.showAddProductModal()">
                            <i class="fas fa-box-open"></i>
                            <span>Neues Produkt</span>
                        </button>
                        <button class="action-card" onclick="window.navigateTo('reminders')">
                            <i class="fas fa-bell"></i>
                            <span>Mahnungen</span>
                        </button>
                    </div>
                </div>
                
                ${recentInvoices.invoices?.length > 0 ? `
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
                                    ${recentInvoices.invoices.slice(0, 5).map(invoice => `
                                        <tr>
                                            <td><strong>${invoice.invoice_number}</strong></td>
                                            <td>${invoice.company_name || `${invoice.first_name} ${invoice.last_name}`}</td>
                                            <td><strong>€${invoice.total}</strong></td>
                                            <td><span class="badge-modern badge-${invoice.status}">${getStatusLabel(invoice.status)}</span></td>
                                            <td>
                                                <button class="btn-icon" onclick="window.viewInvoice(${invoice.id})" title="Ansehen">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-file-invoice"></i>
                        </div>
                        <h3>Noch keine Rechnungen</h3>
                        <p>Erstellen Sie Ihre erste Rechnung um loszulegen</p>
                        <button class="btn-primary-modern" onclick="window.navigateTo('create-invoice')">
                            <i class="fas fa-plus"></i>
                            Erste Rechnung erstellen
                        </button>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        showToast('Fehler beim Laden des Dashboards', 'error');
    }
}

// Load Invoices with real data
async function loadInvoices() {
    try {
        const result = await window.api.getInvoices();
        const invoices = result.success ? result.invoices : [];
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-content animate-fade-in">
                <div class="page-actions">
                    <button class="btn-primary-modern" onclick="window.navigateTo('create-invoice')">
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
                        <button class="btn-primary-modern" onclick="window.navigateTo('create-invoice')">
                            <i class="fas fa-plus"></i>
                            Erste Rechnung erstellen
                        </button>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading invoices:', error);
        showToast('Fehler beim Laden der Rechnungen', 'error');
    }
}

// Load Customers with real data
async function loadCustomers() {
    try {
        const result = await window.api.getCustomers();
        const customers = result.success ? result.customers : [];
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-content animate-fade-in">
                <div class="page-actions">
                    <button class="btn-primary-modern" onclick="window.showAddCustomerModal()">
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
                        <button class="chip" onclick="filterCustomerType('business')">Geschäft</button>
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
                                    <th>Stadt</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customers.map(customer => `
                                    <tr data-type="${customer.type}">
                                        <td><strong>${customer.company_name || `${customer.first_name} ${customer.last_name}`}</strong></td>
                                        <td><span class="badge-modern badge-${customer.type}">${customer.type === 'business' ? 'Geschäft' : 'Privat'}</span></td>
                                        <td>${customer.email || '-'}</td>
                                        <td>${customer.phone || '-'}</td>
                                        <td>${customer.city || '-'}</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="editCustomer(${customer.id})" title="Bearbeiten">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn-icon" onclick="deleteCustomer(${customer.id})" title="Löschen">
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
                        <button class="btn-primary-modern" onclick="window.showAddCustomerModal()">
                            <i class="fas fa-plus"></i>
                            Ersten Kunden hinzufügen
                        </button>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        showToast('Fehler beim Laden der Kunden', 'error');
    }
}

// Load Products with real data
async function loadProducts() {
    try {
        const result = await window.api.getProducts();
        const products = result.success ? result.products : [];
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-content animate-fade-in">
                <div class="page-actions">
                    <button class="btn-primary-modern" onclick="window.showAddProductModal()">
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
                                    <th>SKU</th>
                                    <th>Preis</th>
                                    <th>MwSt</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${products.map(product => `
                                    <tr data-type="${product.type}">
                                        <td><strong>${product.name}</strong></td>
                                        <td><span class="badge-modern badge-${product.type}">${product.type === 'service' ? 'Dienstleistung' : 'Produkt'}</span></td>
                                        <td>${product.sku || '-'}</td>
                                        <td><strong>€${product.price}</strong></td>
                                        <td>${product.tax_rate}%</td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn-icon" onclick="editProduct(${product.id})" title="Bearbeiten">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn-icon" onclick="deleteProduct(${product.id})" title="Löschen">
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
                        <p>Fügen Sie Ihr erstes Produkt hinzu</p>
                        <button class="btn-primary-modern" onclick="window.showAddProductModal()">
                            <i class="fas fa-plus"></i>
                            Erstes Produkt hinzufügen
                        </button>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showToast('Fehler beim Laden der Produkte', 'error');
    }
}

// Load Profile with Admin Panel Access
async function loadProfile() {
    try {
        const isAdmin = currentUser?.email === ADMIN_EMAIL;
        console.log('👤 Loading profile for user:', currentUser?.email, 'Admin:', isAdmin);
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="profile-page animate-fade-in">
                <div class="profile-header">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            ${(currentUser?.first_name?.[0] || 'U') + (currentUser?.last_name?.[0] || 'U')}
                        </div>
                        <div class="profile-info">
                            <h2>${currentUser?.first_name || 'User'} ${currentUser?.last_name || ''}</h2>
                            <p>${currentUser?.email || 'user@example.com'}</p>
                            <span class="subscription-badge">${getSubscriptionLabel(currentUser?.subscription_type || 'trial')}</span>
                            ${isAdmin ? '<span class="admin-badge">👑 Administrator</span>' : ''}
                        </div>
                    </div>
                </div>
                
                ${isAdmin ? `
                    <div class="admin-panel-access">
                        <div class="admin-section">
                            <h3>🔐 Administrator-Bereich</h3>
                            <p>Sie haben Zugriff auf das Admin-Dashboard zur Verwaltung der Anwendung.</p>
                            <button class="btn-admin-modern" onclick="openAdminDashboard()">
                                <i class="fas fa-crown"></i>
                                Admin Dashboard öffnen
                            </button>
                        </div>
                    </div>
                ` : ''}
                
                <div class="profile-tabs">
                    <button class="tab-btn active" onclick="showProfileTab('personal')">Persönliche Daten</button>
                    <button class="tab-btn" onclick="showProfileTab('security')">Sicherheit</button>
                    <button class="tab-btn" onclick="showProfileTab('subscription')">Abonnement</button>
                </div>
                
                <div class="tab-content">
                    <div id="personalTab" class="tab-pane active">
                        <form id="profileForm" class="profile-form">
                            <div class="form-section">
                                <h3>Persönliche Informationen</h3>
                                <div class="form-row">
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Vorname</label>
                                        <input type="text" class="form-input-modern" name="firstName" value="${currentUser?.first_name || ''}" required>
                                    </div>
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Nachname</label>
                                        <input type="text" class="form-input-modern" name="lastName" value="${currentUser?.last_name || ''}" required>
                                    </div>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">E-Mail</label>
                                    <input type="email" class="form-input-modern" name="email" value="${currentUser?.email || ''}" required>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Telefon</label>
                                        <input type="tel" class="form-input-modern" name="phone" value="${currentUser?.phone || ''}">
                                    </div>
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Sprache</label>
                                        <select class="form-input-modern" name="language">
                                            <option value="de" ${currentUser?.language === 'de' ? 'selected' : ''}>Deutsch</option>
                                            <option value="en" ${currentUser?.language === 'en' ? 'selected' : ''}>English</option>
                                            <option value="fr" ${currentUser?.language === 'fr' ? 'selected' : ''}>Français</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary-modern">
                                    <i class="fas fa-save"></i>
                                    Profil aktualisieren
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div id="securityTab" class="tab-pane">
                        <form id="passwordForm" class="profile-form">
                            <div class="form-section">
                                <h3>Passwort ändern</h3>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Aktuelles Passwort</label>
                                    <input type="password" class="form-input-modern" name="currentPassword" required>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Neues Passwort</label>
                                    <input type="password" class="form-input-modern" name="newPassword" required>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Passwort bestätigen</label>
                                    <input type="password" class="form-input-modern" name="confirmPassword" required>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary-modern">
                                    <i class="fas fa-lock"></i>
                                    Passwort ändern
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div id="subscriptionTab" class="tab-pane">
                        <div class="subscription-overview">
                            <h3>Ihr aktuelles Abonnement</h3>
                            <div class="current-plan">
                                <h4>${getSubscriptionLabel(currentUser?.subscription_type || 'trial')}</h4>
                                <p>Aktiv seit: ${formatDate(currentUser?.created_at)}</p>
                                ${currentUser?.subscription_type === 'trial' ? `
                                    <div class="trial-warning">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>Ihr Trial läuft in 15 Tagen ab</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <button class="btn-primary-modern" onclick="window.showUpgradeModal()">
                                <i class="fas fa-crown"></i>
                                Plan upgraden
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize profile forms
        initializeProfileForms();
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showToast('Fehler beim Laden des Profils', 'error');
    }
}

// Admin Dashboard Access - Opens modal with 4-digit code
function openAdminDashboard() {
    console.log('🔐 Opening admin dashboard access...');
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop admin-access-modal';
    modal.innerHTML = `
        <div class="modal-content admin-modal animate-slide-in">
            <div class="modal-header admin-header">
                <h2>🔐 Admin-Authentifizierung</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="admin-auth-content">
                <div class="admin-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3>Administrator-Zugang</h3>
                <p>Bitte geben Sie Ihren 4-stelligen Admin-Code ein:</p>
                
                <div class="code-input-container">
                    <input type="text" class="code-input admin-code" maxlength="1" data-index="0">
                    <input type="text" class="code-input admin-code" maxlength="1" data-index="1">
                    <input type="text" class="code-input admin-code" maxlength="1" data-index="2">
                    <input type="text" class="code-input admin-code" maxlength="1" data-index="3">
                </div>
                
                <div class="admin-auth-actions">
                    <button class="btn-secondary-modern" onclick="closeModal(this)">
                        Abbrechen
                    </button>
                    <button class="btn-admin-modern" onclick="verifyAdminCode()">
                        <i class="fas fa-unlock"></i>
                        Admin Panel öffnen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Setup code input auto-advance
    const codeInputs = modal.querySelectorAll('.admin-code');
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
    
    // Focus first input
    setTimeout(() => codeInputs[0].focus(), 100);
}

// Verify Admin Code and open admin window
async function verifyAdminCode() {
    const codeInputs = document.querySelectorAll('.admin-code');
    const code = Array.from(codeInputs).map(input => input.value).join('');
    
    if (code.length !== 4) {
        showToast('Bitte geben Sie einen 4-stelligen Code ein', 'error');
        return;
    }
    
    console.log('🔐 Verifying admin code:', code);
    
    try {
        const result = await window.api.adminLogin(ADMIN_EMAIL, code);
        
        if (result.success) {
            showToast('Admin-Authentifizierung erfolgreich!', 'success');
            closeModal();
            
            // Open admin window
            setTimeout(() => {
                window.api.openAdminWindow();
            }, 500);
        } else {
            showToast('Falscher Admin-Code', 'error');
            // Clear inputs
            codeInputs.forEach(input => input.value = '');
            codeInputs[0].focus();
        }
    } catch (error) {
        console.error('❌ Admin login error:', error);
        showToast('Fehler bei der Admin-Authentifizierung', 'error');
    }
}

// ... (Continuing with the rest of the implementation in the next part)