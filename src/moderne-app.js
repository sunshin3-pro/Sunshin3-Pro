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

// Initialize Modern App
document.addEventListener('DOMContentLoaded', () => {
    initializeModernApp();
});

function initializeModernApp() {
    // Get current user from session or default
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
    showToast('Invoices page loading...', 'info');
    // Implementation would load invoices
}

async function loadCreateInvoice() {
    showToast('Create invoice page loading...', 'info');
    // Implementation would load create invoice form
}

async function loadCustomers() {
    showToast('Customers page loading...', 'info');
    // Implementation would load customers
}

async function loadProducts() {
    showToast('Products page loading...', 'info');
    // Implementation would load products
}

async function loadReminders() {
    showToast('Reminders page loading...', 'info');
    // Implementation would load reminders
}

async function loadCompanySettings() {
    showToast('Company settings loading...', 'info');
    // Implementation would load company settings
}

async function loadProfile() {
    showToast('Profile page loading...', 'info');
    // Implementation would load profile
}

async function loadSettings() {
    showToast('Settings page loading...', 'info');
    // Implementation would load settings
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