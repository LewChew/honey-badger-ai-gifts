const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory');
        }

        // Create database file in a data directory
        const dbPath = path.join(dataDir, 'users.db');

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database at:', dbPath);
                this.createTables();
            }
        });
    }

    createTables() {
        // Users table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                email_verified BOOLEAN DEFAULT 0,
                phone_verified BOOLEAN DEFAULT 0
            )
        `;

        // Sessions table for token management
        const createSessionsTable = `
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

        // Gift orders table (linked to users)
        const createGiftOrdersTable = `
            CREATE TABLE IF NOT EXISTS gift_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                tracking_id TEXT UNIQUE NOT NULL,
                recipient_name TEXT NOT NULL,
                recipient_contact TEXT NOT NULL,
                gift_type TEXT NOT NULL,
                gift_value TEXT NOT NULL,
                challenge TEXT,
                message TEXT,
                duration INTEGER,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

        // Contacts table (network contacts for each user)
        const createContactsTable = `
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                relationship TEXT,
                birthday TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `;

        // Special dates table (important dates for each contact)
        const createSpecialDatesTable = `
            CREATE TABLE IF NOT EXISTS special_dates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_id INTEGER NOT NULL,
                date_name TEXT NOT NULL,
                date_value TEXT NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
            )
        `;

        this.db.run(createUsersTable, (err) => {
            if (err) console.error('Error creating users table:', err.message);
            else console.log('✅ Users table ready');
        });

        this.db.run(createSessionsTable, (err) => {
            if (err) console.error('Error creating sessions table:', err.message);
            else console.log('✅ Sessions table ready');
        });

        this.db.run(createGiftOrdersTable, (err) => {
            if (err) console.error('Error creating gift_orders table:', err.message);
            else console.log('✅ Gift orders table ready');
        });

        this.db.run(createContactsTable, (err) => {
            if (err) console.error('Error creating contacts table:', err.message);
            else console.log('✅ Contacts table ready');
        });

        this.db.run(createSpecialDatesTable, (err) => {
            if (err) console.error('Error creating special_dates table:', err.message);
            else console.log('✅ Special dates table ready');
        });
    }

    // User management methods
    async createUser(userData) {
        const { name, email, password, phone } = userData;
        
        return new Promise((resolve, reject) => {
            // Hash password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    reject(new Error('Password hashing failed'));
                    return;
                }

                const sql = `
                    INSERT INTO users (name, email, password, phone)
                    VALUES (?, ?, ?, ?)
                `;

                this.db.run(sql, [name, email, hashedPassword, phone], function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Email already exists'));
                        } else {
                            reject(new Error('Database error: ' + err.message));
                        }
                    } else {
                        resolve({
                            id: this.lastID,
                            name,
                            email,
                            phone: phone || null
                        });
                    }
                });
            });
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE email = ? AND is_active = 1`;
            
            this.db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(new Error('Database error: ' + err.message));
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getUserById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, name, email, phone, created_at, email_verified, phone_verified FROM users WHERE id = ? AND is_active = 1`;
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(new Error('Database error: ' + err.message));
                } else {
                    resolve(row);
                }
            });
        });
    }

    async verifyPassword(plainPassword, hashedPassword) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
                if (err) {
                    reject(new Error('Password verification failed'));
                } else {
                    resolve(result);
                }
            });
        });
    }

    // Session management
    async saveSession(userId, token, expiresAt) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`;
            
            this.db.run(sql, [userId, token, expiresAt], function(err) {
                if (err) {
                    reject(new Error('Session save failed: ' + err.message));
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    async getSession(token) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT s.*, u.id as user_id, u.name, u.email 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
            `;
            
            this.db.get(sql, [token], (err, row) => {
                if (err) {
                    reject(new Error('Session lookup failed: ' + err.message));
                } else {
                    resolve(row);
                }
            });
        });
    }

    async deleteSession(token) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM sessions WHERE token = ?`;
            
            this.db.run(sql, [token], function(err) {
                if (err) {
                    reject(new Error('Session deletion failed: ' + err.message));
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    // Gift order management
    async createGiftOrder(userId, orderData) {
        const { trackingId, recipientName, recipientContact, giftType, giftValue, challenge, message, duration } = orderData;
        
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO gift_orders (user_id, tracking_id, recipient_name, recipient_contact, gift_type, gift_value, challenge, message, duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [userId, trackingId, recipientName, recipientContact, giftType, giftValue, challenge, message, duration], function(err) {
                if (err) {
                    reject(new Error('Gift order creation failed: ' + err.message));
                } else {
                    resolve({
                        id: this.lastID,
                        trackingId,
                        ...orderData
                    });
                }
            });
        });
    }

    async getUserOrders(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM gift_orders 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `;
            
            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(new Error('Orders lookup failed: ' + err.message));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Cleanup expired sessions
    async cleanupExpiredSessions() {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM sessions WHERE expires_at <= datetime('now')`;

            this.db.run(sql, function(err) {
                if (err) {
                    reject(new Error('Session cleanup failed: ' + err.message));
                } else {
                    resolve(this.changes);
                }
            });
        });
    }

    // Contact management
    async createContact(userId, contactData) {
        const { name, email, phone, relationship, birthday } = contactData;

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO contacts (user_id, name, email, phone, relationship, birthday)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            this.db.run(sql, [userId, name, email || null, phone || null, relationship || null, birthday || null], function(err) {
                if (err) {
                    reject(new Error('Contact creation failed: ' + err.message));
                } else {
                    resolve({
                        id: this.lastID,
                        userId,
                        name,
                        email: email || null,
                        phone: phone || null,
                        relationship: relationship || null,
                        birthday: birthday || null
                    });
                }
            });
        });
    }

    async getUserContacts(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, name, email, phone, relationship, birthday, created_at
                FROM contacts
                WHERE user_id = ?
                ORDER BY created_at DESC
            `;

            this.db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(new Error('Contacts lookup failed: ' + err.message));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async deleteContact(userId, contactId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM contacts WHERE id = ? AND user_id = ?`;

            this.db.run(sql, [contactId, userId], function(err) {
                if (err) {
                    reject(new Error('Contact deletion failed: ' + err.message));
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    // Special dates management
    async createSpecialDate(contactId, dateData) {
        const { dateName, dateValue, notes } = dateData;

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO special_dates (contact_id, date_name, date_value, notes)
                VALUES (?, ?, ?, ?)
            `;

            this.db.run(sql, [contactId, dateName, dateValue, notes || null], function(err) {
                if (err) {
                    reject(new Error('Special date creation failed: ' + err.message));
                } else {
                    resolve({
                        id: this.lastID,
                        contactId,
                        dateName,
                        dateValue,
                        notes: notes || null
                    });
                }
            });
        });
    }

    async getContactSpecialDates(contactId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, date_name, date_value, notes, created_at
                FROM special_dates
                WHERE contact_id = ?
                ORDER BY date_value ASC
            `;

            this.db.all(sql, [contactId], (err, rows) => {
                if (err) {
                    reject(new Error('Special dates lookup failed: ' + err.message));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async deleteSpecialDate(specialDateId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM special_dates WHERE id = ?`;

            this.db.run(sql, [specialDateId], function(err) {
                if (err) {
                    reject(new Error('Special date deletion failed: ' + err.message));
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    // Verify contact ownership before special date operations
    async verifyContactOwnership(userId, contactId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id FROM contacts WHERE id = ? AND user_id = ?`;

            this.db.get(sql, [contactId, userId], (err, row) => {
                if (err) {
                    reject(new Error('Contact verification failed: ' + err.message));
                } else {
                    resolve(!!row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = new DatabaseService();
