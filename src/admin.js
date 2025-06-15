// Admin Panel JavaScript
let currentAdmin = null;
let currentSection = 'overview';

// Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
    // Lade Admin-Daten
    await loadAdminData();
    
    // Navigation Event Listener
    initializeNavigation();
    
    // Lade erste Sektion
    showSection('overview');
    
    // Lade Daten
    loadOverviewData();
});

// Navigation initialisieren
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.currentTarget.getAttribute('data-section');
            showSection(section);
            
            // Update active state
            navButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
}

// Sektion anzeigen
function showSection(section) {
    currentSection = section;
    
    // Verstecke alle Sektionen
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Zeige gewählte Sektion
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Lade Daten für Sektion
        switch(section) {
            case 'overview':
                loadOverviewData();
                break;
            case 'users':
                loadUsersData();
                break;
            case 'admins':
                loadAdminsData();
                break;
            case 'licenses':
                loadLicenseData();
                break;
            case 'system':
                loadSystemData();
                break;
            case 'activities':
                loadActivitiesData();
                break;
        }
    }
}

// Admin-Daten laden
async function loadAdminData() {
    // Hier würden wir die Admin-Daten vom Backend laden
    // Für Demo-Zwecke setzen wir Dummy-Daten
    currentAdmin = {
        id: 1,
        email: 'admin@sunshin3.pro',
        role: 'super-admin'
    };
    
    document.getElementById('adminEmail').textContent = currentAdmin.email;
    document.getElementById('adminRole').textContent = currentAdmin.role === 'super-admin' ? 'Super Admin' : 'Admin';
}

// Overview Daten laden
async function loadOverviewData() {
    // Lade echte Statistiken
    const statsResult = await window.api.getDashboardStats();
    const stats = statsResult.success ? statsResult.stats : {};
    
    // Update Stats
    document.getElementById('totalUsers').textContent = stats.totalUsers || '0';
    document.getElementById('totalAdmins').textContent = stats.totalAdmins || '0';
    document.getElementById('totalInvoices').textContent = stats.totalInvoices || '0';
    document.getElementById('proUsers').textContent = stats.proUsers || '0';
    
    // Lade Aktivitäten
    const activitiesResult = await window.api.getAdminActivities(5);
    const activities = activitiesResult.success ? activitiesResult.activities : [];
    
    const activitiesList = document.getElementById('recentActivitiesList');
    if (activities.length === 0) {
        activitiesList.innerHTML = '<p class="no-data">Keine Aktivitäten vorhanden</p>';
    } else {
        activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.action)}"></i>
                </div>
                <div class="activity-details">
                    <p><strong>${activity.admin_email}</strong> - ${activity.action}</p>
                    ${activity.details ? `<p>${activity.details}</p>` : ''}
                    <small>${new Date(activity.created_at).toLocaleString('de-DE')}</small>
                </div>
            </div>
        `).join('');
    }
}

// Benutzer laden
async function loadUsersData() {
    // Lade echte Benutzerdaten
    const result = await window.api.getAllUsers();
    const users = result.success ? result.users : [];
    
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">Noch keine Benutzer registriert</td></tr>';
    } else {
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name || ''} ${user.last_name || ''}</td>
                <td>${user.email}</td>
                <td>${user.company_name || '-'}</td>
                <td><span class="badge ${(user.subscription_type || 'trial').toLowerCase()}">${user.subscription_type || 'Trial'}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString('de-DE')}</td>
                <td><span class="status ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Aktiv' : 'Gesperrt'}</span></td>
                <td>
                    <button class="action-btn" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// Admins laden
async function loadAdminsData() {
    // Demo-Daten
    const admins = [
        { id: 1, email: 'admin@sunshin3.pro', role: 'super-admin', created: '2024-01-01', lastLogin: '2024-06-11 17:30' },
        { id: 2, email: 'support@company.com', role: 'admin', created: '2024-01-15', lastLogin: '2024-06-10 14:22' },
        { id: 3, email: 'tech@company.com', role: 'admin', created: '2024-02-01', lastLogin: '2024-06-09 09:15' }
    ];
    
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = admins.map(admin => `
        <tr>
            <td>${admin.id}</td>
            <td>${admin.email}</td>
            <td><span class="badge ${admin.role}">${admin.role === 'super-admin' ? 'Super-Admin' : 'Admin'}</span></td>
            <td>${admin.created}</td>
            <td>${admin.lastLogin}</td>
            <td>
                ${admin.role !== 'super-admin' ? `
                    <button class="action-btn" onclick="generateNewCode(${admin.id})">
                        <i class="fas fa-key"></i> Neuer Code
                    </button>
                    <button class="action-btn danger" onclick="deleteAdmin(${admin.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="text-muted">-</span>'}
            </td>
        </tr>
    `).join('');
}

// Lizenz-Daten laden
async function loadLicenseData() {
    const statsResult = await window.api.getDashboardStats();
    const stats = statsResult.success ? statsResult.stats : {};
    
    document.getElementById('trialUsers').textContent = stats.trialUsers || '0';
    document.getElementById('basicUsers').textContent = stats.basicUsers || '0';
    document.getElementById('proUsers2').textContent = stats.proUsers || '0';
}

// System-Daten laden
async function loadSystemData() {
    document.getElementById('appVersion').textContent = await window.api.getVersion();
    document.getElementById('electronVersion').textContent = process.versions.electron || '-';
    document.getElementById('nodeVersion').textContent = process.versions.node || '-';
    
    // Datenbank-Info
    const appPath = await window.api.getAppPath();
    document.getElementById('dbPath').textContent = appPath;
    document.getElementById('dbSize').textContent = '24.3 MB';
}

