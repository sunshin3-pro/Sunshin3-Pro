#!/usr/bin/env node

console.log('🧪 === ECHTER ELECTRON LOGIN-TEST ===');
console.log('🎯 Testet den Login-Flow direkt im Electron-Prozess');

const testScript = `
(async function electronLoginTest() {
  console.log('🧪 === ELECTRON LOGIN TEST GESTARTET ===');
  
  // Test 1: Überprüfe window.api Verfügbarkeit
  console.log('1. window.api verfügbar:', typeof window.api !== 'undefined');
  
  if (typeof window.api !== 'undefined') {
    console.log('✅ window.api gefunden!');
    console.log('✅ Verfügbare Methoden:', Object.keys(window.api).length);
    
    // Test 2: Teste Login-Funktionalität
    try {
      console.log('🔐 Starte Login-Test...');
      const loginResult = await window.api.userLogin('test@sunshin3.pro', 'test123');
      console.log('🔐 Login-Ergebnis:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult && loginResult.success) {
        console.log('🎉 LOGIN ERFOLGREICH!');
        return { success: true, message: 'Login erfolgreich' };
      } else {
        console.log('❌ Login fehlgeschlagen:', loginResult.error);
        return { success: false, message: 'Login fehlgeschlagen' };
      }
    } catch (error) {
      console.error('❌ Login-Test Fehler:', error.message);
      return { success: false, message: 'Login-Test Fehler' };
    }
  } else {
    console.log('❌ window.api nicht verfügbar');
    return { success: false, message: 'window.api nicht verfügbar' };
  }
})();
`;

console.log('📝 Test-Script erstellt');
console.log(`
🔧 === MANUELLE TEST-ANWEISUNGEN ===

Die Electron-App läuft bereits. Um den Login zu testen:

1. **Öffnen Sie die Developer Tools in der Electron-App:**
   - Drücken Sie F12 in der laufenden App

2. **Fügen Sie das Test-Script in die Console ein:**
---COPY THIS SCRIPT---
${testScript}
---END SCRIPT---

🎯 **ODER MANUELL TESTEN:**
- Email: test@sunshin3.pro
- Passwort: test123
- Klicken Sie "Anmelden"

✅ Test-Anweisungen bereit!
`);
