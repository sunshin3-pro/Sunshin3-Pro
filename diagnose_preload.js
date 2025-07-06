// VOLLSTÄNDIGE PRELOAD.JS DIAGNOSE
console.log('🔧 === PRELOAD DIAGNOSE GESTARTET ===');
console.log('🔧 Node Version:', process.version);
console.log('🔧 Electron Context:', typeof process.versions.electron !== 'undefined');
console.log('🔧 Process Type:', process.type);

// Test 1: Grundlegende Module
try {
    const { ipcRenderer } = require('electron');
    console.log('✅ ipcRenderer erfolgreich geladen');
    console.log('✅ ipcRenderer.invoke verfügbar:', typeof ipcRenderer.invoke === 'function');
} catch (error) {
    console.error('❌ Fehler beim Laden von ipcRenderer:', error.message);
}

// Test 2: Window Object Zugriff
try {
    console.log('✅ Window Object verfügbar:', typeof window !== 'undefined');
    console.log('✅ Window.api vorher:', typeof window.api);
} catch (error) {
    console.error('❌ Fehler beim Window-Zugriff:', error.message);
}

// Test 3: Direkte API Zuweisung
try {
    const { ipcRenderer } = require('electron');
    
    // Vereinfachte API-Zuweisung
    window.api = {
        test: () => 'preload working',
        userLogin: (email, password) => ipcRenderer.invoke('user-login', email, password),
        testIPC: () => ipcRenderer.invoke('test-handler')
    };
    
    console.log('✅ window.api zugewiesen');
    console.log('✅ window.api.test:', window.api.test());
    console.log('✅ window.api Methoden:', Object.keys(window.api));
} catch (error) {
    console.error('❌ Fehler bei API-Zuweisung:', error.message);
}

console.log('🔧 === PRELOAD DIAGNOSE BEENDET ===');
