const fs = require('fs');

// Erstelle eine einfache LICENSE.txt für den Installer
const license = `Sunshin3 Pro - Lizenzvereinbarung / License Agreement

DEUTSCH:
Dies ist eine Testlizenz für Sunshin3 Pro.
Mit der Installation stimmen Sie den Bedingungen zu.

ENGLISH:
This is a test license for Sunshin3 Pro.
By installing you agree to the terms.

FRANÇAIS:
Ceci est une licence de test pour Sunshin3 Pro.
En installant, vous acceptez les conditions.

ESPAÑOL:
Esta es una licencia de prueba para Sunshin3 Pro.
Al instalar, acepta los términos.

ITALIANO:
Questa è una licenza di prova per Sunshin3 Pro.
Installando si accettano i termini.

© 2024 Sunshin3 Pro - Alle Rechte vorbehalten / All Rights Reserved`;

fs.writeFileSync('LICENSE.txt', license);
console.log('LICENSE.txt erstellt!');