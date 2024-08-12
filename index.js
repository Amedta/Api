const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;
require('dotenv').config()
const sslConfig = process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : {};


const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig
});

connection.connect((err) => {
    if (err) {
        console.log('Error connecting to mysql database =', err);
    }
    console.log('Mysql successfully connected!');
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
        connection.query('INSERT INTO users SET ?', userData, (err, results, fields) => {
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

app.listen(process.env.PORT || 3000);
