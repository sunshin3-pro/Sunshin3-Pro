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

  // Generate next invoice number - BUSINESS LOGIC
  ipcMain.handle('generate-invoice-number', async (event) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Get last invoice number for this year
      const lastInvoice = db.prepare(`
        SELECT invoice_number FROM invoices 
        WHERE user_id = ? AND invoice_number LIKE ? 
        ORDER BY invoice_number DESC LIMIT 1
      `).get(userId, `${currentYear}%`);
      
      let nextNumber = 1;
      if (lastInvoice) {
        // Extract number from format: YYYY-MM-NNNN
        const numberPart = lastInvoice.invoice_number.split('-')[2];
        nextNumber = parseInt(numberPart) + 1;
      }
      
      // Format: 2024-03-0001
      const invoiceNumber = `${currentYear}-${currentMonth}-${String(nextNumber).padStart(4, '0')}`;
      
      return { success: true, invoiceNumber };
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

      // Auto-generate invoice number if not provided
      if (!invoice.invoiceNumber) {
        const numberResult = await ipcMain.handle('generate-invoice-number', event);
        if (!numberResult.success) {
          return numberResult;
        }
        invoice.invoiceNumber = numberResult.invoiceNumber;
      }

      // DEUTSCHE STEUERBERECHNUNG
      const calculateTaxes = (items) => {
        let subtotal = 0;
        let totalTax = 0;
        
        items.forEach(item => {
          const netAmount = item.quantity * item.unitPrice;
          const taxRate = item.taxRate || 19; // Standard MwSt. Deutschland
          const taxAmount = netAmount * (taxRate / 100);
          
          subtotal += netAmount;
          totalTax += taxAmount;
          
          // Set item total including tax
          item.total = netAmount + taxAmount;
        });
        
        return {
          subtotal: Math.round(subtotal * 100) / 100,
          taxAmount: Math.round(totalTax * 100) / 100,
          total: Math.round((subtotal + totalTax) * 100) / 100
        };
      };

      const taxCalc = calculateTaxes(invoice.items || []);
      
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
        // Calculate due date (14 days default)
        const dueDate = invoice.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const invoiceResult = insertInvoice.run(
          userId,
          invoice.customerId,
          invoice.invoiceNumber,
          invoice.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate,
          invoice.status || 'draft',
          taxCalc.subtotal,
          taxCalc.taxAmount,
          taxCalc.total,
          invoice.currency || 'EUR',
          invoice.notes || 'Zahlbar innerhalb von 14 Tagen netto.',
          invoice.paymentTerms || '14 Tage netto',
          invoice.language || 'de'
        );
        
        const invoiceId = invoiceResult.lastInsertRowid;
        
        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item, index) => {
            insertItem.run(
              invoiceId,
              item.productId || null,
              item.description,
              item.quantity,
              item.unitPrice,
              item.taxRate || 19,
              item.discount || 0,
              item.total,
              index + 1
            );
          });
        }
        
        return invoiceId;
      });
      
      const invoiceId = transaction(invoice);
      
      return { 
        success: true, 
        id: invoiceId, 
        invoiceNumber: invoice.invoiceNumber,
        totals: taxCalc
      };
    } catch (error) {
      console.error('Create invoice error:', error);
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

  // PDF Generation - ERWEITERT für Business Features
  ipcMain.handle('generate-invoice-pdf', async (event, invoiceId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Nicht angemeldet' };
      }

      const invoice = db.prepare(`
        SELECT i.*, c.*, u.company_name as user_company, u.address as user_address,
               u.city as user_city, u.postal_code as user_postal, u.country as user_country,
               u.phone as user_phone, u.email as user_email
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
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Rechnung ${invoice.invoice_number}`,
          Author: invoice.user_company || 'Sunshin3 Pro',
          Subject: `Rechnung für ${invoice.company_name || invoice.first_name + ' ' + invoice.last_name}`,
          CreationDate: new Date()
        }
      });
      
      const filename = `rechnung_${invoice.invoice_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      const filePath = path.join(require('electron').app.getPath('downloads'), filename);
      
      doc.pipe(fs.createWriteStream(filePath));
      
      // PROFESSIONELLER PDF-HEADER
      doc.fontSize(20)
         .fillColor('#2c3e50')
         .text(invoice.user_company || 'Ihr Unternehmen', 50, 50);
      
      doc.fontSize(10)
         .fillColor('#7f8c8d')
         .text(invoice.user_address || '', 50, 80)
         .text(`${invoice.user_postal || ''} ${invoice.user_city || ''}`, 50, 95)
         .text(invoice.user_country || 'Deutschland', 50, 110)
         .text(`Tel: ${invoice.user_phone || ''}`, 50, 125)
         .text(`E-Mail: ${invoice.user_email || ''}`, 50, 140);
      
      // RECHNUNG HEADER
      doc.fontSize(24)
         .fillColor('#e74c3c')
         .text('RECHNUNG', 400, 50);
      
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .text(`Rechnungsnummer: ${invoice.invoice_number}`, 400, 85)
         .text(`Rechnungsdatum: ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}`, 400, 105)
         .text(`Fälligkeitsdatum: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`, 400, 125);
      
      // STATUS
      const statusColor = invoice.status === 'paid' ? '#27ae60' : invoice.status === 'overdue' ? '#e74c3c' : '#f39c12';
      doc.fontSize(10)
         .fillColor(statusColor)
         .text(`Status: ${getStatusLabel(invoice.status)}`, 400, 145);
      
      // KUNDE
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text('Rechnungsempfänger:', 50, 200);
      
      doc.fontSize(12)
         .text(invoice.company_name || `${invoice.first_name} ${invoice.last_name}`, 50, 220)
         .text(invoice.address || '', 50, 240)
         .text(`${invoice.postal_code || ''} ${invoice.city || ''}`, 50, 260)
         .text(invoice.country || '', 50, 280);
      
      if (invoice.tax_id) {
        doc.text(`USt-IdNr.: ${invoice.tax_id}`, 50, 300);
      }
      
      // TABELLE
      let y = 350;
      
      // Tabellen-Header
      doc.rect(50, y, 500, 25).fillAndStroke('#3498db', '#2980b9');
      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('Pos.', 60, y + 8)
         .text('Beschreibung', 100, y + 8)
         .text('Menge', 300, y + 8)
         .text('Einzelpreis', 360, y + 8)
         .text('MwSt.', 420, y + 8)
         .text('Gesamt', 480, y + 8);
      
      y += 25;
      
      // Tabellen-Inhalt
      let totalNet = 0;
      let totalTax = 0;
      
      items.forEach((item, index) => {
        const netAmount = item.quantity * item.unit_price;
        const taxAmount = netAmount * (item.tax_rate / 100);
        totalNet += netAmount;
        totalTax += taxAmount;
        
        const bgColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
        doc.rect(50, y, 500, 20).fillAndStroke(bgColor, '#bdc3c7');
        
        doc.fontSize(9)
           .fillColor('#2c3e50')
           .text((index + 1).toString(), 60, y + 6)
           .text(item.description, 100, y + 6, { width: 180 })
           .text(item.quantity.toString(), 300, y + 6)
           .text(`€ ${item.unit_price.toFixed(2)}`, 360, y + 6)
           .text(`${item.tax_rate}%`, 420, y + 6)
           .text(`€ ${(netAmount + taxAmount).toFixed(2)}`, 480, y + 6);
        
        y += 20;
      });
      
      // SUMMEN
      y += 20;
      doc.fontSize(11)
         .fillColor('#2c3e50')
         .text(`Zwischensumme (netto): € ${totalNet.toFixed(2)}`, 350, y)
         .text(`MwSt. (${invoice.tax_rate || 19}%): € ${totalTax.toFixed(2)}`, 350, y + 20)
         .fontSize(14)
         .fillColor('#e74c3c')
         .text(`Gesamtbetrag: € ${(totalNet + totalTax).toFixed(2)}`, 350, y + 45);
      
      // ZAHLUNGSHINWEISE
      y += 100;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      
      doc.fontSize(12)
         .fillColor('#2c3e50')
         .text('Zahlungshinweise:', 50, y);
      
      doc.fontSize(10)
         .text(`Bitte überweisen Sie den Betrag bis zum ${new Date(invoice.due_date).toLocaleDateString('de-DE')}.`, 50, y + 20)
         .text('Zahlungsziel: 14 Tage netto', 50, y + 35)
         .text(invoice.notes || 'Vielen Dank für Ihr Vertrauen!', 50, y + 55);
      
      // FOOTER
      doc.fontSize(8)
         .fillColor('#95a5a6')
         .text('Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig.', 50, 750)
         .text(`Erstellt am ${new Date().toLocaleDateString('de-DE')} mit Sunshin3 Invoice Pro`, 50, 765);
      
      doc.end();
      
      return { success: true, path: filePath, filename };
    } catch (error) {
      console.error('PDF generation error:', error);
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