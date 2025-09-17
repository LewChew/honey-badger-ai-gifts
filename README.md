# 🦡 Honey Badger AI Gifts

AI-powered gift experiences with persistent motivation via SMS. Send gifts that recipients unlock through fun challenges!

## 🌟 Features

- **Gift Creation**: Send gift cards, cash, photos, or custom messages
- **Challenge System**: Set unlock conditions (photos, workouts, tasks, etc.)
- **Persistent Motivation**: Honey Badger sends encouraging SMS messages
- **Progress Tracking**: Monitor challenge completion in real-time
- **Multiple Gift Types**: Support for various reward types
- **Smart Reminders**: Automated follow-ups to keep recipients engaged

## 🚀 Quick Start

### Prerequisites

- Node.js (v16.0.0 or higher)
- Twilio Account (for SMS functionality)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LewChew/honey-badger-ai-gifts.git
   cd honey-badger-ai-gifts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   # Required for SMS functionality
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Server configuration
   JWT_SECRET=your-secure-jwt-secret-key
   ```

4. **Configure Twilio Webhook**
   
   In your Twilio Console:
   - Go to Phone Numbers > Manage > Active Numbers
   - Click on your phone number
   - In the "Messaging" section, set the webhook URL to:
     ```
     https://your-domain.com/api/webhooks/twilio/incoming
     ```
   - Set the HTTP method to `POST`

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📱 API Endpoints

### Authentication
- `POST /api/signup` - Create a new account
- `POST /api/login` - Login to existing account
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

### Gift Management
- `POST /api/gifts` - Create a new gift/challenge
- `GET /api/honey-badgers` - List all sent gifts

### Messages
- `POST /api/messages/send-initial` - Send initial gift notification
- `POST /api/messages/send-reminder` - Send reminder message

### Challenge Tracking
- `GET /api/challenges/:challengeId/progress` - Get challenge progress
- `PUT /api/challenges/:challengeId/progress` - Update challenge progress

### Recipients
- `GET /api/recipients/:phone/gifts` - Get all gifts for a recipient

### Webhooks
- `POST /api/webhooks/twilio/incoming` - Twilio incoming message webhook

## 🎁 How It Works

1. **Sender creates a gift**
   - Choose gift type (gift card, cash, photo, etc.)
   - Set the unlock challenge
   - Provide recipient details

2. **Recipient gets notified**
   - Receives SMS from Honey Badger
   - Learn about the gift and challenge

3. **Complete the challenge**
   - Recipient works on the challenge
   - Submit proof (photo, text, etc.)
   - Honey Badger tracks progress

4. **Unlock the gift**
   - Challenge completed = gift unlocked!
   - Receive redemption instructions

## 🛠️ Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | Yes (for SMS) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | Yes (for SMS) |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Yes (for SMS) |
| `PORT` | Server port (default: 3000) | No |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `ENABLE_SCHEDULED_REMINDERS` | Enable automated reminders | No |
| `NODE_ENV` | Environment (development/production) | No |

### Gift Types Supported

- **Gift Cards**: Starbucks, Amazon, etc.
- **Cash**: Direct transfers via Venmo, PayPal
- **Photos**: Special memories or surprises
- **Messages**: Custom text or video messages
- **Physical Items**: Products or experiences

### Challenge Types

- **Photo Challenge**: Submit a specific photo
- **Video Challenge**: Record a video response
- **Task Challenge**: Complete specific tasks
- **Workout Challenge**: Fitness activities
- **Multi-day Challenge**: Long-term goals
- **Custom Challenge**: Anything you can imagine!

## 📊 Example Usage

### Creating a Birthday Gift
```javascript
POST /api/gifts
{
  "recipientPhone": "+1234567890",
  "recipientName": "John",
  "senderName": "Mom",
  "giftType": "giftcard",
  "giftDetails": {
    "value": "$100",
    "description": "Amazon Gift Card"
  },
  "challengeType": "video",
  "challengeDescription": "Send me a video saying hi!",
  "challengeRequirements": {
    "totalSteps": 1
  }
}
```

### Creating a Fitness Motivation Gift
```javascript
POST /api/gifts
{
  "recipientPhone": "+1234567890",
  "recipientName": "Sarah",
  "senderName": "Dad",
  "giftType": "item",
  "giftDetails": {
    "description": "3D Printer"
  },
  "challengeType": "multi-day",
  "challengeDescription": "Work out for 60 days straight",
  "challengeRequirements": {
    "totalSteps": 60
  },
  "reminderFrequency": "daily"
}
```

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- Environment variable protection
- HTTPS recommended for production
- Rate limiting available
- Input validation on all endpoints

## 🚧 Roadmap

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Payment processing (Stripe/PayPal)
- [ ] Media storage (AWS S3/Cloudinary)
- [ ] Email notifications (SendGrid)
- [ ] Mobile app
- [ ] Analytics dashboard
- [ ] AI-powered challenge suggestions
- [ ] Social sharing features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Twilio for SMS infrastructure
- The Honey Badger - nature's most persistent creature
- All contributors and users

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Remember**: Honey Badger doesn't give up, and neither should you! 🦡💪
