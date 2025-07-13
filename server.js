const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import Twilio service
const twilioService = require('./services/twilioService');

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
app.post('/api/send-honey-badger', async (req, res) => {
    const { recipientName, recipientContact, giftType, giftValue, challenge, message, duration } = req.body;
    
    try {
        // Generate tracking ID
        const trackingId = 'HB' + Date.now();
        
        // Check if SMS is enabled and contact is a phone number
        if (process.env.ENABLE_SMS === 'true' && recipientContact.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/)) {
            try {
                // Format phone number
                const formattedPhone = twilioService.formatPhoneNumber(recipientContact);
                
                // Send SMS notification
                await twilioService.sendHoneyBadgerNotification({
                    recipientPhone: formattedPhone,
                    recipientName,
                    giftType: `${giftType}: ${giftValue}`,
                    challenge,
                    trackingId
                });
                
                console.log('✅ SMS notification sent successfully');
            } catch (smsError) {
                console.error('SMS Error:', smsError.message);
                // Continue even if SMS fails
            }
        }
        
        // Here you would also:
        // 1. Save to database
        // 2. Process payment if needed
        // 3. Set up scheduled reminders
        // 4. Send email if that's the contact method
        
        console.log('New Honey Badger request:', {
            recipientName,
            recipientContact,
            giftType,
            giftValue,
            challenge,
            message,
            duration,
            trackingId
        });
        
        res.json({
            success: true,
            message: 'Honey Badger sent successfully!',
            trackingId,
            notificationSent: process.env.ENABLE_SMS === 'true' ? 'SMS' : 'Email'
        });
    } catch (error) {
        console.error('Error sending Honey Badger:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send Honey Badger. Please try again.'
        });
    }
});

// Twilio webhook endpoint for incoming SMS
app.post('/api/twilio/webhook', async (req, res) => {
    try {
        // Handle incoming SMS
        await twilioService.handleIncomingSMS(req.body);
        
        // Send TwiML response
        res.type('text/xml');
        res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Test SMS endpoint (for development)
app.post('/api/test-sms', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!process.env.ENABLE_SMS === 'true') {
        return res.status(400).json({
            success: false,
            message: 'SMS functionality is disabled'
        });
    }
    
    try {
        const formattedPhone = twilioService.formatPhoneNumber(phone);
        const result = await twilioService.sendSMS(formattedPhone, message || 'Test message from Honey Badger! 🍯');
        
        res.json({
            success: true,
            message: 'Test SMS sent successfully',
            sid: result.sid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
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
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            sms: process.env.ENABLE_SMS === 'true' ? 'enabled' : 'disabled',
            email: process.env.ENABLE_EMAIL === 'true' ? 'enabled' : 'disabled'
        }
    });
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
    console.log(`SMS: ${process.env.ENABLE_SMS === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
});
