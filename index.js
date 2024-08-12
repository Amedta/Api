require('dotenv').config(); // Ensure this is at the top

const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
// Removed bcrypt import, you can add alternative code for password handling if needed

const app = express();
app.use(express.json());
app.use(cors());

// Default port if not set in environment variables
const port = process.env.PORT_DB || 4000;

// MySQL connection
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: JSON.parse(process.env.DB_SSL) // Parse JSON string to object
};

const connection = mysql.createPool(dbConfig);

connection.on('connection', (conn) => {
    console.log('Connected to MySQL');
});

connection.on('error', (err) => {
    console.error('MySQL error:', err);
});

// Register route
app.post("/api/register", async (req, res) => {
    const { username, phone, password } = req.body;
    if (!username || !phone || !password) {
        return res.status(400).json({ error: 'Username, phone, and password are required' });
    }
    try {
        // Remove bcrypt usage
        const userData = { username, phone, password }; // Store plain password or handle it differently
        connection.query('INSERT INTO users SET ?', userData, (err, results) => {
            if (err) {
                console.error('Error inserting user into the database:', err);
                return res.status(500).json({ error: 'Failed to register user' });
            }
            return res.status(201).json({ message: 'New user successfully created!' });
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post("/api/login", async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ error: 'Phone and password are required' });
    }
    const query = "SELECT * FROM users WHERE phone = ?";
    connection.query(query, [phone], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.length > 0) {
            const user = results[0];
            // Compare passwords here or use your own method
            if (password === user.password) {
                return res.status(200).json({ message: 'Login successful' });
            } else {
                return res.status(401).json({ error: 'Invalid phone or password' });
            }
        } else {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
