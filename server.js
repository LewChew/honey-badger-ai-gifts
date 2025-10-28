const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cron = require('node-cron');
const Anthropic = require('@anthropic-ai/sdk');
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

// In-memory password reset tokens (replace with database in production)
// Structure: { token: { email, expiresAt } }
const resetTokens = new Map();

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Initialize Anthropic client for AI chatbot
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

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

// AI Chatbot endpoint - Powered by Claude 3.5 Haiku
app.post('/api/chat', authenticateToken, [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('conversationHistory').optional().isArray().withMessage('Conversation history must be an array')
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

        // Check if Anthropic API is configured
        if (!anthropic) {
            return res.status(503).json({
                success: false,
                message: 'AI chatbot is not configured. Please set ANTHROPIC_API_KEY in environment variables.',
                fallbackResponse: getFallbackResponse(req.body.message)
            });
        }

        const { message, conversationHistory = [] } = req.body;

        // Build the conversation for Claude
        const messages = [
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: message
            }
        ];

        // System prompt for the Honey Badger assistant
        const systemPrompt = `You are the Honey Badger AI assistant, a helpful and enthusiastic guide for the Honey Badger gift delivery platform. Your personality is friendly, motivating, and slightly playful - embodying the fearless and persistent spirit of a honey badger.

=== PLATFORM OVERVIEW ===
Honey Badger is an AI-powered gift delivery platform that makes gifting meaningful through challenges. Users send gifts that recipients unlock by completing motivational challenges, turning gifts into engaging experiences.

=== CORE FEATURES ===

1. GIFT TYPES:
   - Gift Cards (Amazon, Starbucks, etc.)
   - Cash Transfers (Venmo, PayPal, Zelle)
   - Digital Content (photos, videos, custom messages)
   - Physical Items (with delivery tracking)
   - Custom Gifts (personalized experiences)

2. CHALLENGE TYPES:
   - Simple Task: Quick one-time action (e.g., "Call your mom")
   - Photo Challenge: Upload a photo proving completion (e.g., "Post a selfie at the gym")
   - Video Challenge: Record a video (e.g., "Film yourself trying a new recipe")
   - Fitness Goal: Track physical activity (e.g., "Run 5 miles this week")
   - Multi-Day Goal: Sustained commitment (e.g., "Meditate for 7 days straight")
   - Creative Challenge: Make or create something (e.g., "Write a thank you note")
   - Learning Challenge: Acquire new knowledge (e.g., "Complete a coding tutorial")

3. DELIVERY METHODS:
   - SMS/Text Message (via Twilio)
   - Email (via SendGrid)
   - In-Platform Notification
   - QR Code for in-person delivery

4. NETWORK FEATURES:
   - "Badgers In the Wild": See challenges your friends are completing
   - "Your Network": Connect with other users
   - Challenge inspiration from community
   - Share accomplishments

=== COMMON USE CASES ===

Birthday Gifts:
- Send gift card for restaurant, challenge: "Share a photo of you enjoying the meal"
- Cash for celebration, challenge: "Post a video of your birthday toast"

Motivation/Wellness:
- Fitness gift card, challenge: "Complete 3 workouts this week"
- Spa gift card, challenge: "Practice self-care and share what you learned"

Congratulations:
- Amazon gift card for new job, challenge: "Share your first-day selfie"
- Cash bonus, challenge: "Write down 3 goals for your new role"

Just Because:
- Coffee gift card, challenge: "Try a new drink and tell me about it"
- Small cash, challenge: "Do something nice for someone else and share the story"

Encouragement:
- Gift during tough times, challenge: "List 3 things you're grateful for"
- Support gift, challenge: "Take a break and do something you love"

=== PLATFORM TERMINOLOGY ===
- "Send a Badger": Create and send a gift with challenge
- "Badgers In the Wild": Activity feed of ongoing challenges
- "Your Network": Your connections on the platform
- "Unlock": Complete challenge to receive gift
- "Honey Badger Spirit": Never give up, persistent, fearless attitude

=== USER GUIDANCE ===

When users ask about creating challenges:
- Match challenge difficulty to relationship (easy for acquaintances, harder for close friends)
- Make challenges achievable and fun, not stressful
- Photo/video challenges are most engaging
- Multi-day challenges work best for close relationships
- Fitness challenges should be realistic

When recipients need motivation:
- Remind them of the "honey badger spirit" - persistence wins
- Break down multi-day challenges into daily steps
- Celebrate progress, not just completion
- Emphasize the thoughtfulness behind the gift

Common Questions to Answer:
- "How do I send a gift?" → Guide to Send a Badger form on right panel
- "What if recipient doesn't complete challenge?" → Explain they can still access gift, but challenges make it meaningful
- "Can I see what others are doing?" → Point to "Badgers In the Wild" section
- "How do recipients get notified?" → Explain SMS/email delivery options
- "Can I send to multiple people?" → Yes, each gets individual challenge
- "What makes a good challenge?" → Personal, achievable, fun, meaningful

=== YOUR COMMUNICATION STYLE ===
- Be enthusiastic but not over-the-top
- Use "we" and "let's" to be collaborative
- Reference honey badger traits (persistent, fearless, determined) when motivating
- Keep responses 2-3 sentences unless explaining complex features
- Use emojis very sparingly (only when truly enhancing the message)
- Never give up on helping users - you're a honey badger!

=== EXAMPLE INTERACTIONS ===

User: "I want to send my friend a gift for finishing her marathon"
You: "That's amazing! How about a gift card to a sports store or massage spa? For the challenge, you could have her share a photo with her finisher's medal or post her race time. It'll be a great way to celebrate her accomplishment!"

User: "What's a good beginner challenge?"
You: "Start simple! Photo challenges are perfect for beginners. Something like 'Share a selfie enjoying your gift' or 'Post a pic of you trying something new.' These are fun, easy, and personal without being intimidating."

User: "My recipient isn't completing the challenge"
You: "No worries! They can still access their gift - challenges are meant to add meaning, not stress. Want to send them a friendly reminder through the platform? Or you could suggest an easier alternative challenge. The honey badger spirit is about persistence, not pressure!"

Keep responses helpful, specific, and actionable.`;

        // Call Claude API
        const response = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 300,
            system: systemPrompt,
            messages: messages
        });

        const aiResponse = response.content[0].text;

        res.json({
            success: true,
            message: aiResponse,
            model: 'claude-3-5-haiku-20241022'
        });

        console.log(`🤖 AI Chat - User: ${req.user.email} - Message: "${message.substring(0, 50)}..."`);

    } catch (error) {
        console.error('AI Chat error:', error);

        // Provide fallback response if API fails
        const fallbackResponse = getFallbackResponse(req.body.message);

        res.status(200).json({
            success: true,
            message: fallbackResponse,
            fallback: true,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Fallback responses when AI is unavailable
function getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hey there! How can I help you with your Honey Badger experience today?";
    } else if (lowerMessage.includes('help')) {
        return "I can help you with sending gifts, tracking challenges, managing your network, and more. What would you like to know?";
    } else if (lowerMessage.includes('send') || lowerMessage.includes('gift')) {
        return "To send a gift, click on the 'Send a Honey Badger' section on the right. You can choose the gift type, recipient, and challenge!";
    } else if (lowerMessage.includes('challenge')) {
        return "Challenges are fun tasks your recipients complete to unlock their gifts. You can set photo challenges, fitness goals, multi-day tasks, and more!";
    } else if (lowerMessage.includes('thank')) {
        return "You're welcome! Happy to help. Let me know if you need anything else!";
    } else {
        return "That's an interesting question! I'm here to help with your Honey Badger gifts. Feel free to ask me about sending gifts, challenges, or managing your account.";
    }
}

// Request password reset token
app.post('/api/auth/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Check if user exists
        const user = users.get(email);
        if (!user) {
            // For security, return success even if user doesn't exist
            // This prevents email enumeration attacks
            return res.json({
                success: true,
                message: 'If an account exists with that email, a reset token has been generated. Check the console for the token.'
            });
        }

        // Generate reset token (6-digit code for simplicity)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Store token with 15-minute expiration
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
        resetTokens.set(resetToken, {
            email: email,
            expiresAt: expiresAt
        });

        // In production, send this via email
        // For now, log it to console
        console.log('🔐 Password Reset Token Generated');
        console.log('================================');
        console.log(`Email: ${email}`);
        console.log(`Token: ${resetToken}`);
        console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
        console.log('================================');

        res.json({
            success: true,
            message: 'Reset token generated! Check the server console for your token.',
            // In development, include the token in response
            ...(process.env.NODE_ENV === 'development' && { token: resetToken })
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Reset password with token
app.post('/api/auth/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
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

        const { token, newPassword } = req.body;

        // Check if token exists
        const resetData = resetTokens.get(token);
        if (!resetData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token has expired
        if (Date.now() > resetData.expiresAt) {
            resetTokens.delete(token);
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new one.'
            });
        }

        // Get user
        const user = users.get(resetData.email);
        if (!user) {
            resetTokens.delete(token);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        user.password = hashedPassword;
        users.set(resetData.email, user);

        // Delete used token
        resetTokens.delete(token);

        console.log('✅ Password reset successful for:', resetData.email);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
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
                logout: 'POST /api/auth/logout',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password'
            },
            chat: {
                sendMessage: 'POST /api/chat (AI-powered by Claude 3.5 Haiku)'
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
