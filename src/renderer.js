// Globale Variablen
let currentLanguage = 'de';
let translations = {};
let currentUser = null;
let isAdminMode = false;
let adminEmail = '';
let isInitialized = false;

// Globale Funktionen
window.loadLiveDashboardStats = loadLiveDashboardStats;
window.createNewInvoice = createNewInvoice;
window.manageCustomers = manageCustomers;
window.viewAllInvoices = viewAllInvoices;
window.refreshDashboard = refreshDashboard;

// Customer Management Functions
window.loadCustomersPage = loadCustomersPage;
window.showAddCustomerModal = showAddCustomerModal;
window.hideAddCustomerModal = hideAddCustomerModal;
window.editCustomer = editCustomer;
window.createInvoiceForCustomer = createInvoiceForCustomer;
window.deleteCustomer = deleteCustomer;
window.refreshCustomers = refreshCustomers;

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

// Live Dashboard mit echten Daten
async function loadLiveDashboardStats() {
    console.log('📊 Loading live dashboard stats from database...');
    
    try {
        // Lade Dashboard-Statistiken von der echten Datenbank
        const result = await window.api.getDashboardStats();
        
        if (result.success) {
            const stats = result.stats;
            console.log('✅ Dashboard stats loaded:', stats);
            
            // Update die Statistics-Cards mit echten Daten
            const liveStats = document.getElementById('liveStats');
            if (liveStats) {
                liveStats.innerHTML = `
                    <div class="stat-card" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 25px; border-radius: 12px; text-align: center; animation: fadeInUp 0.5s ease-out;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;">📄 Rechnungen</h4>
                        <div class="stat-value" style="font-size: 32px; font-weight: bold; color: #1976d2;">${stats.totalInvoices || 0}</div>
                        <p style="margin: 5px 0 0 0; color: #1976d2; font-size: 14px;">
                            Bezahlt: ${stats.paidInvoices || 0} | Entwürfe: ${stats.draftInvoices || 0}
                        </p>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 25px; border-radius: 12px; text-align: center; animation: fadeInUp 0.6s ease-out;">
                        <h4 style="margin: 0 0 10px 0; color: #7b1fa2;">👥 Kunden</h4>
                        <div class="stat-value" style="font-size: 32px; font-weight: bold; color: #7b1fa2;">${stats.totalCustomers || 0}</div>
                        <p style="margin: 5px 0 0 0; color: #7b1fa2; font-size: 14px;">Aktive Kunden</p>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #e8f5e8, #c8e6c9); padding: 25px; border-radius: 12px; text-align: center; animation: fadeInUp 0.7s ease-out;">
                        <h4 style="margin: 0 0 10px 0; color: #388e3c;">💰 Gesamtumsatz</h4>
                        <div class="stat-value" style="font-size: 32px; font-weight: bold; color: #388e3c;">€${(stats.totalRevenue || 0).toFixed(2)}</div>
                        <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 14px;">Bezahlte Rechnungen</p>
                    </div>
                    <div class="stat-card" style="background: linear-gradient(135deg, #fff3e0, #ffe0b2); padding: 25px; border-radius: 12px; text-align: center; animation: fadeInUp 0.8s ease-out;">
                        <h4 style="margin: 0 0 10px 0; color: #f57c00;">⏰ Ausstehend</h4>
                        <div class="stat-value" style="font-size: 32px; font-weight: bold; color: #f57c00;">€${(stats.pendingAmount || 0).toFixed(2)}</div>
                        <p style="margin: 5px 0 0 0; color: #f57c00; font-size: 14px;">
                            Überfällig: ${stats.overdueInvoices || 0}
                        </p>
                    </div>
                `;
            }
            
            // Lade letzte Aktivitäten
            loadRecentActivities();
            
        } else {
            console.error('❌ Failed to load dashboard stats:', result.error);
            // Fallback bei Fehler
            showDashboardError();
        }
    } catch (error) {
        console.error('❌ Dashboard stats loading error:', error);
        showDashboardError();
    }
}

