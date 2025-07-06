#!/usr/bin/env node

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');

// Test Datenbank im aktuellen Verzeichnis
const dbPath = path.join(__dirname, 'test_sunshin3.db');

async function testAuth() {
    console.log('🧪 Testing Authentication System...\n');
    
    try {
        // Datenbank erstellen
        const db = new Database(dbPath);
        
        // Tabelle erstellen
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                company_name TEXT,
                first_name TEXT,
                last_name TEXT,
                subscription_type TEXT DEFAULT 'trial',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1
            )
        `);
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        
        console.log('✅ Database tables created');
        
        // Test-User erstellen
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO users (
                email, password, company_name, first_name, last_name
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            'test@sunshin3.pro',
            hashedPassword,
            'Test Company GmbH',
            'Max',
            'Mustermann'
        );
        
        console.log('✅ Test user created');
        
        // Login testen
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get('test@sunshin3.pro');
        
        if (user) {
            const isValid = await bcrypt.compare('test123', user.password);
            
            if (isValid) {
                console.log('✅ Login successful!');
                console.log('   User:', user.first_name, user.last_name);
                console.log('   Company:', user.company_name);
                
                // Session erstellen
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);
                
                db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
                  .run(user.id, token, expiresAt.toISOString());
                
                console.log('   Token:', token.substring(0, 10) + '...');
            } else {
                console.log('❌ Password validation failed');
            }
        } else {
            console.log('❌ User not found');
        }
        
        // Wrong password test
        const wrongPassword = await bcrypt.compare('wrongpass', user.password);
        if (!wrongPassword) {
            console.log('✅ Wrong password correctly rejected');
        }
        
        console.log('\n🎉 Authentication testing completed!');
        console.log('\n📋 LOGIN CREDENTIALS FOR APP TESTING:');
        console.log('   Email: test@sunshin3.pro');
        console.log('   Password: test123');
        
        db.close();
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testAuth();
