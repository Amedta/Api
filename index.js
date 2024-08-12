const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const url = require('url');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 4000;

// MySQL connection
const dbUrl = new URL(process.env.DATABASE_URL);

const connection = mysql.createConnection({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.split('/')[1],
    port: dbUrl.port,
    ssl: { rejectUnauthorized: true } // Adjust as needed based on your SSL settings
});

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

// Register route
app.post("/api/register", async (req, res) => {
    const { username, phone, password } = req.body;  
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            username,
            phone,
            password: hashedPassword 
        };   
        connection.query('INSERT INTO users SET ?', userData, (err, results) => {
            if (err) {
                console.error('Error while inserting a user into the database:', err);
                return res.status(400).json({ error: 'Failed to register user' });
            }
            return res.status(201).json({ message: 'New user successfully created!' });
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// Login route
app.post("/api/login", (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).send({ error: 'Phone and password are required' });
    }
    const query = "SELECT * FROM users WHERE phone = ?";
    connection.query(query, [phone], async (err, results) => {
        if (err) {
            console.log('Error while querying the database:', err);
            return res.status(500).send({ error: 'Server error' });
        }
        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                return res.status(200).json({ message: 'Login successful' });
            } else {
                return res.status(401).send({ error: 'Invalid phone or password' });
            }
        } else {
            return res.status(401).send({ error: 'Invalid phone or password' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
