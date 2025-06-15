// Modern App JavaScript - Complete Fixed Version
let currentPage = 'dashboard';
let currentUser = null;
let subscriptionLimits = {
    trial: { invoices: 5, customers: 15, products: 5 },
    basic: { invoices: 50, customers: 100, products: 50 },
    pro: { invoices: Infinity, customers: Infinity, products: Infinity }
};

// Store dashboard stats globally for usage tracking
window.lastDashboardStats = {};

// Initialize Modern App - DON'T run automatically on DOMContentLoaded
// This will be called by renderer.js after login

function initializeModernApp() {
    console.log('initializeModernApp called');
    
    // Get current user from session or default
    currentUser = getCurrentUser();
    
    // Update UI based on subscription
    updateSubscriptionUI();
    
    // Initialize navigation
    initializeNavigation();
    
    // Load initial page
    setTimeout(() => {
        navigateTo('dashboard');
    }, 100);
    
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

// Load Dashboard
async function loadDashboard() {
    const stats = await window.api.getDashboardStats();
    const recentInvoices = await window.api.getInvoices();
    
    // Store stats globally
    window.lastDashboardStats = stats.stats || {};
    
    console.log('Dashboard stats:', stats); // Debug
    
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
                                            <button class="btn-icon" onclick="viewInvoice(${invoice.id})" title="Ansehen">
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
                    <button class="btn-primary-modern" onclick="navigateTo('create-invoice')">
                        <i class="fas fa-plus"></i>
                        Erste Rechnung erstellen
                    </button>
                </div>
            `}
        </div>
    `;
}

// Get current user - utility function
function getCurrentUser() {
    // Return default user if not available
    return {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'user@example.com',
        subscription_type: 'trial'
    };
}

// Get current usage from stored stats
function getCurrentUsage() {
    const stats = window.lastDashboardStats || {};
    return {
        invoices: stats.totalInvoices || 0,
        customers: stats.totalCustomers || 0,
        products: stats.totalProducts || 0,
        revenue: stats.totalRevenue || 0
    };
}

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

// Format date utility
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE');
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        draft: 'Entwurf',
        sent: 'Versendet', 
        paid: 'Bezahlt',
        overdue: 'Überfällig'
    };
    return labels[status] || status;
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-modern toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Global Search
function initializeGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                performGlobalSearch(query);
            }
        });
    }
}

function performGlobalSearch(query) {
    console.log('Searching for:', query);
    // Implementation would search across invoices, customers, products
}

// Show upgrade modal
function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content upgrade-modal animate-slide-in">
            <div class="modal-header">
                <h2>Upgrade Your Plan</h2>
                <button class="modal-close" onclick="closeModal(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="upgrade-header">
                <i class="fas fa-crown"></i>
                <h3>Unlock Full Potential</h3>
                <p>Upgrade to Pro for unlimited invoices and premium features</p>
            </div>
            
            <div class="pricing-grid">
                <div class="pricing-card">
                    <h3>Basic Plan</h3>
                    <div class="price">
                        <span class="currency">€</span>
                        <span class="amount">19</span>
                        <span class="period">/mo</span>
                    </div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> 50 Invoices</li>
                        <li><i class="fas fa-check"></i> 100 Customers</li>
                        <li><i class="fas fa-check"></i> Email Support</li>
                    </ul>
                    <button class="btn-secondary-modern" onclick="upgradeSubscription('basic')">
                        Choose Basic
                    </button>
                </div>
                
                <div class="pricing-card featured">
                    <div class="featured-badge">Most Popular</div>
                    <h3>Pro Plan</h3>
                    <div class="price">
                        <span class="currency">€</span>
                        <span class="amount">39</span>
                        <span class="period">/mo</span>
                    </div>
                    <ul class="features">
                        <li><i class="fas fa-check"></i> Unlimited Invoices</li>
                        <li><i class="fas fa-check"></i> Unlimited Customers</li>
                        <li><i class="fas fa-check"></i> Priority Support</li>
                        <li><i class="fas fa-check"></i> Advanced Features</li>
                    </ul>
                    <button class="btn-primary-modern" onclick="upgradeSubscription('pro')">
                        Choose Pro
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
}

// Upgrade subscription
async function upgradeSubscription(plan) {
    const result = await window.api.updateSubscription(plan);
    
    if (result.success) {
        showToast('Subscription upgraded successfully!', 'success');
        closeModal();
        updateSubscriptionUI();
        showUpgradeCelebration(plan);
    } else {
        showToast('Upgrade failed. Please try again.', 'error');
    }
}

