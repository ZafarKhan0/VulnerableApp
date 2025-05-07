const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const db = new sqlite3.Database(':memory:');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database with vulnerable data
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT)");
  db.run("INSERT INTO users (username, password, email) VALUES ('admin', 'admin123', 'admin@example.com')");
  db.run("INSERT INTO users (username, password, email) VALUES ('user1', 'password1', 'user1@example.com')");
});

// 1. SQL Injection endpoint
app.get('/api/users/search', (req, res) => {
  const query = req.query.q;
  db.all(`SELECT * FROM users WHERE username LIKE '%${query}%'`, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// 2. Broken Authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, (err, user) => {
    if (err) return res.status(500).send(err.message);
    res.json(user ? { success: true, user } : { success: false });
  });
});

// 3. XSS Vulnerable endpoint
app.get('/api/reflect', (req, res) => {
  res.json({ data: req.query.input });
});

// 4. File Upload (simulated)
app.post('/api/upload', (req, res) => {
  res.json({ success: true, filename: req.body.filename });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => console.log(`Vulnerable backend running on http://localhost:${PORT}`));