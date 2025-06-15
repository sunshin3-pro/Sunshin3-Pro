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

// Load Dashboard
async function loadDashboard() {
    const stats = await window.api.getDashboardStats();
    const recentInvoices = await window.api.getInvoices();
    
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
        <div class="page-content animate-fade-in">
            <form id="companyForm" class="settings-form">
                <div class="form-section">
                    <h3>Firmendaten</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Firmenname</label>
                        <input type="text" class="form-input-modern" id="companyName" value="${currentUser?.company_name || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Steuernummer</label>
                            <input type="text" class="form-input-modern" id="taxId" placeholder="DE123456789">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Handelsregisternummer</label>
                            <input type="text" class="form-input-modern" id="registryNumber">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Kontaktdaten</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail</label>
                            <input type="email" class="form-input-modern" id="companyEmail" value="${currentUser?.email || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Telefon</label>
                            <input type="tel" class="form-input-modern" id="companyPhone" value="${currentUser?.phone || ''}">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Adresse</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Straße und Hausnummer</label>
                        <input type="text" class="form-input-modern" id="companyAddress" value="${currentUser?.address || ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">PLZ</label>
                            <input type="text" class="form-input-modern" id="companyPostalCode" value="${currentUser?.postal_code || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Stadt</label>
                            <input type="text" class="form-input-modern" id="companyCity" value="${currentUser?.city || ''}">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Logo</h3>
                    <div class="logo-upload">
                        <div class="logo-preview">
                            <i class="fas fa-image"></i>
                        </div>
                        <button type="button" class="btn-secondary-modern">
                            <i class="fas fa-upload"></i>
                            Logo hochladen
                        </button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Speichern
                    </button>
                </div>
            </form>
        </div>
    `;
}

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
    // Get actual usage from current data
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

// CRUD Operations
async function viewInvoice(id) {
    showToast('Rechnung wird geladen...', 'info');
    // Implementation for viewing invoice
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

async function editCustomer(id) {
    showToast('Kunde bearbeiten - In Entwicklung', 'info');
}

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

async function editProduct(id) {
    showToast('Produkt bearbeiten - In Entwicklung', 'info');
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

// NEUE FUNKTIONEN - Implementierung der fehlenden Seiten

// Load Reminders
async function loadReminders() {
    const remindersResult = await window.api.getReminders();
    const reminders = remindersResult.success ? remindersResult.reminders : [];
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="page-actions">
                <button class="btn-primary-modern" onclick="showReminderSettings()">
                    <i class="fas fa-cog"></i>
                    Mahnungseinstellungen
                </button>
            </div>
            
            ${reminders.length > 0 ? `
                <div class="stats-grid-modern" style="margin-bottom: 30px;">
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
                        </div>
                        <div class="stat-value">${reminders.length}</div>
                        <div class="stat-label">Überfällige Rechnungen</div>
                    </div>
                    
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-euro-sign" style="color: var(--warning);"></i>
                        </div>
                        <div class="stat-value">€${reminders.reduce((sum, r) => sum + r.total, 0).toFixed(2)}</div>
                        <div class="stat-label">Offener Betrag</div>
                    </div>
                    
                    <div class="stat-card-modern">
                        <div class="stat-icon-wrapper">
                            <i class="fas fa-clock" style="color: var(--accent-primary);"></i>
                        </div>
                        <div class="stat-value">${Math.max(...reminders.map(r => Math.floor(r.days_overdue)))}</div>
                        <div class="stat-label">Max. Tage überfällig</div>
                    </div>
                </div>
                
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
                                    <td>
                                        <span class="badge-modern badge-error">
                                            ${Math.floor(reminder.days_overdue)} Tage
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn-icon" onclick="sendReminder(${reminder.id})" title="Mahnung senden">
                                                <i class="fas fa-bell"></i>
                                            </button>
                                            <button class="btn-icon" onclick="markAsPaid(${reminder.id})" title="Als bezahlt markieren">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn-icon" onclick="viewInvoice(${reminder.id})" title="Rechnung ansehen">
                                                <i class="fas fa-eye"></i>
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
                        <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    </div>
                    <h3>Keine überfälligen Rechnungen</h3>
                    <p>Alle Rechnungen sind bezahlt oder noch nicht fällig</p>
                </div>
            `}
        </div>
    `;
}

