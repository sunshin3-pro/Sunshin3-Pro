// Modern App JavaScript - Initialization Fix
let currentPage = 'dashboard';
let currentUser = null;
let subscriptionLimits = {
    trial: { invoices: 5, customers: 15, products: 5 },
    basic: { invoices: 50, customers: 100, products: 50 },
    pro: { invoices: Infinity, customers: Infinity, products: Infinity }
};

// Store dashboard stats globally for usage tracking
window.lastDashboardStats = {};

// Initialize Modern App - Called by renderer.js after login
function initializeModernApp() {
    console.log('💫 initializeModernApp called');
    
    // Get current user from session or default
    currentUser = getCurrentUser();
    
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

// Load Dashboard
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
    console.log(`🔔 Toast: ${message} (${type})`);
    
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
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 300);
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
    console.log('🔍 Searching for:', query);
    showToast(`Suche nach: ${query}`, 'info');
}

// Simple page implementations for testing navigation
async function loadInvoices() {
    console.log('📄 Loading invoices page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Rechnungen</h2>
            <p>Hier werden alle Rechnungen angezeigt.</p>
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="window.navigateTo('create-invoice')">
                    <i class="fas fa-plus"></i>
                    Neue Rechnung
                </button>
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadCreateInvoice() {
    console.log('➕ Loading create invoice page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Neue Rechnung erstellen</h2>
            <p>Hier können Sie eine neue Rechnung erstellen.</p>
            <div class="page-actions">
                <button class="btn-secondary-modern" onclick="window.navigateTo('invoices')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zu Rechnungen
                </button>
            </div>
        </div>
    `;
}

async function loadCustomers() {
    console.log('👥 Loading customers page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Kunden</h2>
            <p>Hier werden alle Kunden angezeigt.</p>
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="window.showAddCustomerModal()">
                    <i class="fas fa-plus"></i>
                    Neuer Kunde
                </button>
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadProducts() {
    console.log('📦 Loading products page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Produkte & Dienstleistungen</h2>
            <p>Hier werden alle Produkte angezeigt.</p>
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="window.showAddProductModal()">
                    <i class="fas fa-plus"></i>
                    Neues Produkt
                </button>
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadReminders() {
    console.log('⏰ Loading reminders page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Mahnungen</h2>
            <p>Hier werden überfällige Rechnungen angezeigt.</p>
            <div class="page-actions">
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadCompanySettings() {
    console.log('🏢 Loading company settings page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Unternehmensdaten</h2>
            <p>Hier können Sie Ihre Firmendaten verwalten.</p>
            <div class="page-actions">
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadProfile() {
    console.log('👤 Loading profile page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Mein Profil</h2>
            <p>Hier können Sie Ihre Profildaten bearbeiten.</p>
            <div class="page-actions">
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

async function loadSettings() {
    console.log('⚙️ Loading settings page...');
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <h2>Einstellungen</h2>
            <p>Hier können Sie die Anwendungseinstellungen verwalten.</p>
            <div class="page-actions">
                <button class="btn-secondary-modern" onclick="window.navigateTo('dashboard')">
                    <i class="fas fa-arrow-left"></i>
                    Zurück zum Dashboard
                </button>
            </div>
        </div>
    `;
}

// Modal Functions
function closeModal(element) {
    const modal = element ? element.closest('.modal-backdrop') : document.querySelector('.modal-backdrop');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 300);
    }
}

function showAddCustomerModal() {
    console.log('👤 Opening add customer modal...');
    showToast('Kunden-Modal wird geöffnet...', 'info');
}

function showAddProductModal() {
    console.log('📦 Opening add product modal...');
    showToast('Produkt-Modal wird geöffnet...', 'info');
}

function showUpgradeModal() {
    console.log('⭐ Opening upgrade modal...');
    showToast('Upgrade-Modal wird geöffnet...', 'info');
}

// Update subscription UI
function updateSubscriptionUI() {
    const usage = getCurrentUsage();
    const userType = currentUser?.subscription_type || 'trial';
    const limits = subscriptionLimits[userType];
    
    console.log('🔄 Updating subscription UI:', userType);
    
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

// Export functions for global access with logging
console.log('🔧 Exporting functions to window object...');

window.initializeModernApp = initializeModernApp;
window.navigateTo = navigateTo;
window.showUpgradeModal = showUpgradeModal;
window.showAddCustomerModal = showAddCustomerModal;
window.showAddProductModal = showAddProductModal;
window.closeModal = closeModal;
window.getCurrentUser = getCurrentUser;
window.getCurrentUsage = getCurrentUsage;
window.escapeHtml = escapeHtml;
window.showToast = showToast;

console.log('✅ Modern app functions exported successfully');
console.log('Available functions:', Object.keys(window).filter(key => typeof window[key] === 'function' && ['initializeModernApp', 'navigateTo', 'showToast'].includes(key)));