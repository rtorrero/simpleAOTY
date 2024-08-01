const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config(); 

const dbPath = process.env.DB_PATH || path.join(__dirname, 'albums.db'); // Use DB_PATH from .env
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
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
            }
        });

        // Create albums table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS albums (
            albumID INTEGER PRIMARY KEY NOT NULL UNIQUE,
            name TEXT NOT NULL,
            band TEXT NOT NULL,
            genre TEXT NOT NULL,
            releaseDate DATE NOT NULL,
            coverURL TEXT,
            linkURL TEXT
        )`, (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

module.exports = db;

