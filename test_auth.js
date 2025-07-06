#!/usr/bin/env node

// Test-Script für Authentifizierungs-Funktionalität
const { initDatabase, userFunctions } = require('./src/database');

async function testAuthentication() {
    console.log('🧪 Testing Authentication System...\n');
    
    try {
        // Datenbank initialisieren
        console.log('1. Initializing database...');
        await initDatabase();
        console.log('✅ Database initialized\n');
        
        // Test Login mit dem automatisch erstellten Test-User
        console.log('2. Testing login with test user...');
        const loginResult = await userFunctions.loginUser('test@sunshin3.pro', 'test123');
        
        if (loginResult.success) {
            console.log('✅ Login successful!');
            console.log('   User:', loginResult.user.first_name, loginResult.user.last_name);
            console.log('   Company:', loginResult.user.company_name);
            console.log('   Token:', loginResult.token.substring(0, 10) + '...');
        } else {
            console.log('❌ Login failed:', loginResult.error);
        }
        
        console.log('\n📋 LOGIN CREDENTIALS FOR TESTING:');
        console.log('   Email: test@sunshin3.pro');
        console.log('   Password: test123');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Führe Tests aus
testAuthentication();
