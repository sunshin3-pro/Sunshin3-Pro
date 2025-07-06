const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Datenbank-Pfad
const dbPath = path.join(app.getPath('userData'), 'sunshin3_pro.db');
let db;

// Datenbank initialisieren
async function initDatabase() {
  try {
    db = new Database(dbPath);
    
    // WAL-Modus für bessere Performance
    db.pragma('journal_mode = WAL');
    
    // Tabellen erstellen
    createTables();
    
    // Prüfe ob Super-Admin existiert
    const superAdmin = db.prepare('SELECT * FROM admins WHERE role = ?').get('super-admin');
    if (!superAdmin) {
      // Erstelle ersten Admin bei Installation
      await createInitialAdmin();
    }
    
    console.log('Datenbank erfolgreich initialisiert');
    return true;
  } catch (error) {
    console.error('Datenbankfehler:', error);
    throw error;
  }
}

// Tabellen erstellen
function createTables() {
  // Admins Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      code TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME
    )
  `);

  // Admin-Aktivitäten
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    )
  `);

  // Benutzer Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      language TEXT DEFAULT 'de',
      subscription_type TEXT DEFAULT 'trial',
      subscription_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Kunden Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'private',
      company_name TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      tax_id TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Produkte/Dienstleistungen Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'product',
      name TEXT NOT NULL,
      description TEXT,
      description_translations TEXT,
      sku TEXT,
      price DECIMAL(10,2) NOT NULL,
      tax_rate DECIMAL(5,2) DEFAULT 19.0,
      unit TEXT DEFAULT 'Stück',
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Rechnungen Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      invoice_date DATE NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      notes TEXT,
      payment_terms TEXT,
      language TEXT DEFAULT 'de',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  // Rechnungspositionen Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      tax_rate DECIMAL(5,2) DEFAULT 19.0,
      discount DECIMAL(5,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Einstellungen Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sessions Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      admin_id INTEGER,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    )
  `);

  // Indizes für Performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);
  `);
}

// Initialen Admin erstellen
async function createInitialAdmin() {
  const email = 'admin@sunshin3.pro';
  const code = generateAdminCode();
  const hashedCode = await bcrypt.hash(code, 10);
  
  const stmt = db.prepare(`
    INSERT INTO admins (email, code, role) 
    VALUES (?, ?, ?)
  `);
  
  stmt.run(email, hashedCode, 'super-admin');
  
  console.log('=================================');
  console.log('SUPER-ADMIN ERSTELLT!');
  console.log('Email:', email);
  console.log('Code:', code);
  console.log('BITTE NOTIEREN SIE DIESEN CODE!');
  console.log('=================================');
  
  return { email, code };
}

// Admin-Code generieren (6-stellig für bessere Sicherheit)
function generateAdminCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Admin-Funktionen
const adminFunctions = {
  // Admin verifizieren
  async verifyAdmin(email, code) {
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    
    if (!admin) {
      return { success: false, error: 'Admin nicht gefunden' };
    }
    
    // Prüfe ob gesperrt
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return { success: false, error: 'Account temporär gesperrt' };
    }
    
    // Code prüfen
    const isValid = await bcrypt.compare(code, admin.code);
    
    if (!isValid) {
      // Fehlversuch erhöhen
      const attempts = admin.failed_attempts + 1;
      let lockedUntil = null;
      
      if (attempts >= 3) {
        // 5 Minuten sperren
        lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      }
      
      db.prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockedUntil, admin.id);
      
      return { success: false, error: 'Falscher Code' };
    }
    
    // Erfolg - Reset attempts
    db.prepare('UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .run(admin.id);
    
    // Aktivität loggen
    logAdminActivity(admin.id, 'login', 'Erfolgreiche Anmeldung');
    
    return { success: true, admin };
  },
  
  // Alle Admins holen
  getAllAdmins() {
    return db.prepare('SELECT id, email, role, created_at, last_login FROM admins').all();
  },
  
  // Admin hinzufügen
  async addAdmin(email, role = 'admin', createdBy) {
    const code = generateAdminCode();
    const hashedCode = await bcrypt.hash(code, 10);
    
    try {
      const stmt = db.prepare('INSERT INTO admins (email, code, role) VALUES (?, ?, ?)');
      const result = stmt.run(email, hashedCode, role);
      
      logAdminActivity(createdBy, 'add_admin', `Admin hinzugefügt: ${email}`);
      
      return { success: true, code, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: 'Admin existiert bereits' };
    }
  },
  
  // Admin löschen
  deleteAdmin(adminId, deletedBy) {
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);
    
    if (!admin) {
      return { success: false, error: 'Admin nicht gefunden' };
    }
    
    if (admin.role === 'super-admin') {
      return { success: false, error: 'Super-Admin kann nicht gelöscht werden' };
    }
    
    db.prepare('DELETE FROM admins WHERE id = ?').run(adminId);
    logAdminActivity(deletedBy, 'delete_admin', `Admin gelöscht: ${admin.email}`);
    
    return { success: true };
  },
  
  // Admin-Code ändern
  async changeAdminCode(adminId, newCode) {
    const hashedCode = await bcrypt.hash(newCode, 10);
    
    db.prepare('UPDATE admins SET code = ? WHERE id = ?').run(hashedCode, adminId);
    logAdminActivity(adminId, 'change_code', 'Admin-Code geändert');
    
    return { success: true };
  },
  
  // Admin-Emails prüfen
  isAdminEmail(email) {
    const admin = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    return !!admin;
  }
};

// Admin-Aktivität loggen
function logAdminActivity(adminId, action, details = null) {
  db.prepare(`
    INSERT INTO admin_activities (admin_id, action, details) 
    VALUES (?, ?, ?)
  `).run(adminId, action, details);
}

// User-Funktionen
const userFunctions = {
  // User erstellen
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Trial-Ablaufdatum (30 Tage)
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 30);
    
    const stmt = db.prepare(`
      INSERT INTO users (
        email, password, company_name, first_name, last_name, 
        phone, address, city, postal_code, country, language,
        subscription_type, subscription_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(
        userData.email,
        hashedPassword,
        userData.companyName,
        userData.firstName,
        userData.lastName,
        userData.phone,
        userData.address,
        userData.city,
        userData.postalCode,
        userData.country,
        userData.language || 'de',
        'trial',
        trialExpires.toISOString()
      );
      
      return { success: true, userId: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: 'E-Mail bereits registriert' };
    }
  },
  
  // User Login
  async loginUser(email, password) {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
    
    if (!user) {
      return { success: false, error: 'Ungültige Anmeldedaten' };
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return { success: false, error: 'Ungültige Anmeldedaten' };
    }
    
    // Session erstellen
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 Stunden
    
    db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
      .run(user.id, token, expiresAt.toISOString());
    
    delete user.password;
    return { success: true, user, token };
  },
  
  // User by Token
  getUserByToken(token) {
    const session = db.prepare(`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);
    
    if (session) {
      delete session.password;
      return session;
    }
    
    return null;
  }
};

// Export
module.exports = {
  initDatabase,
  getDb: () => db,
  adminFunctions,
  userFunctions,
  logAdminActivity
};