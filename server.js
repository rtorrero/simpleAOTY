const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Use metal api from my function
const getAlbumDetails = require('./metalAPI.js');

// Add bcrypt lib
const bcrypt = require('bcrypt');

// Add ability to create tokens

const jwt = require('jsonwebtoken');

app.use(bodyParser.json());

// Control auth.

const authenticateToken = require('./middleware');

// Encrypt tokens for links. 

const crypto = require('crypto');

// Create a new user (with hashed pass)
app.post('/users', async (req, res) => {
    const { username, password, albums } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Initialize album values to NULL
    const albumValues = Array(10).fill(null); // Create an array with 10 NULL values

    // If albums are provided, fill the first N album fields with the provided values
    if (Array.isArray(albums) && albums.length > 0) {
        for (let i = 0; i < Math.min(albums.length, 10); i++) {
            albumValues[i] = albums[i];
        }
    }

    // Combine the values to be inserted
    const valuesToInsert = [username, hashedPassword, ...albumValues];

    // Ensure the SQL statement matches the number of values
    const sql = `INSERT INTO users (username, password, album1, album2, album3, album4, album5, album6, album7, album8, album9, album10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, valuesToInsert, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID });
    });
});

// User stuff ===
// Get all users
app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
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

//User / Albums stuff
// Add a album to a user (and add album to albums if needed)


app.post('/users/:username/albums', authenticateToken, async (req, res) => {
    const { username } = req.params; // Change from id to username
    const { album, bandId } = req.body;

    // Validate the album input
    if (typeof album !== 'number') {
        return res.status(400).json({ error: 'Album must be a number.' });
    }

    // Now check the user's album fields first
    const sql = `SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10 FROM users WHERE username = ?`; // Change id to username
    let row;

    try {
        row = await new Promise((resolve, reject) => {
            db.get(sql, [username], (err, row) => {
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

    // Get album detail from Album info
    let albumData;

    try {
        albumData = await getAlbumDetails(album, bandId);
        console.log("back to server.js");
        console.log(albumData);
    } catch (error) {
        console.error("Error fetching album details from server.js:", error);
        return res.status(500).json({ error: 'Failed to fetch album details.' });
    }

    // Double check :/
    if (!albumData) {
        console.error("Album data is NULL.");
        return res.status(404).json({ error: 'Album not found.' });
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

    // Find the first available album field
    let availableField = null;
    for (let i = 1; i <= 10; i++) {
        if (row[`album${i}`] === null) {
            availableField = i;
            break;
        }
    }

    // If no available field was found
    if (availableField === null) {
        return res.status(400).json({ error: 'Could not add album: No available album fields.' });
    }

    // If the album does not exist, insert it into the albums table
    if (!existingAlbum) {
        const insertAlbumSql = `INSERT INTO albums (albumID, name, band, genre, releaseDate, coverUrl, linkURL, type, votes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Update downloaded album info
        const { name = "noname", band = "noband", genre = "nogenre",
            releaseDate = "nodate", coverUrl = "nocover",
            linkURL = "nolink", type = "notype", } = albumData || {};

        console.log("In Server");
        console.log(albumData);

        try {
            await new Promise((resolve, reject) => {
                db.run(insertAlbumSql, [album, name, band, genre, releaseDate, coverUrl, linkURL, type, 1], function (err) {
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
    } else {
        // If the album already exists, increment the votes
        const updateVotesSql = `UPDATE albums SET votes = votes + 1 WHERE albumID = ?`;
        try {
            await new Promise((resolve, reject) => {
                db.run(updateVotesSql, [album], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    console.log(`Votes incremented for album ID: ${album}`);
                    resolve();
                });
            });
        } catch (err) {
            return res.status(400).json({ error: `Could not update votes: ${err.message}` });
        }
    }

    // Update the user's album field
    const updateSql = `UPDATE users SET album${availableField} = ? WHERE username = ?`; // Change id to username
    try {
        await new Promise((resolve, reject) => {
            db.run(updateSql, [album, username], function (err) { // Change id to username
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
});




// Remove an album from a user by value (cancel vote)
// also deletes the album from albums with 0 votes.
app.delete('/users/:username/albums/:album', authenticateToken, (req, res) => {
    const { username, album } = req.params;

    if (isNaN(album)) {
        return res.status(400).json({ error: 'Album must be a number.' });
    }

    const sql = `SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10 FROM users WHERE username = ?`;

    db.get(sql, [username], (err, row) => {
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
                const updateAlbumSql = `UPDATE users SET album${i} = NULL WHERE username = ?`;
                const updateVotesSql = `UPDATE albums SET votes = votes - 1 WHERE albumID = ?`;
                const deleteAlbumSql = `DELETE FROM albums WHERE albumID = ?`;

                // First, remove the album from the user's albums
                db.run(updateAlbumSql, [username], function (err) {
                    if (err) {
                        return res.status(400).json({ error: `Could not remove album: ${err.message}` });
                    }

                    // Then, decrement the votes for the corresponding album
                    db.run(updateVotesSql, [album], function (err) {
                        if (err) {
                            return res.status(400).json({ error: `Could not update votes: ${err.message}` });
                        }

                        // Check the current vote count for the album
                        db.get(`SELECT votes FROM albums WHERE albumID = ?`, [album], (err, albumRow) => {
                            if (err) {
                                return res.status(400).json({ error: `Could not retrieve album votes: ${err.message}` });
                            }

                            // If the votes are now 0, delete the album
                            if (albumRow && albumRow.votes === 0) {
                                db.run(deleteAlbumSql, [album], function (err) {
                                    if (err) {
                                        return res.status(400).json({ error: `Could not delete album: ${err.message}` });
                                    }
                                    return res.json({ message: 'Album removed successfully and deleted from albums table.' });
                                });
                            } else {
                                return res.json({ message: 'Album removed successfully, but still has votes.' });
                            }
                        });
                    });
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

// DELETE route to remove an album by albumID
app.delete('/albums/:albumID', (req, res) => {
    const albumID = req.params.albumID;

    db.run(`DELETE FROM albums WHERE albumID = ?`, [albumID], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Album not found' });
        }
        res.status(200).json({ message: 'Album deleted successfully' });
    });
});

// User login Stuff
// Login check user/pass and return token
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Retrieve user from the database
    const sql = `SELECT password FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, row.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ username }, process.env.SECRET, { expiresIn: '1h' }); // Use a strong secret key
        res.json({ token });
    });
});

// Misc. (Specific routes)

// Route to get album IDs for a given username
app.get('/votes/:username', (req, res) => {
    const username = req.params.username;

    db.get(`SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10 FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create an object to hold the album IDs
        const albumIds = {};
        for (let i = 1; i <= 10; i++) {
            const albumId = row[`album${i}`];
            if (albumId !== null && albumId !== 0) {
                albumIds[`album${i}`] = albumId;
            }
        }

        res.json(albumIds);
    });
});

// Check if a user has free slots
app.get('/freeslots/:username', (req, res) => {
    const username = req.params.username;

    const query = `
        SELECT album1, album2, album3, album4, album5, album6, album7, album8, album9, album10
        FROM users
        WHERE username = ?`;

    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }

        const albums = [
            row.album1,
            row.album2,
            row.album3,
            row.album4,
            row.album5,
            row.album6,
            row.album7,
            row.album8,
            row.album9,
            row.album10
        ];

        const allInUse = albums.every(album => album !== 0 && album !== null);
        res.json({ allInUse });
    });
});

// One time tokens to create accounts.
// Create a link with a token. 

app.post('/generate-link', (req, res) => {
    const token = crypto.randomBytes(16).toString('hex');
    db.run("INSERT INTO tokens (token) VALUES (?)", [token], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Error generating link' });
        }
        const link = `/create-account?token=${token}`;
        res.json({ link });
    });
});


// Read token to allow account creation.

// Handle account creation from valid links
app.post('/create-account', (req, res) => {
    const token = req.query.token; 
    const { username, password } = req.body; 

    db.get("SELECT * FROM tokens WHERE token = ? AND used = 0", [token], (err, row) => {
        if (err || !row) {
            return res.status(400).send('Invalid or already used token.');
        }

        // accunt logic here
   
        // Token used
        db.run("UPDATE tokens SET used = 1 WHERE token = ?", [token], (err) => {
            if (err) {
                return res.status(500).send('Error marking token as used');
            }
            res.send('Token correct');
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