// Lade letzte Aktivitäten
async function loadRecentActivities() {
    try {
        // Lade die letzten Rechnungen für Aktivitäts-Timeline
        const invoicesResult = await window.api.getInvoices();
        
        const recentActivities = document.getElementById('recentActivities');
        if (recentActivities && invoicesResult.success) {
            const recentInvoices = invoicesResult.invoices.slice(0, 5); // Nur die letzten 5
            
            if (recentInvoices.length > 0) {
                recentActivities.innerHTML = recentInvoices.map(invoice => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                        <div>
                            <strong style="color: #495057;">Rechnung ${invoice.invoice_number}</strong>
                            <div style="font-size: 14px; color: #6c757d;">
                                ${invoice.company_name || invoice.first_name + ' ' + invoice.last_name}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: #28a745;">€${parseFloat(invoice.total || 0).toFixed(2)}</div>
                            <div style="font-size: 12px; color: #6c757d;">
                                ${getStatusBadge(invoice.status)}
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                recentActivities.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #6c757d;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
                        <p>Noch keine Rechnungen erstellt.</p>
                        <button onclick="createNewInvoice()" style="margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Erste Rechnung erstellen
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Recent activities loading error:', error);
    }
}

// Status Badge Helper
function getStatusBadge(status) {
    const badges = {
        'draft': '<span style="background: #6c757d; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Entwurf</span>',
        'sent': '<span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Versendet</span>',
        'paid': '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Bezahlt</span>',
        'overdue': '<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">Überfällig</span>'
    };
    return badges[status] || badges['draft'];
}

// Dashboard Error Fallback
function showDashboardError() {
    const liveStats = document.getElementById('liveStats');
    if (liveStats) {
        liveStats.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                <h4>⚠️ Fehler beim Laden der Dashboard-Daten</h4>
                <p>Die Datenbank-Verbindung konnte nicht hergestellt werden.</p>
                <button onclick="refreshDashboard()" style="margin-top: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Erneut versuchen
                </button>
            </div>
        `;
    }
}

// Dashboard Action Functions
function createNewInvoice() {
    console.log('🧾 Creating new invoice...');
    if (typeof window.navigateTo === 'function') {
        window.navigateTo('create-invoice');
    } else {
        alert('Rechnung erstellen - Feature wird implementiert!\n\nNavigations-System wird geladen...');
    }
}

function manageCustomers() {
    console.log('👥 Managing customers...');
    if (typeof window.navigateTo === 'function') {
        window.navigateTo('customers');
    } else {
        alert('Kunden verwalten - Feature wird implementiert!\n\nNavigations-System wird geladen...');
    }
}

function viewAllInvoices() {
    console.log('📄 Viewing all invoices...');
    if (typeof window.navigateTo === 'function') {
        window.navigateTo('invoices');
    } else {
        alert('Alle Rechnungen - Feature wird implementiert!\n\nNavigations-System wird geladen...');
    }
}

function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    loadLiveDashboardStats();
}

// Kunden-Management Page
function loadCustomersPage() {
    console.log('👥 Loading customers management page...');
    
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="page-content" style="padding: 30px;">
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <h2 style="margin: 0; color: #2c3e50;">👥 Kunden-Verwaltung</h2>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d;">Verwalten Sie Ihre Kunden und deren Informationen</p>
                    </div>
                    <button onclick="showAddCustomerModal()" 
                            style="padding: 12px 24px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                        ➕ Neuer Kunde
                    </button>
                </div>
                
                <div class="customers-filters" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <input type="text" id="customerSearch" placeholder="Kunden suchen..." 
                               style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; flex: 1; min-width: 200px;">
                        <select id="customerTypeFilter" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Alle Typen</option>
                            <option value="company">Unternehmen</option>
                            <option value="individual">Privatperson</option>
                        </select>
                        <button onclick="refreshCustomers()" style="padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Aktualisieren
                        </button>
                    </div>
                </div>
                
                <div id="customersContainer" class="customers-container">
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 24px;">⏳</div>
                        <p>Lade Kunden...</p>
                    </div>
                </div>
                
                <div id="addCustomerModal" class="modal-backdrop" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; color: #2c3e50;">Neuer Kunde</h3>
                            <button onclick="hideAddCustomerModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">×</button>
                        </div>
                        
                        <form id="addCustomerForm">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Typ:</label>
                                    <select id="customerType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="company">Unternehmen</option>
                                        <option value="individual">Privatperson</option>
                                    </select>
                                </div>
                                <div id="companyNameField">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Firmenname:</label>
                                    <input type="text" id="companyName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Vorname:</label>
                                    <input type="text" id="firstName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nachname:</label>
                                    <input type="text" id="lastName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">E-Mail:</label>
                                    <input type="email" id="customerEmail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Telefon:</label>
                                    <input type="tel" id="customerPhone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Adresse:</label>
                                <input type="text" id="customerAddress" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Stadt:</label>
                                    <input type="text" id="customerCity" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">PLZ:</label>
                                    <input type="text" id="customerPostalCode" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Land:</label>
                                    <input type="text" id="customerCountry" value="Deutschland" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div id="taxIdField" style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">USt-IdNr. (optional):</label>
                                <input type="text" id="customerTaxId" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notizen (optional):</label>
                                <textarea id="customerNotes" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 80px; resize: vertical;"></textarea>
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                                <button type="button" onclick="hideAddCustomerModal()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Abbrechen
                                </button>
                                <button type="submit" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                    Kunde speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Lade Kunden-Daten
        loadCustomersData();
        
        // Setup Form Handlers
        setupCustomerFormHandlers();
    }
}

// Kunden-Daten laden
async function loadCustomersData() {
    console.log('📊 Loading customers data...');
    
    try {
        const result = await window.api.getCustomers();
        const container = document.getElementById('customersContainer');
        
        if (result.success && container) {
            const customers = result.customers;
            
            if (customers.length > 0) {
                container.innerHTML = customers.map(customer => `
                    <div class="customer-card" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 15px; transition: box-shadow 0.3s;">
                        <div style="display: flex; justify-content: between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <h4 style="margin: 0; color: #2c3e50;">
                                        ${customer.type === 'company' ? '🏢' : '👤'} 
                                        ${customer.company_name || `${customer.first_name} ${customer.last_name}`}
                                    </h4>
                                    <span style="background: ${customer.type === 'company' ? '#007bff' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                                        ${customer.type === 'company' ? 'Unternehmen' : 'Privatperson'}
                                    </span>
                                </div>
                                
                                <div style="color: #6c757d; margin-bottom: 10px;">
                                    ${customer.email ? `📧 ${customer.email}` : ''}
                                    ${customer.email && customer.phone ? ' | ' : ''}
                                    ${customer.phone ? `📞 ${customer.phone}` : ''}
                                </div>
                                
                                ${customer.address ? `
                                    <div style="color: #6c757d; font-size: 14px;">
                                        📍 ${customer.address}, ${customer.postal_code || ''} ${customer.city || ''} ${customer.country || ''}
                                    </div>
                                ` : ''}
                                
                                ${customer.notes ? `
                                    <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 14px; color: #495057;">
                                        💬 ${customer.notes}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button onclick="editCustomer(${customer.id})" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    ✏️ Bearbeiten
                                </button>
                                <button onclick="createInvoiceForCustomer(${customer.id})" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    📄 Rechnung
                                </button>
                                <button onclick="deleteCustomer(${customer.id})" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    🗑️ Löschen
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Add hover effects
                container.querySelectorAll('.customer-card').forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.boxShadow = 'none';
                    });
                });
                
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 8px; border: 2px dashed #e9ecef;">
                        <div style="font-size: 48px; margin-bottom: 20px; color: #dee2e6;">👥</div>
                        <h3 style="color: #495057; margin-bottom: 10px;">Noch keine Kunden</h3>
                        <p style="color: #6c757d; margin-bottom: 20px;">Fügen Sie Ihren ersten Kunden hinzu, um mit der Rechnungsstellung zu beginnen.</p>
                        <button onclick="showAddCustomerModal()" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ➕ Ersten Kunden hinzufügen
                        </button>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8d7da; color: #721c24; border-radius: 8px;">
                    <h4>⚠️ Fehler beim Laden der Kunden</h4>
                    <p>${result.error || 'Unbekannter Fehler'}</p>
                    <button onclick="loadCustomersData()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Erneut versuchen
                    </button>
                </div>
            `;
        }
// Customer Form Handlers
function setupCustomerFormHandlers() {
    // Customer Type Change Handler
    const customerType = document.getElementById('customerType');
    const companyNameField = document.getElementById('companyNameField');
    const taxIdField = document.getElementById('taxIdField');
    
    if (customerType) {
        customerType.addEventListener('change', (e) => {
            if (e.target.value === 'individual') {
                companyNameField.style.display = 'none';
                taxIdField.style.display = 'none';
            } else {
                companyNameField.style.display = 'block';
                taxIdField.style.display = 'block';
            }
        });
    }
    
    // Add Customer Form Submit
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddCustomerSubmit();
        });
    }
    
    // Search and Filter Handlers
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('input', debounce(filterCustomers, 300));
    }
    
    const customerTypeFilter = document.getElementById('customerTypeFilter');
    if (customerTypeFilter) {
        customerTypeFilter.addEventListener('change', filterCustomers);
    }
}

// Add Customer Submit Handler
async function handleAddCustomerSubmit() {
    console.log('💾 Saving new customer...');
    
    const customerData = {
        type: document.getElementById('customerType').value,
        companyName: document.getElementById('companyName').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value,
        city: document.getElementById('customerCity').value,
        postalCode: document.getElementById('customerPostalCode').value,
        country: document.getElementById('customerCountry').value,
        taxId: document.getElementById('customerTaxId').value,
        notes: document.getElementById('customerNotes').value
    };
    
    // Validation
    if (!customerData.firstName || !customerData.lastName) {
        alert('Bitte geben Sie Vor- und Nachname ein.');
        return;
    }
    
    if (customerData.type === 'company' && !customerData.companyName) {
        alert('Bitte geben Sie einen Firmennamen ein.');
        return;
    }
    
    try {
        const result = await window.api.addCustomer(customerData);
        
        if (result.success) {
            console.log('✅ Customer added successfully');
            showToast('Kunde erfolgreich hinzugefügt!', 'success');
            hideAddCustomerModal();
            loadCustomersData(); // Reload customers
        } else {
            console.error('❌ Failed to add customer:', result.error);
            alert('Fehler beim Hinzufügen des Kunden: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Add customer error:', error);
        alert('Verbindungsfehler beim Hinzufügen des Kunden.');
    }
}

// Modal Functions
function showAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        document.getElementById('addCustomerForm').reset();
        document.getElementById('customerCountry').value = 'Deutschland';
    }
}

function hideAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Customer Actions
function editCustomer(customerId) {
    console.log('✏️ Editing customer:', customerId);
    alert('Kunde bearbeiten - Feature wird implementiert!\nKunden-ID: ' + customerId);
}

function createInvoiceForCustomer(customerId) {
    console.log('📄 Creating invoice for customer:', customerId);
    alert('Rechnung für Kunden erstellen - Feature wird implementiert!\nKunden-ID: ' + customerId);
}

async function deleteCustomer(customerId) {
    console.log('🗑️ Deleting customer:', customerId);
    
    if (confirm('Sind Sie sicher, dass Sie diesen Kunden löschen möchten?')) {
        try {
            const result = await window.api.deleteCustomer(customerId);
            
            if (result.success) {
                showToast('Kunde erfolgreich gelöscht!', 'success');
                loadCustomersData(); // Reload customers
            } else {
                alert('Fehler beim Löschen des Kunden: ' + result.error);
            }
        } catch (error) {
            console.error('❌ Delete customer error:', error);
            alert('Verbindungsfehler beim Löschen des Kunden.');
        }
    }
}

function refreshCustomers() {
    console.log('🔄 Refreshing customers...');
    loadCustomersData();
}

// Filter Functions
function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const typeFilter = document.getElementById('customerTypeFilter').value;
    
    const customerCards = document.querySelectorAll('.customer-card');
    
    customerCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesType = !typeFilter || card.innerHTML.includes(typeFilter === 'company' ? 'Unternehmen' : 'Privatperson');
        
        if (matchesSearch && matchesType) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update manageCustomers function
