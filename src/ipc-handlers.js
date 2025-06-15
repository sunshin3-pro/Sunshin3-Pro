const { ipcMain, app } = require('electron');
const { getDb, adminFunctions, userFunctions, logAdminActivity } = require('./database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

function setupIPC() {
  const db = getDb();

  // Admin Functions
  ipcMain.handle('check-admin-email', async (event, email) => {
    return adminFunctions.isAdminEmail(email);
  });

  ipcMain.handle('admin-login', async (event, email, code) => {
    return await adminFunctions.verifyAdmin(email, code);
  });

  // User Functions
  ipcMain.handle('user-login', async (event, email, password) => {
    return await userFunctions.loginUser(email, password);
  });

  ipcMain.handle('user-register', async (event, userData) => {
    return await userFunctions.createUser(userData);
  });

  ipcMain.handle('user-logout', async (event) => {
    return { success: true };
  });

  ipcMain.handle('get-current-user', async (event) => {
    return null;
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
      
      logAdminActivity(1, 'update_user', `Benutzer ${userData.email} aktualisiert`);
      
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
      
      if (user) {
        logAdminActivity(1, 'delete_user', `Benutzer ${user.email} gelöscht`);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get dashboard stats
  ipcMain.handle('get-dashboard-stats', async (event) => {
    try {
      const stats = {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        totalAdmins: db.prepare('SELECT COUNT(*) as count FROM admins').get().count,
        totalInvoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
        totalCustomers: db.prepare('SELECT COUNT(*) as count FROM customers').get().count,
        proUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "pro"').get().count,
        basicUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "basic"').get().count,
        trialUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE subscription_type = "trial"').get().count
      };
      
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get admin activities
  ipcMain.handle('get-admin-activities', async (event, limit = 10) => {
    try {
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
      const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
      return { success: true, customers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-customer', async (event, customer) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO customers (
          user_id, type, company_name, first_name, last_name, 
          email, phone, address, city, postal_code, country, tax_id, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        customer.userId,
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
      const stmt = db.prepare(`
        UPDATE customers SET
          type = ?, company_name = ?, first_name = ?, last_name = ?,
          email = ?, phone = ?, address = ?, city = ?, postal_code = ?,
          country = ?, tax_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
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
        id
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-customer', async (event, id) => {
    try {
      db.prepare('DELETE FROM customers WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Product Operations
  ipcMain.handle('get-products', async (event) => {
    try {
      const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
      return { success: true, products };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('add-product', async (event, product) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO products (
          user_id, type, name, description, description_translations,
          sku, price, tax_rate, unit, category, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        product.userId,
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

  ipcMain.handle('delete-product', async (event, id) => {
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Invoice Operations
  ipcMain.handle('get-invoices', async (event) => {
    try {
      const invoices = db.prepare(`
        SELECT i.*, c.company_name, c.first_name, c.last_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        ORDER BY i.created_at DESC
      `).all();
      return { success: true, invoices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-invoice', async (event, invoice) => {
    try {
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
          invoice.userId,
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
        
        return invoiceId;
      });
      
      const invoiceId = transaction(invoice);
      return { success: true, id: invoiceId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // PDF Generation
  ipcMain.handle('generate-invoice-pdf', async (event, invoiceId) => {
    try {
      const invoice = db.prepare(`
        SELECT i.*, c.*, u.company_name as user_company
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = ?
      `).get(invoiceId);
      
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

  // Test MongoDB Connection
  ipcMain.handle('test-mongo-connection', async (event) => {
    try {
      const mongoose = require('mongoose');
      const uri = process.env.MONGODB_URI || 'mongodb+srv://ertl92:pzwh87E8hqzfH3YI@cluster0.6hfl4fv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
      
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      
      await mongoose.disconnect();
      return { success: true, message: 'MongoDB Verbindung erfolgreich!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Update user profile
  ipcMain.handle('update-profile', async (event, profileData) => {
    try {
      // Hier sollte normalerweise die User-ID aus der Session kommen
      const userId = 1; // Für Demo
      
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
      const userId = 1; // Für Demo
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
      const userId = 1; // Für Demo
      
      // Neues Ablaufdatum (30 Tage für Demo)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      db.prepare(`
        UPDATE users SET 
          subscription_type = ?, 
          subscription_expires = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(plan, expiresAt.toISOString(), userId);
      
      logAdminActivity(1, 'subscription_upgrade', `Benutzer ${userId} upgraded auf ${plan}`);
      
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
      
      // Hier würde die E-Mail erneut gesendet werden
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
      const backupPath = path.join(app.getPath('downloads'), `sunshin3_backup_${Date.now()}.db`);
      fs.copyFileSync(db.name, backupPath);
      return { success: true, path: backupPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Save settings
  ipcMain.handle('save-settings', async (event, key, value) => {
    try {
      const userId = 1; // Für Demo
      
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
  // Email
  ipcMain.handle('send-invoice-email', async (event, invoiceId, recipient) => {
    try {
      const settings = db.prepare('SELECT * FROM settings WHERE key LIKE "smtp_%"').all();
      const smtpConfig = {};
      settings.forEach(setting => {
        const key = setting.key.replace('smtp_', '');
        smtpConfig[key] = setting.value;
      });
      
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
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
}

module.exports = { setupIPC };