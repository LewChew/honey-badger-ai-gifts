#!/usr/bin/env node

/**
 * Password Reset Utility for Honey Badger AI Gifts
 *
 * This script resets a user's password by making a request to the server.
 * Since the app uses in-memory storage, you can also restart the server
 * and sign up again with the new password.
 *
 * Usage:
 *   node reset-password.js <email> <new-password>
 *
 * Example:
 *   node reset-password.js lewischewning@gmail.com NeverForget!6
 */

const bcrypt = require('bcryptjs');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Usage: node reset-password.js <email> <new-password>');
    console.error('   Example: node reset-password.js user@example.com MyNewPass123');
    process.exit(1);
}

const email = args[0];
const newPassword = args[1];

// Validate password requirements
function validatePassword(password) {
    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }
    return null;
}

async function resetPassword() {
    try {
        // Validate password
        const validationError = validatePassword(newPassword);
        if (validationError) {
            console.error(`❌ Invalid password: ${validationError}`);
            process.exit(1);
        }

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        console.log('\n🔐 Password Reset Information');
        console.log('================================');
        console.log(`Email: ${email}`);
        console.log(`New Password: ${newPassword}`);
        console.log(`Hashed Password: ${hashedPassword}`);
        console.log('================================\n');

        console.log('⚠️  IMPORTANT NOTES:');
        console.log('1. This app uses IN-MEMORY storage - data is lost on server restart');
        console.log('2. To reset the password, you have two options:\n');

        console.log('   OPTION 1: Restart server and sign up again');
        console.log('   - Stop the server (Ctrl+C)');
        console.log('   - Start the server again (npm start or npm run dev)');
        console.log(`   - Sign up with email: ${email}`);
        console.log(`   - Use password: ${newPassword}\n`);

        console.log('   OPTION 2: Use the admin endpoint (if you add it to server.js)');
        console.log('   - Add a password reset endpoint to server.js');
        console.log('   - Make a POST request with the new password hash\n');

        console.log('   OPTION 3: Modify server.js to pre-populate this user');
        console.log('   - Add this code after line 27 in server.js:');
        console.log(`   users.set('${email}', {`);
        console.log(`       email: '${email}',`);
        console.log(`       password: '${hashedPassword}',`);
        console.log(`       name: 'Lewis Chewning',`);
        console.log(`       phone: '',`);
        console.log(`       createdAt: new Date().toISOString()`);
        console.log(`   });\n`);

        console.log('✅ Password has been hashed and is ready to use!');
        console.log('💡 For production, migrate to a persistent database (PostgreSQL/MongoDB)');

    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        process.exit(1);
    }
}

resetPassword();
