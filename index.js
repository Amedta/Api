const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MySQL connection
const connection = mysql.createConnection(process.env.DATABASE_URL);
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('MySQL successfully connected!');
});
app.get("/", (req, res) => {
    res.send("Welcome to the API!");
});
// Register route
app.post("/api/register", async (req, res) => {
    const { username, phone, password } = req.body;
    
    if (!username || !phone || !password) {
        return res.status(400).json({ error: 'Username, phone, and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = { username, phone, password: hashedPassword };
        
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
        return res.status(400).json({ error: 'Phone and password are required' });
    }

    const query = "SELECT * FROM users WHERE phone = ?";
    connection.query(query, [phone], async (err, results) => {
        if (err) {
            console.error('Error while querying the database:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                return res.status(200).json({ message: 'Login successful' });
            } else {
                return res.status(401).json({ error: 'Invalid phone or password' });
            }
        } else {
            return res.status(401).json({ error: 'Invalid phone or password' });
        }
    });
});
app.get("/api/display", (req, res) => {
    const query = "SELECT username, phone FROM users";

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error while fetching users from the database:', err);
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.length > 0) {
            return res.status(200).json(results);
        } else {
            return res.status(404).json({ message: 'No users found' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
