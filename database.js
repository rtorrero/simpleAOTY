const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'albums.db'); 
const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT,
            album1 INTEGER,
            album2 INTEGER,
            album3 INTEGER,
            album4 INTEGER,
            album5 INTEGER,
            album6 INTEGER,
            album7 INTEGER,
            album8 INTEGER,
            album9 INTEGER,
            album10 INTEGER
        )`, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                // Check if the users table is empty
                db.get(`SELECT COUNT(*) AS count FROM users`, async (err, row) => {
                    if (err) {
                        console.error(err.message);
                    } else if (row.count === 0) {
                        // Insert the initial user
                        const role = process.env.RADMIN || 'superadmin'; 
                        const username = 'superadmin';
                        const password = 'superadmin'; 

                        try {
                            const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
                            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, [username, hashedPassword, role], (err) => {
                                if (err) {
                                    console.error(err.message);
                                } else {
                                    console.log('Initial user created: superadmin');
                                }
                            });
                        } catch (hashError) {
                            console.error('Error hashing password:', hashError.message);
                        }
                    }
                });
            }
        });

        // Create albums table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS albums (
            albumID INTEGER PRIMARY KEY NOT NULL UNIQUE,
            name TEXT,
            band TEXT,
            genre TEXT,
            releaseDate TEXT,
            coverURL TEXT,
            linkURL TEXT,
            type TEXT,
            votes INTEGER
        )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });

        // Create token table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            used BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

module.exports = db;
