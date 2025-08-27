const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline styles for this demo
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.post('/api/send-honey-badger', (req, res) => {
    const { recipientName, recipientContact, giftType, giftValue, challenge, message, duration } = req.body;
    
    // Here you would integrate with your AI service, payment processor, etc.
    console.log('New Honey Badger request:', {
        recipientName,
        recipientContact,
        giftType,
        giftValue,
        challenge,
        message,
        duration
    });
    
    res.json({
        success: true,
        message: 'Honey Badger sent successfully!',
        trackingId: 'HB' + Date.now()
    });
});

app.post('/api/login', (req, res) => {
    const { loginEmail, loginPassword } = req.body;
    
    // Add your authentication logic here
    console.log('Login attempt:', loginEmail);
    
    res.json({
        success: true,
        message: 'Login successful',
        user: { email: loginEmail }
    });
});

app.post('/api/signup', (req, res) => {
    const { signupName, signupEmail, signupPassword } = req.body;
    
    // Add your user registration logic here
    console.log('New user signup:', { signupName, signupEmail });
    
    res.json({
        success: true,
        message: 'Account created successfully',
        user: { name: signupName, email: signupEmail }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🍯 Honey Badger server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see your app`);
});