// Load Company Settings
async function loadCompanySettings() {
    const result = await window.api.getCompanySettings();
    const settings = result.success ? result.settings : {};
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <form id="companySettingsForm" class="settings-form">
                <div class="form-section">
                    <h3>Grundinformationen</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Firmenname *</label>
                            <input type="text" class="form-input-modern" name="name" value="${settings.name || ''}" required>
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">E-Mail *</label>
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
                            <input type="url" class="form-input-modern" name="website" value="${settings.website || ''}" placeholder="https://example.com">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Adresse</h3>
                    <div class="form-group-modern">
                        <label class="form-label-modern">Straße und Hausnummer</label>
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
                
                <div class="form-section">
                    <h3>Steuerliche Informationen</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Steuernummer</label>
                            <input type="text" class="form-input-modern" name="taxId" value="${settings.taxId || ''}">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">USt-IdNr.</label>
                            <input type="text" class="form-input-modern" name="vatId" value="${settings.vatId || ''}" placeholder="DE123456789">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>Bankverbindung</h3>
                    <div class="form-row">
                        <div class="form-group-modern">
                            <label class="form-label-modern">IBAN</label>
                            <input type="text" class="form-input-modern" name="iban" value="${settings.iban || ''}" placeholder="DE89 3704 0044 0532 0130 00">
                        </div>
                        <div class="form-group-modern">
                            <label class="form-label-modern">BIC</label>
                            <input type="text" class="form-input-modern" name="bic" value="${settings.bic || ''}" placeholder="COBADEFFXXX">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Bank</label>
                        <input type="text" class="form-input-modern" name="bankAccount" value="${settings.bankAccount || ''}" placeholder="Deutsche Bank AG">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary-modern">
                        <i class="fas fa-save"></i>
                        Speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Form submission
    document.getElementById('companySettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const companyData = {};
        formData.forEach((value, key) => {
            companyData[key] = value;
        });
        
        const result = await window.api.updateCompanySettings(companyData);
        
        if (result.success) {
            showToast('Unternehmensdaten erfolgreich gespeichert', 'success');
        } else {
            showToast(result.error || 'Fehler beim Speichern', 'error');
        }
    });
}

