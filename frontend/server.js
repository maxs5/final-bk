require('dotenv').config();

const path = require('path');
const express = require('express');

const app = express();
const { PORT = 5173, API_BASE_URL = 'http://localhost:4000' } = process.env;

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  res.send(`window.__APP_CONFIG__ = { API_BASE_URL: '${API_BASE_URL}' };`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend started on http://localhost:${PORT}`);
});