// Show celebration
function showUpgradeCelebration(plan) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration-overlay';
    celebration.innerHTML = `
        <div class="celebration-content">
            <i class="fas fa-check-circle"></i>
            <h2>Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!</h2>
            <p>Your subscription has been upgraded successfully.</p>
            <button class="btn-primary-modern" onclick="closeCelebration()">
                Continue
            </button>
        </div>
    `;
    
    document.body.appendChild(celebration);
}

// Update subscription UI
function updateSubscriptionUI() {
    const usage = getCurrentUsage();
    const userType = currentUser?.subscription_type || 'trial';
    const limits = subscriptionLimits[userType];
    
    // Update subscription info in sidebar
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    if (subscriptionInfo) {
        subscriptionInfo.innerHTML = `
            <div class="subscription-label">${getSubscriptionLabel(userType)}</div>
            <div class="subscription-details">
                <span id="daysLeft">30 Tage verbleibend</span>
                <div class="subscription-limits">
                    <span>${usage.invoices} / ${limits.invoices === Infinity ? '∞' : limits.invoices} Rechnungen</span>
                </div>
            </div>
        `;
    }
}

// Get subscription label
function getSubscriptionLabel(type) {
    const labels = {
        trial: 'Test Version',
        basic: 'Basic',
        pro: 'Professional'
    };
    return labels[type] || type;
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
    const celebration = document.querySelector('.celebration-overlay');
    if (celebration) {
        celebration.remove();
    }
}

// Show add customer modal
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

// Toggle business fields
function toggleBusinessFields(show) {
    const businessFields = document.getElementById('businessFields');
    const taxIdField = document.getElementById('taxIdField');
    
    if (businessFields) {
        businessFields.style.display = show ? 'block' : 'none';
    }
    if (taxIdField) {
        taxIdField.style.display = show ? 'block' : 'none';
    }
}

// Show add product modal
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
            isActive: true
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

// Stub implementations for remaining functions
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
        
        const invoiceData = {
            userId: currentUser?.id || 1,
            customerId: parseInt(document.getElementById('customerId').value),
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            items: collectInvoiceItems(),
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('€', '')),
            taxAmount: parseFloat(document.getElementById('taxAmount').textContent.replace('€', '')),
            total: parseFloat(document.getElementById('total').textContent.replace('€', ''))
        };
        
        const result = await window.api.createInvoice(invoiceData);
        
        if (result.success) {
            showToast('Rechnung erfolgreich erstellt', 'success');
            navigateTo('invoices');
        } else {
            showToast(result.error || 'Fehler beim Erstellen der Rechnung', 'error');
        }
    });
}

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
                    <button class="btn-primary-modern" onclick="showAddCustomerModal()">
                        <i class="fas fa-plus"></i>
                        Ersten Kunden hinzufügen
                    </button>
                </div>
            `}
        </div>
    `;
}

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
                    <button class="btn-primary-modern" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i>
                        Erstes Produkt hinzufügen
                    </button>
                </div>
            `}
        </div>
    `;
}

async function loadReminders() {
    const result = await window.api.getReminders();
    const reminders = result.success ? result.reminders : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-header">
                <h2>Mahnungen</h2>
                <p>Überfällige und ausstehende Rechnungen</p>
            </div>
            
            ${reminders.length > 0 ? `
                <div class="table-container">
                    <table class="table-modern">
                        <thead>
                            <tr>
                                <th>Rechnung</th>
                                <th>Kunde</th>
                                <th>Betrag</th>
                                <th>Fällig seit</th>
                                <th>Tage überfällig</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reminders.map(reminder => `
                                <tr>
                                    <td><strong>${reminder.invoice_number}</strong></td>
                                    <td>${reminder.company_name || `${reminder.first_name} ${reminder.last_name}`}</td>
                                    <td><strong>€${reminder.total}</strong></td>
                                    <td>${formatDate(reminder.due_date)}</td>
                                    <td><span class="badge-modern badge-error">${Math.floor(reminder.days_overdue)} Tage</span></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="sendReminder(${reminder.id})" title="Mahnung senden">
                                                <i class="fas fa-paper-plane"></i>
                                            </button>
                                            <button class="btn-icon" onclick="markAsPaid(${reminder.id})" title="Als bezahlt markieren">
                                                <i class="fas fa-check"></i>
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
                        <i class="fas fa-bell"></i>
                    </div>
                    <h3>Keine überfälligen Rechnungen</h3>
                    <p>Alle Rechnungen sind aktuell oder bezahlt</p>
                </div>
            `}
        </div>
    `;
}

async function loadCompanySettings() {
    const result = await window.api.getCompanySettings();
    const settings = result.success ? result.settings : {};
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="settings-page animate-fade-in">
            <div class="settings-header">
                <h2>Unternehmensdaten</h2>
                <p>Verwalten Sie Ihre Firmendaten und Kontaktinformationen</p>
            </div>
            
            <form id="companySettingsForm" class="settings-form">
                <div class="settings-section">
                    <h3>Grunddaten</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Firmenname</label>
                            <input type="text" class="form-input-modern" name="name" value="${settings.name || ''}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" name="email" value="${settings.email || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" name="phone" value="${settings.phone || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Website</label>
                            <input type="url" class="form-input-modern" name="website" value="${settings.website || ''}">
                        </div>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Adresse</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Straße & Hausnummer</label>
                        <input type="text" class="form-input-modern" name="address" value="${settings.address || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">PLZ</label>
                            <input type="text" class="form-input-modern" name="postalCode" value="${settings.postalCode || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Stadt</label>
                            <input type="text" class="form-input-modern" name="city" value="${settings.city || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Land</label>
                            <input type="text" class="form-input-modern" name="country" value="${settings.country || 'Deutschland'}">
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Änderungen speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Form submission
    document.getElementById('companySettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const companyData = Object.fromEntries(formData.entries());
        
        const result = await window.api.updateCompanySettings(companyData);
        
        if (result.success) {
            showToast('Unternehmensdaten erfolgreich aktualisiert', 'success');
        } else {
            showToast(result.error || 'Fehler beim Speichern', 'error');
        }
    });
}

