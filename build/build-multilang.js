const fs = require('fs');
const path = require('path');

// Erstelle eine kombinierte Lizenzdatei mit allen Sprachen
const licenses = {
    de: fs.readFileSync(path.join(__dirname, 'license_de.txt'), 'utf8'),
    en: fs.readFileSync(path.join(__dirname, 'license_en.txt'), 'utf8'),
    fr: fs.readFileSync(path.join(__dirname, 'license_fr.txt'), 'utf8'),
    es: fs.readFileSync(path.join(__dirname, 'license_es.txt'), 'utf8'),
    it: fs.readFileSync(path.join(__dirname, 'license_it.txt'), 'utf8')
};

// Erstelle kombinierte Lizenz mit Trennern
let combinedLicense = '';
combinedLicense += '=== DEUTSCH ===\n\n' + licenses.de + '\n\n';
combinedLicense += '=== ENGLISH ===\n\n' + licenses.en + '\n\n';
combinedLicense += '=== FRANÇAIS ===\n\n' + licenses.fr + '\n\n';
combinedLicense += '=== ESPAÑOL ===\n\n' + licenses.es + '\n\n';
combinedLicense += '=== ITALIANO ===\n\n' + licenses.it;

// Speichere als LICENSE.txt im Hauptverzeichnis
fs.writeFileSync(path.join(__dirname, '..', 'LICENSE.txt'), combinedLicense, 'utf8');

console.log('Mehrsprachige LICENSE.txt erstellt!');
console.log('Führen Sie jetzt "npm run build-installer" aus.');