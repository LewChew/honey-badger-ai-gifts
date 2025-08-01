const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class DatabaseService {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // Create database file in a data directory
        const dbPath = path.join(__dirname, '..', 'data', 'users.db');
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
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
