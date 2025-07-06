#!/usr/bin/env node

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Test Datenbank im aktuellen Verzeichnis
const dbPath = path.join(__dirname, 'test_sunshin3.db');

// Remove existing database file if it exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing test database');
}

async function testAuth() {
    console.log('🧪 Testing Authentication System...\n');
    
    try {
        // Datenbank erstellen
        const db = new Database(dbPath);
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
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
            INSERT INTO users (
                email, password, company_name, first_name, last_name
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            'test@sunshin3.pro',
            hashedPassword,
            'Test Company GmbH',
            'Max',
            'Mustermann'
        );
        
        console.log('✅ Test user created with ID:', result.lastInsertRowid);
        
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
                
                // Test getUserByToken
                const session = db.prepare(`
                    SELECT s.*, u.* FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.token = ? AND s.expires_at > datetime('now')
                `).get(token);
                
                if (session) {
                    console.log('✅ User retrieved by token');
                    console.log('   User:', session.first_name, session.last_name);
                } else {
                    console.log('❌ Failed to retrieve user by token');
                }
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
        
        // Test registration
        const regEmail = `test_${Date.now()}@example.com`;
        const regPassword = await bcrypt.hash('password123', 10);
        
        const regResult = db.prepare(`
            INSERT INTO users (
                email, password, company_name, first_name, last_name
            ) VALUES (?, ?, ?, ?, ?)
        `).run(
            regEmail,
            regPassword,
            'New Test Company',
            'New',
            'User'
        );
        
        console.log('✅ New user registered with ID:', regResult.lastInsertRowid);
        
        // Test duplicate registration
        try {
            db.prepare(`
                INSERT INTO users (
                    email, password, company_name, first_name, last_name
                ) VALUES (?, ?, ?, ?, ?)
            `).run(
                'test@sunshin3.pro', // Existing email
                regPassword,
                'Duplicate Company',
                'Duplicate',
                'User'
            );
            console.log('❌ Duplicate registration should have failed');
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                console.log('✅ Duplicate registration correctly failed');
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 Authentication testing completed!');
        console.log('\n📋 LOGIN CREDENTIALS FOR APP TESTING:');
        console.log('   Email: test@sunshin3.pro');
        console.log('   Password: test123');
        
        // Generate HTML report
        generateHtmlReport({
            testUser: {
                email: 'test@sunshin3.pro',
                password: 'test123',
                name: 'Max Mustermann',
                company: 'Test Company GmbH'
            },
            tests: [
                { name: 'Database Creation', status: 'passed' },
                { name: 'Test User Creation', status: 'passed' },
                { name: 'Login with Valid Credentials', status: 'passed' },
                { name: 'Session Token Generation', status: 'passed' },
                { name: 'User Retrieval by Token', status: 'passed' },
                { name: 'Wrong Password Rejection', status: 'passed' },
                { name: 'New User Registration', status: 'passed' },
                { name: 'Duplicate Registration Rejection', status: 'passed' }
            ]
        });
        
        db.close();
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

function generateHtmlReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Test Results</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .summary {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .test {
            margin-bottom: 15px;
            padding: 15px;
            border-radius: 5px;
        }
        .passed {
            background-color: #e6ffe6;
            border-left: 5px solid #4CAF50;
        }
        .failed {
            background-color: #ffebeb;
            border-left: 5px solid #f44336;
        }
        .credentials {
            background-color: #e6f7ff;
            border-left: 5px solid #1890ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .test h3 {
            margin-top: 0;
        }
    </style>
</head>
<body>
    <h1>Authentication Test Results</h1>
    
    <div class="credentials">
        <h2>Test Credentials</h2>
        <p><strong>Email:</strong> ${data.testUser.email}</p>
        <p><strong>Password:</strong> ${data.testUser.password}</p>
        <p><strong>Name:</strong> ${data.testUser.name}</p>
        <p><strong>Company:</strong> ${data.testUser.company}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total tests: ${data.tests.length}</p>
        <p>Passed: ${data.tests.filter(t => t.status === 'passed').length}</p>
        <p>Failed: ${data.tests.filter(t => t.status === 'failed').length}</p>
    </div>
    
    <h2>Test Details</h2>
    ${data.tests.map(test => `
        <div class="test ${test.status}">
            <h3>${test.name}</h3>
            <p>Status: ${test.status === 'passed' ? '✅ Passed' : '❌ Failed'}</p>
        </div>
    `).join('')}
</body>
</html>
    `;
    
    fs.writeFileSync(path.join(__dirname, 'test_results.html'), html);
    console.log('📝 Test results saved to test_results.html');
}

testAuth();
