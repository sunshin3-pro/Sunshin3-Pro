// Teil 2: Rest der Implementierung für moderne-app-complete.js

// Initialize profile forms
function initializeProfileForms() {
    // Profile form
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const profileData = Object.fromEntries(formData.entries());
        
        const result = await window.api.updateProfile(profileData);
        
        if (result.success) {
            showToast('Profil erfolgreich aktualisiert', 'success');
            // Update current user
            currentUser = { ...currentUser, ...profileData };
        } else {
            showToast(result.error || 'Fehler beim Aktualisieren', 'error');
        }
    });
    
    // Password form
    document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const passwords = Object.fromEntries(formData.entries());
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            showToast('Passwörter stimmen nicht überein', 'error');
            return;
        }
        
        const result = await window.api.changePassword({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
        });
        
        if (result.success) {
            showToast('Passwort erfolgreich geändert', 'success');
            e.target.reset();
        } else {
            showToast(result.error || 'Fehler beim Ändern des Passworts', 'error');
        }
    });
}

// Tab switching for profile
function showProfileTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Load Create Invoice with full implementation
async function loadCreateInvoice() {
    try {
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
                        <button type="button" class="btn-secondary-modern" onclick="window.navigateTo('invoices')">
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
    } catch (error) {
        console.error('❌ Error loading create invoice:', error);
        showToast('Fehler beim Laden des Rechnungsformulars', 'error');
    }
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

// Load Reminders with real data
async function loadReminders() {
    try {
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
    } catch (error) {
        console.error('❌ Error loading reminders:', error);
        showToast('Fehler beim Laden der Mahnungen', 'error');
    }
}

// Load Company Settings with real data
async function loadCompanySettings() {
    try {
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
                    
                    <div class="settings-section">
                        <h3>Finanzinformationen</h3>
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Steuernummer</label>
                                <input type="text" class="form-input-modern" name="taxId" value="${settings.taxId || ''}">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">USt-IdNr.</label>
                                <input type="text" class="form-input-modern" name="vatId" value="${settings.vatId || ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group-modern">
                                <label class="form-label-modern">Bankname</label>
                                <input type="text" class="form-input-modern" name="bankName" value="${settings.bankName || ''}">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">IBAN</label>
                                <input type="text" class="form-input-modern" name="iban" value="${settings.iban || ''}">
                            </div>
                            <div class="form-group-modern">
                                <label class="form-label-modern">BIC</label>
                                <input type="text" class="form-input-modern" name="bic" value="${settings.bic || ''}">
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
    } catch (error) {
        console.error('❌ Error loading company settings:', error);
        showToast('Fehler beim Laden der Unternehmensdaten', 'error');
    }
}

// Load Settings Page
async function loadSettings() {
    try {
        const result = await window.api.getSettings();
        const settings = result.success ? result.settings : {};
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="settings-page animate-fade-in">
                <div class="settings-header">
                    <h2>Einstellungen</h2>
                    <p>Konfigurieren Sie Ihre Anwendungseinstellungen</p>
                </div>
                
                <div class="settings-tabs">
                    <button class="tab-btn active" onclick="showSettingsTab('general')">Allgemein</button>
                    <button class="tab-btn" onclick="showSettingsTab('invoice')">Rechnungen</button>
                    <button class="tab-btn" onclick="showSettingsTab('email')">E-Mail</button>
                    <button class="tab-btn" onclick="showSettingsTab('backup')">Backup</button>
                </div>
                
                <div class="tab-content">
                    <div id="generalTab" class="tab-pane active">
                        <form id="generalSettingsForm" class="settings-form">
                            <div class="form-section">
                                <h3>Allgemeine Einstellungen</h3>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Standard-Währung</label>
                                    <select class="form-input-modern" name="currency">
                                        <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                                        <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>US Dollar ($)</option>
                                        <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
                                    </select>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Datumsformat</label>
                                    <select class="form-input-modern" name="dateFormat">
                                        <option value="DD.MM.YYYY" ${settings.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                                        <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                    </select>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Standard-MwSt-Satz (%)</label>
                                    <input type="number" class="form-input-modern" name="defaultTaxRate" value="${settings.defaultTaxRate || 19}" min="0" max="100" step="0.01">
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
                    
                    <div id="invoiceTab" class="tab-pane">
                        <form id="invoiceSettingsForm" class="settings-form">
                            <div class="form-section">
                                <h3>Rechnungseinstellungen</h3>
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Rechnungsnummer-Präfix</label>
                                    <input type="text" class="form-input-modern" name="invoicePrefix" value="${settings.invoicePrefix || 'RE'}" maxlength="10">
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Standard-Zahlungsfrist (Tage)</label>
                                    <input type="number" class="form-input-modern" name="defaultPaymentTerms" value="${settings.defaultPaymentTerms || 14}" min="1" max="365">
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="form-label-modern">Standard-Zahlungsbedingungen</label>
                                    <textarea class="form-input-modern" name="defaultPaymentTermsText" rows="3">${settings.defaultPaymentTermsText || 'Zahlbar innerhalb von 14 Tagen ohne Abzug.'}</textarea>
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
                    
                    <div id="emailTab" class="tab-pane">
                        <form id="emailSettingsForm" class="settings-form">
                            <div class="form-section">
                                <h3>E-Mail-Einstellungen</h3>
                                <div class="form-row">
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">SMTP-Server</label>
                                        <input type="text" class="form-input-modern" name="smtpHost" value="${settings.smtpHost || ''}" placeholder="smtp.gmail.com">
                                    </div>
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Port</label>
                                        <input type="number" class="form-input-modern" name="smtpPort" value="${settings.smtpPort || 587}" min="1" max="65535">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Benutzername</label>
                                        <input type="text" class="form-input-modern" name="smtpUser" value="${settings.smtpUser || ''}">
                                    </div>
                                    <div class="form-group-modern">
                                        <label class="form-label-modern">Passwort</label>
                                        <input type="password" class="form-input-modern" name="smtpPassword" value="${settings.smtpPassword || ''}">
                                    </div>
                                </div>
                                
                                <div class="form-group-modern">
                                    <label class="checkbox-label">
                                        <input type="checkbox" name="smtpSecure" ${settings.smtpSecure ? 'checked' : ''}>
                                        <span>SSL/TLS verwenden</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary-modern" onclick="testEmailConnection()">
                                    <i class="fas fa-vial"></i>
                                    Verbindung testen
                                </button>
                                <button type="submit" class="btn-primary-modern">
                                    <i class="fas fa-save"></i>
                                    Speichern
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div id="backupTab" class="tab-pane">
                        <div class="backup-section">
                            <h3>Daten-Backup</h3>
                            <p>Sichern Sie Ihre Daten regelmäßig, um Datenverlust zu vermeiden.</p>
                            
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
                                <p><strong>Letztes Backup:</strong> Noch nie erstellt</p>
                                <p><strong>Backup-Größe:</strong> -</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize settings forms
        initializeSettingsForms();
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        showToast('Fehler beim Laden der Einstellungen', 'error');
    }
}

// Initialize settings forms
function initializeSettingsForms() {
    // General settings form
    document.getElementById('generalSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData.entries());
        await saveGeneralSettings(settings);
    });
    
    // Invoice settings form  
    document.getElementById('invoiceSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData.entries());
        await saveInvoiceSettings(settings);
    });
    
    // Email settings form
    document.getElementById('emailSettingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData.entries());
        await saveEmailSettings(settings);
    });
}