// Load Settings
async function loadSettings() {
    const result = await window.api.getSettings();
    const settings = result.success ? result.settings : {};
    
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="settings-container animate-fade-in">
            <div class="settings-nav">
                <div class="settings-nav-item active" onclick="showSettingsTab('general')">
                    <i class="fas fa-cog"></i>
                    <span>Allgemein</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('invoice')">
                    <i class="fas fa-file-invoice"></i>
                    <span>Rechnungen</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('email')">
                    <i class="fas fa-envelope"></i>
                    <span>E-Mail</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('backup')">
                    <i class="fas fa-database"></i>
                    <span>Backup</span>
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('subscription')">
                    <i class="fas fa-crown"></i>
                    <span>Abonnement</span>
                </div>
            </div>
            
            <div class="settings-content">
                <!-- General Settings -->
                <div class="settings-section active" id="general-settings">
                    <h2>Allgemeine Einstellungen</h2>
                    
                    <div class="settings-group">
                        <h3>Sprache und Region</h3>
                        <div class="form-group-modern">
                            <label class="form-label-modern">Sprache</label>
                            <select class="form-input-modern" id="language-select">
                                <option value="de" ${(settings.language || 'de') === 'de' ? 'selected' : ''}>Deutsch</option>
                                <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                                <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>Français</option>
                                <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Español</option>
                                <option value="it" ${settings.language === 'it' ? 'selected' : ''}>Italiano</option>
                            </select>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Währung</label>
                            <select class="form-input-modern" id="currency-select">
                                <option value="EUR" ${(settings.currency || 'EUR') === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>US Dollar ($)</option>
                                <option value="CHF" ${settings.currency === 'CHF' ? 'selected' : ''}>Schweizer Franken (CHF)</option>
                                <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>Britisches Pfund (£)</option>
                            </select>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Datumsformat</label>
                            <select class="form-input-modern" id="dateFormat-select">
                                <option value="DD.MM.YYYY" ${(settings.dateFormat || 'DD.MM.YYYY') === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                                <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>
                    
                    <button class="btn-primary-modern" onclick="saveGeneralSettings()">
                        <i class="fas fa-save"></i>
                        Speichern
                    </button>
                </div>
                
                <!-- Invoice Settings -->
                <div class="settings-section" id="invoice-settings">
                    <h2>Rechnungseinstellungen</h2>
                    
                    <div class="settings-group">
                        <h3>Rechnungsnummern</h3>
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Präfix</label>
                                <input type="text" class="form-input-modern" id="invoicePrefix" value="${settings.invoicePrefix || 'RE'}" placeholder="RE">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Nächste Nummer</label>
                                <input type="number" class="form-input-modern" id="nextInvoiceNumber" value="${settings.nextInvoiceNumber || '1'}" min="1">
                            </div>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Zahlungsziel (Tage)</label>
                            <input type="number" class="form-input-modern" id="paymentTermsDays" value="${settings.paymentTermsDays || '14'}" min="1" max="365">
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Standard Fußzeile</label>
                            <textarea class="form-input-modern" id="invoiceFooter" rows="3" placeholder="Vielen Dank für Ihr Vertrauen!">${settings.invoiceFooter || ''}</textarea>
                        </div>
                    </div>
                    
                    <button class="btn-primary-modern" onclick="saveInvoiceSettings()">
                        <i class="fas fa-save"></i>
                        Speichern
                    </button>
                </div>
                
                <!-- Email Settings -->
                <div class="settings-section" id="email-settings">
                    <h2>E-Mail Einstellungen</h2>
                    
                    <div class="settings-group">
                        <h3>SMTP Konfiguration</h3>
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">SMTP Server</label>
                                <input type="text" class="form-input-modern" id="smtpHost" value="${settings.smtp_host || ''}" placeholder="smtp.gmail.com">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Port</label>
                                <input type="number" class="form-input-modern" id="smtpPort" value="${settings.smtp_port || '587'}" placeholder="587">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Benutzername</label>
                                <input type="email" class="form-input-modern" id="smtpUser" value="${settings.smtp_user || ''}" placeholder="your.email@gmail.com">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">Passwort</label>
                                <input type="password" class="form-input-modern" id="smtpPassword" value="${settings.smtp_password || ''}" placeholder="App-Passwort">
                            </div>
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="checkbox-modern">
                                <input type="checkbox" id="smtpSecure" ${settings.smtp_secure === 'true' ? 'checked' : ''}>
                                <span>SSL/TLS verwenden</span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn-secondary-modern" onclick="testEmailConnection()">
                                <i class="fas fa-plug"></i>
                                Verbindung testen
                            </button>
                            <button class="btn-primary-modern" onclick="saveEmailSettings()">
                                <i class="fas fa-save"></i>
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Backup Settings -->
                <div class="settings-section" id="backup-settings">
                    <h2>Backup & Export</h2>
                    
                    <div class="settings-group">
                        <h3>Datenbank Backup</h3>
                        <p class="text-secondary">Erstellen Sie regelmäßig Backups Ihrer Daten</p>
                        
                        <div class="backup-actions">
                            <button class="btn-primary-modern" onclick="createBackup()">
                                <i class="fas fa-download"></i>
                                Backup erstellen
                            </button>
                            <button class="btn-secondary-modern" onclick="restoreBackup()">
                                <i class="fas fa-upload"></i>
                                Backup wiederherstellen
                            </button>
                        </div>
                        
                        <div class="backup-info">
                            <h4>Automatische Backups</h4>
                            <label class="checkbox-modern">
                                <input type="checkbox" id="autoBackup" ${settings.autoBackup === 'true' ? 'checked' : ''}>
                                <span>Tägliche automatische Backups</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Subscription Settings -->
                <div class="settings-section" id="subscription-settings">
                    <h2>Abonnement verwalten</h2>
                    
                    <div class="subscription-status-card">
                        <div class="subscription-header">
                            <h3>Aktuelles Abonnement</h3>
                            <span class="subscription-badge-modern ${currentUser?.subscription_type || 'trial'}">
                                ${getSubscriptionLabel(currentUser?.subscription_type || 'trial')}
                            </span>
                        </div>
                        
                        <div class="subscription-details">
                            <div class="detail-item">
                                <span>Status:</span>
                                <span>Aktiv</span>
                            </div>
                            <div class="detail-item">
                                <span>Läuft ab:</span>
                                <span>${currentUser?.subscription_expires ? formatDate(currentUser.subscription_expires) : 'Unbekannt'}</span>
                            </div>
                        </div>
                        
                        <div class="subscription-limits">
                            <h4>Aktuelle Limits</h4>
                            <div class="limits-grid">
                                <div class="limit-item">
                                    <span>Rechnungen:</span>
                                    <span>${subscriptionLimits[currentUser?.subscription_type || 'trial'].invoices === Infinity ? 'Unbegrenzt' : subscriptionLimits[currentUser?.subscription_type || 'trial'].invoices}</span>
                                </div>
                                <div class="limit-item">
                                    <span>Kunden:</span>
                                    <span>${subscriptionLimits[currentUser?.subscription_type || 'trial'].customers === Infinity ? 'Unbegrenzt' : subscriptionLimits[currentUser?.subscription_type || 'trial'].customers}</span>
                                </div>
                                <div class="limit-item">
                                    <span>Produkte:</span>
                                    <span>${subscriptionLimits[currentUser?.subscription_type || 'trial'].products === Infinity ? 'Unbegrenzt' : subscriptionLimits[currentUser?.subscription_type || 'trial'].products}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="subscription-actions">
                            <button class="btn-primary-modern" onclick="showUpgradeModal()">
                                <i class="fas fa-crown"></i>
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load Profile
async function loadProfile() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = `
        <div class="page-content animate-fade-in">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${(currentUser?.first_name?.charAt(0) || 'U') + (currentUser?.last_name?.charAt(0) || 'U')}
                </div>
                <div class="profile-info">
                    <h2>${currentUser?.first_name || 'Unbekannt'} ${currentUser?.last_name || 'Benutzer'}</h2>
                    <p>${currentUser?.email || 'Keine E-Mail'}</p>
                    <span class="subscription-badge-modern ${currentUser?.subscription_type || 'trial'}">
                        ${getSubscriptionLabel(currentUser?.subscription_type || 'trial')}
                    </span>
                </div>
            </div>
            
            <div class="profile-content">
                <div class="profile-tabs">
                    <button class="tab-btn active" onclick="showProfileTab('personal')">
                        <i class="fas fa-user"></i>
                        Persönliche Daten
                    </button>
                    <button class="tab-btn" onclick="showProfileTab('security')">
                        <i class="fas fa-shield-alt"></i>
                        Sicherheit
                    </button>
                    <button class="tab-btn" onclick="showProfileTab('preferences')">
                        <i class="fas fa-cog"></i>
                        Einstellungen
                    </button>
                </div>
                
                <div class="profile-tab-content">
                    <!-- Personal Data Tab -->
                    <div class="tab-panel active" id="personal-tab">
                        <h3>Persönliche Informationen</h3>
                        <form id="profileForm" class="profile-form">
                            <div class="form-row">
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Vorname</label>
                                    <input type="text" class="form-input-modern" name="first_name" value="${currentUser?.first_name || ''}" required>
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Nachname</label>
                                    <input type="text" class="form-input-modern" name="last_name" value="${currentUser?.last_name || ''}" required>
                                </div>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">E-Mail</label>
                                <input type="email" class="form-input-modern" name="email" value="${currentUser?.email || ''}" readonly>
                                <small class="form-hint">E-Mail kann nicht geändert werden</small>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Telefon</label>
                                    <input type="tel" class="form-input-modern" name="phone" value="${currentUser?.phone || ''}">
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Firma</label>
                                    <input type="text" class="form-input-modern" name="company_name" value="${currentUser?.company_name || ''}">
                                </div>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Adresse</label>
                                <input type="text" class="form-input-modern" name="address" value="${currentUser?.address || ''}">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group-modern">
                                    <label class="form-label-modern">PLZ</label>
                                    <input type="text" class="form-input-modern" name="postal_code" value="${currentUser?.postal_code || ''}">
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Stadt</label>
                                    <input type="text" class="form-input-modern" name="city" value="${currentUser?.city || ''}">
                                </div>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Land</label>
                                    <input type="text" class="form-input-modern" name="country" value="${currentUser?.country || 'Deutschland'}">
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary-modern">
                                <i class="fas fa-save"></i>
                                Speichern
                            </button>
                        </form>
                    </div>
                    
                    <!-- Security Tab -->
                    <div class="tab-panel" id="security-tab">
                        <h3>Passwort ändern</h3>
                        <form id="passwordForm" class="profile-form">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Aktuelles Passwort</label>
                                <input type="password" class="form-input-modern" name="currentPassword" required>
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Neues Passwort</label>
                                <input type="password" class="form-input-modern" name="newPassword" required minlength="6">
                            </div>
                            
                            <div class="form-group-modern">
                                <label class="form-label-modern">Passwort bestätigen</label>
                                <input type="password" class="form-input-modern" name="confirmPassword" required>
                            </div>
                            
                            <button type="submit" class="btn-primary-modern">
                                <i class="fas fa-key"></i>
                                Passwort ändern
                            </button>
                        </form>
                    </div>
                    
                    <!-- Preferences Tab -->
                    <div class="tab-panel" id="preferences-tab">
                        <h3>Einstellungen</h3>
                        <div class="preferences-form">
                            <div class="preference-item">
                                <label class="checkbox-modern">
                                    <input type="checkbox" id="emailNotifications" checked>
                                    <span>E-Mail Benachrichtigungen erhalten</span>
                                </label>
                            </div>
                            
                            <div class="preference-item">
                                <label class="checkbox-modern">
                                    <input type="checkbox" id="autoSave" checked>
                                    <span>Automatisches Speichern</span>
                                </label>
                            </div>
                            
                            <div class="preference-item">
                                <label class="form-label-modern">Theme</label>
                                <select class="form-input-modern" id="theme">
                                    <option value="dark">Dark Mode</option>
                                    <option value="light">Light Mode</option>
                                    <option value="auto">Automatisch</option>
                                </select>
                            </div>
                            
                            <button class="btn-primary-modern" onclick="savePreferences()">
                                <i class="fas fa-save"></i>
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Form handlers
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = {};
        formData.forEach((value, key) => {
            profileData[key] = value;
        });
        
        const result = await window.api.updateProfile(profileData);
        
        if (result.success) {
            showToast('Profil erfolgreich aktualisiert', 'success');
            // Update current user object
            Object.assign(currentUser, profileData);
        } else {
            showToast(result.error || 'Fehler beim Aktualisieren', 'error');
        }
    });
    
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword')
        };
        
        if (passwordData.newPassword !== formData.get('confirmPassword')) {
            showToast('Passwörter stimmen nicht überein', 'error');
            return;
        }
        
        const result = await window.api.changePassword(passwordData);
        
        if (result.success) {
            showToast('Passwort erfolgreich geändert', 'success');
            e.target.reset();
        } else {
            showToast(result.error || 'Fehler beim Ändern des Passworts', 'error');
        }
    });
}

// Helper functions for Settings and Profile
function showSettingsTab(tabName) {
    // Remove active class from all nav items and sections
    document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked nav item and corresponding section
    event.target.closest('.settings-nav-item').classList.add('active');
    document.getElementById(tabName + '-settings').classList.add('active');
}

function showProfileTab(tabName) {
    // Remove active class from all tab buttons and panels
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // Add active class to clicked button and corresponding panel
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Settings save functions
async function saveGeneralSettings() {
    const settings = {
        language: document.getElementById('language-select').value,
        currency: document.getElementById('currency-select').value,
        dateFormat: document.getElementById('dateFormat-select').value
    };
    
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('Allgemeine Einstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function saveInvoiceSettings() {
    const settings = {
        invoicePrefix: document.getElementById('invoicePrefix').value,
        nextInvoiceNumber: document.getElementById('nextInvoiceNumber').value,
        paymentTermsDays: document.getElementById('paymentTermsDays').value,
        invoiceFooter: document.getElementById('invoiceFooter').value
    };
    
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('Rechnungseinstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function saveEmailSettings() {
    const settings = {
        smtp_host: document.getElementById('smtpHost').value,
        smtp_port: document.getElementById('smtpPort').value,
        smtp_user: document.getElementById('smtpUser').value,
        smtp_password: document.getElementById('smtpPassword').value,
        smtp_secure: document.getElementById('smtpSecure').checked.toString()
    };
    
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('E-Mail Einstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function testEmailConnection() {
    const config = {
        host: document.getElementById('smtpHost').value,
        port: document.getElementById('smtpPort').value,
        user: document.getElementById('smtpUser').value,
        password: document.getElementById('smtpPassword').value,
        secure: document.getElementById('smtpSecure').checked.toString()
    };
    
    showToast('Teste Verbindung...', 'info');
    
    const result = await window.api.testEmailConnection(config);
    
    if (result.success) {
        showToast(result.message, 'success');
    } else {
        showToast(result.error || 'Verbindungstest fehlgeschlagen', 'error');
    }
}

async function createBackup() {
    showToast('Erstelle Backup...', 'info');
    
    const result = await window.api.createBackup();
    
    if (result.success) {
        showToast('Backup erfolgreich erstellt: ' + result.path, 'success');
    } else {
        showToast('Fehler beim Erstellen des Backups', 'error');
    }
}

function restoreBackup() {
    showToast('Backup-Wiederherstellung - In Entwicklung', 'info');
}

function savePreferences() {
    showToast('Einstellungen gespeichert', 'success');
}

// Reminder functions
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

// Export functions for global access
window.navigateTo = navigateTo;
window.showUpgradeModal = showUpgradeModal;
window.upgradeSubscription = upgradeSubscription;