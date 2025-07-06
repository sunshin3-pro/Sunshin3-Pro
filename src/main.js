const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
require('dotenv').config();
const path = require('path');
const Store = require('electron-store');
const { initDatabase } = require('./database');
const { setupIPC } = require('./ipc-handlers');

// Konfiguration
const store = new Store();
let mainWindow;
let adminWindow;
const isDev = process.argv.includes('--dev');

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Fenster erstellen
function createWindow() {
  // Hauptfenster
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#0F172A'
  });

  // Lade die Startseite
  mainWindow.loadFile(path.join(__dirname, '../views/index.html'));

  // DevTools im Dev-Modus
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Window ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  
  // Warte bis Seite geladen ist
  mainWindow.webContents.once('did-finish-load', () => {
    // Prüfe ob erste Installation
    const isFirstRun = store.get('firstRun', true);
    if (isFirstRun) {
      mainWindow.webContents.send('show-language-selection');
    }
  });

  // Window Events
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (adminWindow) {
      adminWindow.close();
    }
  });

  // Menü erstellen
  createMenu();
}

// Admin-Fenster erstellen
function createAdminWindow() {
  if (adminWindow) {
    adminWindow.focus();
    return;
  }

  adminWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    parent: mainWindow,
    modal: true,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0F172A',
    frame: false
  });

  adminWindow.loadFile(path.join(__dirname, '../views/admin.html'));

  if (isDev) {
    adminWindow.webContents.openDevTools();
  }

  adminWindow.on('closed', () => {
    adminWindow = null;
  });
}

// Menü erstellen
function createMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Neue Rechnung',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('new-invoice')
        },
        {
          label: 'Öffnen',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send('open-file')
        },
        { type: 'separator' },
        {
          label: 'Beenden',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { label: 'Rückgängig', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Wiederholen', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Ausschneiden', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopieren', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Einfügen', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        { label: 'Neu laden', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Vollbild', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Entwicklertools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        }
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über Sunshin3 Pro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über Sunshin3 Pro',
              message: 'Sunshin3 Pro v1.0.0',
              detail: 'Professionelle Rechnungssoftware mit Mehrsprachigkeit\n\n© 2024 Ihre Firma',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handler
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.handle('open-admin-window', () => createAdminWindow());
ipcMain.handle('close-admin-window', () => {
  if (adminWindow) adminWindow.close();
});

// Window Controls
ipcMain.handle('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.handle('maximize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.handle('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.close();
});

// Sprache speichern
ipcMain.handle('save-language', (event, language) => {
  store.set('language', language);
  store.set('firstRun', false);
  return true;
});

ipcMain.handle('get-language', () => {
  return store.get('language', 'de');
});

// TEMPORÄRE Mock IPC für Tests ohne Datenbank
function setupMockIPC() {
  console.log('🧪 Setting up Mock IPC handlers for testing...');
  
  // Mock User Login
  ipcMain.handle('user-login', async (event, email, password) => {
    console.log('🧪 Mock login attempt:', email);
    
    if (email === 'test@sunshin3.pro' && password === 'test123') {
      return {
        success: true,
        user: {
          id: 1,
          email: 'test@sunshin3.pro',
          first_name: 'Test',
          last_name: 'User',
          company_name: 'Test Company'
        },
        token: 'mock-token-12345'
      };
    } else {
      return {
        success: false,
        error: 'Ungültige Anmeldedaten'
      };
    }
  });
  
  // Mock User Register
  ipcMain.handle('user-register', async (event, userData) => {
    console.log('🧪 Mock registration:', userData.email);
    return {
      success: true,
      message: 'Registrierung erfolgreich (Mock)'
    };
  });
  
  // Mock andere Funktionen
  ipcMain.handle('get-current-user', async () => ({
    success: true,
    user: { email: 'test@sunshin3.pro', first_name: 'Test' }
  }));
  
  ipcMain.handle('user-logout', async () => ({ success: true }));
  
  // Mock Dashboard Stats (nach Login benötigt)
  ipcMain.handle('get-dashboard-stats', async () => ({
    success: true,
    stats: {
      totalInvoices: 5,
      totalCustomers: 3,
      totalProducts: 8,
      totalRevenue: 2500.00,
      pendingAmount: 750.00,
      paidInvoices: 3,
      draftInvoices: 2,
      overdueInvoices: 0
    }
  }));
  
  // Mock andere benötigte Handler
  ipcMain.handle('get-customers', async () => ({ success: true, customers: [] }));
  ipcMain.handle('get-products', async () => ({ success: true, products: [] }));
  ipcMain.handle('get-invoices', async () => ({ success: true, invoices: [] }));
  
  console.log('✅ Mock IPC handlers set up');
}

// App Events
app.whenReady().then(async () => {
  try {
    console.log('🚀 Starting app without database for testing...');
    
    // TEMPORÄR: Datenbank-Initialisierung übersprungen
    // await initDatabase();
    
    // TEMPORÄR: IPC Handler ohne Datenbank
    // setupIPC();
    
    // Einfache Mock-IPC für Tests
    setupMockIPC();
    
    // Fenster erstellen
    createWindow();
    
    console.log('✅ App started successfully in test mode');
  } catch (error) {
    console.error('Fehler beim App-Start:', error);
    dialog.showErrorBox('Fehler', 'Die Anwendung konnte nicht gestartet werden.');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Auto-Updater (später implementieren)
app.on('ready', () => {
  // Hier können Sie auto-updater implementieren
});

// Fehlerbehandlung
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Unerwarteter Fehler', error.message);
});