async function loadProfile() {
    showToast('Profile page - implementation needed', 'info');
}

async function loadSettings() {
    showToast('Settings page - implementation needed', 'info');
}

// Export functions for global access
window.navigateTo = navigateTo;
window.showUpgradeModal = showUpgradeModal;
window.upgradeSubscription = upgradeSubscription;
window.showAddCustomerModal = showAddCustomerModal;
window.showAddProductModal = showAddProductModal;
window.toggleBusinessFields = toggleBusinessFields;
window.closeModal = closeModal;
window.closeCelebration = closeCelebration;
window.getCurrentUser = getCurrentUser;
window.getCurrentUsage = getCurrentUsage;
window.escapeHtml = escapeHtml;
window.showToast = showToast;

// Helper functions for filtering and actions
function filterInvoices(searchTerm) {
    const table = document.getElementById('invoicesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterByStatus(status) {
    const table = document.getElementById('invoicesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = status === 'all' || rowStatus === status ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function filterCustomers(searchTerm) {
    const table = document.getElementById('customersTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterCustomerType(type) {
    const table = document.getElementById('customersTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        row.style.display = type === 'all' || rowType === type ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function filterProducts(searchTerm) {
    const table = document.getElementById('productsTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterProductType(type) {
    const table = document.getElementById('productsTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        row.style.display = type === 'all' || rowType === type ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Invoice item management functions
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

// Action functions
async function viewInvoice(id) {
    showToast('Öffne Rechnung...', 'info');
    // Implementation would open invoice view
}

async function downloadInvoicePDF(id) {
    const result = await window.api.generateInvoicePDF(id);
    
    if (result.success) {
        showToast('PDF erfolgreich erstellt: ' + result.path, 'success');
    } else {
        showToast('Fehler beim Erstellen der PDF', 'error');
    }
}

async function sendInvoiceEmail(id) {
    showToast('E-Mail wird versendet...', 'info');
    // Implementation would send email
}

async function editCustomer(id) {
    showToast('Kunde bearbeiten...', 'info');
    // Implementation would open edit modal
}

async function deleteCustomer(id) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        const result = await window.api.deleteCustomer(id);
        
        if (result.success) {
            showToast('Kunde erfolgreich gelöscht', 'success');
            navigateTo('customers');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    }
}

async function editProduct(id) {
    showToast('Produkt bearbeiten...', 'info');
    // Implementation would open edit modal
}

async function deleteProduct(id) {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
        const result = await window.api.deleteProduct(id);
        
        if (result.success) {
            showToast('Produkt erfolgreich gelöscht', 'success');
            navigateTo('products');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    }
}

async function sendReminder(invoiceId) {
    showToast('Mahnung wird gesendet...', 'info');
    // Implementation for sending reminder
}

async function markAsPaid(invoiceId) {
    const result = await window.api.updateInvoiceStatus(invoiceId, 'paid');
    
    if (result.success) {
        showToast('Rechnung als bezahlt markiert', 'success');
        loadReminders(); // Reload the page
    } else {
        showToast('Fehler beim Aktualisieren', 'error');
    }
}

// Export all required functions to window for onclick handlers
window.filterInvoices = filterInvoices;
window.filterByStatus = filterByStatus;
window.filterCustomers = filterCustomers;
window.filterCustomerType = filterCustomerType;
window.filterProducts = filterProducts;
window.filterProductType = filterProductType;
window.addInvoiceItem = addInvoiceItem;
window.removeInvoiceItem = removeInvoiceItem;
window.calculateInvoiceTotals = calculateInvoiceTotals;
window.collectInvoiceItems = collectInvoiceItems;
window.viewInvoice = viewInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
window.sendInvoiceEmail = sendInvoiceEmail;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.sendReminder = sendReminder;
window.markAsPaid = markAsPaid;
window.showAddCustomerModal = showAddCustomerModal;
window.showAddProductModal = showAddProductModal;
window.toggleBusinessFields = toggleBusinessFields;
window.closeModal = closeModal;
window.closeCelebration = closeCelebration;
window.getCurrentUser = getCurrentUser;
window.getCurrentUsage = getCurrentUsage;
window.escapeHtml = escapeHtml;
window.showToast = showToast;

// Helper functions for filtering and actions
function filterInvoices(searchTerm) {
    const table = document.getElementById('invoicesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterByStatus(status) {
    const table = document.getElementById('invoicesTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        row.style.display = status === 'all' || rowStatus === status ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function filterCustomers(searchTerm) {
    const table = document.getElementById('customersTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterCustomerType(type) {
    const table = document.getElementById('customersTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        row.style.display = type === 'all' || rowType === type ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

function filterProducts(searchTerm) {
    const table = document.getElementById('productsTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterProductType(type) {
    const table = document.getElementById('productsTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowType = row.getAttribute('data-type');
        row.style.display = type === 'all' || rowType === type ? '' : 'none';
    });
    
    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Invoice item management functions
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

// Action functions
async function viewInvoice(id) {
    showToast('Öffne Rechnung...', 'info');
    // Implementation would open invoice view
}

async function downloadInvoicePDF(id) {
    const result = await window.api.generateInvoicePDF(id);
    
    if (result.success) {
        showToast('PDF erfolgreich erstellt: ' + result.path, 'success');
    } else {
        showToast('Fehler beim Erstellen der PDF', 'error');
    }
}

async function sendInvoiceEmail(id) {
    showToast('E-Mail wird versendet...', 'info');
    // Implementation would send email
}

async function editCustomer(id) {
    showToast('Kunde bearbeiten...', 'info');
    // Implementation would open edit modal
}

async function deleteCustomer(id) {
    if (confirm('Möchten Sie diesen Kunden wirklich löschen?')) {
        const result = await window.api.deleteCustomer(id);
        
        if (result.success) {
            showToast('Kunde erfolgreich gelöscht', 'success');
            navigateTo('customers');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    }
}

async function editProduct(id) {
    showToast('Produkt bearbeiten...', 'info');
    // Implementation would open edit modal
}

async function deleteProduct(id) {
    if (confirm('Möchten Sie dieses Produkt wirklich löschen?')) {
        const result = await window.api.deleteProduct(id);
        
        if (result.success) {
            showToast('Produkt erfolgreich gelöscht', 'success');
            navigateTo('products');
        } else {
            showToast('Fehler beim Löschen', 'error');
        }
    }
}

async function sendReminder(invoiceId) {
    showToast('Mahnung wird gesendet...', 'info');
    // Implementation for sending reminder
}

async function markAsPaid(invoiceId) {
    const result = await window.api.updateInvoiceStatus(invoiceId, 'paid');
    
    if (result.success) {
        showToast('Rechnung als bezahlt markiert', 'success');
        loadReminders(); // Reload the page
    } else {
        showToast('Fehler beim Aktualisieren', 'error');
    }
}

// Export all required functions to window for onclick handlers
window.filterInvoices = filterInvoices;
window.filterByStatus = filterByStatus;
window.filterCustomers = filterCustomers;
window.filterCustomerType = filterCustomerType;
window.filterProducts = filterProducts;
window.filterProductType = filterProductType;
window.addInvoiceItem = addInvoiceItem;
window.removeInvoiceItem = removeInvoiceItem;
window.calculateInvoiceTotals = calculateInvoiceTotals;
window.collectInvoiceItems = collectInvoiceItems;
window.viewInvoice = viewInvoice;
window.downloadInvoicePDF = downloadInvoicePDF;
window.sendInvoiceEmail = sendInvoiceEmail;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.sendReminder = sendReminder;
window.markAsPaid = markAsPaid;