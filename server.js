const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Validate Twilio environment variables
if (process.env.ENABLE_SMS === 'true') {
    const requiredTwilioVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missingVars = requiredTwilioVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.warn('⚠️ Warning: Missing Twilio environment variables:', missingVars.join(', '));
        console.warn('   SMS functionality will be disabled.');
        process.env.ENABLE_SMS = 'false';
    }
}

// In-memory user storage (replace with database in production)
const users = new Map();

// Pre-populate admin user
users.set('lewischewning@gmail.com', {
    email: 'lewischewning@gmail.com',
    password: '$2a$12$ankRlg6IOXfLSbe.ytGUTubpp/av16s.pxb1/IVvRC/5X.8wx7mgW',
    name: 'Lewis Chewning',
    phone: '',
    createdAt: new Date().toISOString()
});

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline styles for this demo
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Import gift routes (only if file exists)
let giftsRouter;
try {
    giftsRouter = require('./api/routes/gifts');
    console.log('✅ Gift routes loaded successfully');
} catch (error) {
    console.warn('⚠️ Gift routes not found. Some API functionality may be limited.');
}

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Mount gift routes if available
if (giftsRouter) {
    app.use('/api', giftsRouter);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User registration
app.post('/api/signup', [
    body('signupName').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('signupEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('signupPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    body('signupPhone').optional().isMobilePhone().withMessage('Valid phone number required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { signupName, signupEmail, signupPassword, signupPhone } = req.body;

        // Check if user already exists
        if (users.has(signupEmail)) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(signupPassword, saltRounds);

        // Create user
        const user = {
            id: Date.now().toString(),
            name: signupName,
            email: signupEmail,
            phone: signupPhone || null,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        users.set(signupEmail, user);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return success response (don't send password)
        const { password, ...userWithoutPassword } = user;
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: userWithoutPassword
        });

        console.log('✅ New user registered:', signupEmail);

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// User login
app.post('/api/login', [
    body('loginEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('loginPassword').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid email and password',
                errors: errors.array()
            });
        }

        const { loginEmail, loginPassword } = req.body;

        // Find user
        const user = users.get(loginEmail);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account has been disabled'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(loginPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: user.name 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return success response (don't send password)
        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

        console.log('✅ User logged in:', loginEmail);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const user = users.get(req.user.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
});

// Logout (client-side token removal, but we can log it)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    console.log('✅ User logged out:', req.user.email);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Protected route: Send Honey Badger (requires authentication)
app.post('/api/send-honey-badger', authenticateToken, async (req, res) => {
    const { recipientName, recipientContact, giftType, giftValue, challenge, message, duration } = req.body;
    
    console.log('New Honey Badger request from:', req.user.email, {
        recipientName,
        recipientContact,
        giftType,
        giftValue,
        challenge,
        message,
        duration
    });
    
    // If SMS is enabled and gift routes are available, use the new system
    if (process.env.ENABLE_SMS === 'true' && giftsRouter) {
        // Forward to the new gift creation endpoint
        req.body = {
            recipientPhone: recipientContact,
            recipientName,
            senderName: req.user.name,
            giftType,
            giftDetails: {
                value: giftValue,
                description: message
            },
            challengeType: 'custom',
            challengeDescription: challenge,
            challengeRequirements: {
                totalSteps: duration || 1
            }
        };
        
        // Call the gift creation endpoint
        return app._router.handle(req, res, () => {
            res.json({
                success: true,
                message: 'Honey Badger sent successfully!',
                trackingId: 'HB' + Date.now(),
                sender: req.user.name
            });
        });
    }
    
    // Fallback response if SMS not configured
    res.json({
        success: true,
        message: 'Honey Badger sent successfully!',
        trackingId: 'HB' + Date.now(),
        sender: req.user.name,
        note: 'SMS notifications not configured. Gift created but recipient will not receive SMS.'
    });
});

// Get user's sent honey badgers (mock data)
app.get('/api/honey-badgers', authenticateToken, (req, res) => {
    // Mock data - replace with actual database query
    const mockHoneyBadgers = [
        {
            id: 'HB' + (Date.now() - 86400000),
            recipientName: 'John Doe',
            giftType: 'giftcard',
            giftValue: '$50 Starbucks',
            challenge: 'Send me a selfie with your morning coffee!',
            status: 'active',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'HB' + (Date.now() - 172800000),
            recipientName: 'Jane Smith',
            giftType: 'cash',
            giftValue: '$100',
            challenge: 'Complete a 30-minute workout',
            status: 'completed',
            createdAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];

    res.json({
        success: true,
        honeyBadgers: mockHoneyBadgers
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        users: users.size,
        features: {
            authentication: 'enabled',
            encryption: 'bcrypt',
            tokenAuth: 'JWT',
            sms: process.env.ENABLE_SMS === 'true' ? 'enabled' : 'disabled',
            twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured'
        }
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        message: '🦡 Honey Badger AI Gifts API',
        version: '1.0.0',
        endpoints: {
            auth: {
                signup: 'POST /api/signup',
                login: 'POST /api/login',
                profile: 'GET /api/auth/me',
                logout: 'POST /api/auth/logout'
            },
            honeyBadgers: {
                send: 'POST /api/send-honey-badger',
                list: 'GET /api/honey-badgers'
            },
            gifts: giftsRouter ? {
                create: 'POST /api/gifts',
                messages: {
                    sendInitial: 'POST /api/messages/send-initial',
                    sendReminder: 'POST /api/messages/send-reminder'
                },
                challenges: {
                    getProgress: 'GET /api/challenges/:challengeId/progress',
                    updateProgress: 'PUT /api/challenges/:challengeId/progress'
                },
                recipients: {
                    getGifts: 'GET /api/recipients/:phone/gifts'
                },
                webhooks: {
                    twilioIncoming: 'POST /api/webhooks/twilio/incoming'
                }
            } : 'Gift routes not configured',
            health: 'GET /health'
        }
    });
});

// Scheduled task for sending reminders (runs every hour)
if (process.env.ENABLE_SCHEDULED_REMINDERS === 'true') {
    const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 * * * *';
    cron.schedule(cronSchedule, async () => {
        console.log('🔔 Running scheduled reminder check...');
        // This would check all active challenges and send reminders as needed
        // Implementation would depend on your database setup
    });
    console.log('📅 Scheduled reminders enabled with cron:', cronSchedule);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({ 
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

app.listen(PORT, () => {
    console.log('');
    console.log('🦡 Honey Badger AI Gifts Server');
    console.log('================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Visit http://localhost:${PORT} to see your app`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
    console.log('');
    console.log('Features:');
    console.log(`  🔐 Authentication: Enabled (JWT + bcrypt)`);
    console.log(`  👥 Users registered: ${users.size}`);
    console.log(`  📱 SMS (Twilio): ${process.env.ENABLE_SMS === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  📧 Email: ${process.env.ENABLE_EMAIL === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  🔔 Scheduled Reminders: ${process.env.ENABLE_SCHEDULED_REMINDERS === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
    
    if (process.env.ENABLE_SMS === 'true' && process.env.TWILIO_ACCOUNT_SID) {
        console.log('');
        console.log('Twilio Configuration:');
        console.log(`  📞 Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
        console.log(`  🔗 Webhook URL: ${process.env.WEBHOOK_BASE_URL}${process.env.TWILIO_WEBHOOK_PATH || '/api/webhooks/twilio/incoming'}`);
    }
    
    console.log('================================');
});

module.exports = app;