// Settings save functions
async function saveGeneralSettings(settings) {
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('Allgemeine Einstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function saveInvoiceSettings(settings) {
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('Rechnungseinstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

async function saveEmailSettings(settings) {
    const result = await window.api.updateSettings(settings);
    
    if (result.success) {
        showToast('E-Mail-Einstellungen gespeichert', 'success');
    } else {
        showToast('Fehler beim Speichern', 'error');
    }
}

// Tab switching functions
function showSettingsTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Additional functionality functions...
async function testEmailConnection() {
    const form = document.getElementById('emailSettingsForm');
    const formData = new FormData(form);
    const settings = Object.fromEntries(formData.entries());
    
    const result = await window.api.testEmailConnection(settings);
    
    if (result.success) {
        showToast('E-Mail-Verbindung erfolgreich getestet', 'success');
    } else {
        showToast('E-Mail-Verbindung fehlgeschlagen: ' + result.error, 'error');
    }
}

async function createBackup() {
    const result = await window.api.createBackup();
    
    if (result.success) {
        showToast('Backup erfolgreich erstellt: ' + result.path, 'success');
    } else {
        showToast('Fehler beim Erstellen des Backups', 'error');
    }
}

function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const result = await window.api.restoreBackup(file.path);
            
            if (result.success) {
                showToast('Backup erfolgreich wiederhergestellt', 'success');
            } else {
                showToast('Fehler beim Wiederherstellen', 'error');
            }
        }
    };
    input.click();
}

// Modal Functions with real implementations
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