function manageCustomers() {
    console.log('👥 Managing customers...');
    loadCustomersPage();
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
                            console.log('🎉 Login successful! Transitioning to main app...');
                            showMainApp(result.user);
                        } else {
                            console.log('❌ Login failed:', result?.error || 'Unbekannter Fehler');
                            showErrorWithAnimation(result?.error || 'Login fehlgeschlagen');
                        }
                    } else {
                        console.error('❌ API not available');
                        showErrorWithAnimation('API nicht verfügbar');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showErrorWithAnimation('Fehler beim Login: ' + error.message);
                }
            });
            console.log('✅ LOGIN button handler added');
        }
        
        // REGISTER LINK - Direkt an Link
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 REGISTER LINK CLICKED!');
                showRegistrationForm();
            });
            console.log('✅ REGISTER link handler added');
        }
        
        // FORGOT PASSWORD LINK - Mit ID
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 FORGOT PASSWORD LINK CLICKED!');
                showForgotPasswordForm();
            });
            console.log('✅ FORGOT PASSWORD link handler added');
        } else {
            // Fallback für data-i18n Selektor
            const forgotPasswordFallback = document.querySelector('a[data-i18n="login.forgotPassword"]');
            if (forgotPasswordFallback) {
                forgotPasswordFallback.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🔘 FORGOT PASSWORD LINK CLICKED! (fallback)');
                    showForgotPasswordForm();
                });
                console.log('✅ FORGOT PASSWORD link handler added (fallback)');
            }
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
            console.log('📋 Showing LIVE dashboard with real database data...');
            // LIVE Dashboard mit echten Daten aus der Datenbank
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div class="page-content" style="padding: 30px;">
                        <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                            <div>
                                <h2 style="margin: 0; color: #2c3e50;">🎯 Willkommen zurück, <strong>${user.first_name || user.email}</strong>!</h2>
                                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Dashboard mit Live-Daten aus SQLite-Datenbank</p>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 12px; color: #95a5a6;">Letzter Login</div>
                                <div style="font-weight: bold; color: #34495e;">${new Date().toLocaleDateString('de-DE')}</div>
                            </div>
                        </div>
                        
                        <div id="liveStats" class="live-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0;">
                            <div class="stat-card loading" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 25px; border-radius: 12px; text-align: center; position: relative;">
                                <h4 style="margin: 0 0 10px 0; color: #1976d2;">📄 Rechnungen</h4>
                                <div class="stat-value" style="font-size: 28px; font-weight: bold; color: #1976d2;">⏳</div>
                                <p style="margin: 5px 0 0 0; color: #1976d2; font-size: 14px;">Wird geladen...</p>
                            </div>
                            <div class="stat-card loading" style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 25px; border-radius: 12px; text-align: center; position: relative;">
                                <h4 style="margin: 0 0 10px 0; color: #7b1fa2;">👥 Kunden</h4>
                                <div class="stat-value" style="font-size: 28px; font-weight: bold; color: #7b1fa2;">⏳</div>
                                <p style="margin: 5px 0 0 0; color: #7b1fa2; font-size: 14px;">Wird geladen...</p>
                            </div>
                            <div class="stat-card loading" style="background: linear-gradient(135deg, #e8f5e8, #c8e6c9); padding: 25px; border-radius: 12px; text-align: center; position: relative;">
                                <h4 style="margin: 0 0 10px 0; color: #388e3c;">💰 Gesamtumsatz</h4>
                                <div class="stat-value" style="font-size: 28px; font-weight: bold; color: #388e3c;">⏳</div>
                                <p style="margin: 5px 0 0 0; color: #388e3c; font-size: 14px;">Wird geladen...</p>
                            </div>
                            <div class="stat-card loading" style="background: linear-gradient(135deg, #fff3e0, #ffe0b2); padding: 25px; border-radius: 12px; text-align: center; position: relative;">
                                <h4 style="margin: 0 0 10px 0; color: #f57c00;">⏰ Ausstehend</h4>
                                <div class="stat-value" style="font-size: 28px; font-weight: bold; color: #f57c00;">⏳</div>
                                <p style="margin: 5px 0 0 0; color: #f57c00; font-size: 14px;">Wird geladen...</p>
                            </div>
                        </div>
                        
                        <div class="recent-activity" style="margin-top: 30px; padding: 25px; background: #f8f9fa; border-radius: 12px; border-left: 4px solid #007bff;">
                            <h3 style="margin: 0 0 20px 0; color: #2c3e50;">📊 Letzte Aktivitäten</h3>
                            <div id="recentActivities" style="color: #6c757d;">
                                <div style="text-align: center; padding: 20px;">
                                    <div style="font-size: 20px;">⏳</div>
                                    <p>Lade letzte Aktivitäten...</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="quick-actions" style="margin-top: 30px;">
                            <h3 style="color: #2c3e50; margin-bottom: 20px;">🚀 Schnellaktionen</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                <button onclick="createNewInvoice()" 
                                        style="padding: 15px 20px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                                    ➕ Neue Rechnung erstellen
                                </button>
                                <button onclick="manageCustomers()" 
                                        style="padding: 15px 20px; background: linear-gradient(135deg, #007bff, #0056b3); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
                                    👤 Kunden verwalten
                                </button>
                                <button onclick="viewAllInvoices()" 
                                        style="padding: 15px 20px; background: linear-gradient(135deg, #6f42c1, #5a2d91); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s; box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);">
                                    📄 Alle Rechnungen
                                </button>
                                <button onclick="refreshDashboard()" 
                                        style="padding: 15px 20px; background: linear-gradient(135deg, #17a2b8, #138496); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s; box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">
                                    🔄 Aktualisieren
                                </button>
                            </div>
                        </div>
                        
                        <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 8px; border-left: 4px solid #28a745;">
                            <h4 style="margin: 0 0 10px 0; color: #155724;">✅ SQLite-Datenbank aktiv!</h4>
                            <p style="margin: 0; color: #155724;">Ihre Daten werden persistent in der lokalen SQLite-Datenbank gespeichert. Alle Business-Features sind verfügbar.</p>
                        </div>
                    </div>
                `;
                
                console.log('✅ Live dashboard with real data initialized');
                
                // Lade echte Statistiken aus der Datenbank
                loadLiveDashboardStats();
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

// Kunden-Management Page
function loadCustomersPage() {
    console.log('👥 Loading customers management page...');
    
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="page-content" style="padding: 30px;">
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div>
                        <h2 style="margin: 0; color: #2c3e50;">👥 Kunden-Verwaltung</h2>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d;">Verwalten Sie Ihre Kunden und deren Informationen</p>
                    </div>
                    <button onclick="showAddCustomerModal()" 
                            style="padding: 12px 24px; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                        ➕ Neuer Kunde
                    </button>
                </div>
                
                <div class="customers-filters" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <input type="text" id="customerSearch" placeholder="Kunden suchen..." 
                               style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; flex: 1; min-width: 200px;">
                        <select id="customerTypeFilter" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Alle Typen</option>
                            <option value="company">Unternehmen</option>
                            <option value="individual">Privatperson</option>
                        </select>
                        <button onclick="refreshCustomers()" style="padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            🔄 Aktualisieren
                        </button>
                    </div>
                </div>
                
                <div id="customersContainer" class="customers-container">
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 24px;">⏳</div>
                        <p>Lade Kunden...</p>
                    </div>
                </div>
                
                <div id="addCustomerModal" class="modal-backdrop" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; color: #2c3e50;">Neuer Kunde</h3>
                            <button onclick="hideAddCustomerModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6c757d;">×</button>
                        </div>
                        
                        <form id="addCustomerForm">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Typ:</label>
                                    <select id="customerType" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                        <option value="company">Unternehmen</option>
                                        <option value="individual">Privatperson</option>
                                    </select>
                                </div>
                                <div id="companyNameField">
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Firmenname:</label>
                                    <input type="text" id="companyName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Vorname:</label>
                                    <input type="text" id="firstName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nachname:</label>
                                    <input type="text" id="lastName" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">E-Mail:</label>
                                    <input type="email" id="customerEmail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Telefon:</label>
                                    <input type="tel" id="customerPhone" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Adresse:</label>
                                <input type="text" id="customerAddress" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Stadt:</label>
                                    <input type="text" id="customerCity" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">PLZ:</label>
                                    <input type="text" id="customerPostalCode" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                                <div>
                                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Land:</label>
                                    <input type="text" id="customerCountry" value="Deutschland" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                </div>
                            </div>
                            
                            <div id="taxIdField" style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">USt-IdNr. (optional):</label>
                                <input type="text" id="customerTaxId" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notizen (optional):</label>
                                <textarea id="customerNotes" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 80px; resize: vertical;"></textarea>
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                                <button type="button" onclick="hideAddCustomerModal()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Abbrechen
                                </button>
                                <button type="submit" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                                    Kunde speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Lade Kunden-Daten
        loadCustomersData();
        
        // Setup Form Handlers
        setupCustomerFormHandlers();
    }
}

// Kunden-Daten laden
async function loadCustomersData() {
    console.log('📊 Loading customers data...');
    
    try {
        const result = await window.api.getCustomers();
        const container = document.getElementById('customersContainer');
        
        if (result.success && container) {
            const customers = result.customers;
            
            if (customers.length > 0) {
                container.innerHTML = customers.map(customer => `
                    <div class="customer-card" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 15px; transition: box-shadow 0.3s;">
                        <div style="display: flex; justify-content: between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <h4 style="margin: 0; color: #2c3e50;">
                                        ${customer.type === 'company' ? '🏢' : '👤'} 
                                        ${customer.company_name || `${customer.first_name} ${customer.last_name}`}
                                    </h4>
                                    <span style="background: ${customer.type === 'company' ? '#007bff' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                                        ${customer.type === 'company' ? 'Unternehmen' : 'Privatperson'}
                                    </span>
                                </div>
                                
                                <div style="color: #6c757d; margin-bottom: 10px;">
                                    ${customer.email ? `📧 ${customer.email}` : ''}
                                    ${customer.email && customer.phone ? ' | ' : ''}
                                    ${customer.phone ? `📞 ${customer.phone}` : ''}
                                </div>
                                
                                ${customer.address ? `
                                    <div style="color: #6c757d; font-size: 14px;">
                                        📍 ${customer.address}, ${customer.postal_code || ''} ${customer.city || ''} ${customer.country || ''}
                                    </div>
                                ` : ''}
                                
                                ${customer.notes ? `
                                    <div style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 14px; color: #495057;">
                                        💬 ${customer.notes}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button onclick="editCustomer(${customer.id})" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    ✏️ Bearbeiten
                                </button>
                                <button onclick="createInvoiceForCustomer(${customer.id})" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    📄 Rechnung
                                </button>
                                <button onclick="deleteCustomer(${customer.id})" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                    🗑️ Löschen
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Add hover effects
                container.querySelectorAll('.customer-card').forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.boxShadow = 'none';
                    });
                });
                
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 8px; border: 2px dashed #e9ecef;">
                        <div style="font-size: 48px; margin-bottom: 20px; color: #dee2e6;">👥</div>
                        <h3 style="color: #495057; margin-bottom: 10px;">Noch keine Kunden</h3>
                        <p style="color: #6c757d; margin-bottom: 20px;">Fügen Sie Ihren ersten Kunden hinzu, um mit der Rechnungsstellung zu beginnen.</p>
                        <button onclick="showAddCustomerModal()" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ➕ Ersten Kunden hinzufügen
                        </button>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8d7da; color: #721c24; border-radius: 8px;">
                    <h4>⚠️ Fehler beim Laden der Kunden</h4>
                    <p>${result.error || 'Unbekannter Fehler'}</p>
                    <button onclick="loadCustomersData()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Erneut versuchen
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Customers loading error:', error);
    }
}

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