const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;
// Use metal api from my function
const getAlbumDetails = require('./metalAPI.js');

app.use(bodyParser.json());

// Create a new user
app.post('/users', (req, res) => {
    const { username, password, albums } = req.body;

    // Initialize album values to NULL
    const albumValues = Array(10).fill(null); // Create an array with 10 NULL values

    // If albums are provided, fill the first N album fields with the provided values
    if (Array.isArray(albums) && albums.length > 0) {
        for (let i = 0; i < Math.min(albums.length, 10); i++) {
            albumValues[i] = albums[i];
        }
    }

    // Combine the values to be inserted
    const valuesToInsert = [username, password, ...albumValues];

    // Ensure the SQL statement matches the number of values
    const sql = `INSERT INTO users (username, password, album1, album2, album3, album4, album5, album6, album7, album8, album9, album10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, valuesToInsert, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});



// Get all users
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Update a user (not needed?)
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, password, albums } = req.body;
    const placeholders = albums.map(() => '?').join(',');
    const sql = `UPDATE users SET username = ?, password = ?, album1 = ?, album2 = ?, album3 = ?, album4 = ?, album5 = ?, album6 = ?, album7 = ?, album8 = ?, album9 = ?, album10 = ? WHERE id = ?`;

    db.run(sql, [username, password, ...albums, id], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ updatedID: id });
    });
});

app.post('/users/:id/albums', async (req, res) => {
    const { id } = req.params;
    const { album } = req.body;

    // Validate the album input
    if (typeof album !== 'number') {
        return res.status(400).json({ error: 'Album must be a number.' });
    }

    // Get album detail from Album info
    let albumData;
    try {
        albumData = await getAlbumDetails(album);
        console.log("back to server.js");
        console.log(albumData);
    } catch (error) {
        console.error("Error fetching album details from server.js:", error);
        return res.status(500).json({ error: 'Failed to fetch album details.' });
    }

    // Check if the album exists in the albums table
    const checkAlbumSql = `SELECT * FROM albums WHERE albumID = ?`;
    let existingAlbum;

    try {
        existingAlbum = await new Promise((resolve, reject) => {
            db.get(checkAlbumSql, [album], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    // If the album does not exist, insert it into the albums table
    if (!existingAlbum) {
        const insertAlbumSql = `INSERT INTO albums (albumID, name, band, genre, releaseDate, coverURL, linkURL) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        // Update downloaded album info
        const { name = "noname", band = "noband", genre = "nogenre",
                releaseDate = "nodate", coverURL = "nocover",
                linkURL ="nolink", type = "notype" } = albumData || {};

        try {
            await new Promise((resolve, reject) => {
                db.run(insertAlbumSql, [album, name, band, genre, releaseDate, coverURL, linkURL], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    console.log(`Album added to albums table with ID: ${album}`);
                    resolve();
                });
            });
        } catch (err) {
            return res.status(400).json({ error: `Could not add album to albums table: ${err.message}` });
        }
    }

    // Now check the user's album fields
    const sql = `SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10 FROM users WHERE id = ?`;
    let row;

    try {
        row = await new Promise((resolve, reject) => {
            db.get(sql, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!row) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the album already exists in any of the fields
    for (let i = 1; i <= 10; i++) {
        if (row[`album${i}`] === album) {
            return res.status(400).json({ error: 'Album already added.' });
        }
    }

    // Find the first available album field
    for (let i = 1; i <= 10; i++) {
        if (row[`album${i}`] === null) {
            const updateSql = `UPDATE users SET album${i} = ? WHERE id = ?`;
            try {
                await new Promise((resolve, reject) => {
                    db.run(updateSql, [album, id], function (err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
                return res.json({ message: 'Album correctly added to user.' });
            } catch (err) {
                return res.status(400).json({ error: `Could not add album: ${err.message}` });
            }
        }
    }

    // If no available field was found
    res.status(400).json({ error: 'Could not add album: No available album fields.' });
});



// Remove an album from a user by value
app.delete('/users/:id/albums/:album', (req, res) => {
    const { id, album } = req.params;

    if (isNaN(album)) {
        return res.status(400).json({ error: 'Album must be a number.' });
    }

    const sql = `SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10 FROM users WHERE id = ?`;

    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Check each album field for the specified album value
        let found = false;
        for (let i = 1; i <= 10; i++) {
            if (row[`album${i}`] === parseInt(album)) {
                found = true;
                const updateSql = `UPDATE users SET album${i} = NULL WHERE id = ?`;
                db.run(updateSql, [id], function (err) {
                    if (err) {
                        return res.status(400).json({ error: `Could not remove album: ${err.message}` });
                    }
                    return res.json({ message: 'Album removed successfully' });
                });
                break; // Exit the loop after removing the album
            }
        }

        // If the album was not found
        if (!found) {
            return res.status(400).json({ error: 'Album not found in the user\'s album fields.' });
        }
    });
});

// Route to remove a user by username
app.delete('/users', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    const sql = `DELETE FROM users WHERE username = ?`;

    db.run(sql, [username], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        return res.json({ message: 'User successfully removed.' });
    });
});

//Album related routes

// Get album information by albumID
app.get('/albums/:albumID', (req, res) => {
    const { albumID } = req.params;

    // SQL query to select album information by albumID
    const sql = `SELECT * FROM albums WHERE albumID = ?`;

    db.get(sql, [albumID], (err, album) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!album) {
            return res.status(404).json({ error: 'Album not found.' });
        }
        // Return the album information
        res.json(album);
    });
});

// Route to get all albums
app.get('/albums', (req, res) => {
    db.all(`SELECT * FROM albums`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