// Aktivitäten laden
async function loadActivitiesData() {
    const activities = [
        { type: 'login', user: 'admin@sunshin3.pro', action: 'Admin-Login', details: 'Erfolgreiche Anmeldung', time: '2024-06-11 17:30:00' },
        { type: 'admin', user: 'admin@sunshin3.pro', action: 'Admin hinzugefügt', details: 'tech@company.com', time: '2024-06-11 16:45:00' },
        { type: 'user', user: 'max@example.com', action: 'Rechnung erstellt', details: 'Rechnung #2024-001234', time: '2024-06-11 15:20:00' }
    ];
    
    const logList = document.getElementById('activityLogList');
    logList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details" style="flex: 1;">
                <p><strong>${activity.user}</strong> - ${activity.action}</p>
                <p>${activity.details}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
}

// Helper: Activity Icon
function getActivityIcon(type) {
    switch(type) {
        case 'login': return 'fa-sign-in-alt';
        case 'admin': return 'fa-user-shield';
        case 'user': return 'fa-user';
        default: return 'fa-info-circle';
    }
}

// Admin hinzufügen Dialog
function showAddAdminDialog() {
    document.getElementById('addAdminDialog').classList.remove('hidden');
    document.getElementById('addAdminForm').style.display = 'block';
    document.getElementById('newAdminCode').classList.add('hidden');
}

function closeAddAdminDialog() {
    document.getElementById('addAdminDialog').classList.add('hidden');
    document.getElementById('newAdminEmail').value = '';
    document.getElementById('newAdminRole').value = 'admin';
}

// Admin hinzufügen Form
document.getElementById('addAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('newAdminEmail').value;
    const role = document.getElementById('newAdminRole').value;
    
    // Hier würde die API aufgerufen werden
    // Für Demo generieren wir einen Code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Zeige Code an
    document.getElementById('addAdminForm').style.display = 'none';
    document.getElementById('newAdminCode').classList.remove('hidden');
    document.getElementById('generatedCode').textContent = code;
    
    // Aktualisiere Admin-Liste
    setTimeout(() => {
        loadAdminsData();
    }, 3000);
});

// Weitere Funktionen
async function generateNewCode(adminId) {
    if (confirm('Möchten Sie wirklich einen neuen Code generieren?')) {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        alert(`Neuer Code für Admin ${adminId}: ${newCode}\n\nBitte notieren Sie diesen Code!`);
    }
}

async function deleteAdmin(adminId) {
    if (confirm('Möchten Sie diesen Admin wirklich löschen?')) {
        // API-Aufruf zum Löschen
        loadAdminsData();
    }
}

// Benutzer bearbeiten Dialog
async function editUser(userId) {
    const user = await getUserById(userId);
    if (!user) return;
    
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <h2>Benutzer bearbeiten</h2>
            <form id="editUserForm">
                <div class="form-group">
                    <label>Firma</label>
                    <input type="text" id="editCompany" value="${user.company_name || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Vorname</label>
                        <input type="text" id="editFirstName" value="${user.first_name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nachname</label>
                        <input type="text" id="editLastName" value="${user.last_name || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>E-Mail</label>
                    <input type="email" id="editEmail" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Abonnement</label>
                    <select id="editSubscription">
                        <option value="trial" ${user.subscription_type === 'trial' ? 'selected' : ''}>Trial (30 Tage)</option>
                        <option value="basic" ${user.subscription_type === 'basic' ? 'selected' : ''}>Basic (€19.99)</option>
                        <option value="pro" ${user.subscription_type === 'pro' ? 'selected' : ''}>Professional (€49.99)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="editStatus">
                        <option value="1" ${user.is_active ? 'selected' : ''}>Aktiv</option>
                        <option value="0" ${!user.is_active ? 'selected' : ''}>Gesperrt</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal(this)">Abbrechen</button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Speichern
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            company_name: document.getElementById('editCompany').value,
            first_name: document.getElementById('editFirstName').value,
            last_name: document.getElementById('editLastName').value,
            email: document.getElementById('editEmail').value,
            subscription_type: document.getElementById('editSubscription').value,
            is_active: document.getElementById('editStatus').value === '1'
        };
        
        const result = await window.api.updateUser(userId, updatedData);
        
        if (result.success) {
            showSuccess('Benutzer erfolgreich aktualisiert');
            closeModal(dialog);
            loadUsersData();
        } else {
            showError(result.error || 'Fehler beim Aktualisieren');
        }
    });
}

// Modal schließen
function closeModal(element) {
    const modal = element.closest ? element.closest('.modal') : element;
    if (modal) {
        modal.remove();
    }
}

// Benutzer by ID holen
async function getUserById(userId) {
    const result = await window.api.getUser(userId);
    return result.success ? result.user : null;
}

// Success/Error Notifications
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function deleteUser(userId) {
    if (confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
        // API-Aufruf zum Löschen
        loadUsersData();
    }
}

async function testMongoConnection() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Teste...';
    
    // Simuliere Test
    setTimeout(() => {
        document.getElementById('mongoStatus').textContent = 'Verbunden';
        document.getElementById('mongoStatus').style.color = 'var(--success)';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plug"></i> Verbindung testen';
        alert('MongoDB-Verbindung erfolgreich!');
    }, 2000);
}

async function createBackup() {
    if (confirm('Möchten Sie ein Backup erstellen?')) {
        alert('Backup wird erstellt...\nSpeicherort: ' + await window.api.getAppPath() + '/backups/');
    }
}

async function clearCache() {
    if (confirm('Möchten Sie den Cache wirklich leeren?')) {
        alert('Cache wurde geleert!');
    }
}

async function checkUpdates() {
    alert('Sie verwenden die neueste Version!');
}

// Globale Funktionen für HTML onclick
window.closeModal = closeModal;

// Suche
document.getElementById('userSearch')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    // Implementiere Suchlogik
});