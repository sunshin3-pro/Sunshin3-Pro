const { ipcMain, app } = require('electron');
const { getDb, adminFunctions, userFunctions, logAdminActivity } = require('./database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Session Management
let currentSession = {
  userId: null,
  token: null,
  user: null,
  isAdmin: false
};

function getCurrentUserId() {
  return currentSession.userId || null;
}

function setCurrentSession(user, token) {
  currentSession = {
    userId: user.id,
    token: token,
    user: user,
    isAdmin: false
  };
}

function setAdminSession(admin) {
  currentSession = {
    userId: null,
    token: null,
    user: admin,
    isAdmin: true
  };
}

function clearSession() {
  currentSession = {
    userId: null,
    token: null,
    user: null,
    isAdmin: false
  };
}

function setupIPC() {
  const db = getDb();

  // Session Management
  ipcMain.handle('get-current-session', async (event) => {
    return currentSession;
  });

  ipcMain.handle('clear-session', async (event) => {
    clearSession();
    return { success: true };
  });

  // Admin Functions
  ipcMain.handle('check-admin-email', async (event, email) => {
    return adminFunctions.isAdminEmail(email);
  });

  ipcMain.handle('admin-login', async (event, email, code) => {
    try {
      const result = await adminFunctions.verifyAdmin(email, code);
      if (result.success) {
        setAdminSession(result.admin);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // User Functions
  ipcMain.handle('user-login', async (event, email, password) => {
    try {
      const result = await userFunctions.loginUser(email, password);
      if (result.success) {
        setCurrentSession(result.user, result.token);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('user-register', async (event, userData) => {
    try {
      return await userFunctions.createUser(userData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('user-logout', async (event) => {
    clearSession();
    return { success: true };
  });

  ipcMain.handle('get-current-user', async (event) => {
    return currentSession.user;
  });

  // Get single user
  ipcMain.handle('get-user', async (event, userId) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (user) {
        delete user.password;
        return { success: true, user };
      }
      return { success: false, error: 'Benutzer nicht gefunden' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update user
  ipcMain.handle('update-user', async (event, userId, userData) => {
    try {
      const stmt = db.prepare(`
        UPDATE users SET
          company_name = ?, first_name = ?, last_name = ?, email = ?,
          subscription_type = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        userData.company_name,
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.subscription_type,
        userData.is_active ? 1 : 0,
        userId
      );
      
      if (currentSession.isAdmin) {
        logAdminActivity(currentSession.user.id, 'update_user', `Benutzer ${userData.email} aktualisiert`);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Delete user
  ipcMain.handle('delete-user', async (event, userId) => {
    try {
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      
      if (user && currentSession.isAdmin) {
        logAdminActivity(currentSession.user.id, 'delete_user', `Benutzer ${user.email} gelöscht`);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get dashboard stats
  ipcMain.handle('get-dashboard-stats', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId && !currentSession.isAdmin) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      let stats;
      if (currentSession.isAdmin) {
        // Admin stats - global
        stats = {
          totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
          totalAdmins: db.prepare('SELECT COUNT(*) as count FROM admins').get().count,
          totalInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
          totalCustomers: db.prepare('SELECT COUNT(*) as count FROM customers').get().count,
          totalProducts: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
          proUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "pro"').get().count,
          basicUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "basic"').get().count,
          trialUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "trial"').get().count,
          totalRevenue: db.prepare('SELECT SUM(total) as revenue FROM invoices WHERE status = "paid"').get().revenue || 0,
          pendingAmount: db.prepare('SELECT SUM(total) as amount FROM invoices WHERE status IN ("sent", "overdue")').get().amount || 0
        };
      } else {
        // User stats - personal only
        stats = {
          totalInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(userId).count,
          totalCustomers: db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(userId).count,
          totalProducts: db.prepare('SELECT COUNT(*) as count FROM products WHERE user_id = ?').get(userId).count,
          totalRevenue: db.prepare('SELECT SUM(total) as revenue FROM invoices WHERE user_id = ? AND status = "paid"').get(userId).revenue || 0,
          pendingAmount: db.prepare('SELECT SUM(total) as amount FROM invoices WHERE user_id = ? AND status IN ("sent", "overdue")').get(userId).amount || 0,
          paidInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "paid"').get(userId).count,
          draftInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "draft"').get(userId).count,
          overdueInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = "overdue"').get(userId).count
        };
      }
      
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get admin activities
  ipcMain.handle('get-admin-activities', async (event, limit = 10) => {
    try {
      if (!currentSession.isAdmin) {
        return { success: false, error: 'Keine Admin-Berechtigung' };
      }

      const activities = db.prepare(`
        SELECT a.*, ad.email as admin_email
        FROM admin_activities a
        LEFT JOIN admins ad ON a.admin_id = ad.id
        ORDER BY a.created_at DESC
        LIMIT ?
      `).all(limit);
      
      return { success: true, activities };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get all users (for admin panel)
  ipcMain.handle('get-all-users', async (event) => {
    try {
      if (!currentSession.isAdmin) {
        return { success: false, error: 'Keine Admin-Berechtigung' };
      }

      const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      users.forEach(user => delete user.password);
      return { success: true, users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Customer Operations
  ipcMain.handle('get-customers', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const customers = db.prepare('SELECT * FROM customers WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      return { success: true, customers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-customer', async (event, customer) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const stmt = db.prepare(`
        INSERT INTO customers (
          user_id, type, company_name, first_name, last_name, 
          email, phone, address, city, postal_code, country, tax_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        userId,
        customer.type,
        customer.companyName,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.postalCode,
        customer.country,
        customer.taxId,
        customer.notes
      );
      
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-customer', async (event, id, customer) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const stmt = db.prepare(`
        UPDATE customers SET
          type = ?, company_name = ?, first_name = ?, last_name = ?,
          email = ?, phone = ?, address = ?, city = ?, postal_code = ?,
          country = ?, tax_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      
      stmt.run(
        customer.type,
        customer.companyName,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.address,
        customer.city,
        customer.postalCode,
        customer.country,
        customer.taxId,
        customer.notes,
        id,
        userId
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-customer', async (event, id) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      db.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?').run(id, userId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Product Operations
  ipcMain.handle('get-products', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const products = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC').all(userId);
      return { success: true, products };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-product', async (event, product) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const stmt = db.prepare(`
        INSERT INTO products (
          user_id, type, name, description, description_translations,
          sku, price, tax_rate, unit, category, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        userId,
        product.type,
        product.name,
        product.description,
        JSON.stringify(product.descriptionTranslations || {}),
        product.sku,
        product.price,
        product.taxRate,
        product.unit,
        product.category,
        product.isActive ? 1 : 0
      );
      
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-product', async (event, id, product) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const stmt = db.prepare(`
        UPDATE products SET
          type = ?, name = ?, description = ?, description_translations = ?,
          sku = ?, price = ?, tax_rate = ?, unit = ?, category = ?, is_active = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      
      stmt.run(
        product.type,
        product.name,
        product.description,
        JSON.stringify(product.descriptionTranslations || {}),
        product.sku,
        product.price,
        product.taxRate,
        product.unit,
        product.category,
        product.isActive ? 1 : 0,
        id,
        userId
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-product', async (event, id) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(id, userId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Invoice Operations
  ipcMain.handle('get-invoices', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const invoices = db.prepare(`
        SELECT i.*, c.company_name, c.first_name, c.last_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
      `).all(userId);
      return { success: true, invoices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get Invoice by ID
  ipcMain.handle('get-invoice', async (event, id) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const invoice = db.prepare(`
        SELECT i.*, c.*, u.company_name as user_company
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ? AND i.user_id = ?
      `).get(id, userId);
      
      if (!invoice) {
        return { success: false, error: 'Rechnung nicht gefunden' };
      }
      
      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position
      `).all(id);
      
      return { success: true, invoice: { ...invoice, items } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-invoice', async (event, invoice) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const insertInvoice = db.prepare(`
        INSERT INTO invoices (
          user_id, customer_id, invoice_number, invoice_date, due_date,
          status, subtotal, tax_amount, total, currency, notes, payment_terms, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price,
          tax_rate, discount, total, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const transaction = db.transaction((invoice) => {
        const invoiceResult = insertInvoice.run(
          userId,
          invoice.customerId,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.dueDate,
          invoice.status || 'draft',
          invoice.subtotal,
          invoice.taxAmount,
          invoice.total,
          invoice.currency || 'EUR',
          invoice.notes,
          invoice.paymentTerms,
          invoice.language || 'de'
        );
        
        const invoiceId = invoiceResult.lastInsertRowid;
        
        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item, index) => {
            insertItem.run(
              invoiceId,
              item.productId,
              item.description,
              item.quantity,
              item.unitPrice,
              item.taxRate,
              item.discount || 0,
              item.total,
              index + 1
            );
          });
        }
        
        return invoiceId;
      });
      
      const invoiceId = transaction(invoice);
      return { success: true, id: invoiceId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update Invoice
  ipcMain.handle('update-invoice', async (event, id, invoice) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const updateInvoice = db.prepare(`
        UPDATE invoices SET
          customer_id = ?, invoice_number = ?, invoice_date = ?, due_date = ?,
          status = ?, subtotal = ?, tax_amount = ?, total = ?, currency = ?,
          notes = ?, payment_terms = ?, language = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      
      const deleteItems = db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?');
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price,
          tax_rate, discount, total, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const transaction = db.transaction((invoice) => {
        updateInvoice.run(
          invoice.customerId,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.dueDate,
          invoice.status || 'draft',
          invoice.subtotal,
          invoice.taxAmount,
          invoice.total,
          invoice.currency || 'EUR',
          invoice.notes,
          invoice.paymentTerms,
          invoice.language || 'de',
          id,
          userId
        );
        
        deleteItems.run(id);
        
        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item, index) => {
            insertItem.run(
              id,
              item.productId,
              item.description,
              item.quantity,
              item.unitPrice,
              item.taxRate,
              item.discount || 0,
              item.total,
              index + 1
            );
          });
        }
      });
      
      transaction(invoice);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Delete Invoice
  ipcMain.handle('delete-invoice', async (event, id) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id);
        db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(id, userId);
      });
      
      transaction();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update Invoice Status
  ipcMain.handle('update-invoice-status', async (event, invoiceId, status) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      db.prepare('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
        .run(status, invoiceId, userId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // PDF Generation
  ipcMain.handle('generate-invoice-pdf', async (event, invoiceId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const invoice = db.prepare(`
        SELECT i.*, c.*, u.company_name as user_company
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ? AND i.user_id = ?
      `).get(invoiceId, userId);

      if (!invoice) {
        return { success: false, error: 'Rechnung nicht gefunden' };
      }
      
      const items = db.prepare(`
        SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position
      `).all(invoiceId);
      
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice_${invoice.invoice_number}.pdf`;
      const filePath = path.join(require('electron').app.getPath('downloads'), filename);
      
      doc.pipe(fs.createWriteStream(filePath));
      
      doc.fontSize(20).text(invoice.user_company || 'Sunshin3 Pro', 50, 50);
      doc.fontSize(12).text('RECHNUNG', 50, 100);
      
      doc.text(`Rechnungsnummer: ${invoice.invoice_number}`, 50, 130);
      doc.text(`Datum: ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}`, 50, 150);
      doc.text(`Fällig: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`, 50, 170);
      
      doc.text('Kunde:', 300, 130);
      doc.text(invoice.company_name || `${invoice.first_name} ${invoice.last_name}`, 300, 150);
      doc.text(invoice.address || '', 300, 170);
      doc.text(`${invoice.postal_code || ''} ${invoice.city || ''}`, 300, 190);
      
      let y = 250;
      doc.text('Pos.', 50, y);
      doc.text('Beschreibung', 100, y);
      doc.text('Menge', 300, y);
      doc.text('Preis', 370, y);
      doc.text('Gesamt', 450, y);
      
      y += 20;
      items.forEach((item, index) => {
        doc.text(index + 1, 50, y);
        doc.text(item.description, 100, y);
        doc.text(item.quantity, 300, y);
        doc.text(`€ ${item.unit_price}`, 370, y);
        doc.text(`€ ${item.total}`, 450, y);
        y += 20;
      });
      
      y += 20;
      doc.text(`Zwischensumme: € ${invoice.subtotal}`, 350, y);
      y += 20;
      doc.text(`MwSt.: € ${invoice.tax_amount}`, 350, y);
      y += 20;
      doc.fontSize(14).text(`Gesamt: € ${invoice.total}`, 350, y);
      
      doc.end();
      
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get Settings
  ipcMain.handle('get-settings', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const settings = db.prepare('SELECT key, value FROM settings WHERE user_id = ?').all(userId);
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return { success: true, settings: settingsObj };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update Settings
  ipcMain.handle('update-settings', async (event, settings) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }
      
      for (const [key, value] of Object.entries(settings)) {
        const existing = db.prepare('SELECT id FROM settings WHERE user_id = ? AND key = ?')
          .get(userId, key);
        
        if (existing) {
          db.prepare('UPDATE settings SET value = ? WHERE user_id = ? AND key = ?')
            .run(value, userId, key);
        } else {
          db.prepare('INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)')
            .run(userId, key, value);
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get Company Settings
  ipcMain.handle('get-company-settings', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      const settings = db.prepare('SELECT key, value FROM settings WHERE user_id = ? AND key LIKE "company_%"').all(userId);
      
      const companySettings = {
        name: user.company_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postal_code,
        country: user.country
      };
      
      settings.forEach(setting => {
        const key = setting.key.replace('company_', '');
        companySettings[key] = setting.value;
      });
      
      return { success: true, settings: companySettings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update Company Settings
  ipcMain.handle('update-company-settings', async (event, companyData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }
      
      db.prepare(`
        UPDATE users SET
          company_name = ?, email = ?, phone = ?, address = ?,
          city = ?, postal_code = ?, country = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        companyData.name,
        companyData.email,
        companyData.phone,
        companyData.address,
        companyData.city,
        companyData.postalCode,
        companyData.country,
        userId
      );
      
      const companyKeys = ['taxId', 'website', 'logo', 'bankAccount', 'iban', 'bic'];
      companyKeys.forEach(key => {
        if (companyData[key] !== undefined) {
          const settingKey = `company_${key}`;
          const existing = db.prepare('SELECT id FROM settings WHERE user_id = ? AND key = ?')
            .get(userId, settingKey);
          
          if (existing) {
            db.prepare('UPDATE settings SET value = ? WHERE user_id = ? AND key = ?')
              .run(companyData[key], userId, settingKey);
          } else {
            db.prepare('INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)')
              .run(userId, settingKey, companyData[key]);
          }
        }
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get Reminders/Overdue Invoices
  ipcMain.handle('get-reminders', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const overdueInvoices = db.prepare(`
        SELECT i.*, c.company_name, c.first_name, c.last_name,
               JULIANDAY('now') - JULIANDAY(i.due_date) as days_overdue
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.user_id = ? AND i.status IN ('sent', 'overdue') 
        AND DATE(i.due_date) < DATE('now')
        ORDER BY days_overdue DESC
      `).all(userId);
      
      return { success: true, reminders: overdueInvoices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Create Payment Record
  ipcMain.handle('create-payment', async (event, paymentData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      db.exec(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_method TEXT,
          reference TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id)
        )
      `);
      
      const stmt = db.prepare(`
        INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        paymentData.invoiceId,
        paymentData.amount,
        paymentData.paymentDate,
        paymentData.paymentMethod,
        paymentData.reference,
        paymentData.notes
      );
      
      const totalPayments = db.prepare(`
        SELECT SUM(amount) as total FROM payments WHERE invoice_id = ?
      `).get(paymentData.invoiceId).total || 0;
      
      const invoice = db.prepare('SELECT total FROM invoices WHERE id = ? AND user_id = ?').get(paymentData.invoiceId, userId);
      
      if (invoice && totalPayments >= invoice.total) {
        db.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?')
          .run('paid', paymentData.invoiceId, userId);
      }
      
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get Payments for Invoice
  ipcMain.handle('get-invoice-payments', async (event, invoiceId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const payments = db.prepare(`
        SELECT p.* FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE p.invoice_id = ? AND i.user_id = ?
        ORDER BY p.payment_date DESC
      `).all(invoiceId, userId);
      
      return { success: true, payments };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Email
  ipcMain.handle('send-invoice-email', async (event, invoiceId, recipient) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const settings = db.prepare('SELECT * FROM settings WHERE user_id = ? AND key LIKE "smtp_%"').all(userId);
      const smtpConfig = {};
      settings.forEach(setting => {
        const key = setting.key.replace('smtp_', '');
        smtpConfig[key] = setting.value;
      });
      
      if (!smtpConfig.host || !smtpConfig.user) {
        return { success: false, error: 'E-Mail-Einstellungen nicht konfiguriert' };
      }

      const transporter = nodemailer.createTransporter({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure === 'true',
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password
        }
      });
      
      const pdfResult = await ipcMain.handle('generate-invoice-pdf', null, invoiceId);
      if (!pdfResult.success) throw new Error(pdfResult.error);
      
      const info = await transporter.sendMail({
        from: smtpConfig.user,
        to: recipient,
        subject: 'Ihre Rechnung',
        text: 'Anbei finden Sie Ihre Rechnung.',
        attachments: [{
          filename: path.basename(pdfResult.path),
          path: pdfResult.path
        }]
      });
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Test Email Connection
  ipcMain.handle('test-email-connection', async (event, config) => {
    try {
      const transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure === 'true',
        auth: {
          user: config.user,
          pass: config.password
        }
      });
      
      await transporter.verify();
      return { success: true, message: 'E-Mail Verbindung erfolgreich!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update user profile
  ipcMain.handle('update-profile', async (event, profileData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }
      
      const stmt = db.prepare(`
        UPDATE users SET
          first_name = ?, last_name = ?, phone = ?, 
          address = ?, city = ?, postal_code = ?, country = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        profileData.first_name,
        profileData.last_name,
        profileData.phone,
        profileData.address,
        profileData.city,
        profileData.postal_code,
        profileData.country,
        userId
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Change password
  ipcMain.handle('change-password', async (event, passwordData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
      
      const isValid = await bcrypt.compare(passwordData.currentPassword, user.password);
      if (!isValid) {
        return { success: false, error: 'Aktuelles Passwort ist falsch' };
      }
      
      const newHashedPassword = await bcrypt.hash(passwordData.newPassword, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHashedPassword, userId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update subscription
  ipcMain.handle('update-subscription', async (event, plan) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      db.prepare(`
        UPDATE users SET 
          subscription_type = ?, 
          subscription_expires = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(plan, expiresAt.toISOString(), userId);
      
      if (currentSession.isAdmin) {
        logAdminActivity(currentSession.user.id, 'subscription_upgrade', `Benutzer ${userId} upgraded auf ${plan}`);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Resend verification email
  ipcMain.handle('resend-verification-email', async (event, email) => {
    try {
      const user = db.prepare('SELECT verification_token FROM users WHERE email = ?').get(email);
      if (!user) {
        return { success: false, error: 'Benutzer nicht gefunden' };
      }
      
      console.log('Resending verification email to:', email);
      console.log('Token:', user.verification_token);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Verify email
  ipcMain.handle('verify-email', async (event, token) => {
    try {
      const user = db.prepare('SELECT id FROM users WHERE verification_token = ?').get(token);
      if (!user) {
        return { success: false, error: 'Ungültiger Verifizierungstoken' };
      }
      
      db.prepare('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?')
        .run(user.id);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Create backup
  ipcMain.handle('create-backup', async (event) => {
    try {
      if (!currentSession.isAdmin) {
        return { success: false, error: 'Keine Admin-Berechtigung' };
      }

      const backupPath = path.join(app.getPath('downloads'), `sunshin3_backup_${Date.now()}.db`);
      fs.copyFileSync(db.name, backupPath);
      return { success: true, path: backupPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Restore Backup
  ipcMain.handle('restore-backup', async (event, filePath) => {
    try {
      if (!currentSession.isAdmin) {
        return { success: false, error: 'Keine Admin-Berechtigung' };
      }

      fs.copyFileSync(filePath, db.name);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Save settings
  ipcMain.handle('save-settings', async (event, key, value) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }
      
      const existing = db.prepare('SELECT id FROM settings WHERE user_id = ? AND key = ?')
        .get(userId, key);
      
      if (existing) {
        db.prepare('UPDATE settings SET value = ? WHERE user_id = ? AND key = ?')
          .run(value, userId, key);
      } else {
        db.prepare('INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)')
          .run(userId, key, value);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupIPC };