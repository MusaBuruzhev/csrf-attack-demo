const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'vulnerable-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Vulnerable: no SameSite, no Secure
}));

// In-memory storage for demo
let balance = 10000;
let transactionHistory = [];

// Routes
app.get('/', (req, res) => {
    res.redirect('/vulnerable-bank.html');
});

app.post('/login', (req, res) => {
    // Simple login simulation
    req.session.authenticated = true;
    req.session.user = 'user123';
    res.redirect('/vulnerable-bank.html');
});

app.get('/api/data', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(403).json({ error: 'Not authenticated' });
    }
    res.json({
        balance: balance,
        history: transactionHistory
    });
});

app.post('/transfer', (req, res) => {
    if (!req.session.authenticated) {
        return res.status(403).send('Not authenticated');
    }

    const amount = parseInt(req.body.amount);
    const toAccount = req.body.to_account;

    if (isNaN(amount) || amount <= 0 || amount > balance) {
        return res.status(400).send('Invalid amount');
    }

    // Perform transfer (vulnerable: no CSRF check)
    balance -= amount;
    transactionHistory.push({
        date: new Date().toISOString(),
        amount: amount,
        toAccount: toAccount,
        type: 'transfer'
    });

    res.redirect('/vulnerable-bank.html');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/vulnerable-bank.html');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(PORT, () => {
    console.log(`Vulnerable bank server running on http://localhost:${PORT}`);
});
