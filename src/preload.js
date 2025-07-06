const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Session Management
  getCurrentSession: () => ipcRenderer.invoke('get-current-session'),
  clearSession: () => ipcRenderer.invoke('clear-session'),
  
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // App Info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // Language
  saveLanguage: (language) => ipcRenderer.invoke('save-language', language),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  
  // Admin Functions
  checkAdminEmail: (email) => ipcRenderer.invoke('check-admin-email', email),
  adminLogin: (email, code) => ipcRenderer.invoke('admin-login', email, code),
  openAdminWindow: () => ipcRenderer.invoke('open-admin-window'),
  closeAdminWindow: () => ipcRenderer.invoke('close-admin-window'),
  
  // User Functions
  userLogin: (email, password) => ipcRenderer.invoke('user-login', email, password),
  userRegister: (userData) => ipcRenderer.invoke('user-register', userData),
  userLogout: () => ipcRenderer.invoke('user-logout'),
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  
  // User Management (Admin)
  getAllUsers: () => ipcRenderer.invoke('get-all-users'),
  getUser: (userId) => ipcRenderer.invoke('get-user', userId),
  updateUser: (userId, userData) => ipcRenderer.invoke('update-user', userId, userData),
  deleteUser: (userId) => ipcRenderer.invoke('delete-user', userId),
  
  // Dashboard Stats
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getAdminActivities: (limit) => ipcRenderer.invoke('get-admin-activities', limit),
  
  // Customer Functions
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  addCustomer: (customer) => ipcRenderer.invoke('add-customer', customer),
  updateCustomer: (id, customer) => ipcRenderer.invoke('update-customer', id, customer),
  deleteCustomer: (id) => ipcRenderer.invoke('delete-customer', id),
  
  // Product Functions
  getProducts: () => ipcRenderer.invoke('get-products'),
  addProduct: (product) => ipcRenderer.invoke('add-product', product),
  updateProduct: (id, product) => ipcRenderer.invoke('update-product', id, product),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  
  // Invoice Functions
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  getInvoice: (id) => ipcRenderer.invoke('get-invoice', id),
  createInvoice: (invoice) => ipcRenderer.invoke('create-invoice', invoice),
  updateInvoice: (id, invoice) => ipcRenderer.invoke('update-invoice', id, invoice),
  deleteInvoice: (id) => ipcRenderer.invoke('delete-invoice', id),
  updateInvoiceStatus: (invoiceId, status) => ipcRenderer.invoke('update-invoice-status', invoiceId, status),
  
  // Payments
  createPayment: (paymentData) => ipcRenderer.invoke('create-payment', paymentData),
  getInvoicePayments: (invoiceId) => ipcRenderer.invoke('get-invoice-payments', invoiceId),
  
  // Reminders
  getReminders: () => ipcRenderer.invoke('get-reminders'),
  
  // Company Settings
  getCompanySettings: () => ipcRenderer.invoke('get-company-settings'),
  updateCompanySettings: (companyData) => ipcRenderer.invoke('update-company-settings', companyData),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Email
  sendInvoiceEmail: (invoiceId, recipient) => ipcRenderer.invoke('send-invoice-email', invoiceId, recipient),
  testEmailConnection: (config) => ipcRenderer.invoke('test-email-connection', config),
  
  // PDF
  generateInvoicePDF: (invoiceId) => ipcRenderer.invoke('generate-invoice-pdf', invoiceId),
  
  // Backup
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: (filePath) => ipcRenderer.invoke('restore-backup', filePath),
  
  // Profile & Settings
  updateProfile: (profileData) => ipcRenderer.invoke('update-profile', profileData),
  changePassword: (passwordData) => ipcRenderer.invoke('change-password', passwordData),
  updateSubscription: (plan) => ipcRenderer.invoke('update-subscription', plan),
  saveSettings: (key, value) => ipcRenderer.invoke('save-settings', key, value),
  
  // Email Verification
  resendVerificationEmail: (email) => ipcRenderer.invoke('resend-verification-email', email),
  verifyEmail: (token) => ipcRenderer.invoke('verify-email', token),
  
  // Events from main process
  on: (channel, callback) => {
    const validChannels = [
      'show-language-selection',
      'new-invoice',
      'open-file',
      'update-available'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});